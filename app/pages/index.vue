<template>
  <div class="relative min-h-screen bg-gradient-to-br from-[#0f1419] via-[#1a1d29] to-[#151922] overflow-hidden">
    <!-- Enhanced Particle System -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div 
        v-for="particle in particles" 
        :key="particle.id"
        class="absolute rounded-full opacity-20"
        :class="particle.color"
        :style="{
          width: particle.size + 'px',
          height: particle.size + 'px',
          left: particle.x + '%',
          top: particle.y + '%',
          animationDuration: particle.duration + 's',
          animationDelay: particle.delay + 's'
        }"
      ></div>
      <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse"></div>
      <div 
        class="absolute top-3/4 right-1/4 w-80 h-80 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse"
        style="animation-delay: 2s"
      ></div>
      <div 
        class="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-r from-indigo-500/20 to-blue-500/20 rounded-full blur-3xl animate-pulse"
        style="animation-delay: 4s"
      ></div>
      <div class="absolute inset-0 opacity-5" style="background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0); background-size: 50px 50px;"></div>
    </div>

    <div class="relative z-10 max-w-3xl mx-auto pt-16 px-6 flex flex-col items-center">
      <div class="text-center mb-12">
        <h1 class="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent tracking-tight">
          Document Search
        </h1>
        <p class="text-gray-400 text-lg font-light">Temukan dokumen dengan mudah dan cepat</p>
      </div>

      <!-- Upload Section -->
      <div class="w-full mb-8">
        <div class="bg-[#242938]/60 backdrop-blur-sm rounded-3xl shadow-[inset_6px_6px_12px_#1a1d29,inset_-6px_-6px_12px_#2e3441] p-8 border border-gray-700/30">
          <h3 class="font-bold mb-6 text-gray-200 text-xl flex items-center gap-3">
            <div class="p-2 rounded-xl bg-gradient-to-r from-green-500/20 to-blue-500/20 shadow-[4px_4px_8px_#1a1d29,-4px_-4px_-8px_#2e3441]">
              <svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
              </svg>
            </div>
            Upload Dokumen
          </h3>
          <div class="flex gap-4 items-center">
            <input
              type="file"
              @change="handleFileSelect"
              accept=".pdf,.txt,.doc,.docx"
              class="flex-1 px-4 py-3 rounded-2xl border-none bg-[#242938]/80 backdrop-blur-sm shadow-[inset_8px_8px_16px_#1a1d29,inset_-8px_-8px_16px_#2e3441] focus:shadow-[inset_6px_6px_12px_#1a1d29,inset_-6px_-6px_12px_#2e3441] focus:outline-none text-gray-200"
            />
            <button
              @click="uploadFile"
              :disabled="!selectedFile"
              class="bg-gradient-to-r from-green-500/20 to-blue-500/20 backdrop-blur-sm text-green-400 font-semibold px-8 py-3 rounded-2xl shadow-[8px_8px_16px_#1a1d29,-8px_-8px_16px_#2e3441] hover:shadow-[inset_8px_8px_16px_#1a1d29,inset_-4px_-4px_8px_#2e3441] hover:text-green-300 active:shadow-[inset_6px_6px_12px_#1a1d29,inset_-6px_-6px_12px_#2e3441] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Upload
            </button>
          </div>
          <p v-if="uploadStatus" class="mt-4 text-sm text-gray-400">{{ uploadStatus }}</p>
        </div>
      </div>

      <!-- Search Section -->
      <div class="w-full mb-8 relative group">
        <div class="flex gap-4 items-center">
          <div class="relative flex-1">
            <input
              v-model="query"
              @keypress="handleKeyPress"
              type="text"
              placeholder="Ketik kata kunci untuk mencari dokumen..."
              class="w-full pl-14 pr-6 py-5 rounded-2xl border-none bg-[#242938]/80 backdrop-blur-sm shadow-[inset_8px_8px_16px_#1a1d29,inset_-8px_-8px_16px_#2e3441] focus:shadow-[inset_6px_6px_12px_#1a1d29,inset_-6px_-6px_12px_#2e3441] focus:outline-none text-lg text-gray-200 placeholder-gray-500 transition-all duration-300 hover:shadow-[inset_4px_4px_8px_#1a1d29,inset_-4px_-4px_8px_#2e3441]"
            />
            <div class="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-blue-400 transition-colors duration-300">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </div>
          </div>

          <button
            @click="searchDocs"
            class="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm text-blue-400 font-semibold px-8 py-5 rounded-2xl shadow-[8px_8px_16px_#1a1d29,-8px_-8px_16px_#2e3441] hover:shadow-[inset_8px_8px_16px_#1a1d29,inset_-4px_-4px_8px_#2e3441] hover:text-blue-300 active:shadow-[inset_6px_6px_12px_#1a1d29,inset_-6px_-6px_12px_#2e3441] transition-all duration-300 whitespace-nowrap flex items-center gap-3 group border border-blue-500/20"
          >
            <svg class="w-5 h-5 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            Cari
          </button>
        </div>
      </div>

      <!-- Enhanced Results -->
      <div v-if="results && results.length > 0" class="w-full">
        <div class="bg-[#242938]/60 backdrop-blur-sm rounded-3xl shadow-[inset_6px_6px_12px_#1a1d29,inset_-6px_-6px_12px_#2e3441] p-8 border border-gray-700/30">
          <h3 class="font-bold mb-6 text-gray-200 text-xl flex items-center gap-3">
            <div class="p-2 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 shadow-[4px_4px_8px_#1a1d29,-4px_-4px_-8px_#2e3441]">
              <svg class="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            Hasil Pencarian ({{ results.length }})
          </h3>
          <div class="space-y-4">
            <div
              v-for="(doc, index) in results"
              :key="doc.id"
              class="bg-[#242938]/40 backdrop-blur-sm rounded-2xl p-6 shadow-[6px_6px_12px_#1a1d29,-6px_-6px_-12px_#2e3441] hover:shadow-[4px_4px_8px_#1a1d29,-4px_-4px_8px_#2e3441] transition-all duration-300 cursor-pointer group border border-gray-700/20 hover:border-blue-500/30"
              :style="{ animationDelay: index * 0.1 + 's' }"
            >
              <div class="flex items-start gap-4">
                <div class="p-3 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 shadow-[inset_4px_4px_8px_#1a1d29,inset_-4px_-4px_8px_#2e3441] group-hover:shadow-[inset_2px_2px_4px_#1a1d29,inset_-2px_-2px_4px_#2e3441] transition-all duration-300">
                  <svg class="w-6 h-6 text-blue-400 group-hover:text-blue-300 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                </div>
                <div class="flex-1">
                  <h4 class="text-xl font-semibold text-gray-100 mb-3 group-hover:text-blue-300 transition-colors duration-300">
                    {{ doc.title }}
                  </h4>
                  <p class="text-gray-400 leading-relaxed text-base">
                    {{ (doc.content || doc.snippet || '').slice(0, 150) }}...
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Enhanced No Results -->
      <div v-if="searched && results && results.length === 0" class="w-full text-center">
        <div class="bg-[#242938]/60 backdrop-blur-sm rounded-3xl p-8 shadow-[inset_6px_6px_12px_#1a1d29,inset_-6px_-6px_12px_#2e3441] border border-red-500/20">
          <div class="p-4 rounded-2xl bg-gradient-to-r from-red-500/10 to-orange-500/10 shadow-[inset_4px_4px_8px_#1a1d29,inset_-4px_-4px_8px_#2e3441] inline-block mb-4">
            <svg class="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
          <h3 class="text-xl font-semibold text-red-400 mb-2">Tidak ada hasil ditemukan</h3>
          <p class="text-gray-500">Coba gunakan kata kunci yang berbeda</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSupabaseClient } from '~/composables/supabase'
