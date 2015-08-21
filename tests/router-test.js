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

  test('query depth of one', function (done) {
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

  test('query depth of two', { timeout: false }, function (done) {
    var peerZero = new Peer(Id.create(), [multiaddr('/ip4/127.0.0.1/tcp/8090')])
    var swarmZero = new Swarm()
    swarmZero.listen(8090)
    var krZero = new KadRouter(peerZero, swarmZero)

    var peerOne = new Peer(Id.create(), [multiaddr('/ip4/127.0.0.1/tcp/8091')])
    var swarmOne = new Swarm()
    swarmOne.listen(8091)
    var krOne = new KadRouter(peerOne, swarmOne)

    var peerTwo = new Peer(Id.create(), [multiaddr('/ip4/127.0.0.1/tcp/8092')])
    var swarmTwo = new Swarm()
    swarmTwo.listen(8092)
    var krTwo = new KadRouter(peerTwo, swarmTwo)

    var peerThree = new Peer(Id.create(), [multiaddr('/ip4/127.0.0.1/tcp/8093')])
    var swarmThree = new Swarm()
    swarmThree.listen(8093)
    var krThree = new KadRouter(peerThree, swarmThree)

    var peerFour = new Peer(Id.create(), [multiaddr('/ip4/127.0.0.1/tcp/8094')])
    var swarmFour = new Swarm()
    swarmFour.listen(8094)
    var krFour = new KadRouter(peerFour, swarmFour)

    var peerFive = new Peer(Id.create(), [multiaddr('/ip4/127.0.0.1/tcp/8095')])
    var swarmFive = new Swarm()
    swarmFive.listen(8095)
    var krFive = new KadRouter(peerFive, swarmFive)

    krZero.addPeer(peerOne)
    krZero.addPeer(peerTwo)
    krZero.addPeer(peerThree)
    krOne.addPeer(peerFour)
    krOne.addPeer(peerFive)
    krTwo.addPeer(peerZero)
    krThree.addPeer(peerZero)
    krFour.addPeer(peerZero)
    krFive.addPeer(peerZero)

    krZero.findPeers(Id.create().toBytes(), function (err, peerList) {
      expect(err).to.equal(null)
      expect(Object.keys(peerList).length).to.be.greaterThan(0)
      done()
    })
  })
})
