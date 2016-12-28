/* eslint-env mocha */
'use strict'

const expect = require('chai').expect
const PeerInfo = require('peer-info')
const multiaddr = require('multiaddr')
const PeerId = require('peer-id')
const map = require('async/map')
const range = require('lodash.range')
const random = require('lodash.random')

const Message = require('../src/message')

describe('Message', () => {
  it('create', () => {
    const k = 'hello'
    const msg = new Message(Message.TYPES.PING, k, 5)

    expect(msg).to.have.property('type', 5)
    expect(msg).to.have.property('key', 'hello')
    // TODO: confirm this works as expected
    expect(msg).to.have.property('_clusterLevelRaw', 5)
    expect(msg).to.have.property('clusterLevel', 4)
  })

  it('encode and decode', (done) => {
    map(range(10), (n, cb) => PeerId.create(cb), (err, peers) => {
      expect(err).to.not.exist
      const closer = peers.slice(5).map((p) => {
        const info = new PeerInfo(p)
        info.multiaddrs = [
          multiaddr(`/ip4/198.176.1.${random(198)}/tcp/1234`),
          multiaddr(`/ip4/100.176.1.${random(198)}`)
        ]
        return info
      })

      const provider = peers.slice(0, 5).map((p) => {
        const info = new PeerInfo(p)
        info.multiaddrs = [
          multiaddr(`/ip4/98.176.1.${random(198)}/tcp/1234`),
          multiaddr(`/ip4/10.176.1.${random(198)}`)
        ]
        return info
      })

      const msg = new Message(Message.TYPES.GET_VALUE, 'hello', 5)

      msg.closerPeers = closer
      msg.providerPeers = provider

      const enc = msg.encode()
      const dec = Message.decode(enc)

      expect(dec.type).to.be.eql(msg.type)
      expect(dec.key).to.be.eql(msg.key)
      expect(dec.clusterLevel).to.be.eql(msg.clusterLevel)

      dec.closerPeers.forEach((peer, i) => {
        expect(
          peer.id.id.equals(msg.closerPeers[i].id.id)
        ).to.be.eql(true)
        expect(
          peer.multiaddrs
        ).to.be.eql(
          msg.closerPeers[i].multiaddrs
        )
      })

      dec.providerPeers.forEach((peer, i) => {
        expect(
          peer.id.id.equals(msg.providerPeers[i].id.id)
        ).to.be.eql(true)
        expect(
          peer.multiaddrs
        ).to.be.eql(
          msg.providerPeers[i].multiaddrs
        )
      })

      done()
    })
  })
})
