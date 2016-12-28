'use strict'

const PeerInfo = require('peer-info')
const PeerId = require('peer-id')
const multiaddr = require('multiaddr')
const protobuf = require('protocol-buffers')
const pbm = protobuf(require('./dht.proto'))

const MESSAGE_TYPE = pbm.Message.MessageType
const CONNECTION_TYPE = pbm.Message.ConnectionType

/**
 * Represents a single DHT control message.
 */
class Message {
  /**
   * @param {MessageType} type
   * @param {string} key
   * @param {number} level
   */
  constructor (type, key, level) {
    this.type = type
    this.key = key
    this._clusterLevelRaw = level
    this.closerPeers = []
    this.providerPeers = []
  }

  /**
   * @type {number}
   */
  get clusterLevel () {
    const level = this._clusterLevelRaw - 1
    if (level < 0) {
      return 0
    }

    return level
  }

  set clusterLevel (level) {
    this._clusterLevelRaw = level
  }

  /**
   * Encode into protobuf
   * @returns {Buffer}
   */
  encode () {
    return pbm.Message.encode({
      key: this.key,
      type: this.type,
      clusterLevelRaw: this._clusterLevelRaw,
      closerPeers: this.closerPeers.map(toPbPeer),
      providerPeers: this.providerPeers.map(toPbPeer)
    })
  }

  /**
   * Decode from protobuf
   *
   * @param {Buffer} raw
   * @returns {Message}
   */
  static decode (raw) {
    const dec = pbm.Message.decode(raw)

    const msg = new Message(dec.type, dec.key, dec.clusterLevelRaw)

    msg.closerPeers = dec.closerPeers.map(fromPbPeer)
    msg.providerPeers = dec.providerPeers.map(fromPbPeer)

    return msg
  }
}

Message.TYPES = MESSAGE_TYPE

function toPbPeer (peer) {
  return {
    // TODO: get peer network status
    connection: CONNECTION_TYPE.CONNECTED,
    id: peer.id.id,
    addrs: peer.multiaddrs.map((p) => p.buffer)
  }
}

function fromPbPeer (peer) {
  const id = new PeerId(peer.id)
  const addrs = peer.addrs.map(multiaddr)
  const info = new PeerInfo(id)
  info.multiaddrs = addrs

  return info
}

module.exports = Message
