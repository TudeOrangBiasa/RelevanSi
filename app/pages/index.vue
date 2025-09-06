<template>
  <div class="relative min-h-screen bg-gradient-to-br from-[#0f1419] via-[#1a1d29] to-[#151922] overflow-hidden">
    <!-- Toast container -->
    <div class="fixed top-6 right-6 z-50 flex flex-col gap-3 items-end">
      <transition-group name="toast" tag="div" class="flex flex-col gap-3">
        <div
          v-for="t in toasts"
          :key="t.id"
          :class="[
            'max-w-sm w-full flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg text-sm',
            t.type === 'success' ? 'bg-green-600/95 text-white' : '',
            t.type === 'error' ? 'bg-red-600/95 text-white' : '',
            t.type === 'info' ? 'bg-sky-600/95 text-white' : '',
            t.type === 'loading' ? 'bg-gray-800/95 text-white' : ''
          ]"
        >
          <div class="flex-shrink-0">
            <svg v-if="t.type === 'loading'" class="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-opacity="0.25"></circle>
              <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" stroke-width="3" stroke-linecap="round"></path>
            </svg>
            <svg v-else-if="t.type === 'success'" class="w-5 h-5" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <svg v-else-if="t.type === 'error'" class="w-5 h-5" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <svg v-else class="w-5 h-5" viewBox="0 0 24 24" fill="none">
              <path d="M13 16h-1v-4h-1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M12 8h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="flex-1">
            <div class="font-medium">{{ t.title }}</div>
            <div class="text-xs opacity-90">{{ t.message }}</div>
          </div>
          <button @click="removeToast(t.id)" class="ml-2 opacity-80 hover:opacity-100">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </transition-group>
    </div>

    <!-- Particles (visual) -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div v-for="particle in particles" :key="particle.id" class="absolute rounded-full opacity-20" :class="particle.color" :style="{
        width: particle.size + 'px',
        height: particle.size + 'px',
        left: particle.x + '%',
        top: particle.y + '%',
        animationDuration: particle.duration + 's',
        animationDelay: particle.delay + 's'
      }"></div>
      <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse"></div>
      <div class="absolute top-3/4 right-1/4 w-80 h-80 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse" style="animation-delay: 2s"></div>
      <div class="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-r from-indigo-500/20 to-blue-500/20 rounded-full blur-3xl animate-pulse" style="animation-delay: 4s"></div>
      <div class="absolute inset-0 opacity-5" style="background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0); background-size: 50px 50px;"></div>
    </div>

    <div class="relative z-10 max-w-4xl mx-auto pt-16 px-6 flex flex-col items-center">
      <div class="w-full flex items-center justify-between mb-6 gap-4">
        <div class="flex-1 text-center">
          <h1 class="text-5xl font-bold mb-2 flex items-center justify-center gap-3 bg-clip-text text-transparent tracking-tight bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400">
            <svg class="w-10 h-10 text-blue-400 animate-search-wiggle" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <span>RelevanSi</span>
          </h1>
          <p class="text-gray-400 text-lg font-light">Simple Javascript Based Document Search</p>
        </div>
      </div>

      <div class="flex items-center gap-4 mb-4 w-full max-w-md mx-auto">
        <a href="https://github.com/TudeOrangBiasa/RelevanSi" target="_blank" rel="noopener noreferrer" class="inline-flex justify-center items-center gap-2 py-4 rounded-2xl flex-1 bg-[#0b1220]/60 border border-gray-700/30 text-gray-200 hover:bg-[#0b1626]/70 transition whitespace-nowrap" title="View on GitHub">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
            <path d="M12.001 2C6.47598 2 2.00098 6.475 2.00098 12C2.00098 16.425 4.86348 20.1625 8.83848 21.4875C9.33848 21.575 9.52598 21.275 9.52598 21.0125C9.52598 20.775 9.51348 19.9875 9.51348 19.15C7.00098 19.6125 6.35098 18.5375 6.15098 17.975C6.03848 17.6875 5.55098 16.8 5.12598 16.5625C4.77598 16.375 4.27598 15.9125 5.11348 15.9C5.90098 15.8875 6.46348 16.625 6.65098 16.925C7.55098 18.4375 8.98848 18.0125 9.56348 17.75C9.65098 17.1 9.91348 16.6625 10.201 16.4125C7.97598 16.1625 5.65098 15.3 5.65098 11.475C5.65098 10.3875 6.03848 9.4875 6.67598 8.7875C6.57598 8.5375 6.22598 7.5125 6.77598 6.1375C6.77598 6.1375 7.61348 5.875 9.52598 7.1625C10.326 6.9375 11.176 6.825 12.026 6.825C12.876 6.825 13.726 6.9375 14.526 7.1625C16.4385 5.8625 17.276 6.1375 17.276 6.1375C17.826 7.5125 17.476 8.5375 17.376 8.7875C18.0135 9.4875 18.401 10.375 18.401 11.475C18.401 15.3125 16.0635 16.1625 13.8385 16.4125C14.201 16.725 14.5135 17.325 14.5135 18.2625C14.5135 19.6 14.501 20.675 14.501 21.0125C14.501 21.275 14.6885 21.5875 15.1885 21.4875C19.259 20.1133 21.9999 16.2963 22.001 12C22.001 6.475 17.526 2 12.001 2Z"/>
          </svg>
          <span class="text-sm">View On GitHub</span>
        </a>

        <button @click="showUploadModal = true" class="inline-flex items-center justify-center gap-2 py-4 rounded-2xl flex-1 bg-gradient-to-r from-green-500/20 to-blue-500/20 text-green-300 border border-green-500/20 hover:brightness-110 transition whitespace-nowrap" title="Upload dokumen">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
            <path d="M20 3H4C3.44772 3 3 3.44772 3 4V20C3 20.5523 3.44772 21 4 21H20C20.5523 21 21 20.5523 21 20V4C21 3.44772 20.5523 3 20 3ZM5 19V5H19V19H5ZM12 6.34311L6.34315 12L7.75736 13.4142L11 10.1715V17.6568H13V10.1715L16.2426 13.4142L17.6569 12L12 6.34311Z"/>
          </svg>
          <span class="text-sm">Upload File</span>
        </button>
      </div>

      <!-- Search -->
      <div class="w-full mb-6 relative group ">
        <div class="flex gap-4 items-center">
          <div class="relative flex-1 group">
        <span class="absolute z-10 left-5 top-1/2 -translate-y-1/2 transform text-gray-400 group-focus-within:text-blue-400 group-hover:text-blue-400 transition-colors duration-300 pointer-events-none flex items-center h-full">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </span>
        <input v-model="query" @keypress="handleKeyPress" type="text" placeholder="Ketik kata kunci untuk mencari dokumen..." class="w-full pl-14 pr-6 py-4 rounded-2xl border-none bg-[#242938]/80 backdrop-blur-sm text-lg text-gray-200 placeholder-gray-500 transition" />
          </div>
          <button @click="searchDocs" class="bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 font-semibold px-6 py-4 rounded-2xl">Cari</button>
        </div>
      </div>

      <!-- Results -->
      <div class="w-full mb-8">
        <div class="bg-[#242938]/60 backdrop-blur-sm rounded-3xl p-6 border border-gray-700/30">
          <h3 class="font-bold mb-4 text-gray-200 text-lg flex items-center gap-3">
            <div class="p-2 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20">
              <svg class="w-6 h-6 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            Hasil Pencarian ({{ results.length }})
          </h3>

          <div class="results-container max-h-[55dvh] overflow-auto space-y-4">
            <div v-for="(doc, index) in results" :key="doc.id" role="button" tabindex="0" @click="viewDoc(doc.id)" @keydown.enter.prevent="viewDoc(doc.id)" class="bg-[#242938]/40 backdrop-blur-sm rounded-2xl p-4 shadow-md border border-gray-700/20 hover:border-blue-500/30 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/30">
              <div class="flex items-start gap-4">
                <div class="p-3 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10">
                  <svg class="w-6 h-6 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                </div>
                <div class="flex-1">
                  <h4 class="text-xl font-semibold text-gray-100 mb-2">{{ doc.title }}</h4>
                  <p class="text-gray-400 leading-relaxed text-sm">
                    {{ (doc.metadata?.excerpt ?? (doc.content || '')).slice(0, 300) }}{{ ((doc.metadata?.excerpt ?? (doc.content || '')).length > 300) ? '...' : '' }}
                  </p>
                </div>
              </div>
            </div>

            <div v-if="searched && results && results.length === 0" class="w-full text-center py-12">
              <div class="p-4 rounded-2xl bg-gradient-to-r from-red-500/10 to-orange-500/10 inline-block mb-4">
                <svg class="w-8 h-8 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
              </div>
              <h3 class="text-xl font-semibold text-red-400 mb-2">Tidak ada hasil ditemukan</h3>
              <p class="text-gray-500">Coba gunakan kata kunci yang berbeda</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Upload Modal -->
    <transition name="fade">
      <div v-if="showUploadModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <div class="w-full max-w-2xl p-6 rounded-2xl bg-[#0f151a]/90 border border-gray-700/40 shadow-lg">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold text-gray-100">Upload Dokumen</h3>
            <button @click="showUploadModal = false" class="text-gray-400 hover:text-gray-200">Close ✕</button>
          </div>

          <div class="flex gap-4 items-center">
            <input type="file" @change="handleFileSelect" accept=".txt" class="flex-1 px-4 py-3 rounded-2xl border-none bg-[#242938]/80 text-gray-200" />
            <button
              @click="onUploadClick"
              :disabled="!selectedFile || isUploading"
              class="px-6 py-3 rounded-2xl bg-gradient-to-r from-green-500/20 to-blue-500/20 text-green-300 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span v-if="isUploading" class="inline-flex items-center gap-2">
                <svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-opacity="0.25"></circle>
                  <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" stroke-width="3" stroke-linecap="round"></path>
                </svg>
                Uploading...
              </span>
              <span v-else>Upload</span>
            </button>
          </div>

          <p v-if="uploadStatus" class="mt-4 text-sm text-gray-400">{{ uploadStatus }}</p>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSupabaseClient } from '~/composables/supabase'
