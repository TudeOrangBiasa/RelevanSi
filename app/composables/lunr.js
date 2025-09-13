import lunr from 'lunr'

export function createLunrIndex(docs) {
  return lunr(function () {
    this.ref('id')
    this.field('title')
    this.field('content')

    try {
      this.pipeline.remove(lunr.stemmer)
      this.pipeline.remove(lunr.stopWordFilter)
      this.searchPipeline.remove(lunr.stemmer)
      this.searchPipeline.remove(lunr.stopWordFilter)
    } catch (e) {
      
      console.warn('lunr pipeline tweak failed', e)
    }

    docs.forEach(doc => {
      this.add({
        id: String(doc.id),
        title: doc.title ?? '',
        content: doc.content ?? '' 
      })
    })
  })
}

export function searchWithLunr(lunrIndex, docs, query) {
  if (!lunrIndex || !query) return []
  
  try {
    const lunrHits = lunrIndex.search(query)
    return lunrHits.map(hit => {
      const doc = docs.find(d => String(d.id) === String(hit.ref))
      return doc ? { ...doc, score: hit.score } : null
    }).filter(Boolean)
  } catch (e) {
    console.warn('lunr search failed', e)
    return []
  }
}