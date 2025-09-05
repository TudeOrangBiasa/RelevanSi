<template>
  <div class="relative h-screen bg-gradient-to-br from-[#0f1419] via-[#1a1d29] to-[#151922] text-gray-200 overflow-hidden">
    <div class="relative z-10 max-w-3xl mx-auto h-full pt-12 pb-12 px-6 flex flex-col">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-4">
          <button @click="goBack" class="px-3 py-2 rounded-xl bg-[#0b1220]/60 border border-gray-700/30 hover:bg-[#0b1626]/70">
            ← Kembali
          </button>
          <div>
            <h1 class="text-3xl font-semibold">{{ titleText }}</h1>
            <div class="text-xs text-gray-400 mt-1">
              <span v-if="doc?.metadata?.language">Lang: {{ doc.metadata.language }}</span>
              <span v-if="doc?.metadata?.word_count"> • {{ doc.metadata.word_count }} kata</span>
              <span v-if="doc?.created_at"> • {{ formatDate(doc.created_at) }}</span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button @click="decreaseFont" class="px-3 py-2 rounded-lg bg-[#242938]/60">A-</button>
          <button @click="increaseFont" class="px-3 py-2 rounded-lg bg-[#242938]/60">A+</button>
          <button @click="toggleLineHeight" class="px-3 py-2 rounded-lg bg-[#242938]/60">
            {{ relaxed ? 'Tight' : 'Relax' }}
          </button>
        </div>
      </div>


      <div
        class="reader bg-[#0f151a]/60 border border-gray-700/30 rounded-2xl p-8 shadow-[inset_6px_6px_12px_#0c0f14] overflow-auto flex-1"
        :style="{ fontSize: fontSize + 'px', lineHeight: relaxed ? 1.9 : 1.6, fontFamily: 'Georgia, Times, serif' }"
      >
        <template v-if="loading">
          <p class="text-gray-400">Loading...</p>
        </template>

        <template v-else-if="!doc">
          <p class="text-gray-400">Dokumen tidak ditemukan.</p>
        </template>

        <template v-else-if="!originalText">
          <p class="text-gray-400">Tidak ada konten untuk ditampilkan.</p>
        </template>

        <template v-else>
          <article class="prose prose-invert max-w-none">
            <p v-if="metaExcerpt" class="text-sm text-gray-300 italic mb-4">{{ metaExcerpt }}</p>
            <div v-for="(para, idx) in paragraphs" :key="idx" class="mb-4">
              <p v-html="para"></p>
            </div>
          </article>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { navigateTo } from '#app'
import { useSupabaseClient } from '~/composables/supabase'

const route = useRoute()
const supabase: any = useSupabaseClient()

const doc = ref<any>(null)
const loading = ref(true)
const fontSize = ref(18)
const relaxed = ref(false)

// safe id parsing
const rawId = route.query.id ?? route.params.id ?? null
const idStr = Array.isArray(rawId) ? String(rawId[0] ?? '') : (rawId == null ? '' : String(rawId ?? ''))
const idParam: string | number | null = /^\d+$/.test(idStr) ? Number(idStr) : (idStr || null)

const titleText = computed(() => doc.value?.title ?? 'Document')

function formatDate(d: string | Date | undefined) {
  if (!d) return ''
  const dt = new Date(d)
  return dt.toLocaleString()
}

const originalText = computed(() => {
  return doc.value?.content_raw ?? ''
})

const metaExcerpt = computed(() => doc.value?.metadata?.excerpt ?? '')

const paragraphs = computed(() => {
  const text = originalText.value || ''
  return text
    .split(/\n{2,}/g)
    .map((p: string) => p.trim())
    .filter(Boolean)
    .map((p: string) => p.replace(/\n/g, '<br/>'))
})

async function loadDoc() {
  loading.value = true
  try {
    if (!idParam) {
      doc.value = null
      return
    }
    const queryId = typeof idParam === 'number' ? idParam : String(idParam)
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', queryId)
      .maybeSingle()
    if (error) {
      console.error('fetch doc error', error)
      doc.value = null
    } else {
      doc.value = data
    }
  } catch (e) {
    console.error(e)
    doc.value = null
  } finally {
    loading.value = false
  }
}

function goBack() {
  navigateTo('/')
}

function increaseFont() {
  fontSize.value = Math.min(28, fontSize.value + 2)
}
function decreaseFont() {
  fontSize.value = Math.max(12, fontSize.value - 2)
}
function toggleLineHeight() {
  relaxed.value = !relaxed.value
}

onMounted(() => {
  loadDoc()
})
</script>

<style scoped>
.reader {
  color: #e6eef8;
  /* ensure it's a flex child that scrolls (set in template) */
}

/* prose-like tweaks for "light-novel" feel:
   - justify text (rata kiri-kanan)
   - paragraph indent
*/
.prose p {
  font-size: inherit;
  margin: 0 0 1.1em 0;
  color: #dbe7f6;
  text-align: justify;
  text-indent: 1.2em;
}

/* keep small images/figures centered within reader */
.prose img {
  display: block;
  margin: 0.8em auto;
  max-width: 100%;
}

/* scrollbar styling (optional, subtle) */
.reader::-webkit-scrollbar {
  width: 10px;
}
.reader::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.06);
  border-radius: 8px;
}
</style>