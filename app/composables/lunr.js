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