import { ref, computed } from 'vue'
import * as stopwords from 'stopwords-iso'

const stopwordsObj = (stopwords as any) || {}
const indonesianStopwords = new Set<string>((stopwordsObj['id'] as string[]) || [])
const englishStopwords = new Set<string>((stopwordsObj['en'] as string[]) || [])

// small, dependency-free stemmer to avoid importing `natural`
function simpleStem(word: string): string {
  if (!word || word.length <= 3) return word
  return word.replace(/(ingly|edly|ingly|edly|ing|ied|ly|ed|es|s)$/i, '')
}

export function preprocess(text: string, language: 'id' | 'en' = 'id'): string {
  if (!text) return ''
  let t = String(text).toLowerCase()
  t = t.replace(/[^\p{L}\p{N}\s]/gu, ' ')
  t = t.replace(/\s+/g, ' ').trim()
  if (!t) return ''

  const tokens = t.split(' ').filter(Boolean)
  if (language === 'id') {
    const filtered = tokens.filter(tok => !indonesianStopwords.has(tok))
    return filtered.join(' ')
  } else {
    const filtered = tokens.filter(tok => !englishStopwords.has(tok))
    const stemmed = filtered.map(tok => simpleStem(tok))
    return stemmed.join(' ')
  }
}

export function detectLanguageFromText(sample = ''): 'id' | 'en' {
  const text = (sample || '').toLowerCase().trim()
  if (!text) return 'id'

  const tokens = text.slice(0, 1000).replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(Boolean)
  const countWords = (set: Set<string>) => tokens.reduce((c, t) => c + (set.has(t) ? 1 : 0), 0)

  const idCount = countWords(indonesianStopwords)
  const enCount = countWords(englishStopwords)
  return idCount >= enCount ? 'id' : 'en'
}

export const useTextProcessor = () => {
  const rawText = ref('')
  const language = ref<'id' | 'en'>('id')

  const processedText = computed(() => preprocess(rawText.value, language.value))

  return {
    rawText,
    language,
    processedText,
    detectLanguage: detectLanguageFromText
  }
}
