export async function extractText(file: File): Promise<string> {
  const ext = (file.name || '').split('.').pop()?.toLowerCase() || ''

  if (ext === 'txt') {
    return await file.text()
  }

  if (ext === 'pdf') {
    try {
      // dynamic import browser-compatible pdfjs (legacy build)
      const pdfjs = await import('pdfjs-dist/legacy/build/pdf')
      // set worker (CDN) - change version if needed
      if (pdfjs && pdfjs.GlobalWorkerOptions) {
        pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js'
      }

      const arrayBuffer = await file.arrayBuffer()
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer })
      const pdf = await loadingTask.promise

      let text = ''
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        text += content.items.map((it: any) => it.str).join(' ') + '\n'
      }
      return text
    } catch (err) {
      // extraction failed — return empty so caller can handle gracefully
      // console.warn('extractText: pdf extraction failed', err)
      return ''
    }
  }

  if (ext === 'docx' || ext === 'doc') {
    try {
      const mammothModule = await import('mammoth')
      // support named export or default export shape
      const extractor = (mammothModule.extractRawText ?? mammothModule.default?.extractRawText) as any
      if (typeof extractor === 'function') {
        const arrayBuffer = await file.arrayBuffer()
        const result = await extractor({ arrayBuffer })
        return (result && result.value) ? result.value : ''
      } else {
        // fallback: try calling default.extractRawText if available
        const alt = (mammothModule.default?.extractRawText ?? mammothModule.extractRawText) as any
        if (typeof alt === 'function') {
          const arrayBuffer = await file.arrayBuffer()
          const result = await alt({ arrayBuffer })
          return (result && result.value) ? result.value : ''
        }
        return ''
      }
    } catch (err) {
      // console.warn('extractText: docx extraction failed', err)
      return ''
    }
  }

  // fallback attempt: read as text
  try {
    return await file.text()
  } catch {
    return ''
  }
}