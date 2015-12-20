
var pull = require('pull-stream')
var explain = require('explain-error')

var links_rx = /(\!?\[[^\[\]]+\]\([^)]+\))/
var parts_rx = /\!?\[([^\[\]]+)\]\(([^)]+)\)/

function isString (s) {
  return 'string' === typeof s
}

function links (text) {
  return text.split(links_rx)
    .filter(function (_, i) {
      return i%2
    }).map(function (e) {
      var parts = parts_rx.exec(e)
      return {
        text: parts[1], target: parts[2],
        image: e[0]==='!'
      }
    })
}

function match (q, t) {
  var m = q.length
  q.forEach(function (e) {
    if(~t.indexOf(e)) m--
  })
  return !m
}

function isHttp (url) {
  return /^https?:\/\//.test(url)
}

var query = process.argv.slice(2)

function Search (sbot) {
  var table = [], waiting = [], ready = false
  pull(
    sbot.createLogStream({live: true}),
    pull.filter(function (data) {
      if(data.sync) {
        ready = true
        while(waiting.length)
          waiting.shift()()
        return false
      }
      return 'string' === typeof data.value.content.text
    }),
    pull.map(function (data) {
      var l = links(data.value.content.text)
      l.forEach(function (e) { e.key = data.key })
      return l
    }),
    pull.flatten(),
    pull.drain(function (data) {
      table.push(data)
    }, function (_) {
  //    if(err) throw explain(err, 'ssb-seach: log stream errored')
      sbot.close(true)
    })
  )

  return {
    //todo: implement limit
    query: function (opts) {
      if(isString(opts)) opts = {query: [opts]}
      if(!opts || !opts.query)
        throw new Error('search.query: opts.query is required')
      var query = opts.query
      return pull(
        pull.values(table),
        pull.filter(function (e) {
          return match(query, e.text)
        }),
        opts && opts.limit ? pull.take(opts.limit) : pull.through()
      )
    },
    ready: function (cb) {
      if(ready) cb()
      else waiting.push(cb)
    }
  }
}

module.exports = {
  name: 'search',
  version: '0.0.0',
  manifest: {
    query: 'source',
    ready: 'async'
  },
  init: Search
}

if(!module.parent)
  require('ssb-client')(function (err, sbot) {
    if(err) throw explain(err, 'could not connect to sbot')
    var search = Search(sbot)
    search.ready(function (){
      var n = 0
      pull(
        search.query({query: process.argv.slice(2)}),
        pull.drain(function (data) {
          n++
          console.log(data)
        }, function () {
          console.log(''+n, 'result(s)')
          sbot.close(true)
        })
      )
    })
  })


