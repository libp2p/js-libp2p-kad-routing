'use strict'

const debug = require('debug')
const parallel = require('async/parallel')

const Message = require('../message')

const log = debug('libp2p:dht:rpc')
log.error = debug('libp2p:dht:rpc:error')

/**
 * Process `GetValue` DHT messages.
 *
 * @param {DHT} dht
 * @param {PeerInfo} peer
 * @param {Message} msg
 * @param {function(Error, Message)} callback
 * @returns {undefined}
 */
function getValue (dht, peer, msg, callback) {
  const key = msg.key

  log('handle GetValue for key: %s', msg.key)

  if (!key) {
    return callback(new Error('no key was provided'))
  }

  const response = new Message(msg.type, msg.key, msg.clusterLevel)

  parallel([
    (cb) => dht._checkLocalDatastore(key, cb),
    (cb) => dht._betterPeersToQuery(msg, peer, cb)
  ], (err, res) => {
    if (err) {
      return callback(err)
    }

    const record = res[0]
    const closer = res[1]

    response.record = record

    if (closer.length > 0) {
      response.closerPeers = closer
    }

    callback(null, response)
  })
}

module.exports = getValue
