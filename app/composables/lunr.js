import lunr from 'lunr'

export function createLunrIndex(docs) {
  return lunr(function () {
    this.ref('id')
    this.field('title')
    this.field('content')

    docs.forEach(doc => this.add(doc))
  })
}