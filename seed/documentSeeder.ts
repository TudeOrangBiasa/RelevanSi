
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

type Lang = 'id' | 'en'

function simplePreprocess(text: string, lang: Lang = 'id'): string {
  if (!text) return ''
  let t = String(text).toLowerCase()
  t = t.replace(/[^\p{L}\p{N}\s]/gu, ' ')
  t = t.replace(/\s+/g, ' ').trim()
  const tokens = t.split(' ').filter(Boolean)
  const stopEn = ['a','the','and','of','to','in','is','it','for','on','with','that','this','as','are']
  const stopId = ['yang','di','ke','dari','pada','untuk','dengan','adalah','ini','itu','dan','atau','juga']
  const stops = lang === 'id' ? stopId : stopEn
  const stemEn = (w: string) => w.replace(/(ing|ed|ly|es|s)$/, '')
  const stemId = (w: string) => w.replace(/(kan|i|an|lah|nya|ku|mu)$/, '')
  const filtered = tokens.filter(tk => !stops.includes(tk))
  const stemmed = filtered.map(tk => (lang === 'id' ? stemId(tk) : stemEn(tk)))
  return stemmed.join(' ')
}

function excerpt(text: string, length = 300) {
  if (!text) return ''
  return text.length <= length ? text : text.slice(0, length).trim() + '...'
}

