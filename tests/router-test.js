var Lab = require('lab')
var Code = require('code')
var lab = exports.lab = Lab.script()

var experiment = lab.experiment
var test = lab.test
var expect = Code.expect

var multiaddr = require('multiaddr')
var Id = require('peer-id')
var Peer = require('peer-info')
var Swarm = require('libp2p-swarm')
var tcp = require('libp2p-tcp')
var Spdy = require('libp2p-spdy')

var KadRouter = require('./../src')

experiment('PING', function () {
  test('Add 10 peers to a k=2 kBucket', function (done) {
    function ready (sw, p) {
      var kr = new KadRouter(p, sw, 2)

      kr.kb.once('ping', function (oldContacts, newContact) {
        sw.close()
        done()
      })

      for (var i = 0; i < 10; i++) {
        Peer.create(function(err, peer) {
          if (err) throw err
          peer.lastSeen = new Date()
          kr.addPeer(peer)
        })
      }
    }

    Peer.create(function (err, p) {
      var mh = multiaddr('/ip4/127.0.0.1/tcp/8010')
      var sw = new Swarm(p)
      sw.connection.addStreamMuxer(Spdy)
      sw.identify = true
      sw.transport.add('tcp', new tcp, {port: 8010}, function() { ready(sw, p) })
    })
  })
})

