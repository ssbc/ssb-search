var FlumeViewSearch = require('flumeview-search')
var pullCont = require('pull-cont')
var pull = require('pull-stream')
var msgs = require('ssb-msgs')

exports.name = 'search'
exports.version = '2.0.0'
exports.manifest = { query: 'source' }

exports.init = function (sbot) {
  var search = sbot._flumeUse('search', FlumeViewSearch(12, 3, function (data) {
    return data.value.content.text
  }))
  return {
    query: function (opts) {
      opts = opts || {}

      return pullCont(function (cb) {
        var keys = {}
        pull(
          search.query({query: opts.query}),
          pull.drain(function (data) {
            keys[data.key] = data.value
          }, function () {
            var counts = {}
            for(var key in keys) {
              var msg = keys[key]
              msgs.indexLinks(msg.content, function (n) {
                if(keys[n.link])
                  counts[n.link] = (counts[n.link] || 0) + 1
              })
            }
            var array = 
              Object.keys(keys)
              .sort(function (a, b) {
                return (
                  ((counts[b]|0) - (counts[a]|0)) ||
                  (keys[b].timestamp - keys[a].timestamp)
                )
              }).map(function (key) {
                return {key: key, value: keys[key], rank: counts[key]}
              })

            cb(null, pull.values(array.slice(0, opts.limit || array.length)))

          })
        )
      })
    }
  }
}








