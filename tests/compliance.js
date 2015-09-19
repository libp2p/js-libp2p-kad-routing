var tape = require('tape')
var tests = require('abstract-peer-routing/tests')
var multiaddr = require('multiaddr')
var Id = require('peer-id')
var Peer = require('peer-info')
var Swarm = require('ipfs-swarm')

var KadRouter = require('./../src')

var swarmZero
var swarmOne
var swarmTwo
var swarmThree
var swarmFour
var swarmFive

var peerZero
var peerOne
var peerTwo
var peerThree
var peerFour
var peerFive

var krZero
var krOne
var krTwo
var krThree
var krFour
var krFive

var common = {
  setup: function (t, cb) {
    peerZero = new Peer(Id.create(), [multiaddr('/ip4/127.0.0.1/tcp/8090')])
    swarmZero = new Swarm()
    swarmZero.listen(8090)
    krZero = new KadRouter(peerZero, swarmZero)

    peerOne = new Peer(Id.create(), [multiaddr('/ip4/127.0.0.1/tcp/8091')])
    swarmOne = new Swarm()
    swarmOne.listen(8091)
    krOne = new KadRouter(peerOne, swarmOne)

    peerTwo = new Peer(Id.create(), [multiaddr('/ip4/127.0.0.1/tcp/8092')])
    swarmTwo = new Swarm()
    swarmTwo.listen(8092)
    krTwo = new KadRouter(peerTwo, swarmTwo)

    peerThree = new Peer(Id.create(), [multiaddr('/ip4/127.0.0.1/tcp/8093')])
    swarmThree = new Swarm()
    swarmThree.listen(8093)
    krThree = new KadRouter(peerThree, swarmThree)

    peerFour = new Peer(Id.create(), [multiaddr('/ip4/127.0.0.1/tcp/8094')])
    swarmFour = new Swarm()
    swarmFour.listen(8094)
    krFour = new KadRouter(peerFour, swarmFour)

    peerFive = new Peer(Id.create(), [multiaddr('/ip4/127.0.0.1/tcp/8095')])
    swarmFive = new Swarm()
    swarmFive.listen(8095)
    krFive = new KadRouter(peerFive, swarmFive)

    krZero.addPeer(peerOne)
    krZero.addPeer(peerTwo)
    krZero.addPeer(peerThree)
    krOne.addPeer(peerFour)
    krOne.addPeer(peerFive)
    krTwo.addPeer(peerZero)
    krThree.addPeer(peerZero)
    krFour.addPeer(peerZero)
    krFive.addPeer(peerZero)

    cb(null, krZero)
  },
  teardown: function (t, cb) {
    swarmZero.closeListener()
    swarmOne.closeListener()
    swarmTwo.closeListener()
    swarmThree.closeListener()
    swarmFour.closeListener()
    swarmFive.closeListener()

    // cb()
  }
}

tests(tape, common)
