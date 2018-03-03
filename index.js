var FlumeViewSearch = require('flumeview-search')

exports.name = 'search'
exports.version = '2.0.0'
exports.manifest = { query: 'source' }

exports.init = function (sbot) {
  var search = sbot._flumeUse('search', FlumeViewSearch(12, 3, function (data) {
    return data.value.content.text
  }))
  return {
    query: search.query
  }
}









