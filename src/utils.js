'use strict'

const multihashing = require('multihashing-async')

/**
 * Convert a buffer to their SHA2-256 hash.
 *
 * @param {Bufffer} buf
 * @param {function(Error, Buffer)} callback
 * @returns {undefined}
 */
exports.bufferToKey = (buf, callback) => {
  multihashing.digest(buf, 'sha2-256', callback)
}
