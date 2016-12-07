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
    var mh2 = multiaddr('/ip4/127.0.0.1/tcp/8082')

    var p1, p2
    var sw1, sw2
    var unknownId

    Peer.create(function (err, p) {
      if (err) throw err
      p1 = p
      p1.multiaddr.add(mh1)
      sw1 = new Swarm(p1)
      sw1.connection.addStreamMuxer(Spdy)
      sw1.identify = true
      sw1.transport.add('tcp', new tcp, {port: 8081}, function () {
        sw1.listen(ready)
      })
    })

    Peer.create(function (err, p) {
      if (err) throw err
      p2 = p
      p2.multiaddr.add(mh2)
      sw2 = new Swarm(p2)
      sw2.connection.addStreamMuxer(Spdy)
      sw2.identify = true
      sw2.transport.add('tcp', new tcp, {port: 8082}, function () {
        sw2.listen(ready)
      })
    })

    Id.create(function (err, id) {
      if (err) throw err
      unknownId = id
      ready()
    })

    var counter = 0

    function ready (err) {
      if (err) throw err
      counter++
      if (counter < 3) {
        return
      }

      var krOne = new KadRouter(p1, sw1)
      var krTwo = new KadRouter(p2, sw2)

      krOne.addPeer(p2)
      krTwo.addPeer(p1)

      krOne.findPeers(unknownId.toBytes(), function (err, peerQueue) {
        expect(err).to.equal(null)
        expect(peerQueue.peek().id.toB58String()).to.equal(p2.id.toB58String())
        done()
      })
    }
  })

  test('query depth of two', function (done) {
    var p1, p2, p3, p4, p5, p6
    var sw1, sw2, sw3, sw4, sw5, sw6
    var mh1 = multiaddr('/ip4/127.0.0.1/tcp/8091')
    var mh2 = multiaddr('/ip4/127.0.0.1/tcp/8092')
    var mh3 = multiaddr('/ip4/127.0.0.1/tcp/8093')
    var mh4 = multiaddr('/ip4/127.0.0.1/tcp/8094')
    var mh5 = multiaddr('/ip4/127.0.0.1/tcp/8095')
    var mh6 = multiaddr('/ip4/127.0.0.1/tcp/8096')

    Peer.create(function (err, p) {
      if (err) throw err

      p1 = p
      p1.multiaddr.add(mh1)
      sw1 = new Swarm(p1)
      sw1.connection.addStreamMuxer(Spdy)
      sw1.identify = true
      sw1.transport.add('tcp', new tcp, {port: 8091}, function () {
        sw1.listen(ready)
      })
    })

    Peer.create(function (err, p) {
      if (err) throw err

      p2 = p
      p2.multiaddr.add(mh2)
      sw2 = new Swarm(p2)
      sw2.connection.addStreamMuxer(Spdy)
      sw2.identify = true
      sw2.transport.add('tcp', new tcp, {port: 8092}, function () {
        sw2.listen(ready)
      })
    })

    Peer.create(function (err, p) {
      if (err) throw err

      p3 = p
      p3.multiaddr.add(mh3)
      sw3 = new Swarm(p3)
      sw3.connection.addStreamMuxer(Spdy)
      sw3.identify = true
      sw3.transport.add('tcp', new tcp, {port: 8093}, function () {
        sw3.listen(ready)
      })
    })

    Peer.create(function (err, p) {
      if (err) throw err

      p4 = p
      p4.multiaddr.add(mh4)
      sw4 = new Swarm(p4)
      sw4.connection.addStreamMuxer(Spdy)
      sw4.identify = true
      sw4.transport.add('tcp', new tcp, {port: 8094}, function () {
        sw4.listen(ready)
      })
    })

    Peer.create(function (err, p) {
      if (err) throw err

      p5 = p
      p5.multiaddr.add(mh5)
      sw5 = new Swarm(p5)
      sw5.connection.addStreamMuxer(Spdy)
      sw5.identify = true
      sw5.transport.add('tcp', new tcp, {port: 8095}, function () {
        sw5.listen(ready)
      })
    })

    Peer.create(function (err, p) {
      if (err) throw err

      p6 = p
      p6.multiaddr.add(mh6)
      sw6 = new Swarm(p6)
      sw6.connection.addStreamMuxer(Spdy)
      sw6.identify = true
      sw6.transport.add('tcp', new tcp, {port: 8096}, function () {
        sw6.listen(ready)
      })
    })

    var unknownId
    Id.create(function (err, id) {
      if (err) throw err
      unknownId = id
      ready()
    })

    var counter = 0

    function ready () {
      counter++
      if (counter < 7) {
        return
      }

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

      krOne.findPeers(unknownId.toBytes(), function (err, peerQueue) {
        expect(err).to.equal(null)
        expect(peerQueue.length).to.be.greaterThan(0)
        done()
      })
    }
  })

  test('query depth of three', function (done) {
    var p1, p2, p3, p4, p5, p6
    var sw1, sw2, sw3, sw4, sw5, sw6
    var mh1 = multiaddr('/ip4/127.0.0.1/tcp/8121')
    var mh2 = multiaddr('/ip4/127.0.0.1/tcp/8122')
    var mh3 = multiaddr('/ip4/127.0.0.1/tcp/8123')
    var mh4 = multiaddr('/ip4/127.0.0.1/tcp/8124')
    var mh5 = multiaddr('/ip4/127.0.0.1/tcp/8125')
    var mh6 = multiaddr('/ip4/127.0.0.1/tcp/8126')

    Peer.create(function (err, p) {
      if (err) throw err

      p1 = p
      p1.multiaddr.add(mh1)
      sw1 = new Swarm(p1)
      sw1.connection.addStreamMuxer(Spdy)
      sw1.identify = true
      sw1.transport.add('tcp', new tcp, {port: 8121}, function () {
        sw1.listen(ready)
      })
    })

    Peer.create(function (err, p) {
      if (err) throw err

      p2 = p
      p2.multiaddr.add(mh2)
      sw2 = new Swarm(p2)
      sw2.connection.addStreamMuxer(Spdy)
      sw2.identify = true
      sw2.transport.add('tcp', new tcp, {port: 8122}, function () {
        sw2.listen(ready)
      })
    })

    Peer.create(function (err, p) {
      if (err) throw err

      p3 = p
      p3.multiaddr.add(mh3)
      sw3 = new Swarm(p3)
      sw3.connection.addStreamMuxer(Spdy)
      sw3.identify = true
      sw3.transport.add('tcp', new tcp, {port: 8123}, function () {
        sw3.listen(ready)
      })
    })

    Peer.create(function (err, p) {
      if (err) throw err

      p4 = p
      p4.multiaddr.add(mh4)
      sw4 = new Swarm(p4)
      sw4.connection.addStreamMuxer(Spdy)
      sw4.identify = true
      sw4.transport.add('tcp', new tcp, {port: 8124}, function () {
        sw4.listen(ready)
      })
    })

    Peer.create(function (err, p) {
      if (err) throw err

      p5 = p
      p5.multiaddr.add(mh5)
      sw5 = new Swarm(p5)
      sw5.connection.addStreamMuxer(Spdy)
      sw5.identify = true
      sw5.transport.add('tcp', new tcp, {port: 8125}, function () {
        sw5.listen(ready)
      })
    })

    Peer.create(function (err, p) {
      if (err) throw err

      p6 = p
      p6.multiaddr.add(mh6)
      sw6 = new Swarm(p6)
      sw6.connection.addStreamMuxer(Spdy)
      sw6.identify = true
      sw6.transport.add('tcp', new tcp, {port: 8126}, function () {
        sw6.listen(ready)
      })
    })

    var unknownId
    Id.create(function (err, id) {
      if (err) throw err
      unknownId = id
      ready()
    })

    var counter = 0

    function ready () {
      counter++
      if (counter < 7) {
        return
      }

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

      krOne.findPeers(unknownId.toBytes(), function (err, peerQueue) {
        expect(err).to.equal(null)
        expect(peerQueue.length).to.be.greaterThan(0)
        done()
      })
    }
  })
})
