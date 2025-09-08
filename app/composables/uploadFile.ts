export async function uploadFile(file: File, save: boolean = false) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('save', save ? 'true' : 'false')

  const res = await fetch('/api/upload-file', {
    method: 'POST',
    body: formData,
  })

  return await res.json()
}