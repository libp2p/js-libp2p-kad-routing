/* eslint-env mocha */
'use strict'

const expect = require('chai').expect

const utils = require('../src/utils')

describe('utils', () => {
  describe('bufferToKey', () => {
    it('returns the sha2-256 hash of the buffer', (done) => {
      const buf = new Buffer('hello world')

      utils.bufferToKey(buf, (err, digest) => {
        expect(err).to.not.exist

        expect(
          digest
        ).to.be.eql(
          new Buffer('b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9', 'hex')
        )
        done()
      })
    })
  })
})
