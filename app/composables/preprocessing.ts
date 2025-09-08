import { ref, computed } from 'vue'
import stopwords from 'stopwords-iso'

// Simple stemmer implementation (tanpa natural untuk compatibility)
function simpleStem(word: string): string {
  if (!word || word.length <= 3) return word
  
  // Simple suffix removal for English
  word = word.replace(/(ies|ied)$/i, 'i')
  word = word.replace(/(ies|ies|ied|ies)$/i, 'y') 
  word = word.replace(/(ingly|edly)$/i, '')
  word = word.replace(/(ing|ly|ed|es|s)$/i, '')
  
  return word
}

// Simple TF-IDF implementation untuk mengganti natural
export class SimpleTfIdf {
  private documents: string[] = []
  private vocabulary: Set<string> = new Set()

  addDocument(doc: string) {
    this.documents.push(doc)
    const words = doc.toLowerCase().split(/\s+/).filter(Boolean)
    words.forEach(word => this.vocabulary.add(word))
  }

  tfidfs(query: string, callback: (index: number, score: number) => void) {
    const queryTerms = query.toLowerCase().split(/\s+/).filter(Boolean)
    
    this.documents.forEach((doc, index) => {
      const docWords = doc.toLowerCase().split(/\s+/).filter(Boolean)
      let score = 0
      
      queryTerms.forEach(term => {
        // Calculate TF
        const tf = docWords.filter(word => word === term).length / docWords.length
        
        // Calculate IDF
        const docsWithTerm = this.documents.filter(d => 
          d.toLowerCase().includes(term)
        ).length
        const idf = docsWithTerm > 0 ? Math.log(this.documents.length / docsWithTerm) : 0
        
        score += tf * idf
      })
      
      callback(index, score)
    })
  }
}

export function preprocess(text: string, language: 'id' | 'en' = 'id'): string {
  if (!text) return ''
  
  // Tokenize dan lowercase
  const tokens = text.toLowerCase().split(/\W+/).filter(Boolean)
  
  // Remove stopwords menggunakan stopwords-iso
  let filtered: string[]
  if (language === 'id') {
    // Untuk bahasa Indonesia
    const idStopwords = stopwords.id || []
    filtered = tokens.filter(token => !idStopwords.includes(token))
  } else {
    // Untuk bahasa Inggris
    const enStopwords = stopwords.en || []
    filtered = tokens.filter(token => !enStopwords.includes(token))
  }
  
  // Apply simple stemming
  const stemmed = filtered.map(token => simpleStem(token))
  
  return stemmed.join(' ')
}

export function detectLanguageFromText(sample = ''): 'id' | 'en' {
  const text = (sample || '').toLowerCase().trim()
  if (!text) return 'id'

  // Deteksi sederhana berdasarkan kata-kata umum
  const indonesianWords = ['dan', 'atau', 'yang', 'ini', 'itu', 'dari', 'untuk', 'dengan', 'pada', 'adalah']
  const englishWords = ['and', 'or', 'the', 'this', 'that', 'from', 'for', 'with', 'on', 'is']

  const tokens = text.slice(0, 1000).split(/\s+/).filter(Boolean)
  
  const idCount = tokens.reduce((count, token) => 
    count + (indonesianWords.includes(token) ? 1 : 0), 0
  )
  const enCount = tokens.reduce((count, token) => 
    count + (englishWords.includes(token) ? 1 : 0), 0
  )

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