async function main() {
  const SUPABASE_URL = process.env.SUPABASE_URL
  const SUPABASE_KEY = process.env.SUPABASE_KEY

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_KEY env vars')
    process.exit(1)
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

  // 30 sample documents
  const samples: Array<{ title: string; raw: string; file_url?: string; lang?: Lang; file_size?: number }> = [
    { title: 'Pengenalan Kernel Linux', raw: 'Penjelasan mendalam tentang arsitektur kernel Linux, modul, sistem berkas, dan manajemen proses.', file_url: 'seed/pengenalan-kernel-linux.txt', lang: 'id', file_size: 1024 },
    { title: 'Manajemen Paket di Debian dan Red Hat', raw: 'Perbandingan antara manajer paket APT (Debian) dan YUM/DNF (Red Hat). Cara instalasi paket dan resolusi dependensi.', file_url: 'seed/manajemen-paket-debian-redhat.txt', lang: 'id', file_size: 2048 },
    { title: 'Cloud Computing: IaaS, PaaS, SaaS', raw: 'Explains IaaS, PaaS, and SaaS models and typical use-cases.', file_url: 'seed/cloud-computing.txt', lang: 'en', file_size: 1500 },
    { title: 'Keamanan Jaringan Dasar', raw: 'Konsep dasar keamanan jaringan: firewall, NAT, VPN, dan enkripsi komunikasi.', file_url: 'seed/keamanan-jaringan.txt', lang: 'id', file_size: 1800 },
    { title: 'Algoritma Sorting', raw: 'Penjelasan quicksort, mergesort, dan bubblesort dengan kompleksitas waktu dan contoh penerapan.', file_url: 'seed/algoritma-sorting.txt', lang: 'id', file_size: 1200 },
    { title: 'Pengenalan GraphQL', raw: 'Alternatif untuk REST API, memahami query, mutation, dan skema GraphQL.', file_url: 'seed/pengenalan-graphql.txt', lang: 'id', file_size: 1300 },
    { title: 'Introduction to Machine Learning', raw: 'Overview of supervised and unsupervised learning, basic algorithms and evaluation metrics.', file_url: 'seed/ml-intro.txt', lang: 'en', file_size: 2200 },
    { title: 'Basis Data Relasional vs NoSQL', raw: 'Perbandingan model relasional dan NoSQL: kelebihan, kelemahan, dan use-cases.', file_url: 'seed/db-comparison.txt', lang: 'en', file_size: 1600 },
    { title: 'Pengantar Docker', raw: 'Dasar containerization menggunakan Docker: images, containers, Dockerfile, dan docker-compose.', file_url: 'seed/docker-intro.txt', lang: 'id', file_size: 1400 },
    { title: 'WebAssembly (WASM): Masa Depan Web', raw: 'Menjelajahi potensi WebAssembly untuk performa aplikasi web dan bahasa yang didukung.', file_url: 'seed/wasm.txt', lang: 'id', file_size: 1100 },
    { title: 'Pemrograman Functional', raw: 'Konsep dasar pemrograman fungsional: immutable data, pure functions, dan higher-order functions.', file_url: 'seed/functional.txt', lang: 'en', file_size: 1250 },
    { title: 'Etika dalam Pengembangan Teknologi', raw: 'Diskusi mengenai tanggung jawab etis pengembang perangkat lunak dan implikasi sosial teknologi.', file_url: 'seed/etika-teknologi.txt', lang: 'id', file_size: 900 },
    { title: 'Pengenalan Internet of Things (IoT)', raw: 'Bagaimana perangkat terhubung, protokol umum, dan contoh aplikasi IoT.', file_url: 'seed/iot-intro.txt', lang: 'en', file_size: 1350 },
    { title: 'Optimasi Kinerja Web', raw: 'Teknik optimasi frontend dan backend untuk mengurangi latency dan meningkatkan UX.', file_url: 'seed/web-performance.txt', lang: 'en', file_size: 1500 },
    { title: 'Dasar-dasar Kriptografi', raw: 'Konsep kunci publik dan privat, hashing, serta penggunaan kriptografi dalam keamanan data.', file_url: 'seed/kriptografi.txt', lang: 'id', file_size: 1700 },
    { title: 'Pemrosesan Teks dengan NLP', raw: 'Pendahuluan NLP: tokenization, stemming, stopwords, dan teknik sederhana untuk ekstraksi informasi.', file_url: 'seed/nlp.txt', lang: 'en', file_size: 1900 },
    { title: 'Version Control dengan Git', raw: 'Dasar penggunaan Git: branching, merging, rebase, dan alur kerja kolaboratif.', file_url: 'seed/git.txt', lang: 'id', file_size: 1100 },
    { title: 'Quantum Computing: Pengenalan', raw: 'Memahami qubit, superposition, dan algoritma dasar seperti Grover dan Shor.', file_url: 'seed/quantum.txt', lang: 'en', file_size: 2100 },
    { title: 'Membangun REST API dengan Node.js', raw: 'Panduan membuat RESTful API menggunakan Node.js dan Express, termasuk routing dan middleware.', file_url: 'seed/rest-node.txt', lang: 'id', file_size: 1600 },
    { title: 'Analisis Big Data', raw: 'Teknik penyimpanan dan pemrosesan big data serta alat umum seperti Hadoop dan Spark.', file_url: 'seed/bigdata.txt', lang: 'en', file_size: 2300 },
    { title: 'Desain Antarmuka Pengguna (UI)', raw: 'Prinsip dasar desain UI: konsistensi, hirarki visual, dan aksesibilitas.', file_url: 'seed/ui-design.txt', lang: 'id', file_size: 1000 },
    { title: 'Search Engine Basics', raw: 'How search engines index, rank, and retrieve documents; basics of IR models.', file_url: 'seed/search-basics.txt', lang: 'en', file_size: 1800 },
    { title: 'Pengenalan Sistem File Ext4', raw: 'Detail teknis mengenai struktur dan fitur Ext4 pada sistem operasi Linux.', file_url: 'seed/ext4.txt', lang: 'id', file_size: 1450 },
    { title: 'Container Orchestration: Kubernetes', raw: 'Konsep pods, services, deployment, dan cara mengelola skala aplikasi di Kubernetes.', file_url: 'seed/k8s.txt', lang: 'en', file_size: 2000 },
    { title: 'Pemrograman Berorientasi Objek', raw: 'Prinsip OOP: kelas, objek, pewarisan, enkapsulasi, dan polymorphism.', file_url: 'seed/oop.txt', lang: 'id', file_size: 1150 },
    { title: 'Testing Otomatis dengan Jest', raw: 'Menulis unit test dan snapshot test menggunakan Jest untuk aplikasi JavaScript.', file_url: 'seed/jest.txt', lang: 'en', file_size: 950 },
    { title: 'Pengenalan Sistem Operasi', raw: 'Konsep proses, manajemen memori, schedulers, dan interaksi hardware-software.', file_url: 'seed/os.txt', lang: 'id', file_size: 1750 },
    { title: 'Arsitektur Mikroservis', raw: 'Kelebihan dan tantangan arsitektur mikroservis serta pola komunikasi antar service.', file_url: 'seed/microservices.txt', lang: 'en', file_size: 1650 },
    { title: 'Optimasi Database SQL', raw: 'Indexing, query planning, dan tips mengoptimalkan performa query SQL.', file_url: 'seed/sql-opt.txt', lang: 'en', file_size: 1400 }
  ]

  // build payloads (processed + metadata)
  const toUpsert = samples.map(s => {
    const lang = s.lang ?? 'id'
    const processed = simplePreprocess(s.raw, lang)
    const word_count = processed ? processed.split(/\s+/).filter(Boolean).length : 0
    const md = {
      uploadedAt: new Date().toISOString(),
      language: lang,
      word_count,
      excerpt: excerpt(s.raw, 300),
      file_size: s.file_size ?? null,
      source: s.file_url ?? null
    }

    return {
      title: s.title,
      file_url: s.file_url ?? '',
      content: processed,
      processed: true,
      metadata: md,
      created_at: new Date().toISOString()
    }
  })

  // avoid duplicate insertion: check existing by file_url and title first
  const fileUrls = Array.from(new Set(toUpsert.map(t => t.file_url).filter(Boolean)))
  const titles = Array.from(new Set(toUpsert.map(t => t.title).filter(Boolean)))

  const existingUrls: string[] = []
  const existingTitles: string[] = []

  if (fileUrls.length > 0) {
    const { data: urlRows, error: urlErr } = await supabase
      .from('documents')
      .select('file_url')
      .in('file_url', fileUrls)
    if (urlErr) console.warn('check urls warning', urlErr)
    if (urlRows) existingUrls.push(...urlRows.map((r: any) => r.file_url))
  }

  if (titles.length > 0) {
    const { data: titleRows, error: titleErr } = await supabase
      .from('documents')
      .select('title')
      .in('title', titles)
    if (titleErr) console.warn('check titles warning', titleErr)
    if (titleRows) existingTitles.push(...titleRows.map((r: any) => r.title))
  }

  const toInsert = toUpsert.filter(t => {
    const existsByUrl = t.file_url && existingUrls.includes(t.file_url)
    const existsByTitle = existingTitles.includes(t.title)
    return !existsByUrl && !existsByTitle
  })

  if (toInsert.length === 0) {
    console.log('No new samples to insert.')
  } else {
    const { error } = await supabase
      .from('documents')
      .insert(toInsert)
    if (error) {
      console.error('Seeder insert failed:', error)
      process.exit(1)
    }
    console.log(`Inserted ${toInsert.length} sample documents.`)
  }

  // Optionally mark existing rows with non-empty content as processed=true
  const { error: markErr } = await supabase
    .from('documents')
    .update({ processed: true })
    .neq('content', '')
  if (markErr) {
    console.warn('Mark existing non-empty content rows failed:', markErr)
  }

  console.log('Seeder finished.')
  process.exit(0)
}

main().catch((e) => { console.error(e); process.exit(1) })
