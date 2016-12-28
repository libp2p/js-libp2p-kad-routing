'use strict'

const pull = require('pull-stream')
const lp = require('pull-length-prefixed')
const debug = require('debug')

const Message = require('../message')
const getMessageHandler = require('./handlers')

const log = debug('libp2p:dht')
log.error = debug('libp2p:dht:error')

/**
 * Handle incoming streams from the swarm, on the dht protocol.
 *
 * @param {DHT} dht
 * @param {string} protocol
 * @param {Connection} conn
 * @returns {undefined}
 */
function protocolHandler (dht, protocol, conn) {
  conn.getPeerInfo((err, peer) => {
    if (err) {
      log.error('Failed to get peer info')
      return
    }

    pull(
      conn,
      lp.decode(),
      pull.map((rawMsg) => Message.decode(rawMsg)),
      pull.asyncMap((msg, cb) => {
        handleMessage(dht, peer, msg, cb)
      }),
      // Not all handlers will return a response
      pull.filter(Boolean),
      pull.map((response) => response.encode()),
      lp.encode(),
      conn
    )
  })
}

/**
 * Process incoming DHT messages.
 *
 * @param {DHT} dht
 * @param {PeerInfo} peer
 * @param {Message} msg
 * @param {function(Error, Message)} callback
 * @returns {undefined}
 * @private
 */
function handleMessage (dht, peer, msg, callback) {
  // update the peer
  dht._update(peer)

  // get handler & exectue it
  const handler = getMessageHandler(msg.type)

  if (!handler) {
    log.error(`no handler found for message type: ${msg.type}`)
    return callback()
  }

  handler(dht, peer, msg, callback)
}

module.exports = protocolHandler
