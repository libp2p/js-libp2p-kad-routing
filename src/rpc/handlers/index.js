'use strict'

const Message = require('../../message')

/**
 * Get the message handler matching the passed in type.
 *
 * @param {number} type
 * @returns {function()}
 * @private
 */
function getMessageHandler (type) {
  switch (type) {
    case Message.TYPES.GET_VALUE:
      return require('./get-value')
    case Message.TYPES.PUT_VALUE:
      return require('./put-value')
    case Message.TYPES.FIND_NODE:
      return require('./find-node')
    case Message.TYPES.ADD_PROVIDER:
      return require('./add-provider')
    case Message.TYPES.GET_PROVIDERS:
      return require('./get-providers')
    case Message.TYPES.PING:
      return require('./ping')
    default:
      return
  }
}

module.exports = getMessageHandler
