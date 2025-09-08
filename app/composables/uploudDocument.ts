import type { SupabaseClient } from '@supabase/supabase-js'
import { extractText } from './extractText'
import { preprocess, detectLanguageFromText } from './preprocessing'

type Lang = 'id' | 'en'

export async function uploadDocument(file: File, supabase: SupabaseClient) {
  // 1. Ekstrak teks mentah dari file
  const raw = await extractText(file)
  const originalRaw = String(raw || '')

  // 2. Deteksi bahasa dokumen
  const lang = detectLanguageFromText(originalRaw) as Lang

  // 3. Preprocess teks untuk indexing/search
  const processed = preprocess(originalRaw || '', lang)
  const word_count = processed ? processed.split(/\s+/).filter(Boolean).length : 0

  // 4. Siapkan metadata
  const initialMeta = {
    uploadedAt: new Date().toISOString(),
    language: lang,
    word_count,
    excerpt: (originalRaw || '').slice(0, 300),
    file_name: file.name,
    file_size: file.size ?? null,
    full_text: originalRaw
  }

  // 5. Siapkan payload untuk database
  const payload = {
    title: file.name,
    file_url: file.name,
    content_raw: originalRaw,
    content: processed,
    processed: true,
    metadata: initialMeta,
    created_at: new Date().toISOString()
  }

  // 6. Simpan ke Supabase
  const { data: insData, error: insErr } = await supabase
    .from('documents')
    .insert([payload])
    .select('id,title,content,content_raw,metadata')
    .maybeSingle()

  if (insErr) throw insErr
  const inserted = insData as any
  const rowId = inserted?.id

  // 7. Pastikan content_raw di database sama dengan hasil ekstraksi
  if (inserted && typeof inserted.content_raw === 'string' && inserted.content_raw !== originalRaw) {
    const { error: fixErr } = await supabase
      .from('documents')
      .update({ content_raw: originalRaw })
      .eq('id', rowId)
    if (fixErr) console.warn('uploadDocument: failed to fix content_raw', fixErr)

    // re-select final row
    const { data: finalRow } = await supabase
      .from('documents')
      .select('id,title,content,content_raw,metadata')
      .eq('id', rowId)
      .maybeSingle()
    return finalRow ?? inserted
  }

  return inserted
}