import { createLunrIndex } from '~/composables/lunr'
import { createFuseIndex } from '~/composables/fuse'
import { extractText } from '~/composables/extractText'
import { preprocess } from '~/composables/preprocessing'

type Lang = 'id' | 'en'

interface DocumentItem {
  id: number
  title: string
  file_url: string
  content: string
  created_at: string | Date
  processed: boolean
  metadata: Record<string, any>
}

const MAX_DOCS = 200 // safety limit for client-side indexing
const query = ref<string>('')
const docs = ref<DocumentItem[]>([])
const results = ref<DocumentItem[]>([])
const searched = ref<boolean>(false)
const particles = ref<Array<any>>([])
const selectedFile = ref<File | null>(null)
const uploadStatus = ref<string>('')
let lunrIndex: any = null
let fuseIndex: any = null
const supabase: any = useSupabaseClient()

// Minimal particle generator so UI stays consistent
const generateParticles = () => {
  const colors = ['bg-blue-500/40', 'bg-purple-500/40', 'bg-pink-500/40', 'bg-cyan-400/30']
  const arr: Array<any> = []
  for (let i = 0; i < 8; i++) {
    arr.push({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 60 + Math.floor(Math.random() * 120),
      duration: 8 + Math.random() * 8,
      delay: Math.random() * 4,
      color: colors[i % colors.length]
    })
  }
  particles.value = arr
}

