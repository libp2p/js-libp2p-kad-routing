var tape = require('tape')
var tests = require('abstract-peer-routing/tests')
var multiaddr = require('multiaddr')
var Id = require('peer-id')
var Peer = require('peer-info')
var Swarm = require('libp2p-swarm')
var tcp = require('libp2p-tcp')

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

var mh

var common = {
  setup: function (t, cb) {
    mh = multiaddr('/ip4/127.0.0.1/tcp/8090')
    peerZero = new Peer(Id.create(), [mh])
    swarmZero = new Swarm(peerZero)
    swarmZero.addTransport('tcp', tcp, {}, {}, {port: 8090})
    krZero = new KadRouter(peerZero, swarmZero)

    mh = multiaddr('/ip4/127.0.0.1/tcp/8091')
    peerOne = new Peer(Id.create(), [mh])
    swarmOne = new Swarm(peerOne)
    swarmOne.addTransport('tcp', tcp, {}, {}, {port: 8091})
    krOne = new KadRouter(peerOne, swarmOne)

    mh = multiaddr('/ip4/127.0.0.1/tcp/8092')
    peerTwo = new Peer(Id.create(), [mh])
    swarmTwo = new Swarm(peerTwo)
    swarmTwo.addTransport('tcp', tcp, {}, {}, {port: 8092})
    krTwo = new KadRouter(peerTwo, swarmTwo)

    mh = multiaddr('/ip4/127.0.0.1/tcp/8093')
    peerThree = new Peer(Id.create(), [mh])
    swarmThree = new Swarm(peerThree)
    swarmThree.addTransport('tcp', tcp, {}, {}, {port: 8093})
    krThree = new KadRouter(peerThree, swarmThree)

    mh = multiaddr('/ip4/127.0.0.1/tcp/8094')
    peerFour = new Peer(Id.create(), [mh])
    swarmFour = new Swarm(peerFour)
    swarmFour.addTransport('tcp', tcp, {}, {}, {port: 8094})
    krFour = new KadRouter(peerFour, swarmFour)

    mh = multiaddr('/ip4/127.0.0.1/tcp/8095')
    peerFive = new Peer(Id.create(), [mh])
    swarmFive = new Swarm(peerFive)
    swarmFive.addTransport('tcp', tcp, {}, {}, {port: 8095})
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
  teardown: function () {
    swarmZero.closeListener('tcp')
    swarmOne.closeListener('tcp')
    swarmTwo.closeListener('tcp')
    swarmThree.closeListener('tcp')
    swarmFour.closeListener('tcp')
    swarmFive.closeListener('tcp')
  }
}

tests(tape, common)
