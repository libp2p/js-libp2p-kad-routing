var KBucket = require('k-bucket')
var async = require('async')
var log = require('ipfs-logger').group('peer-routing ipfs-kad-router')
var protobufs = require('protocol-buffers-stream')
var fs = require('fs')
var Peer = require('peer-info')
var Id = require('peer-id')
var multiaddr = require('multiaddr')
var PriorityQueue = require('js-priority-queue')
var xor = require('buffer-xor')

exports = module.exports = KadRouter

function KadRouter (peerSelf, swarmSelf, kBucketSize) {
  var self = this

  if (!(self instanceof KadRouter)) {
    throw new Error('KadRouter must be called with new')
  }

  self.kBucketSize = kBucketSize || 20 // same as go-ipfs
  self.ncp // number of closest peers to return on kBucket search

  var schema = fs.readFileSync(__dirname + '/kad.proto')
  self.createProtoStream = protobufs(schema)

  self.kb = new KBucket({
    localNodeId: peerSelf.id.toBytes(),
    numberOfNodesPerKBucket: self.kBucketSize
  })

  self.kb.on('ping', function (oldContacts, newContact) {
    var sorted = oldContacts.sort(function (a, b) {
      return a.peer.lastSeen - b.peer.lastSeen
    })

    // add all less the last seen contact
    for (var i = 0; i < sorted.length - 1; i++) {
      self.kb.add(sorted[i])
    }

    self.kb.remove(sorted[sorted.length - 1])

    // add the new one
    self.kb.add(newContact)
  })

  // register /ipfs/dht/1.0.0 protocol handler

  swarmSelf.handleProtocol('/ipfs/dht/1.0.0', function (stream) {
    var ps = self.createProtoStream()

    ps.on('query', function (msg) {
      var closerPeers = self.kb.closest({
        id: msg.key,
        n: self.ncp
      })

      closerPeers = closerPeers.length > 0 ? closerPeers.map(function (cp) {
        return {
          id: cp.peer.id.toBytes(),
          addrs: cp.peer.multiaddrs.map(function (mh) { return mh.buffer })
        }
      }) : []

      ps.query({
        key: msg.key,
        closerPeers: closerPeers
      })

      ps.finalize()
    })

    ps.pipe(stream).pipe(ps)
  })

  // Interface

  self.findPeers = function (key, callback) {
    // 1. get closest peers
    // 2. ping them for more closer peers
    // 3. use in memory qeues with async (closer peers to ping, only add them if they are not yet on the priority queue)
    // start with an object to return then move to priority queue

    var peerList = {} // < b58Id : Peer >

    var q = async.queue(queryPeer, 1)

    var closerPeers = self.kb.closest({
      id: key, // key must be an Id object exported with .toBytes()
      n: self.ncp
    })

    if (closerPeers.length === 0) {
      return callback(new Error('kbuckets are empty'))
    }

    closerPeers.map(function (p) { q.push(p.peer) })

    function queryPeer (peerToQuery, cb) {
      // 1. query peer
      //  1.1 open a stream
      //  2.2 attach protobufs
      // 2. get closer peers
      // 3. if we already queried the peer, skip
      // 4. if not, add to the peerList and the queue (q.push(peer))

      swarmSelf.dial(peerToQuery, {}, '/ipfs/dht/1.0.0', function (err, stream) {
        if (err) {
          log.error('Could not open a stream to:', peerToQuery.id.toB58String())
          return cb()
        }

        // consider the peer to our finger table
        self.addPeer(peerToQuery)

        peerList[peerToQuery.id.toB58String()] = peerToQuery

        var ps = self.createProtoStream()

        ps.on('query', function (msg) {
          // Didn't get any new peers to query, meaning our contact has its kbuckets empty
          if (msg.closerPeers.length === 0) {
            return cb()
          }

          msg.closerPeers.forEach(function (closerPeer) {
            var peerId = Id.createFromBytes(closerPeer.id)
            var addrs = closerPeer.addrs.map(function (addr) {
              return multiaddr(addr) // converting from buffer to multiaddr
            })

            var cPeer = new Peer(peerId, addrs)

            // make sure we haven't pinged this one already
            if (peerList[peerId.toB58String()]) {
              return
            }

            // make sure we weren't told to query ourselfs
            if (peerId.toB58String() === peerSelf.id.toB58String()) {
              return
            }

            // add this peer to the query list
            q.push(cPeer)

            // TODO Consider this new found peer to our kbucket (attempt connection first)
          })

          cb()
        })

        ps.query({
          key: key,
          closerPeers: []
        })

        ps.pipe(stream).pipe(ps)
        ps.finalize()
      })
    }

    // drain gets called after all items on the queue were process, in another words,
    // it only happens after all callbacks were called, (which is different from the
    // queue having 0 items to process)
    q.drain = function done () {
      var queue = new PriorityQueue({
        comparator: function (a, b) {
          return xor(a.id.toBytes(), key).compare(xor(b.id.toBytes(), key))
        }
      })

      // add all the values on the peerList
      Object.keys(peerList).forEach(function (peerB58String) {
        queue.queue(peerList[peerB58String])
      })

      callback(null, queue)
    }
  }

  self.addPeer = function (peer) {
    self.kb.add({
      id: peer.id.toBytes(),
      peer: peer
    })
  }
}
