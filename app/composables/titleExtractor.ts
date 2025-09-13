/**
 * Mengekstrak judul dari isi dokumen
 * Menggunakan berbagai heuristik untuk menentukan judul yang paling mungkin
 */

export function extractTitleFromContent(content: string, fallbackTitle?: string): string {
  if (!content || content.trim().length === 0) {
    return fallbackTitle || 'Dokumen Tanpa Judul'
  }

  const lines = content.trim().split(/\r?\n/).filter(line => line.trim().length > 0)
  
  if (lines.length === 0) {
    return fallbackTitle || 'Dokumen Tanpa Judul'
  }

  // Strategi 1: Cari baris pertama yang terlihat seperti judul
  const firstLine = lines[0]?.trim() || ''
  
  // Jika baris pertama cukup pendek dan tidak berakhir dengan tanda baca kalimat
  if (firstLine.length > 0 && firstLine.length <= 150 && 
      !firstLine.match(/[.!?;:]$/)) {
    return cleanTitle(firstLine, false) // Jangan hapus prefix untuk baris pertama
  }

  // Strategi 2: Cari pattern judul dengan format khusus
  for (const line of lines.slice(0, 10)) { // hanya cek 10 baris pertama
    const trimmed = line.trim()
    
    // Skip baris yang terlalu pendek atau panjang
    if (trimmed.length < 3 || trimmed.length > 200) continue
    
    // Pola judul yang sering ditemukan:
    // - Baris yang diawali dengan angka/huruf dan diikuti titik (1. Judul, A. Judul)
    // - Baris yang berada di dalam tanda kurung atau quotes
    // - Baris yang menggunakan format CAPS atau Title Case
    
    if (
      // Format "1. Judul" atau "A. Judul" 
      /^[A-Za-z0-9]+\.?\s+[A-Z]/.test(trimmed) ||
      // Format dalam quotes atau brackets
      /^["'\[\(].*["'\]\)]$/.test(trimmed) ||
      // Format yang lebih dari 60% huruf kapital (judul CAPS)
      (countCapitalLetters(trimmed) / trimmed.replace(/\s/g, '').length > 0.6 && trimmed.length > 5) ||
      // Baris yang menggunakan Title Case (setiap kata diawali huruf besar)
      isTitleCase(trimmed)
    ) {
      return cleanTitle(trimmed, true) // Hapus prefix untuk format khusus
    }
  }

  // Strategi 3: Ambil kalimat pertama yang lengkap
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
  if (sentences.length > 0) {
    const firstSentence = sentences[0]?.trim() || ''
    if (firstSentence.length <= 200) {
      return cleanTitle(firstSentence, false)
    }
  }

  // Strategi 4: Fallback ke baris pertama yang tidak kosong
  if (firstLine.length > 0) {
    // Potong jika terlalu panjang tapi pertahankan kata kunci penting
    const truncated = firstLine.length > 120 ? firstLine.substring(0, 117) + '...' : firstLine
    return cleanTitle(truncated, false)
  }

  return fallbackTitle || 'Dokumen Tanpa Judul'
}

/**
 * Membersihkan dan memformat judul
 */
function cleanTitle(title: string, removePrefix: boolean = true): string {
  let cleaned = title.trim()
  
  // Hapus karakter khusus di awal dan akhir
  cleaned = cleaned.replace(/^["\'\[\(]+|["\'\]\)]+$/g, '')
  
  // Hanya hapus pattern nomor di awal jika removePrefix = true
  if (removePrefix) {
    // Hapus pattern nomor di awal (1., A., dll) hanya jika tidak mengandung kata kunci penting
    if (!/\b(EndeavourOS|Arch|Linux|Windows|MacOS|Ubuntu|Debian|CentOS|RedHat)\b/i.test(cleaned)) {
      cleaned = cleaned.replace(/^[A-Za-z0-9]+\.?\s*/, '')
    }
  }
  
  // Hapus multiple whitespace
  cleaned = cleaned.replace(/\s+/g, ' ')
  
  // Capitalize first letter jika seluruhnya lowercase
  if (cleaned === cleaned.toLowerCase()) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
  }
  
  // Potong jika masih terlalu panjang
  if (cleaned.length > 120) {
    cleaned = cleaned.substring(0, 117) + '...'
  }
  
  return cleaned.trim() || 'Dokumen Tanpa Judul'
}

/**
 * Menghitung jumlah huruf kapital dalam string
 */
function countCapitalLetters(text: string): number {
  return (text.match(/[A-Z]/g) || []).length
}

/**
 * Mengecek apakah string menggunakan Title Case
 */
function isTitleCase(text: string): boolean {
  const words = text.split(/\s+/).filter(word => /[a-zA-Z]/.test(word))
  if (words.length === 0) return false
  
  // Minimal 70% kata harus dimulai dengan huruf kapital
  const capitalizedWords = words.filter(word => /^[A-Z]/.test(word))
  return capitalizedWords.length / words.length >= 0.7 && words.length >= 2
}

/**
 * Ekstrak judul dengan beberapa kandidat dan pilih yang terbaik
 */
export function extractBestTitle(content: string, fallbackTitle?: string): { title: string; confidence: 'high' | 'medium' | 'low' } {
  if (!content || content.trim().length === 0) {
    return { title: fallbackTitle || 'Dokumen Tanpa Judul', confidence: 'low' }
  }

  const lines = content.trim().split(/\r?\n/).filter(line => line.trim().length > 0)
  
  if (lines.length === 0) {
    return { title: fallbackTitle || 'Dokumen Tanpa Judul', confidence: 'low' }
  }

  const firstLine = lines[0]?.trim() || ''
  
  // High confidence: baris pertama yang jelas merupakan judul dan mengandung kata kunci penting
  if (firstLine.length > 0 && firstLine.length <= 120 && 
      !firstLine.match(/[.!?;:]$/) && 
      (isTitleCase(firstLine) || 
       countCapitalLetters(firstLine) / firstLine.replace(/\s/g, '').length > 0.5 ||
       /\b(EndeavourOS|Arch|Linux|Windows|MacOS|Ubuntu|Debian|Guide|Tutorial|Manual|Report)\b/i.test(firstLine))) {
    return { title: cleanTitle(firstLine, false), confidence: 'high' }
  }

  // Medium confidence: menggunakan heuristik lainnya
  const extractedTitle = extractTitleFromContent(content, fallbackTitle)
  if (extractedTitle !== fallbackTitle && extractedTitle !== 'Dokumen Tanpa Judul') {
    return { title: extractedTitle, confidence: 'medium' }
  }

  // Low confidence: fallback
  return { title: extractedTitle, confidence: 'low' }
}
