import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import type { Document } from './schema/document'

type Lang = 'id' | 'en'
type SeedDoc = Omit<Document, 'id'>

// helper: robustly load stopwords-iso JSON (works with CJS/ESM/Node import-assertion issues)
async function loadStopwordsIso(): Promise<Record<string, string[]>> {
  // Try to load robustly across CJS/ESM environments
  try {
    // prefer createRequire to support ESM runner (ts-node --esm, node >= 12+)
    const { createRequire } = await import('module')
    const requireFunc = createRequire(import.meta.url)
    const r = requireFunc('stopwords-iso')
    return r && (r.default ?? r)
  } catch (errCreateRequire) {
    try {
      // Try import with JSON assertion (Node >=17+)
      // @ts-ignore - import assertions
      const mod = await import('stopwords-iso', { assert: { type: 'json' } })
      return (mod && (mod.default ?? mod)) as any
    } catch (errImportJson) {
      try {
        // Fallback: read package JSON directly from node_modules
        const pkgPath = path.join(process.cwd(), 'node_modules', 'stopwords-iso', 'stopwords-iso.json')
        const raw = fs.readFileSync(pkgPath, 'utf8')
        return JSON.parse(raw)
      } catch (errRead) {
        console.warn('loadStopwordsIso: failed to load stopwords-iso, continuing with empty sets', errCreateRequire ?? errImportJson ?? errRead)
        return {}
      }
    }
  }
}
// small stemmer (same as app/composables/preprocessing.ts)
function simpleStem(word: string): string {
  if (!word || word.length <= 3) return word
  return word.replace(/(ingly|edly|ing|ied|ly|ed|es|s)$/i, '')
}