import { preprocess, detectLanguageFromText } from '~/composables/preprocessing'
import { navigateTo } from '#app'

type Lang = 'id' | 'en'

interface DocumentItem {
  id: string
  title: string
  file_url?: string
  content: string
  created_at: string | Date
  processed: boolean
  metadata?: Record<string, any>
}

const supabase: any = useSupabaseClient()
const MAX_DOCS = 200
const query = ref('')
const docs = ref<DocumentItem[]>([])
const results = ref<DocumentItem[]>([])
const searched = ref(false)
const particles = ref<Array<any>>([])
const selectedFile = ref<File | null>(null)
const uploadStatus = ref('')
const showUploadModal = ref(false)
const isUploading = ref(false) // prevents double uploads
let lunrIndex: any = null
let fuseIndex: any = null

const toasts = ref<Array<{ id: number; type: 'success'|'error'|'info'|'loading'; title: string; message: string; timeout?: number | null }>>([])

function showToast(type: 'success'|'error'|'info'|'loading', title: string, message: string, timeout = 3500): number {
  const id = Date.now() + Math.floor(Math.random() * 1000)
  toasts.value.push({ id, type, title, message, timeout })
  if (timeout && type !== 'loading') {
    setTimeout(() => removeToast(id), timeout)
  }
  return id
}

