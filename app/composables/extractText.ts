export async function extractText(file: File): Promise<string> {
  const ext = (file.name || '').split('.').pop()?.toLowerCase() || ''

  try {
    if (ext === 'txt') {
      return await file.text()
    }
    // Untuk PDF/DOCX, ekstraksi harus dilakukan di server
    console.warn('Ekstraksi PDF/DOCX hanya didukung di server. Kirim file ke API untuk diproses:', file.name)
    return ''
  } catch (err) {
    console.warn('extractText: gagal mengekstrak file', err)
    return ''
  }
}