experiment('QUERY', function () {
  test('Should return error when kbucket is empty', function (done) {
    var mh = multiaddr('/ip4/127.0.0.1/tcp/8010')
    Peer.create(function (err, p) {
      if (err) throw err

      var sw = new Swarm(p)
      sw.transport.add('tcp', new tcp, {port: 8005}, ready)

      function ready () {
        sw.connection.addStreamMuxer(Spdy)
        sw.identify = true

        var kr = new KadRouter(p, sw, 2)

        Id.create(function (err, id) {
          if (err) throw err

          kr.findPeers(id.toBytes(), function (err, peerQueue) {
            expect(peerQueue).to.equal(undefined)
            expect(err).to.be.instanceof(Error)
            done()
          })
        })
      }
    })
  })

  test('query depth of one', function (done) {
    var mh1 = multiaddr('/ip4/127.0.0.1/tcp/8081')
    Peer.create(function (err, p1) {
      if (err) throw err
      p1.multiaddr.add(mh1)

      Peer.create(function (err, p2) {
        if (err) throw err
        p2.multiaddr.add(multiaddr('/ip4/127.0.0.1/tcp/8082'))

        var sw1 = new Swarm(p1)
        var sw2 = new Swarm(p2)

        sw1.transport.add('tcp', new tcp, {port: 8081}, ready)
        sw2.transport.add('tcp', new tcp, {port: 8082}, ready)
        sw1.connection.addStreamMuxer(Spdy)
        sw1.identify = true
        sw2.connection.addStreamMuxer(Spdy)
        sw2.identify = true

        sw1.listen(ready)
        sw2.listen(ready)

        var counter = 0

        function ready (err) {
          if (err) throw err
          counter++
          if (counter < 4) {
            return
          }

          var krOne = new KadRouter(p1, sw1)
          var krTwo = new KadRouter(p2, sw2)

          krOne.addPeer(p2)
          krTwo.addPeer(p1)

          Id.create(function (err, unknownId) {
            if (err) throw err
            krOne.findPeers(unknownId.toBytes(), function (err, peerQueue) {
              expect(err).to.equal(null)
              expect(peerQueue.peek().id.toB58String()).to.equal(p2.id.toB58String())
              done()
            })
          })
        }
      })
    })
  })

  test('query depth of two', function (done) {
    var mh1 = multiaddr('/ip4/127.0.0.1/tcp/8091')
    var p1 = new Peer(Id.create(), [])
    var sw1 = new Swarm(p1)
    sw1.transport.add('tcp', tcp, { multiaddr: mh1 }, {}, {port: 8091}, ready)

    var mh2 = multiaddr('/ip4/127.0.0.1/tcp/8092')
    var p2 = new Peer(Id.create(), [])
    var sw2 = new Swarm(p2)
    sw2.transport.add('tcp', tcp, { multiaddr: mh2 }, {}, {port: 8092}, ready)

    var mh3 = multiaddr('/ip4/127.0.0.1/tcp/8093')
    var p3 = new Peer(Id.create(), [])
    var sw3 = new Swarm(p3)
    sw3.transport.add('tcp', tcp, { multiaddr: mh3 }, {}, {port: 8093}, ready)

    var mh4 = multiaddr('/ip4/127.0.0.1/tcp/8094')
    var p4 = new Peer(Id.create(), [])
    var sw4 = new Swarm(p4)
    sw4.transport.add('tcp', tcp, { multiaddr: mh4 }, {}, {port: 8094}, ready)

    var mh5 = multiaddr('/ip4/127.0.0.1/tcp/8095')
    var p5 = new Peer(Id.create(), [])
    var sw5 = new Swarm(p5)
    sw5.transport.add('tcp', tcp, { multiaddr: mh5 }, {}, {port: 8095}, ready)

    var mh6 = multiaddr('/ip4/127.0.0.1/tcp/8096')
    var p6 = new Peer(Id.create(), [])
    var sw6 = new Swarm(p6)
    sw6.transport.add('tcp', tcp, { multiaddr: mh6 }, {}, {port: 8096}, ready)

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

      krOne.findPeers(Id.create().toBytes(), function (err, peerQueue) {
        expect(err).to.equal(null)
        expect(peerQueue.length).to.be.greaterThan(0)
        done()
      })
    }
  })

  test('query depth of three', function (done) {
    var mh1 = multiaddr('/ip4/127.0.0.1/tcp/8121')
    var p1 = new Peer(Id.create(), [])
    var sw1 = new Swarm(p1)
    sw1.transport.add('tcp', tcp, { multiaddr: mh1 }, {}, {port: 8121}, ready)

    var mh2 = multiaddr('/ip4/127.0.0.1/tcp/8122')
    var p2 = new Peer(Id.create(), [])
    var sw2 = new Swarm(p2)
    sw2.transport.add('tcp', tcp, { multiaddr: mh2 }, {}, {port: 8122}, ready)

    var mh3 = multiaddr('/ip4/127.0.0.1/tcp/8123')
    var p3 = new Peer(Id.create(), [])
    var sw3 = new Swarm(p3)
    sw3.transport.add('tcp', tcp, { multiaddr: mh3 }, {}, {port: 8123}, ready)

    var mh4 = multiaddr('/ip4/127.0.0.1/tcp/8124')
    var p4 = new Peer(Id.create(), [])
    var sw4 = new Swarm(p4)
    sw4.transport.add('tcp', tcp, { multiaddr: mh4 }, {}, {port: 8124}, ready)

    var mh5 = multiaddr('/ip4/127.0.0.1/tcp/8125')
    var p5 = new Peer(Id.create(), [])
    var sw5 = new Swarm(p5)
    sw5.transport.add('tcp', tcp, { multiaddr: mh5 }, {}, {port: 8125}, ready)

    var mh6 = multiaddr('/ip4/127.0.0.1/tcp/8126')
    var p6 = new Peer(Id.create(), [])
    var sw6 = new Swarm(p6)
    sw6.transport.add('tcp', tcp, { multiaddr: mh6 }, {}, {port: 8126}, ready)

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
      krOne.addPeer(p2)
      krTwo.addPeer(p3)
      krTwo.addPeer(p4)
      krFour.addPeer(p6)
      krThree.addPeer(p2)
      krFive.addPeer(p2)
      krSix.addPeer(p3)

      krOne.findPeers(Id.create().toBytes(), function (err, peerQueue) {
        expect(err).to.equal(null)
        expect(peerQueue.length).to.be.greaterThan(0)
        done()
      })
    }
  })
})