function removeToast(id: number) {
  toasts.value = toasts.value.filter(t => t.id !== id)
}

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
  const { data, error } = await supabase
    .from('documents')
    .select('id,title,content,created_at,metadata')
    .eq('processed', true)
    .order('created_at', { ascending: false })
    .limit(MAX_DOCS)

  if (error) {
    console.error('loadDocuments error', error)
    showToast('error', 'Load failed', error?.message ?? String(error), 6000)
    return
  }

  docs.value = (data || []) as DocumentItem[]

  // Dynamic import of indexing functions to avoid bundling node-only deps into SSR/client bundle
  if (typeof window !== 'undefined') {
    try {
      const lunrMod = await import('~/composables/lunr')
      if (lunrMod && typeof lunrMod.createLunrIndex === 'function') {
        lunrIndex = lunrMod.createLunrIndex(docs.value)
      } else {
        lunrIndex = null
      }
    } catch (e) {
      console.warn('lunr index error (dynamic import)', e)
      lunrIndex = null
    }

    try {
      const fuseMod = await import('~/composables/fuse')
      if (fuseMod && typeof fuseMod.createFuseIndex === 'function') {
        fuseIndex = fuseMod.createFuseIndex(docs.value)
      } else {
        fuseIndex = null
      }
    } catch (e) {
      console.warn('fuse index error (dynamic import)', e)
      fuseIndex = null
    }
  } else {
    lunrIndex = null
    fuseIndex = null
  }

  results.value = []
}

