var Lab = require('lab')
var Code = require('code')
var lab = exports.lab = Lab.script()

var experiment = lab.experiment
var test = lab.test
var expect = Code.expect

var multiaddr = require('multiaddr')
var Id = require('ipfs-peer-id')
var Peer = require('ipfs-peer')
var Swarm = require('ipfs-swarm')

var KadRouter = require('./../src')

experiment('PING', function () {
  test('Add 10 peers to a k=2 kBucket', function (done) {
    var peerSelf = new Peer(Id.create(), [multiaddr('/ip4/127.0.0.1/tcp/4001')])
    var swarmSelf = new Swarm()

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
  test('Should return error when kbucket is empty', function (done) {
    var peerSelf = new Peer(Id.create(), [multiaddr('/ip4/127.0.0.1/tcp/4001')])
    var swarmSelf = new Swarm()

    var kr = new KadRouter(peerSelf, swarmSelf)

    kr.findPeers(Id.create().toBytes(), function (err, peerList) {
      expect(peerList).to.equal(undefined)
      expect(err).to.be.instanceof(Error)
      done()
    })
  })

  test('2 peers with each other in their routing table, should return peerList of one', function (done) {
    var peerOne = new Peer(Id.create(), [multiaddr('/ip4/127.0.0.1/tcp/8081')])
    var swarmOne = new Swarm()
    swarmOne.listen(8081)

    var peerTwo = new Peer(Id.create(), [multiaddr('/ip4/127.0.0.1/tcp/8082')])
    var swarmTwo = new Swarm()
    swarmTwo.listen(8082)

    var krOne = new KadRouter(peerOne, swarmOne)
    var krTwo = new KadRouter(peerTwo, swarmTwo)

    krOne.addPeer(peerTwo)
    krTwo.addPeer(peerOne)

    krOne.findPeers(Id.create().toBytes(), function (err, peerList) {
      expect(err).to.equal(null)
      expect(Object.keys(peerList)[0]).to.equal(peerTwo.id.toB58String())
      done()
    })
  })

})
