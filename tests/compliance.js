var tape = require('tape')
var tests = require('abstract-peer-routing/tests')
var multiaddr = require('multiaddr')
var Id = require('peer-id')
var Peer = require('peer-info')
var Swarm = require('libp2p-swarm')
var tcp = require('libp2p-tcp')
var Spdy = require('libp2p-spdy')

var KadRouter = require('./../src')

var sw1
var sw2
var sw3
var sw4
var sw5
var sw6

var common = {
  setup: function (t, cb) {
    var mh1 = multiaddr('/ip4/127.0.0.1/tcp/8091')
    var p1 = new Peer(Id.create(), [])
    sw1 = new Swarm(p1)
    sw1.addTransport('tcp', tcp, { multiaddr: mh1 }, {}, {port: 8091}, ready)

    var mh2 = multiaddr('/ip4/127.0.0.1/tcp/8092')
    var p2 = new Peer(Id.create(), [])
    sw2 = new Swarm(p2)
    sw2.addTransport('tcp', tcp, { multiaddr: mh2 }, {}, {port: 8092}, ready)

    var mh3 = multiaddr('/ip4/127.0.0.1/tcp/8093')
    var p3 = new Peer(Id.create(), [])
    sw3 = new Swarm(p3)
    sw3.addTransport('tcp', tcp, { multiaddr: mh3 }, {}, {port: 8093}, ready)

    var mh4 = multiaddr('/ip4/127.0.0.1/tcp/8094')
    var p4 = new Peer(Id.create(), [])
    sw4 = new Swarm(p4)
    sw4.addTransport('tcp', tcp, { multiaddr: mh4 }, {}, {port: 8094}, ready)

    var mh5 = multiaddr('/ip4/127.0.0.1/tcp/8095')
    var p5 = new Peer(Id.create(), [])
    sw5 = new Swarm(p5)
    sw5.addTransport('tcp', tcp, { multiaddr: mh5 }, {}, {port: 8095}, ready)

    var mh6 = multiaddr('/ip4/127.0.0.1/tcp/8096')
    var p6 = new Peer(Id.create(), [])
    sw6 = new Swarm(p6)
    sw6.addTransport('tcp', tcp, { multiaddr: mh6 }, {}, {port: 8096}, ready)

    var counter = 0

    function ready () {
      counter++
      if (counter < 6) {
        return
      }
      sw1.addStreamMuxer('spdy', Spdy, {})
      sw1.enableIdentify()
      sw2.addStreamMuxer('spdy', Spdy, {})
      sw2.enableIdentify()
      sw3.addStreamMuxer('spdy', Spdy, {})
      sw3.enableIdentify()
      sw4.addStreamMuxer('spdy', Spdy, {})
      sw4.enableIdentify()
      sw5.addStreamMuxer('spdy', Spdy, {})
      sw5.enableIdentify()
      sw6.addStreamMuxer('spdy', Spdy, {})
      sw6.enableIdentify()

      var krOne = new KadRouter(p1, sw1)
      var krTwo = new KadRouter(p2, sw2)
      var krThree = new KadRouter(p3, sw3)
      var krFour = new KadRouter(p4, sw4)
      var krFive = new KadRouter(p5, sw5)
      var krSix = new KadRouter(p6, sw6)

      krOne.addPeer(p2)
      krOne.addPeer(p3)
      krOne.addPeer(p4)
      krTwo.addPeer(p5)
      krTwo.addPeer(p6)
      krThree.addPeer(p1)
      krFour.addPeer(p1)
      krFive.addPeer(p1)
      krSix.addPeer(p1)

      cb(null, krOne)
    }
  },
  teardown: function () {
    sw1.closeListener('tcp', function () {})
    sw2.closeListener('tcp', function () {})
    sw3.closeListener('tcp', function () {})
    sw4.closeListener('tcp', function () {})
    sw5.closeListener('tcp', function () {})
    sw6.closeListener('tcp', function () {})
  }
}

tests(tape, common)
