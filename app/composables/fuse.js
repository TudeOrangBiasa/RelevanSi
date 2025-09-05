import Fuse from 'fuse.js'

export function createFuseIndex(docs) {
  const options = {
    keys: [
      { name: 'title', weight: 0.7 },
      { name: 'content', weight: 0.3 } 
    ],
    threshold: 0.3,
    includeScore: true,
    ignoreLocation: true,
    minMatchCharLength: 2,
  }
  return new Fuse(docs, options)
}