import type { SupabaseClient } from '@supabase/supabase-js'
import { extractText } from './extractText'
import { preprocess, detectLanguageFromText } from './preprocessing'

type Lang = 'id' | 'en'

export async function uploadDocument(file: File, supabase: SupabaseClient) {
  // 1) extract raw text (do NOT modify this)
  const raw = await extractText(file)
  const originalRaw = String(raw || '') // defensive copy

  // 2) detect language and preprocess immediately
  const lang = detectLanguageFromText(originalRaw) as Lang
  const processed = preprocess(originalRaw || '', lang)
  const word_count = processed ? processed.split(/\s+/).filter(Boolean).length : 0

  // 3) prepare metadata and payload including processed content
  const initialMeta = {
    uploadedAt: new Date().toISOString(),
    language: lang,
    word_count,
    excerpt: (originalRaw || '').slice(0, 300),
    file_name: file.name,
    file_size: file.size ?? null,
    full_text: originalRaw
  }

  const payload = {
    title: file.name,
    file_url: file.name,
    content_raw: originalRaw, // original untouched text
    content: processed,       // preprocessed content for indexing
    processed: true,
    metadata: initialMeta,
    created_at: new Date().toISOString()
  }

  // 4) insert row (store raw + processed in one go)
  const { data: insData, error: insErr } = await supabase
    .from('documents')
    .insert([payload])
    .select('id,title,content,content_raw,metadata')
    .maybeSingle()

  if (insErr) throw insErr
  const inserted = insData as any
  const rowId = inserted?.id

  // 5) defensive: if DB returned content_raw different from original, correct it
  if (inserted && typeof inserted.content_raw === 'string' && inserted.content_raw !== originalRaw) {
    console.warn('uploadDocument: content_raw in DB differs from original extracted raw — correcting.')
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