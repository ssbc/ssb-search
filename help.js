
module.exports = {
  description: 'full text search within ssb messages',
  commands: {
    query: {
      type: 'source',
      description: 'perform a search query'
      args: {
        query: 'search terms, space separated'
      }
    }
  }
}
