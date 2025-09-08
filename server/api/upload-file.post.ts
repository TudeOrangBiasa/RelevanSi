import formidable from 'formidable'
import fs from 'fs'
import mammoth from 'mammoth'
import { createRequire } from 'module'

// Untuk mendukung require di ES modules
const require = createRequire(import.meta.url)

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

    // Kembalikan hasil ekstraksi
    return {
      ok: true,
      title: (file.originalFilename ?? '').replace(/\.[^/.]+$/, ''),
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