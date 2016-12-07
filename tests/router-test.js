var Lab = require('lab')
var Code = require('code')
var lab = exports.lab = Lab.script()

var experiment = lab.experiment
var test = lab.test
var expect = Code.expect
var before = lab.before

var multiaddr = require('multiaddr')
var Id = require('peer-id')
var Peer = require('peer-info')
var Swarm = require('libp2p-swarm')
var tcp = require('libp2p-tcp')
var Spdy = require('libp2p-spdy')

var KadRouter = require('./../src')

function makePeer (callback) {
  Peer.create(function (err, peer) {
    if (err) throw err
    callback(peer)
  })
}

function makePeers (count, callback) {
  var peers = []
  var created = 0

  for (var i = 0; i < count; i++) {
    makePeer(function (peer) {
      peers.push(peer)
      created++
      if (created == count) {
        callback(peers)
      }
    })
  }
}

function makeId (callback) {
  Id.create(function (err, id) {
    if (err) throw err
    callback(id)
  })
}

function makeSwarm (peer, port) {
  var maddr = multiaddr('/ip4/127.0.0.1/tcp/' + port)
  peer.multiaddr.add(maddr)
  var sw = new Swarm(peer)
  sw.connection.addStreamMuxer(Spdy)
  sw.identify = true
  sw.__listenPort = port
  return sw
}

function startSwarm (sw, callback) {
  sw.transport.add('tcp', new tcp, {port: sw.__listenPort}, function () {
    sw.listen(callback)
  })
}

function startSwarms (swarms, callback) {
  var started = 0
  for (var i = 0; i < swarms.length; i++) {
    var sw = swarms[i]
    startSwarm(sw, function (err) {
      if (err) throw err

      started++
      if (started == swarms.length) {
        callback()
      }
    })
  }
}

experiment('PING', function () {
  var p
  var peers = []
  before(function (done) {
    makePeers(11, function(newPeers) {
      p = newPeers.pop()
      peers = newPeers
      done()
    })
  })

  test('Add 10 peers to a k=2 kBucket', function (done) {
    var sw = makeSwarm(p, 8010)
    startSwarm(sw, function() {
      var kr = new KadRouter(p, sw, 2)

      kr.kb.once('ping', function (oldContacts, newContact) {
        sw.close(done)
      })

      for (var i = 0; i < peers.length; i++) {
        var peer = peers[i]
        peer.lastSeen = new Date()
        kr.addPeer(peer)
      }
    })
  })
})

experiment('QUERY', function () {
  var p
  var id

  before(function (done) {
    makePeer(function (peer) {
      p = peer
      if (p && id) done()
    })

    makeId(function (peerId) {
      id = peerId
      if (p && id) done()
    })
  })

  test('Should return error when kbucket is empty', function (done) {
    var sw = makeSwarm(p, 8005)
    startSwarm(sw, function () {
      var kr = new KadRouter(p, sw, 2)

      kr.findPeers(id.toBytes(), function (err, peerQueue) {
        expect(peerQueue).to.equal(undefined)
        expect(err).to.be.instanceof(Error)
        done()
      })
    })
  })
})

experiment('QUERY2', function () {
  var p1, p2
  var sw1, sw2
  var unknownId

  before(function (done) {
    makePeers(2, function(peers) {
      p1 = peers[0]
      p2 = peers[1]
      sw1 = makeSwarm(p1, 8081)
      sw2 = makeSwarm(p2, 8082)
      makeId(function (id) {
        unknownId = id
        done()
      })
    })
  })

  test('query depth of one', function (done) {
    startSwarms([sw1, sw2], ready)

    function ready () {
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
})

experiment('QUERY3', function () {
  var p1, p2, p3, p4, p5, p6
  var sw1, sw2, sw3, sw4, sw5, sw6
  var unknownId

  before(function (done) {
    makePeers(6, function(peers) {
      p1 = peers[0]
      p2 = peers[1]
      p3 = peers[2]
      p4 = peers[3]
      p5 = peers[4]
      p6 = peers[5]
      sw1 = makeSwarm(p1, 8091)
      sw2 = makeSwarm(p2, 8092)
      sw3 = makeSwarm(p3, 8093)
      sw4 = makeSwarm(p4, 8094)
      sw5 = makeSwarm(p5, 8095)
      sw6 = makeSwarm(p6, 8096)

      makeId(function (id) {
        unknownId = id
        done()
      })
    })
  })

  test('query depth of two', function (done) {
    startSwarms([sw1, sw2, sw3, sw4, sw5, sw6], ready)

    function ready () {
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
})

experiment('QUERY4', function () {
  var p1, p2, p3, p4, p5, p6
  var sw1, sw2, sw3, sw4, sw5, sw6
  var unknownId
  before(function (done) {
    makePeers(6, function(peers) {
      p1 = peers[0]
      p2 = peers[1]
      p3 = peers[2]
      p4 = peers[3]
      p5 = peers[4]
      p6 = peers[5]
      sw1 = makeSwarm(p1, 8121)
      sw2 = makeSwarm(p2, 8122)
      sw3 = makeSwarm(p3, 8123)
      sw4 = makeSwarm(p4, 8124)
      sw5 = makeSwarm(p5, 8125)
      sw6 = makeSwarm(p6, 8126)

      makeId(function (id) {
        unknownId = id
        done()
      })
    })
  })

  test('query depth of three', function (done) {
    startSwarms([sw1, sw2, sw3, sw4, sw5, sw6], ready)
    
    function ready () {
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