function simplePreprocess(text: string, lang: Lang = 'id', indonesianStopwords = new Set<string>(), englishStopwords = new Set<string>()): string {
  if (!text) return ''
  let t = String(text).toLowerCase()
  t = t.replace(/[^\p{L}\p{N}\s]/gu, ' ')
  t = t.replace(/\s+/g, ' ').trim()
  if (!t) return ''
  const tokens = t.split(' ').filter(Boolean)
  if (lang === 'id') {
    const filtered = tokens.filter(tok => !indonesianStopwords.has(tok))
    return filtered.join(' ')
  } else {
    const filtered = tokens.filter(tok => !englishStopwords.has(tok))
    const stemmed = filtered.map(tok => simpleStem(tok))
    return stemmed.join(' ')
  }
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

  // load stopwords safely
  const stopwordsObj = await loadStopwordsIso()
  const indonesianStopwords = new Set<string>((stopwordsObj['id'] as string[]) || [])
  const englishStopwords = new Set<string>((stopwordsObj['en'] as string[]) || [])

  // 30 sample documents
  const samples: Array<{ title: string; raw: string; file_url?: string; lang?: Lang; file_size?: number }> = [
    {
      "title": "Pengenalan Kernel Linux",
      "raw": "Kernel Linux dapat dianggap sebagai otak dari sistem operasi. Ia berfungsi sebagai lapisan abstraksi fundamental antara perangkat keras komputer dan perangkat lunak yang berjalan di atasnya. Arsitekturnya, meskipun secara teknis bersifat monolitik (berjalan dalam satu ruang alamat), sangat modular. Fleksibilitas ini dicapai melalui Modul Kernel yang Dapat Dimuat (LKM), yang memungkinkan driver perangkat dan fungsionalitas lainnya untuk ditambahkan atau dihapus dari kernel saat runtime, tanpa memerlukan kompilasi ulang atau reboot sistem.\n\nSalah satu komponen paling kuat dari kernel adalah Virtual File System (VFS). VFS menyediakan antarmuka tunggal dan seragam untuk semua jenis sistem berkas. Baik Anda mengakses file di partisi Ext4, drive jaringan NFS, atau stik USB FAT32, aplikasi Anda tidak perlu tahu detail implementasinya; VFS menangani penerjemahan panggilan sistem standar (seperti open, read, write) ke operasi spesifik yang dibutuhkan oleh sistem berkas yang bersangkutan. Di jantung manajemen proses terdapat scheduler, dengan Completely Fair Scheduler (CFS) menjadi implementasi default saat ini. Tugas CFS adalah untuk memastikan bahwa setiap proses mendapatkan porsi waktu CPU yang adil, menciptakan ilusi bahwa banyak program berjalan secara bersamaan dengan responsif dan efisien.",
      "file_url": "seed/pengenalan-kernel-linux.txt",
      "lang": "id",
    "file_size": 1024
  },
  {
    "title": "Manajemen Paket di Debian dan Red Hat",
    "raw": "Manajer paket adalah alat esensial yang menyelesaikan masalah 'neraka dependensi' (dependency hell) dalam instalasi perangkat lunak. Di ekosistem Debian (termasuk Ubuntu), APT (Advanced Package Tool) adalah antarmuka tingkat tinggi yang paling umum. APT bekerja di atas sistem `dpkg` (Debian Package) yang menangani instalasi, penghapusan, dan informasi file `.deb` secara individual. Keajaiban APT terletak pada kemampuannya untuk secara otomatis mengunduh dan menginstal semua paket lain yang dibutuhkan (dependensi) dari sumber yang disebut 'repositori'.\n\nDi sisi lain, ekosistem Red Hat (termasuk Fedora dan CentOS) menggunakan DNF (Dandified YUM), yang merupakan evolusi dari YUM. Baik DNF maupun YUM adalah antarmuka tingkat tinggi untuk sistem `rpm` (Red Hat Package Manager). Seperti APT, DNF mengelola dependensi dengan memeriksa metadata dari repositori, memastikan bahwa semua library dan utilitas yang diperlukan oleh sebuah program sudah terpasang. Meskipun sintaks perintahnya berbeda, tujuan akhir APT dan DNF adalah sama: menyediakan cara yang andal, dapat diulang, dan otomatis untuk mengelola siklus hidup perangkat lunak di sistem operasi.",
    "file_url": "seed/manajemen-paket-debian-redhat.txt",
    "lang": "id",
    "file_size": 2048
  },
  {
    "title": "Cloud Computing: IaaS, PaaS, SaaS",
    "raw": "Cloud computing models are often explained with a pizza analogy. IaaS (Infrastructure as a Service) is like renting a professional kitchen with an oven, stove, and ingredients; you have full control to cook whatever you want from scratch. In tech terms, providers like AWS (EC2) and Google Cloud (Compute Engine) give you fundamental building blocks—virtual servers, storage, networking—and you are responsible for managing the operating system and everything above it.\n\nPaaS (Platform as a Service) is like ordering a pizza base that is delivered to you; you just add your own toppings and bake it. Providers like Heroku or AWS Elastic Beanstalk manage the OS, runtime environment, and servers, allowing developers to focus solely on deploying and managing their application code. SaaS (Software as a Service) is like ordering a fully cooked pizza delivered to your door; you just eat it. This model delivers complete, ready-to-use applications over the internet, such as Google Workspace, Salesforce, or Dropbox. The user has the least control but also the least responsibility, as the provider manages everything.",
    "file_url": "seed/cloud-computing.txt",
    "lang": "en",
    "file_size": 1500
  },
  {
    "title": "Keamanan Jaringan Dasar",
    "raw": "Membangun pertahanan jaringan yang kokoh melibatkan beberapa konsep fundamental. Firewall adalah garda terdepan, bertindak sebagai filter antara jaringan internal tepercaya dan jaringan eksternal. Firewall dapat berupa perangkat keras atau perangkat lunak, dan ia memeriksa paket data yang masuk dan keluar, mengizinkan atau memblokirnya berdasarkan seperangkat aturan keamanan yang telah ditentukan, seperti alamat IP, nomor port, atau protokol.\n\nNAT (Network Address Translation) adalah teknik yang digunakan untuk memetakan beberapa alamat IP privat di jaringan lokal ke satu alamat IP publik. Ini tidak hanya membantu menghemat alamat IPv4 yang terbatas tetapi juga menambah lapisan keamanan dengan menyembunyikan struktur jaringan internal dari dunia luar. Untuk komunikasi aman melalui jaringan yang tidak aman seperti internet, VPN (Virtual Private Network) menciptakan 'terowongan' virtual yang terenkripsi. Semua data yang melewati terowongan ini dilindungi dari penyadapan. Enkripsi itu sendiri, yang paling sering diimplementasikan dengan protokol TLS (Transport Layer Security), adalah proses mengubah data menjadi format yang tidak dapat dibaca untuk melindunginya saat transit.",
    "file_url": "seed/keamanan-aringan.txt",
    "lang": "id",
    "file_size": 1800
  },
  {
    "title": "Algoritma Sorting",
    "raw": "Algoritma sorting adalah fondasi penting dalam ilmu komputer untuk mengatur data dalam urutan tertentu. Quicksort adalah contoh algoritma 'divide and conquer' yang sangat efisien dalam praktiknya. Ia bekerja dengan memilih elemen sebagai 'pivot' dan mempartisi array menjadi dua sub-array, sesuai dengan apakah elemen tersebut lebih kecil atau lebih besar dari pivot, lalu secara rekursif mengurutkan sub-array tersebut. Kompleksitas waktunya rata-rata O(n log n), menjadikannya sangat cepat.\n\nMergesort juga menggunakan pendekatan 'divide and conquer' dan memiliki kompleksitas waktu O(n log n) yang dijamin dalam semua kasus, menjadikannya lebih dapat diprediksi daripada Quicksort. Keunggulan utamanya adalah stabilitasnya, yang berarti elemen dengan nilai yang sama mempertahankan urutan relatifnya. Di ujung spektrum yang lain, Bubblesort adalah algoritma pengurutan perbandingan sederhana yang berulang kali melintasi daftar, membandingkan pasangan elemen yang berdekatan dan menukarnya jika urutannya salah. Meskipun mudah dipahami, kinerjanya sangat buruk (O(n^2)) dan tidak praktis untuk kumpulan data yang besar.",
    "file_url": "seed/algoritma-sorting.txt",
    "lang": "id",
    "file_size": 1200
  },
  {
    "title": "Pengenalan GraphQL",
    "raw": "GraphQL muncul sebagai solusi untuk mengatasi beberapa keterbatasan arsitektur REST API. Masalah utama dengan REST adalah 'over-fetching' (mendapatkan lebih banyak data daripada yang dibutuhkan) dan 'under-fetching' (membutuhkan beberapa permintaan untuk mendapatkan semua data yang diperlukan). GraphQL memecahkan ini dengan menyediakan bahasa kueri yang kuat dan deklaratif. Klien mendefinisikan struktur data yang mereka inginkan dalam satu permintaan, dan server merespons dengan JSON yang sama persis strukturnya.\n\nArsitektur ini biasanya beroperasi melalui satu endpoint, tidak seperti REST yang memiliki banyak endpoint untuk sumber daya yang berbeda. Tiga operasi utama dalam GraphQL adalah: Query untuk mengambil data, Mutation untuk memodifikasi (membuat, memperbarui, menghapus) data, dan Subscription untuk komunikasi real-time berbasis WebSocket. Inti dari server GraphQL adalah 'skema', yang ditulis dalam Schema Definition Language (SDL). Skema ini bertindak sebagai kontrak yang kuat antara klien dan server, mendefinisikan semua tipe data dan operasi yang tersedia.",
    "file_url": "seed/pengenalan-graphql.txt",
    "lang": "id",
    "file_size": 1300
  },
  {
    "title": "Introduction to Machine Learning",
    "raw": "Machine learning (ML) empowers systems to learn and improve from experience without being explicitly programmed. The most common paradigm is supervised learning, where a model is trained on a dataset containing labeled examples. This category is further divided into classification tasks (predicting a discrete category, like 'spam' or 'not spam') and regression tasks (predicting a continuous value, like a house price). The model learns a mapping function from input features to the output label.\n\nIn contrast, unsupervised learning deals with unlabeled data, where the goal is to discover hidden structures or patterns. The most common task is clustering, which groups similar data points together, such as segmenting customers based on purchasing behavior. Another important task is dimensionality reduction, which reduces the number of variables in a dataset while preserving its important structure. A critical part of any ML project is evaluation, which typically involves splitting the data into a training set to build the model and a testing set to assess its performance on unseen data.",
    "file_url": "seed/ml-intro.txt",
    "lang": "en",
    "file_size": 2200
  },
  {
    "title": "Basis Data Relasional vs NoSQL",
    "raw": "Basis data relasional, yang menggunakan SQL (Structured Query Language), telah menjadi standar industri selama puluhan tahun. Mereka menyimpan data dalam tabel yang sangat terstruktur dengan baris dan kolom, dan hubungan antar tabel didefinisikan secara ketat. Kekuatan utama mereka terletak pada jaminan ACID (Atomicity, Consistency, Isolation, Durability), yang memastikan integritas data bahkan jika terjadi kegagalan. Ini membuat mereka ideal untuk sistem transaksional seperti perbankan dan e-commerce, di mana konsistensi data adalah hal yang paling utama.\n\nBasis data NoSQL ('Not only SQL') muncul untuk mengatasi keterbatasan model relasional dalam skala besar dan dengan data yang tidak terstruktur. Ada beberapa jenis utama: basis data dokumen (MongoDB) menyimpan data dalam format seperti JSON yang fleksibel; basis data key-value (Redis) sangat cepat untuk pencarian sederhana; dan basis data graf (Neo4j) dioptimalkan untuk menavigasi hubungan yang kompleks. Basis data NoSQL sering kali memprioritaskan ketersediaan dan skalabilitas horizontal, menjadikannya pilihan populer untuk aplikasi web skala besar dan analisis big data.",
    "file_url": "seed/db-comparison.txt",
    "lang": "en",
    "file_size": 1600
  },
  {
    "title": "Pengantar Docker",
    "raw": "Docker memecahkan masalah klasik dalam pengembangan perangkat lunak: 'tapi ini berjalan di mesin saya'. Ia melakukannya melalui containerization, sebuah teknologi yang membungkus aplikasi beserta semua dependensinya—seperti library, file konfigurasi, dan runtime—ke dalam sebuah unit standar yang disebut 'container'. Tidak seperti mesin virtual (VM) yang memvirtualisasikan seluruh tumpukan perangkat keras, container berbagi kernel sistem operasi host, membuatnya sangat ringan, cepat untuk dimulai, dan efisien dalam penggunaan sumber daya.\n\nAlur kerja Docker dimulai dengan `Dockerfile`, sebuah file teks sederhana yang berisi instruksi langkah demi langkah untuk membangun sebuah 'image'. Image adalah sebuah template read-only yang menjadi cetak biru untuk container kita. Dengan perintah `docker build`, Dockerfile dieksekusi untuk membuat image. Kemudian, dengan `docker run`, kita dapat meluncurkan satu atau lebih container dari image tersebut. Untuk aplikasi yang terdiri dari beberapa service (misalnya, web server, database, dan caching layer), `docker-compose` adalah alat yang memungkinkan kita untuk mendefinisikan dan menjalankan seluruh tumpukan aplikasi multi-container dengan satu perintah.",
    "file_url": "seed/docker-intro.txt",
    "lang": "id",
    "file_size": 1400
  },
  {
    "title": "WebAssembly (WASM): Masa Depan Web",
    "raw": "WebAssembly, atau WASM, adalah sebuah standar terbuka yang mendefinisikan format instruksi biner portabel untuk program yang dapat dieksekusi di halaman web. Ini dirancang untuk menjadi target kompilasi bagi bahasa pemrograman berkinerja tinggi seperti C++, C#, dan Rust, memungkinkan kode yang ditulis dalam bahasa-bahasa tersebut untuk berjalan di browser dengan kecepatan mendekati kecepatan native. Ini membuka pintu bagi aplikasi web yang jauh lebih kompleks dan menuntut secara komputasi, seperti game 3D, perangkat lunak desain (CAD), dan pengeditan video, yang sebelumnya tidak praktis untuk dijalankan di web.\n\nSangat penting untuk dipahami bahwa WASM tidak bertujuan untuk menggantikan JavaScript. Sebaliknya, ia dirancang untuk bekerja bersamanya. Alur kerja yang umum adalah membangun logika inti yang intensif secara komputasi dalam C++ atau Rust, mengkompilasinya ke WASM, dan kemudian memuat serta berinteraksi dengan modul WASM tersebut menggunakan JavaScript. Ini memungkinkan pengembang untuk memanfaatkan kekuatan ekosistem JavaScript yang luas untuk UI dan logika aplikasi, sambil mendelegasikan tugas-tugas berat ke WASM untuk performa maksimal.",
    "file_url": "seed/wasm.txt",
    "lang": "id",
    "file_size": 1100
  },
  {
    "title": "Pemrograman Functional",
    "raw": "Functional programming is a programming paradigm where programs are constructed by applying and composing functions. It avoids shared state, mutable data, and side-effects, treating functions more like pure mathematical functions. One of its core tenets is immutability, meaning that data structures, once created, can never be changed. Instead of modifying existing data, functional code creates new data structures with the updated values. This approach eliminates a whole class of bugs related to unexpected state changes.\n\nA pure function is a function that, given the same input, will always return the same output and has no observable side effects (like modifying a global variable or writing to a file). This makes code easier to reason about, test, and debug. The paradigm also heavily utilizes higher-order functions—functions that can take other functions as arguments or return them as results. This enables powerful constructs for abstracting over actions, such as the widely used `map`, `filter`, and `reduce` operations.",
    "file_url": "seed/functional.txt",
    "lang": "en",
    "file_size": 1250
  },
  {
    "title": "Etika dalam Pengembangan Teknologi",
    "raw": "Seiring dengan meningkatnya peran teknologi dalam kehidupan sehari-hari, tanggung jawab etis para pengembang perangkat lunak menjadi semakin penting. Keputusan yang dibuat selama desain dan implementasi dapat memiliki konsekuensi sosial yang mendalam dan tidak terduga. Salah satu area perhatian utama adalah bias algoritmik. Sistem machine learning yang dilatih pada data historis yang bias dapat melanggengkan atau bahkan memperkuat diskriminasi yang ada, misalnya dalam aplikasi pinjaman, perekrutan, atau sistem peradilan pidana.\n\nPrivasi data adalah isu etis krusial lainnya. Pengembang memiliki kewajiban untuk melindungi data pengguna, menerapkan praktik seperti minimalisasi data (hanya mengumpulkan apa yang benar-benar diperlukan) dan memberikan transparansi tentang bagaimana data digunakan. Selain itu, ada pertimbangan mengenai 'dark patterns' dalam desain UI/UX, di mana antarmuka sengaja dirancang untuk mengelabui pengguna agar melakukan tindakan yang tidak mereka inginkan. Pada akhirnya, pengembangan teknologi yang etis menuntut refleksi berkelanjutan tentang dampak produk terhadap individu dan masyarakat secara keseluruhan.",
    "file_url": "seed/etika-teknologi.txt",
    "lang": "id",
    "file_size": 900
  },
  {
    "title": "Pengenalan Internet of Things (IoT)",
    "raw": "The Internet of Things (IoT) describes the network of physical objects—'things'—that are embedded with sensors, software, and other technologies to connect and exchange data with other devices and systems over the internet. These devices range from common household objects to sophisticated industrial tools. A typical IoT architecture involves devices collecting data, which is often sent to a gateway. The gateway then aggregates and transmits the data to a cloud platform for processing, analysis, and storage.\n\nWhile IoT offers immense potential for automation and data-driven insights, it also presents significant challenges, particularly in security and privacy. Each connected device is a potential entry point for attackers, making robust security measures essential. Popular communication protocols in the IoT space include MQTT (Message Queuing Telemetry Transport), a lightweight publish-subscribe protocol ideal for constrained devices, and CoAP (Constrained Application Protocol). Use cases span across smart homes, wearable technology, precision agriculture, and connected healthcare.",
    "file_url": "seed/iot-intro.txt",
    "lang": "en",
    "file_size": 1350
  },
  {
    "title": "Optimasi Kinerja Web",
    "raw": "Web performance optimization is the art and science of making websites load faster. On the frontend, this involves optimizing the Critical Rendering Path, which is the sequence of steps the browser takes to convert HTML, CSS, and JavaScript into pixels on the screen. Techniques include minifying assets, compressing images, deferring the loading of non-critical CSS and JavaScript (code splitting and async/defer), and leveraging browser caching to avoid re-downloading resources.\n\nOn the backend, performance optimization focuses on reducing server response time. This often starts at the database level, with techniques like adding indexes to speed up query execution and optimizing slow queries. Implementing a caching layer, using in-memory stores like Redis or Memcached, can dramatically reduce database load by storing frequently accessed data. Additionally, using a Content Delivery Network (CDN) to distribute static assets across a global network of servers ensures that users receive data from a location geographically closer to them, significantly reducing network latency.",
    "file_url": "seed/web-performance.txt",
    "lang": "en",
    "file_size": 1500
  },
  {
    "title": "Dasar-dasar Kriptografi",
    "raw": "Kriptografi adalah fondasi dari keamanan digital modern, yang menyediakan kerahasiaan, integritas, dan otentikasi. Ada dua jenis utama enkripsi: simetris, di mana kunci yang sama digunakan untuk enkripsi dan dekripsi, dan asimetris (kunci publik), di mana kunci publik yang didistribusikan secara bebas digunakan untuk mengenkripsi data, dan hanya pemilik kunci privat yang cocok yang dapat mendekripsinya. Kriptografi kunci publik adalah dasar dari protokol aman seperti TLS/SSL yang melindungi lalu lintas web.\n\nSelain enkripsi, hashing adalah konsep fundamental lainnya. Fungsi hash seperti SHA-256 mengambil input data dan menghasilkan output string dengan panjang tetap yang unik (hash). Ini bersifat satu arah, artinya sangat sulit untuk merekayasa balik data asli dari hash-nya. Hashing sangat penting untuk memverifikasi integritas data (memastikan file tidak diubah) dan untuk menyimpan kata sandi dengan aman. Dengan menyimpan hash kata sandi (bukan kata sandi itu sendiri), sistem dapat memverifikasi login tanpa pernah mengetahui kata sandi asli.",
    "file_url": "seed/kriptografi.txt",
    "lang": "id",
    "file_size": 1700
  },
  {
    "title": "Pemrosesan Teks dengan NLP",
    "raw": "Natural Language Processing (NLP) enables machines to process and understand human language. A typical NLP pipeline involves several key steps to transform unstructured text into structured data. It starts with sentence segmentation and tokenization, where the text is broken down into individual sentences and then into words or sub-words (tokens). After tokenization, stopword removal is often applied to filter out common words like 'a', 'the', and 'in', which usually don't carry significant meaning.\n\nNext, stemming or lemmatization is used to reduce words to their root form. Stemming is a crude, rule-based process (e.g., 'running' -> 'run'), while lemmatization uses vocabulary and morphological analysis to return a proper root word (e.g., 'ran' -> 'run'). Once the text is cleaned and normalized, feature extraction techniques like Bag-of-Words (BoW) or TF-IDF are used to convert the text into numerical vectors that machine learning models can understand.",
    "file_url": "seed/nlp.txt",
    "lang": "en",
    "file_size": 1900
  },
  {
    "title": "Version Control dengan Git",
    "raw": "Git adalah sistem kontrol versi terdistribusi yang menjadi standar de facto dalam pengembangan perangkat lunak modern. Ia memungkinkan individu dan tim untuk melacak riwayat perubahan file, berkolaborasi dalam proyek, dan kembali ke versi sebelumnya jika terjadi kesalahan. Konsep inti Git melibatkan tiga 'ruang': Direktori Kerja (file yang sedang Anda edit), Area Staging (file yang telah Anda tandai untuk disertakan dalam 'commit' berikutnya), dan Repositori (riwayat lengkap proyek Anda yang tersimpan di direktori `.git`).\n\nKekuatan sebenarnya dari Git terletak pada model 'branching'-nya. Sebuah branch adalah garis pengembangan independen. Pengembang dapat membuat branch baru untuk mengerjakan fitur baru atau memperbaiki bug tanpa mempengaruhi branch utama (`main` atau `master`). Setelah pekerjaan selesai, branch fitur tersebut dapat digabungkan kembali ke branch utama melalui operasi `merge` atau `rebase`. Alur kerja ini memungkinkan pengembangan paralel yang sangat efisien dan merupakan dasar dari platform kolaboratif seperti GitHub dan GitLab.",
    "file_url": "seed/git.txt",
    "lang": "id",
    "file_size": 1100
  },
  {
    "title": "Quantum Computing: Pengenalan",
    "raw": "Quantum computing represents a fundamentally new paradigm of computation, leveraging the counterintuitive principles of quantum mechanics. While classical computers store information in bits that are either 0 or 1, quantum computers use qubits. A qubit can exist in a state of superposition, representing both 0 and 1 simultaneously. This property allows quantum computers to explore a vast number of possibilities concurrently.\n\nAnother key concept is entanglement, a phenomenon where two or more qubits become linked in such a way that their fates are intertwined, regardless of the distance separating them. By harnessing superposition and entanglement, quantum computers can run algorithms that are intractable for classical machines. Shor's algorithm, for example, can factor large numbers exponentially faster than any known classical algorithm, posing a significant threat to current encryption standards. Grover's algorithm offers a quadratic speedup for searching unstructured databases.",
    "file_url": "seed/quantum.txt",
    "lang": "en",
    "file_size": 2100
  },
  {
    "title": "Membangun REST API dengan Node.js",
    "raw": "REST (Representational State Transfer) adalah gaya arsitektur yang populer untuk merancang layanan web. Sebuah API disebut RESTful jika ia mematuhi batasan-batasan tertentu, seperti arsitektur klien-server, komunikasi stateless (setiap permintaan dari klien harus berisi semua informasi yang dibutuhkan server), dan penggunaan metode HTTP standar (GET, POST, PUT, DELETE) untuk melakukan operasi pada sumber daya. Node.js, dengan sifatnya yang non-blocking I/O, adalah pilihan yang sangat baik untuk membangun API yang cepat dan skalabel.\n\nFramework Express.js menyederhanakan proses ini secara signifikan. Dengan Express, pengembang mendefinisikan 'rute' yang memetakan URL dan metode HTTP ke fungsi handler. Misalnya, permintaan `GET /api/products` akan ditangani oleh fungsi yang mengambil daftar produk dari database. Konsep penting lainnya adalah 'middleware', yaitu fungsi-fungsi yang memiliki akses ke objek request (req), objek response (res), dan fungsi middleware berikutnya dalam siklus request-response. Middleware digunakan untuk berbagai tugas seperti parsing body request, otentikasi pengguna, dan logging.",
    "file_url": "seed/rest-node.txt",
    "lang": "id",
    "file_size": 1600
  },
  {
    "title": "Analisis Big Data",
    "raw": "Big data is characterized by the 'Three V's': Volume (enormous amounts of data), Velocity (data being generated at high speed), and Variety (data coming in many different formats, both structured and unstructured). Traditional databases are ill-equipped to handle this scale and complexity. The Hadoop ecosystem was an early solution, using the Hadoop Distributed File System (HDFS) for reliable storage across clusters of commodity hardware and the MapReduce programming model for parallel processing.\n\nMapReduce works in two phases: the Map phase processes and filters the data, and the Reduce phase aggregates the results. While powerful, MapReduce can be slow due to its reliance on disk I/O. Apache Spark emerged as a successor, offering a significant performance boost by performing computations in-memory. Spark's core abstraction is the Resilient Distributed Dataset (RDD), an immutable distributed collection of objects. Spark is now the de facto standard for large-scale data processing, supporting SQL queries, streaming data, and machine learning.",
    "file_url": "seed/bigdata.txt",
    "lang": "en",
    "file_size": 2300
  },
  {
    "title": "Desain Antarmuka Pengguna (UI)",
    "raw": "Desain Antarmuka Pengguna (UI) adalah tentang menciptakan antarmuka yang estetis, intuitif, dan mudah digunakan. Ini adalah disiplin yang menggabungkan desain visual, desain interaksi, dan arsitektur informasi. Salah satu prinsip yang paling penting adalah menciptakan hirarki visual yang jelas. Dengan menggunakan ukuran, warna, kontras, dan spasi, desainer dapat memandu mata pengguna ke elemen-elemen yang paling penting di layar, membuat antarmuka lebih mudah dipindai dan dipahami.\n\nKonsistensi adalah kunci lain untuk UI yang baik. Elemen antarmuka yang melakukan fungsi serupa harus terlihat dan berperilaku dengan cara yang sama di seluruh aplikasi. Ini menciptakan rasa keakraban dan membuat aplikasi lebih dapat diprediksi bagi pengguna. Terakhir, aksesibilitas (sering disebut a11y) tidak boleh diabaikan. Ini adalah praktik merancang antarmuka agar dapat digunakan oleh semua orang, termasuk mereka yang memiliki keterbatasan penglihatan, pendengaran, atau motorik. Ini melibatkan penggunaan HTML semantik, memastikan kontras warna yang cukup, dan menyediakan navigasi keyboard yang lengkap.",
    "file_url": "seed/ui-design.txt",
    "lang": "id",
    "file_size": 1000
  },
  {
    "title": "Search Engine Basics",
    "raw": "Search engines are complex systems designed to find information on the World Wide Web. Their operation can be broken down into three main stages. The first is crawling, where automated programs called spiders or crawlers systematically browse the web, following hyperlinks from one page to another to discover new content. The second stage is indexing. After a page is crawled, its content is analyzed and stored in a massive database called an index. A key data structure used here is the inverted index, which maps words to the documents that contain them, allowing for incredibly fast lookups.\n\nFinally, the third stage is ranking and retrieval. When a user submits a query, the search engine's query processor searches the index for matching documents. It then uses a sophisticated ranking algorithm to sort these documents by relevance and authority. While Google's original PageRank algorithm was a foundational concept based on link analysis, modern ranking algorithms are far more complex, incorporating hundreds of signals, including user engagement, content quality, and machine learning models.",
    "file_url": "seed/search-basics.txt",
    "lang": "en",
    "file_size": 1800
  },
  {
    "title": "Pengenalan Sistem File Ext4",
    "raw": "Ext4 (Fourth Extended Filesystem) adalah evolusi dari seri sistem file yang telah lama menjadi andalan di Linux. Salah satu fitur terpentingnya adalah 'journaling'. Jurnal adalah log khusus yang mencatat perubahan yang akan dilakukan pada sistem file sebelum benar-benar ditulis. Jika sistem crash di tengah operasi penulisan, jurnal dapat digunakan saat startup berikutnya untuk membawa sistem file kembali ke keadaan yang konsisten, sangat mengurangi risiko korupsi data.\n\nUntuk meningkatkan performa, Ext4 menggantikan skema pemetaan blok tradisional dengan 'extents'. Sebuah extent pada dasarnya adalah rentang blok disk fisik yang berurutan. Untuk file besar, ini jauh lebih efisien daripada harus menyimpan pointer ke setiap blok data secara individual, karena mengurangi fragmentasi dan metadata yang diperlukan. Fitur lain seperti 'delayed allocation' memungkinkan sistem file untuk menunda keputusan tentang di mana menempatkan blok data sampai data tersebut benar-benar akan ditulis ke disk, memberikan lebih banyak informasi untuk membuat keputusan alokasi yang lebih baik.",
    "file_url": "seed/ext4.txt",
    "lang": "id",
    "file_size": 1450
  },
  {
    "title": "Container Orchestration: Kubernetes",
    "raw": "While Docker provides a way to run individual containers, Kubernetes orchestrates them, managing their lifecycle across a cluster of machines. Think of it as the conductor of a container orchestra. Kubernetes' architecture consists of a control plane (the 'master' nodes) and data plane (the 'worker' nodes). The control plane's components, like the API server, scheduler, and controller manager, make global decisions about the cluster, while worker nodes run the actual containerized applications.\n\nThe smallest deployable unit in Kubernetes is a 'pod', which is a wrapper around one or more containers that share storage and network resources. To manage the lifecycle of pods declaratively, Kubernetes provides higher-level objects like 'Deployments'. A Deployment allows you to describe the desired state for your application—for example, 'I want 3 replicas of my web server running'—and Kubernetes' controllers will work to ensure the current state matches the desired state, handling scaling, updates, and self-healing automatically.",
    "file_url": "seed/k8s.txt",
    "lang": "en",
    "file_size": 2000
  },
  {
    "title": "Pemrograman Berorientasi Objek",
    "raw": "Pemrograman Berorientasi Objek (OOP) adalah paradigma yang mengorganisir desain perangkat lunak di sekitar data, atau 'objek', bukan fungsi dan logika. Objek ini, yang merupakan instance dari sebuah 'kelas', membungkus data dan perilaku yang relevan menjadi satu unit. Prinsip fundamental pertama adalah 'enkapsulasi', yaitu praktik menyembunyikan detail internal sebuah objek dan hanya mengekspos fungsionalitas yang diperlukan melalui antarmuka publik (metode). Ini mengurangi kompleksitas dan meningkatkan kekokohan kode.\n\nPrinsip kedua adalah 'pewarisan' (inheritance), yang memungkinkan sebuah kelas baru (subclass) untuk mewarisi atribut dan metode dari kelas yang sudah ada (superclass). Ini mempromosikan penggunaan kembali kode dan menciptakan hierarki hubungan. Terakhir, 'polimorfisme' (polymorphism), yang berarti 'banyak bentuk', memungkinkan objek dari kelas yang berbeda untuk merespons pesan atau panggilan metode yang sama dengan cara yang spesifik untuk tipe mereka sendiri. Ini memungkinkan fleksibilitas dan kode yang dapat diperluas.",
    "file_url": "seed/oop.txt",
    "lang": "id",
    "file_size": 1150
  },
  {
    "title": "Testing Otomatis dengan Jest",
    "raw": "Jest is a delightful JavaScript Testing Framework with a focus on simplicity. It provides an integrated solution for running automated tests, including a test runner, assertion library, and mocking capabilities. A common practice in testing is the 'Arrange-Act-Assert' pattern. You first 'Arrange' the necessary preconditions and inputs. Then, you 'Act' by executing the function or method you want to test. Finally, you 'Assert' that the outcome matches your expectation using Jest's matchers like `expect(result).toBe(true)`.\n\nOne of Jest's notable features is snapshot testing. This is particularly useful for testing UI components in frameworks like React or Vue. On the first run, Jest renders the component and saves its structure to a file (a 'snapshot'). On subsequent test runs, it compares the new rendered output to the saved snapshot. If there are differences, the test fails, alerting the developer to either an intended or unintended change in the UI. This provides a powerful way to prevent regressions in the user interface.",
    "file_url": "seed/jest.txt",
    "lang": "en",
    "file_size": 950
  },
  {
    "title": "Pengenalan Sistem Operasi",
    "raw": "Sistem Operasi (OS) bertindak sebagai perantara antara pengguna komputer dan perangkat keras komputer. Tujuannya adalah untuk menyediakan lingkungan di mana pengguna dapat menjalankan program dengan nyaman dan efisien. Di intinya, OS mengelola sumber daya yang kompleks. Manajemen proses bertanggung jawab untuk membuat, menghapus, dan menjadwalkan proses. CPU scheduler menentukan proses mana yang mendapatkan akses ke CPU dan untuk berapa lama, menciptakan ilusi multitasking atau 'concurrency'.\n\nManajemen memori adalah fungsi penting lainnya. OS melacak bagian memori mana yang sedang digunakan dan oleh siapa, memutuskan proses mana (atau bagian dari proses) yang akan dimuat ke memori saat ada ruang, dan mengalokasikan serta mendealokasikan ruang memori sesuai kebutuhan. Teknik seperti 'memori virtual' memungkinkan OS untuk menjalankan program yang lebih besar dari memori fisik yang sebenarnya dengan menggunakan ruang disk sebagai perpanjangan dari RAM. Semua interaksi tingkat rendah ini ditangani oleh 'kernel', bagian inti dari OS yang memiliki kendali penuh atas segala sesuatu dalam sistem.",
    "file_url": "seed/os.txt",
    "lang": "id",
    "file_size": 1750
  },
  {
    "title": "Arsitektur Mikroservis",
    "raw": "Microservices is an architectural approach where a large, complex application is composed of small, independent services. Each service is self-contained, runs in its own process, and communicates with other services through well-defined APIs, typically over HTTP. This contrasts with the traditional monolithic architecture, where the entire application is built as a single, tightly-coupled unit. The primary advantage of microservices is that it allows for independent development, deployment, and scaling of each service, enabling teams to work in parallel and use different technology stacks for different services.\n\nHowever, this approach introduces the complexities of a distributed system. Developers must deal with challenges like network latency, fault tolerance, and data consistency across multiple databases. Patterns like Service Discovery (how services find each other), Circuit Breakers (to prevent cascading failures), and API Gateways (a single entry point for all clients) are often employed to manage this complexity. The decision to use microservices involves a significant trade-off between development velocity and operational complexity.",
    "file_url": "seed/microservices.txt",
    "lang": "en",
    "file_size": 1650
  },
  {
    "title": "Optimasi Database SQL",
    "raw": "Database query performance can often be the bottleneck in an application. The most effective optimization technique is proper indexing. An index on a database table works much like an index in a book; instead of scanning the entire table to find the data you're looking for (a 'full table scan'), the database can use the index to go directly to the relevant rows. B-Tree indexes are the most common type and are highly effective for a wide range of queries, especially those involving range lookups (e.g., `WHERE age > 30`).\n\nBeyond indexing, it's crucial to understand how the database executes your queries. Most SQL databases provide a command, often `EXPLAIN` or `EXPLAIN PLAN`, which shows the query execution plan. This plan details the steps the database will take, such as whether it will use an index or perform a full table scan. Analyzing this plan can reveal inefficiencies and help you rewrite queries for better performance. Other optimization strategies include query caching, connection pooling, and proper database schema design (normalization).",
    "file_url": "seed/sql-opt.txt",
    "lang": "en",
    "file_size": 1400
  }
]
  
const toUpsert: SeedDoc[] = samples.map(s => {
    const lang = s.lang ?? 'id'
    const raw = s.raw ?? ''

    const processed = simplePreprocess(raw, lang, indonesianStopwords, englishStopwords)
    const word_count = processed ? processed.split(/\s+/).filter(Boolean).length : 0
    const md = {
      uploadedAt: new Date().toISOString(),
      language: lang,
      word_count,
      excerpt: excerpt(raw, 300),
      file_size: s.file_size ?? null,
      source: s.file_url ?? null
    }

    const doc: SeedDoc = {
      title: s.title,
      file_url: s.file_url ?? '',
      content: processed,
      content_raw: raw,
      processed: true,
      metadata: md,
      created_at: new Date()
    }
    return doc
  })

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
    if (urlRows) existingUrls.push(...(urlRows as any[]).map(r => r.file_url))
  }

  if (titles.length > 0) {
    const { data: titleRows, error: titleErr } = await supabase
      .from('documents')
      .select('title')
      .in('title', titles)
    if (titleErr) console.warn('check titles warning', titleErr)
    if (titleRows) existingTitles.push(...(titleRows as any[]).map(r => r.title))
  }

  const toInsert = toUpsert.filter(t => {
    const existsByUrl = t.file_url && existingUrls.includes(t.file_url)
    const existsByTitle = existingTitles.includes(t.title)
    return !existsByUrl && !existsByTitle
  })

  if (toInsert.length === 0) {
    console.log('No new samples to insert.')
  } else {
    // Supabase expects ISO strings for timestamps, convert before insert
    type InsertPayload = Omit<SeedDoc, 'created_at'> & { created_at: string }
    const payload: InsertPayload[] = toInsert.map(d => ({
      ...d,
      created_at: d.created_at.toISOString()
    }))
    const { error } = await supabase
      .from('documents')
      .insert(payload)
    if (error) {
      console.error('Seeder insert failed:', error)
      process.exit(1)
    }
    console.log(`Inserted ${toInsert.length} sample documents.`)
  }

  // Optionally mark existing rows with non-empty content as processed=true (kept as-is)
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