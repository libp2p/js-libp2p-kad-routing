/* eslint-env mocha */
'use strict'

const expect = require('chai').expect
const PeerId = require('peer-id')
const map = require('async/map')
const each = require('async/each')
const waterfall = require('async/waterfall')
const range = require('lodash.range')
const random = require('lodash.random')

const RoutingTable = require('../src/routing')
const utils = require('../src/utils')

describe('RoutingTable', () => {
  let table

  beforeEach((done) => {
    PeerId.create((err, id) => {
      if (err) {
        done(err)
      }

      table = new RoutingTable(id, 20)

      done()
    })
  })

  it('add', (done) => {
    createPeers(100, (err, peers) => {
      expect(err).to.not.exist
      waterfall([
        (cb) => each(range(1000), (n, cb) => {
          table.add(peers[random(peers.length - 1)], cb)
        }, cb),
        (cb) => each(range(100), (n, cb) => {
          const id = peers[random(peers.length - 1)]
          utils.bufferToKey(id.id, (err, key) => {
            expect(err).to.not.exist
            expect(
              table.closestPeers(key, 5).length
            ).to.be.above(0)
            cb()
          })
        }, cb)
      ], done)
    })
  })

  it('remove', (done) => {
    createPeers(10, (err, peers) => {
      let k
      expect(err).to.not.exist
      waterfall([
        (cb) => each(peers, (peer, cb) => {
          table.add(peer, cb)
        }, cb),
        (cb) => {
          const id = peers[2]
          utils.bufferToKey(id.id, (err, key) => {
            expect(err).to.not.exist
            k = key
            expect(
              table.closestPeers(key, 10)
            ).to.have.length(10)
            cb()
          })
        },
        (cb) => table.remove(peers[5], cb),
        (cb) => {
          expect(
            table.closestPeers(k, 10)
          ).to.have.length(9)

          expect(table.size).to.be.eql(9)
          cb()
        }
      ], done)
    })
  })

  it('closestPeer', (done) => {
    createPeers(10, (err, peers) => {
      expect(err).to.not.exist
      waterfall([
        (cb) => each(peers, (peer, cb) => {
          table.add(peer, cb)
        }, cb),
        (cb) => {
          const id = peers[2]
          utils.bufferToKey(id.id, (err, key) => {
            expect(err).to.not.exist
            expect(
              table.closestPeer(key)
            ).to.be.eql([id])
            cb()
          })
        }
      ], done)
    })
  })

  it('closestPeers', (done) => {
    createPeers(18, (err, peers) => {
      expect(err).to.not.exist
      waterfall([
        (cb) => each(peers, (peer, cb) => {
          table.add(peer, cb)
        }, cb),
        (cb) => {
          const id = peers[2]
          utils.bufferToKey(id.id, (err, key) => {
            expect(err).to.not.exist
            expect(
              table.closestPeers(key, 15)
            ).to.have.length(15)
            cb()
          })
        }
      ], done)
    })
  })
})

function createPeers (n, callback) {
  map(range(n), (i, cb) => PeerId.create(cb), callback)
}
