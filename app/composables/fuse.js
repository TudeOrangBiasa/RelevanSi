import Fuse from 'fuse.js'

export function createFuseIndex(docs) {
  const options = {
    keys: ['title', 'content'],
    threshold: 0.3,
    includeScore: true
  }
  return new Fuse(docs, options)
}

