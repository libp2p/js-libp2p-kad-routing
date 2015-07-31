var KBucket = require('k-bucket')
// var log = require('ipfs-logger').group('peer-routing ipfs-kad-router')

exports = module.exports = KadRouter

function KadRouter (peerSelf, swarm, kBucketSize) {
  var self = this

  if (!(self instanceof KadRouter)) {
    throw new Error('KadRouter must be called with new')
  }

  self.kBucketSize = kBucketSize || 20 // same as go-ipfs

  self.kb = new KBucket({
    localNodeId: peerSelf.id.toBytes(),
    numberOfNodesPerKBucket: self.kBucketSize
  })

  self.kb.on('ping', function (oldContacts, newContact) {
    var sorted = oldContacts.sort(function (a, b) {
      return a.peer.lastSeen - b.peer.lastSeen
    })

    console.log('sorted len: ', sorted.length)

    // add all less the last seen contact
    for (var i = 0; i < sorted.length - 1; i++) {
      self.kb.add(sorted[i])
    }

    self.kb.remove(sorted[sorted.length - 1])

    // add the new one
    self.kb.add(newContact)
  })

  // register /ipfs/dht/1.0.0 protocol handler

  swarm.registerHandler('/ipfs/dht/1.0.0', function (stream) {
    // TODO(davididas)
    //  1. attach the proto buf
    //  2. receive the peerId the other peer is looking forward
    //  3. get from the DHT, who are the closest peers
    //  4. write a protobuf back with those peers
  })

  self.findPeers = function (key, callback) {
    // TODO (daviddias) query and fill the priority queue, call the callback with priority queue
  }

  self.addPeer = function (peer) {
    self.kb.add({
      id: peer.id.toBytes(),
      peer: peer
    })
  }
}

/*
self.candidatesToId = function (id) {
  return kBucket.closest({
    id: id.toBytes(),
    n: 3
  })
}
*/
