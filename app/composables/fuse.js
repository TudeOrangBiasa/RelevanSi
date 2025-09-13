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

export function searchWithFuse(fuseIndex, query) {
  if (!fuseIndex || !query) return []
  
  try {
    const fuseHits = fuseIndex.search(query)
    return fuseHits.map(hit => ({
      ...hit.item,
      score: 1 - hit.score // Convert Fuse score (lower is better) to similarity score (higher is better)
    }))
  } catch (e) {
    console.warn('fuse search failed', e)
    return []
  }
}