function viewDoc(id: number | string) {
  if (!id) return
  navigateTo(`/view?id=${encodeURIComponent(String(id))}`)
}

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  selectedFile.value = input.files?.[0] ?? null
  if (selectedFile.value) {
    showToast('info', 'File selected', selectedFile.value.name, 2000)
  }
}

async function onUploadClick() {
  if (!selectedFile.value) return
  if (isUploading.value) return

  isUploading.value = true
  uploadStatus.value = 'Uploading & processing...'
  const loadingId = showToast('loading', 'Uploading', `Processing ${selectedFile.value.name}...`, undefined)
  try {
    if (typeof window === 'undefined') {
      throw new Error('Upload must be performed in browser')
    }
    const mod = await import('~/composables/uploudDocument')
    if (!mod || typeof mod.uploadDocument !== 'function') {
      throw new Error('uploadDocument module not available')
    }
    const inserted = await mod.uploadDocument(selectedFile.value, supabase)

    console.log('uploaded document', {
      id: inserted?.id,
      title: inserted?.title,
      contentPreview: (inserted?.content ?? '').slice(0, 200),
      contentRawPreview: (inserted?.content_raw ?? '').slice(0, 200)
    })

    removeToast(loadingId)
    showToast('success', 'Upload sukses', `File ${selectedFile.value.name} berhasil diproses`, 3500)
    uploadStatus.value = 'Upload & processing berhasil'
    selectedFile.value = null
    showUploadModal.value = false
    await loadDocuments()
  } catch (err: any) {
    removeToast(loadingId)
    const msg = (err?.message ?? String(err))
    showToast('error', 'Upload gagal', msg, 6000)
    uploadStatus.value = 'Upload gagal: ' + msg
    console.error(err)
  } finally {
    isUploading.value = false
  }
}

function searchDocs() {
  searched.value = true
  const rawQuery = query.value && query.value.trim()

  if (!rawQuery || rawQuery.length < 2) {
    results.value = []
    return
  }

  // detect language from query (safe, lightweight)
  const lang = detectLanguageFromText(rawQuery)
  const processedQuery = preprocess(rawQuery, lang)

  if (!processedQuery) {
    results.value = []
    return
  }

  if (lunrIndex) {
    try {
      const lunrHits = lunrIndex.search(processedQuery)
      const lunrResults = lunrHits.map((r: { ref: string }) => docs.value.find(d => String(d.id) === String(r.ref))).filter(Boolean)
      if (lunrResults.length > 0) {
        results.value = lunrResults as DocumentItem[]
        return
      }
    } catch (e) {
      console.warn('lunr search failed', e)
    }
  }

  if (fuseIndex) {
    try {
      const fuseHits = fuseIndex.search(processedQuery)
      const fuseResults = fuseHits.map((res: { item: DocumentItem }) => res.item)
      if (fuseResults.length > 0) {
        results.value = fuseResults
        return
      }
    } catch (e) {
      console.warn('fuse fallback failed', e)
    }
  }

  const plain = docs.value.filter(d =>
    (d.content || '').toLowerCase().includes(processedQuery.toLowerCase()) ||
    (d.title || '').toLowerCase().includes(rawQuery.toLowerCase())
  )
  results.value = plain
}

function handleKeyPress(e: KeyboardEvent) {
  if (e.key === 'Enter') searchDocs()
}

onMounted(async () => {
  generateParticles()
  await loadDocuments()
})
</script>

<style scoped>
@keyframes float { 0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-20px) rotate(180deg)} }
.animate-float { animation: float 6s ease-in-out infinite; }

@keyframes search-wiggle {
  0%{transform:translateY(0) rotate(0)}25%{transform:translateY(-3px) rotate(-6deg)}50%{transform:translateY(0) rotate(6deg)}75%{transform:translateY(-2px) rotate(-4deg)}100%{transform:translateY(0) rotate(0)}
}
.animate-search-wiggle { animation: search-wiggle 0.4s ease-in-out infinite; }

.results-container { max-height: calc(43dvh); overflow: auto; padding-right: 8px; }

.fade-enter-active, .fade-leave-active { transition: opacity .2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.toast-enter-active, .toast-leave-active { transition: all .2s ease; }
.toast-enter-from { transform: translateY(-8px); opacity: 0; }
.toast-leave-to { transform: translateY(-8px); opacity: 0; }
</style>