async function loadDocuments() {
  // ambil hanya dokumen yang sudah diproses
  const { data, error } = await supabase
    .from('documents')
    .select('id,title,content,created_at,metadata')
    .eq('processed', true)
    .order('created_at', { ascending: false })
    .limit(MAX_DOCS)

  console.log('loadDocuments ->', { dataLength: (data || []).length, error })
  if (error) {
    console.error('loadDocuments error', error)
    return
  }

  docs.value = (data || []) as DocumentItem[]

  console.log('first doc sample:', docs.value[0] ?? null)

  try {
    lunrIndex = createLunrIndex(docs.value)
    console.log('lunr index created')
  } catch (e) {
    console.error('lunr index error', e)
    lunrIndex = null
  }
  try {
    fuseIndex = createFuseIndex(docs.value)
    console.log('fuse index created')
  } catch (e) {
    console.error('fuse index error', e)
    fuseIndex = null
  }
}

// Upload: simpan metadata + processed = true (simple client-side processing for tugas)
async function uploadFile() {
  if (!selectedFile.value) return
  uploadStatus.value = 'Uploading...'
  try {
    const fileName = `${Date.now()}-${selectedFile.value.name}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, selectedFile.value as File)
    if (uploadError) throw uploadError

    // extract text first
    const raw = await extractText(selectedFile.value as File)

    // simple language detection from text sample (counts stopword occurrences)
    const detectLanguageFromText = (sample = ''): Lang => {
      const text = (sample || '').toLowerCase()
      if (!text) return 'id' // fallback

      const indo = ['yang','di','ke','dari','pada','untuk','dengan','adalah','ini','itu','dan','atau','juga']
      const eng = ['the','and','of','to','in','is','it','for','on','with','that','this','as','are']

      let idCount = 0, enCount = 0
      const sampleText = text.slice(0, 1000)
      for (const w of indo) {
        const re = new RegExp(`\\b${w}\\b`, 'g')
        const m = sampleText.match(re)
        if (m) idCount += m.length
      }
      for (const w of eng) {
        const re = new RegExp(`\\b${w}\\b`, 'g')
        const m = sampleText.match(re)
        if (m) enCount += m.length
      }
      return idCount >= enCount ? 'id' : 'en'
    }

    // decide language dynamically from extracted text
    const lang: Lang = detectLanguageFromText(raw)

    const processedText = preprocess(raw || '', lang)
    const word_count = processedText ? processedText.split(/\s+/).filter(Boolean).length : 0
    const metadata = {
      uploadedAt: new Date().toISOString(),
      language: lang,
      word_count,
      excerpt: (raw || '').slice(0, 300),
      file_size: selectedFile.value?.size ?? null
    }

    const { data, error } = await supabase
      .from('documents')
      .insert([{
        title: selectedFile.value!.name,
        file_url: uploadData.path,
        content: processedText,
        processed: true,
        metadata,
        created_at: new Date().toISOString()
      }])
    if (error) throw error

    uploadStatus.value = 'Upload & processing berhasil'
    selectedFile.value = null
    await loadDocuments()
  } catch (err: any) {
    uploadStatus.value = 'Upload gagal: ' + (err?.message ?? String(err))
    console.error(err)
  }
}

onMounted(async () => {
  generateParticles()
  await loadDocuments()
})

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  selectedFile.value = input.files?.[0] ?? null
}

function searchDocs() {
  searched.value = true
  const q = query.value && query.value.trim()
  console.log('searchDocs query=', q)

  if (!q) {
    results.value = []
    return
  }

  // Try lunr first (if available)
  if (lunrIndex) {
    try {
      const lunrHits = lunrIndex.search(q)
      console.log('lunr hits', lunrHits)
      const lunrResults = lunrHits
        .map((r: any) => docs.value.find(d => String(d.id) === String(r.ref)))
        .filter(Boolean) as DocumentItem[]
      if (lunrResults.length > 0) {
        results.value = lunrResults
        return
      }
    } catch (e) {
      console.warn('lunr search failed', e)
    }
  }

  // Fuse fallback
  if (fuseIndex) {
    try {
      const fuseHits = fuseIndex.search(q)
      console.log('fuse hits', fuseHits.length)
      const fuseResults = fuseHits.map((res: any) => res.item) as DocumentItem[]
      if (fuseResults.length > 0) {
        results.value = fuseResults
        return
      }
    } catch (e) {
      console.warn('fuse fallback failed', e)
    }
  }

  // Debug fallback: plain client-side substring search to confirm data presence
  console.log('running plain substring fallback search on client docs')
  const plain = docs.value.filter(d =>
    (d.content || '').toLowerCase().includes(q.toLowerCase()) ||
    (d.title || '').toLowerCase().includes(q.toLowerCase())
  )
  console.log('plain fallback results count=', plain.length)
  results.value = plain
}

function handleKeyPress(e: KeyboardEvent) {
  if (e.key === 'Enter') searchDocs()
}
</script>

<style scoped>
@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(180deg); }
}

.animate-float {
  animation: float 6s ease-in-out infinite;
}
</style>