export async function extractText(file: File): Promise<string> {
  const ext = (file.name || '').split('.').pop()?.toLowerCase() || ''

  if (ext === 'txt') {
    try {
      return await file.text()
    } catch (err) {
      console.warn('extractText: failed to read txt file', err)
      return ''
    }
  }

  console.warn('extractText: only .txt extraction supported — skipping file:', file.name)
  return ''
}