var Lab = require('lab')
// var Code = require('code')
var lab = exports.lab = Lab.script()

var experiment = lab.experiment
var test = lab.test
// var expect = Code.expect

var multiaddr = require('multiaddr')
var Id = require('ipfs-peer-id')
var Peer = require('ipfs-peer')
var Swarm = require('ipfs-swarm')

var KadRouter = require('./../src')

experiment('PING', function () {
  test('Add 10 peers to a k=2 kBucket', function (done) {
    var peerSelf = new Peer(Id.create(), [multiaddr('/ip4/127.0.0.1/tcp/4001')])
    var swarmSelf = new Swarm(4001)

    var kr = new KadRouter(peerSelf, swarmSelf, 2)

    kr.kb.once('ping', function (oldContacts, newContact) {
      done()
    })

    for (var i = 0; i < 10; i++) {
      var p = new Peer(Id.create(), [multiaddr('/ip4/127.0.0.1/tcp/4001')])
      p.lastSeen = new Date()
      kr.addPeer(p)
    }
  })

})

experiment('QUERY', function () {

})
