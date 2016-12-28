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
              table.closestPeers(key).length
            ).to.be.above(0)
            cb()
          })
        }, cb)
      ], done)
    })
  })
})

function createPeers (n, callback) {
  map(range(n), (i, cb) => PeerId.create(cb), callback)
}
