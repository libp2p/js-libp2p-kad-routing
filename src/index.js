'use strict'

const KBucket = require('k-bucket')
const queue = require('async/queue')
const debug = require('debug')
const protocolBufffers = require('protocol-buffers')
const pull = require('pull-stream')
const lp = require('pull-length-prefixed')
const fs = require('fs')
const Peer = require('peer-info')
const Id = require('peer-id')
const multiaddr = require('multiaddr')
const PriorityQueue = require('js-priority-queue')
const xor = require('buffer-xor')

const Message = require('./message')

const log = debug('libp2p:dht')
log.error = debug('libp2p:dht:error')

const PROTOCOL_DHT = '/ipfs/kad/1.0.0'

class KadRouter {
  constructor (peerSelf, swarmSelf, kBucketSize) {
    /**
     * Local peer (yourself)
     * @type {PeerId}
     */
    this.self = peerSelf

    /**
     * @type {Swarm}
     */
    this.swarm = swarmSelf

    /**
     * k-bucket size, defaults to 20.
     * @type {number}
     */
    this.kBucketSize = kBucketSize || 20

    /**
     * Number of closest peers to return on kBucket search
     * @type {number}
     */
    this.ncp = 6


    this.kb = new KBucket({
      localNodeId: this.self.id.toBytes(),
      numberOfNodesPerKBucket: this.kBucketSize
    })

    this.kb.on('ping', this._onKbPing.bind(this))

    this._handleStream = this._handleStream.bind(this)
    this.swarm.handle(PROTOCOL_DHT, this._handleStream)

    this.messageHandlers = {
      [Message.TYPES.GET_VALUE]: this._handleMsgGetValue,
      [Message.TYPES.PUT_VALUE]: this._handleMsgPutValue,
      [Message.TYPES.FIND_NODE]: this._handleMsgFindNode,
      [Message.TYPES.ADD_PROVIDER]: this._handleMsgAddProvider,
      [Message.TYPES.GET_PROVIDERS]: this._handleMsgGetProviders,
      [Message.TYPES.PING]: this._handleMsgPing
    }
  }

  _onKbPing (oldContacts, newContact) {
    const sorted = oldContacts.sort((a, b) => {
      return a.peer.lastSeen - b.peer.lastSeen
    })

    const oldest = sorted.pop()

    // add all less the last seen contact
    sorted.forEach((contact) => this.kb.add(contact))

    // remove the oldest one
    this.kb.remove(oldest.id)

    // add the new one
    this.kb.add(newContact)
  }

  _handleStream (protocol, conn) {
    conn.getPeerInfo((err, peer) => {
      if (err) {
        log.error('Failed to get peer info')
        return
      }

      pull(
        conn,
        lp.decode(),
        pull.map((rawMsg) => Message.decode(rawMsg)),
        pull.asyncMap((msg, cb) => {
          this._handleMessage(msg, peer, cb)
        }),
        // Not all handlers will return a response
        pull.filter(Boolean),
        pull.map((response) => response.encode()),
        lp.encode(),
        conn
      )
    })
  }

  /**
   * Handle incoming messages
   *
   * @param {Message} msg
   * @param {PeerInfo} peer
   * @param {function(Error, Message)} callback
   * @returns {undefined}
   * @private
   */
  _handleMessage (msg, peer, callback) {
    // update the peer
    this._update(peer)

    // get handler & exectue it
    const handler = this._getMessageHandler(msg.type)

    if (!handler) {
      log.error(`no handler found for message type: ${msg.type}`)
      return callback()
    }

    handler(msg, peer, callback)
  }

  /**
   * Signal the routing table to update its last-seen status
   * of the given peer.
   *
   * @param {PeerInfo} peer
   * @private
   */
  _update (peer) {
    peer.lastSeen = new Date().getTime()
    this.kb.update({
      id: peer.id,
      peer: peer
    })
  }

  _getMessageHandler (type) {
    return this.messageHandlers[type]
  }

  // Interface

  findPeers (key, callback) {
    // 1. get closest peers
    // 2. ping them for more closer peers
    // 3. use in memory qeues with async (closer peers to ping, only add them if they are not yet on the priority queue)
    // start with an object to return then move to priority queue

    var peerList = {} // < b58Id : Peer >

    var q = queue(queryPeer, 1)

    var closerPeers = this.kb.closest(
      key, // key must be an Id object exported with .toBytes()
      this.ncp
    )

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
      this.swarm.dial(peerToQuery, '/ipfs/dht/1.0.0', function (err, conn) {
        if (err) {
          log.error('Could not open a stream to:', peerToQuery.id.toB58String())
          return cb()
        }

        // consider the peer to our finger table
        this.addPeer(peerToQuery)
        peerList[peerToQuery.id.toB58String()] = peerToQuery

        var query = {key: key, closerPeers: []}
        pull(
          pull.once(query),
          pull.map(this.pb.Query.encode),
          lp.encode(),
          conn,
          lp.decode(),
          pull.map(this.pb.Query.decode),
          pull.take(1),
          pull.collect(handleQuery)
        )

        function handleQuery (err, msgs) {
          if (err || msgs.length < 1) {
            log.error('Error receiving query', err)
            return cb()
          }
          var msg = msgs[0]
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
        }
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

  addPeer (peer) {
    this.kb.add({
      id: peer.id.toBytes(),
      peer: peer
    })
  }
}

module.exports = KadRouter
