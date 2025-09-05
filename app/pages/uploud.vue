<template>
  <div class="max-w-xl mx-auto mt-10 p-6 bg-white rounded shadow">
    <h2 class="text-2xl font-bold mb-4">Upload Dokumen</h2>
    <form @submit.prevent="handleUpload">
      <input type="file" @change="onFileChange" accept=".txt,.pdf,.docx" class="mb-4" />
      <input v-model="title" type="text" placeholder="Judul dokumen" class="mb-4 border p-2 w-full" />
      <button type="submit" class="bg-blue-500 text-white px-4 py-2 rounded" :disabled="loading">
        {{ loading ? 'Uploading...' : 'Upload' }}
      </button>
    </form>
    <div v-if="message" class="mt-4 text-green-600">{{ message }}</div>
    <div v-if="error" class="mt-4 text-red-600">{{ error }}</div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useSupabaseClient } from '~/composables/supabase'
import { extractText } from '~/composables/extractText'
import { preprocess } from '~/composables/preprocessing'

const file = ref(null)
const title = ref('')
const loading = ref(false)
const message = ref('')
const error = ref('')
const supabase = useSupabaseClient()

function onFileChange(e) {
  file.value = e.target.files[0]
}

async function handleUpload() {
  if (!file.value || !title.value) {
    error.value = 'Judul dan file wajib diisi.'
    return
  }
  loading.value = true
  error.value = ''
  message.value = ''
  try {
    // Upload file ke Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(`${Date.now()}_${file.value.name}`, file.value)
    if (uploadError) throw uploadError

    // Dapatkan public URL file
    const { publicUrl } = supabase.storage
      .from('documents')
      .getPublicUrl(data.path)

    // Ekstrak teks dari file
    const rawText = await extractText(file.value)
    // Preprocessing (opsional)
    const processedText = preprocess(rawText)

    // Simpan metadata dan hasil ekstraksi ke tabel documents
    const { error: dbError } = await supabase
      .from('documents')
      .insert([{
        title: title.value,
        file_url: publicUrl,
        content: processedText,
        processed: true,
        metadata: { original_name: file.value.name }
      }])
    if (dbError) throw dbError

    message.value = 'Upload dan ekstraksi berhasil!'
    file.value = null
    title.value = ''
  } catch (err) {
    error.value = err.message || 'Upload gagal.'
  } finally {
    loading.value = false
  }
}
</script>