'use strict'

const debug = require('debug')

const rpc = require('./rpc')
const RoutingTable = require('./routing')

const log = debug('libp2p:dht')
log.error = debug('libp2p:dht:error')

const PROTOCOL_DHT = '/ipfs/kad/1.0.0'

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
    this.swarm.handle(PROTOCOL_DHT, (protocol, conn) => {
      rpc.handle(this, protocol, conn)
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

      if (closer.length === 0) {
        return callback(null, closer)
      }
      // TODO
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
