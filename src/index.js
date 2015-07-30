var KBucket = require('k-bucket')
// var log = require('ipfs-logger').group('peer-routing ipfs-kad-router')

exports = module.exports = KadRouter

function KadRouter (peerSelf, swarm) {
  var self = this

  if (!(self instanceof KadRouter)) {
    throw new Error('KadRouter must be called with new')
  }

  var kb = new KBucket({
    localNodeId: peerSelf.id.toBytes(),
    numberOfNodesPerKBucket: 20 // same as go-ipfs
  })

  kb.on('ping', function (oldContacts, newContact) {
    // TODO(daviddias)
    // 0. Update peer record with lastSeen
    // 1. sort oldContacts by last seen, swap last seen with new (kBucket.add)
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
    kb.add({
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
