'use strict'

const KBucket = require('k-bucket')

const utils = require('./utils')
const bufferToKey = utils.bufferToKey

/**
 * A wrapper around `k-bucket`, to provide easy store and
 * retrival for peers.
 */
class RoutingTable {
  /**
   * @param {PeerId} self
   * @param {number} kBucketSize
   */
  constructor (self, kBucketSize) {
    this.self = self

    this._onPing = this._onPing.bind(this)

    bufferToKey(self.id, (err, selfKey) => {
      if (err) {
        throw err
      }

      this.kb = new KBucket({
        localNodeId: selfKey,
        numberOfNodesPerKBucket: kBucketSize,
        numberOfNodesToPing: 1
      })

      this.kb.on('ping', this._onPing)
    })
  }

  // -- Private Methods

  /**
   * Called on the `ping` event from `k-bucket`.
   * Currently this just removes the oldest contact from
   * the list, without acutally pinging the individual peers.
   * This is the same as go does, but should probably
   * be upgraded to actually ping the individual peers.
   *
   * @param {Array<Object>} oldContacts
   * @param {Object} newContact
   * @returns {undefined}
   * @private
   */
  _onPing (oldContacts, newContact) {
    // just use the first one (k-bucket sorts from oldest to newest)
    const oldest = oldContacts[0]

    // remove the oldest one
    this.kb.remove(oldest.id)

    // add the new one
    this.kb.add(newContact)
  }

  // -- Public Interface

  /**
   * Retrieve the `count`-closest peers to the given key.
   *
   * @param {Buffer} key
   * @param {number} count
   * @returns {Array<PeerId>}
   */
  closestPeers (key, count) {
    return this.kb.closest(key, count).map((p) => p.peer)
  }

  /**
   * Add or update the routing table with the given peer.
   *
   * @param {PeerId} peer
   * @param {function(Error)} callback
   * @returns {undefined}
   */
  add (peer, callback) {
    bufferToKey(peer.id, (err, key) => {
      if (err) {
        return callback(err)
      }

      this.kb.add({
        id: key,
        peer: peer
      })

      callback()
    })
  }

  /**
   * Remove a given peer from the table.
   *
   * @param {PeerId} peer
   * @param {function(Error)} callback
   * @returns {undefined}
   */
  remove (peer, callback) {
    bufferToKey(peer.id, (err, key) => {
      if (err) {
        return callback(err)
      }

      this.kb.remove(key)

      callback()
    })
  }
}

module.exports = RoutingTable
