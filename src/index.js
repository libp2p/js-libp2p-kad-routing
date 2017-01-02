'use strict'

const debug = require('debug')
const libp2pRecord = require('libp2p-record')

const rpc = require('./rpc')
const RoutingTable = require('./routing')
const utils = require('./utils')
const c = require('./constants')

const log = debug('libp2p:dht')
log.error = debug('libp2p:dht:error')

const Record = libp2pRecord.record

class KadRouter {
  /**
   * @param {PeerInfo} peerSelf
   * @param {Swarm} swarm
   * @param {PeerBook} peerBook
   * @param {number} kBucketSize
   */
  constructor (peerSelf, swarm, peerBook, kBucketSize) {
    /**
     * Local peer (yourself)
     * @type {PeerInfo}
     */
    this.self = peerSelf

    /**
     * @type {Swarm}
     */
    this.swarm = swarm

    /**
     * k-bucket size, defaults to 20.
     * @type {number}
     */
    this.kBucketSize = kBucketSize || 20

    /**
     * Number of closest peers to return on kBucket search
     * @type {number}
     */
    this.ncp = 6

    /**
     * @type {PeerBook}
     */
    this.peerBook = peerBook

    /**
     * @type {RoutingTable}
     */
    this.routingTable = new RoutingTable(this.self, this.kBucketSize)

    this._handleStream = this._handleStream.bind(this)
    this.swarm.handle(c.PROTOCOL_DHT, (protocol, conn) => {
      rpc.handle(this, protocol, conn)
    })
  }

  /**
   * Returns the routing tables closest peers, for the key of
   * the message.
   *
   * @param {Message} msg
   * @param {function(Error, Array<PeerInfo>)} callback
   * @returns {undefined}
   * @private
   */
  _nearestPeersToQuery (msg, callback) {
    utils.keyToBuffer(msg.key, (err, key) => {
      if (err) {
        return callback(err)
      }
      this.routingTable.closestPeers(key, this.ncp, callback)
    })
  }

  /**
   * Get the nearest peers to the given query, but iff closer
   * than self.
   *
   * @param {Message} msg
   * @param {PeerInfo} peer
   * @param {function(Error, Array<PeerInfo>)} callback
   * @returns {undefined}
   * @private
   */
  _betterPeersToQuery (msg, peer, callback) {
    this._nearestPeersToQuery(msg, (err, closer) => {
      if (err) {
        return callback(err)
      }

      const filtered = closer.filter((closer) => {
        if (closer.id.equals(this.self.id)) {
          // Should bail, not sure
          log.error('trying to return self as closer')
          return false
        }

        return !closer.id.equals(peer.id)
      })

      callback(null, filtered)
    })
  }

  /**
   * Try to fetch a given record by from the local datastore.
   * Returns the record iff it is still valid, meaning
   * - it was either authored by this node, or
   * - it was receceived less than `MAX_RECORD_AGE` ago.
   *
   * @param {string} key
   * @param {function(Error, Record)} callback
   * @returns {undefined}
   */
  _checkLocalDatastore (key, callback) {
    // 1. convert key to datastore key (done inside datastore)
    // 2. fetch value from ds
    this.datastore.get(key, (err, rawRecord) => {
      if (err) {
        // TODO: check message
        if (err.message === 'not found') {
          // 3. if: not found return
          return callback()
        } else {
          return callback(err)
        }
      }

      // 4. create record from the returned bytes
      let record
      try {
        record = Record.decode(rawRecord)
      } catch (err) {
        return callback(err)
      }

      // 5. check validity

      // 5. if: we are the author, all good
      if (record.author.id.equals(this.self)) {
        return callback(null, record)
      }

      //    else: compare recvtime with maxrecordage
      if (record.recvtime == null ||
          new Date().getTime() - record.recvtime > c.MAX_RECORD_AGE) {
        // 6. if: record is bad delete it and return
        return this.datastore.delete(key, callback)
      }

      //    else: return good record
      callback(null, record)
    })
  }

  /**
   * Signal the routing table to update its last-seen status
   * of the given peer.
   *
   * @param {PeerInfo} peer
   * @param {function(Error)} callback
   * @returns {undefined}
   * @private
   */
  _update (peer, callback) {
    this.routingTable.update(peer, callback)
  }
}

module.exports = KadRouter
