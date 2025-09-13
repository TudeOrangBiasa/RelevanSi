import { SimpleTfIdf, preprocess } from './preprocessing'

export interface DocumentItem {
  id: string
  title: string
  file_url?: string
  content: string
  created_at: string | Date
  processed: boolean
  metadata?: Record<string, any>
}

export interface DocumentWithScore extends DocumentItem {
  score: number
}

export function searchWithTfIdf(documents: DocumentItem[], query: string, language: 'id' | 'en' = 'id'): DocumentWithScore[] {
  if (!query.trim() || documents.length === 0) {
    return []
  }

  // Buat model TF-IDF seperti teman Anda
  const tfidf = new SimpleTfIdf()
  
  // Tambahkan semua dokumen ke TF-IDF
  documents.forEach((doc, idx) => {
    const combinedText = (doc.title || '') + " " + (doc.content || '')
    const processed = preprocess(combinedText, language)
    tfidf.addDocument(processed)
  })

  // Proses query
  const processedQuery = preprocess(query, language)
  const results: DocumentWithScore[] = []
  
  // Hitung TF-IDF score untuk setiap dokumen
  tfidf.tfidfs(processedQuery, (i: number, measure: number) => {
    if (measure > 0 && documents[i]) {
      results.push({
        ...documents[i],
        score: measure,
      } as DocumentWithScore)
    }
  })

  // Urutkan berdasarkan relevansi (score tertinggi di atas)
  return results.sort((a, b) => b.score - a.score)
}

// Fungsi untuk kompatibilitas dengan interface lama
export function searchWithTfIdfLegacy(documents: DocumentItem[], query: string, language: 'id' | 'en' = 'id'): DocumentItem[] {
  const results = searchWithTfIdf(documents, query, language)
  return results.map(({ score, ...doc }) => doc as DocumentItem)
}
