'use strict'

// MaxRecordAge specifies the maximum time that any node will hold onto a record
// from the time its received. This does not apply to any other forms of validity that
// the record may contain.
// For example, a record may contain an ipns entry with an EOL saying its valid
// until the year 2020 (a great time in the future). For that record to stick around
// it must be rebroadcasted more frequently than once every 'MaxRecordAge'

const second = 1000
const minute = 60 * second
const hour = 60 * minute

exports.MAX_RECORD_AGE = 36 * hour

exports.PROTOCOL_DHT = '/ipfs/kad/1.0.0'
