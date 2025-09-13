import formidable from 'formidable'
import fs from 'fs'
import mammoth from 'mammoth'
import { createRequire } from 'module'

// Untuk mendukung require di ES modules
const require = createRequire(import.meta.url)

// Import fungsi ekstraksi judul (dibuat inline karena ini server-side)
function extractTitleFromContent(content: string, fallbackTitle?: string): string {
  if (!content || content.trim().length === 0) {
    return fallbackTitle || 'Dokumen Tanpa Judul'
  }

  const lines = content.trim().split(/\r?\n/).filter(line => line.trim().length > 0)
  
  if (lines.length === 0) {
    return fallbackTitle || 'Dokumen Tanpa Judul'
  }

  const firstLine = lines[0]?.trim() || ''
  
  // Jika baris pertama cukup pendek dan tidak berakhir dengan tanda baca kalimat
  if (firstLine.length > 0 && firstLine.length <= 150 && 
      !firstLine.match(/[.!?;:]$/)) {
    return cleanTitle(firstLine, false) // Jangan hapus prefix untuk baris pertama
  }

  // Cari pattern judul dengan format khusus
  for (const line of lines.slice(0, 10)) {
    const trimmed = line.trim()
    
    if (trimmed.length < 3 || trimmed.length > 200) continue
    
    if (
      /^[A-Za-z0-9]+\.?\s+[A-Z]/.test(trimmed) ||
      /^["'\[\(].*["'\]\)]$/.test(trimmed) ||
      isTitleCase(trimmed)
    ) {
      return cleanTitle(trimmed, true) // Hapus prefix untuk format khusus
    }
  }

  // Ambil kalimat pertama yang lengkap
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
  if (sentences.length > 0) {
    const firstSentence = sentences[0]?.trim() || ''
    if (firstSentence.length <= 200) {
      return cleanTitle(firstSentence, false)
    }
  }

  // Fallback ke baris pertama
  if (firstLine.length > 0) {
    const truncated = firstLine.length > 120 ? firstLine.substring(0, 117) + '...' : firstLine
    return cleanTitle(truncated, false)
  }

  return fallbackTitle || 'Dokumen Tanpa Judul'
}

function cleanTitle(title: string, removePrefix: boolean = true): string {
  let cleaned = title.trim()
  cleaned = cleaned.replace(/^["\'\[\(]+|["\'\]\)]+$/g, '')
  
  // Hanya hapus pattern nomor di awal jika removePrefix = true dan tidak mengandung kata kunci penting
  if (removePrefix) {
    if (!/\b(EndeavourOS|Arch|Linux|Windows|MacOS|Ubuntu|Debian|CentOS|RedHat|Guide|Tutorial|Manual|Report)\b/i.test(cleaned)) {
      cleaned = cleaned.replace(/^[A-Za-z0-9]+\.?\s*/, '')
    }
  }
  
  cleaned = cleaned.replace(/\s+/g, ' ')
  
  if (cleaned === cleaned.toLowerCase()) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
  }
  
  if (cleaned.length > 120) {
    cleaned = cleaned.substring(0, 117) + '...'
  }
  
  return cleaned.trim() || 'Dokumen Tanpa Judul'
}

function isTitleCase(text: string): boolean {
  const words = text.split(/\s+/).filter(word => /[a-zA-Z]/.test(word))
  if (words.length === 0) return false
  
  const capitalizedWords = words.filter(word => /^[A-Z]/.test(word))
  return capitalizedWords.length / words.length >= 0.7 && words.length >= 2
}

export default defineEventHandler(async (event) => {
  try {
    // Hanya menerima POST
    if (event.req.method !== 'POST') {
      setResponseStatus(event, 405)
      return { ok: false, error: 'Method Not Allowed' }
    }

    // Parse form-data dengan formidable
    const form = formidable({ multiples: false, keepExtensions: true })
    const { fields, files } = await new Promise<{ fields: formidable.Fields; files: formidable.Files }>((resolve, reject) => {
      form.parse(event.req, (err, fields, files) => {
        if (err) reject(err)
        else resolve({ fields, files })
      })
    })

    // Ambil file pertama
    const fileArray = Array.isArray(files.file) ? files.file : [files.file]
    const file = fileArray[0]
    if (!file) return { ok: false, error: 'Tidak ada file' }

    console.log('Processing file:', file.originalFilename, 'at path:', file.filepath)

    // Baca buffer file
    const buffer = await fs.promises.readFile(file.filepath)
    const filenameLower = (file.originalFilename || '').toLowerCase()
    let text = ''

    // Ekstrak teks sesuai tipe file
    if (filenameLower.endsWith('.pdf')) {
      // Gunakan require dengan path langsung ke library parser
      const pdfParseLib = require('pdf-parse/lib/pdf-parse.js')
      const data = await pdfParseLib(buffer)
      text = data.text || ''
    } else if (filenameLower.endsWith('.docx')) {
      const result = await mammoth.extractRawText({ buffer })
      text = result.value || ''
    } else {
      text = buffer.toString('utf8')
    }

    // Ekstrak judul dari isi dokumen
    const originalFilename = (file.originalFilename ?? '').replace(/\.[^/.]+$/, '')
    const extractedTitle = extractTitleFromContent(text, originalFilename)

    // Kembalikan hasil ekstraksi
    return {
      ok: true,
      title: extractedTitle,
      originalFilename: originalFilename,
      preview: text.trim().slice(0, 3000),
      length: text.length,
    }
  } catch (err: any) {
    console.error('Upload file error:', err)
    setResponseStatus(event, 500)
    return { 
      ok: false, 
      error: err.message || 'Server error saat memproses file'
    }
  }
})