import { uploadFile } from './uploadFile'
import { extractText } from './extractText'
import { preprocess, detectLanguageFromText } from './preprocessing'
import { extractTitleFromContent } from './titleExtractor'
import type { SupabaseClient } from '@supabase/supabase-js'

type Lang = 'id' | 'en'

export async function uploadAndSave(file: File, supabase: SupabaseClient) {
  const ext = (file.name || '').split('.').pop()?.toLowerCase() || ''
  let rawText = ''
  let extractedTitle = ''
  
  // Untuk PDF/DOCX, ekstrak di server dulu
  if (ext === 'pdf' || ext === 'docx') {
    const serverResult = await uploadFile(file, false) // false = hanya ekstrak, tidak simpan
    if (!serverResult.ok) {
      throw new Error(serverResult.error || 'Ekstraksi file gagal')
    }
    rawText = serverResult.preview || ''
    extractedTitle = serverResult.title || '' // Judul sudah diekstrak di server
  } 
  // Untuk TXT, ekstrak langsung di client
  else if (ext === 'txt') {
    rawText = await extractText(file)
    // Ekstrak judul dari isi file TXT
    const originalFilename = file.name.replace(/\.[^/.]+$/, '')
    extractedTitle = extractTitleFromContent(rawText, originalFilename)
  } 
  else {
    throw new Error('Format file tidak didukung. Hanya .txt, .pdf, .docx yang diizinkan.')
  }

  // Jika rawText kosong, tolak
  if (!rawText || rawText.trim().length === 0) {
    throw new Error('File kosong atau tidak bisa diekstrak')
  }

  // Jika ekstraksi judul gagal, gunakan nama file sebagai fallback
  if (!extractedTitle || extractedTitle.trim().length === 0) {
    extractedTitle = file.name.replace(/\.[^/.]+$/, '')
  }

  // Deteksi bahasa dan preprocess
  const lang = detectLanguageFromText(rawText) as Lang
  const processed = preprocess(rawText, lang)
  const word_count = processed ? processed.split(/\s+/).filter(Boolean).length : 0

  // Siapkan metadata
  const metadata = {
    uploadedAt: new Date().toISOString(),
    language: lang,
    word_count,
    excerpt: rawText.slice(0, 300),
    file_name: file.name,
    file_size: file.size ?? null,
    full_text: rawText,
    extracted_title: extractedTitle, // Simpan judul yang diekstrak
    title_source: extractedTitle !== file.name.replace(/\.[^/.]+$/, '') ? 'content' : 'filename'
  }

  // Simpan ke Supabase
  const payload = {
    title: extractedTitle, // Gunakan judul yang diekstrak
    file_url: file.name,
    content_raw: rawText,
    content: processed,
    processed: true,
    metadata,
    created_at: new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('documents')
    .insert([payload])
    .select('id,title,content,content_raw,metadata')
    .maybeSingle()

  if (error) throw error
  return data
}
