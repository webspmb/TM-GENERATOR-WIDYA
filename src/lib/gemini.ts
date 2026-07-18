/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from "@google/genai";
import { ModulFormData, GeneratedModul, AsesmenConfig, GeneratedAsesmen, KisiKisiItem, KokurikulerFormData, GeneratedKokurikuler } from "../types";

// Inisialisasi Klien Gemini Utama dan Cadangan secara malas (Lazy initialization)
// guna menghindari peringatan kegagalan/kosongnya kunci API pada saat inisialisasi modul.
const primaryKey = process.env.GEMINI_API_KEY || "";
const fallbackKey = 
  process.env.GEMINI_API_KEY_2 || 
  process.env.GEMINI_API_KEY_FALLBACK || 
  process.env.GEMINI_API_KEY_SECONDARY || 
  process.env.SECONDARY_GEMINI_API_KEY || 
  "";

let aiPrimaryInstance: GoogleGenAI | null = null;
export function getAiPrimary(): GoogleGenAI {
  if (!aiPrimaryInstance) {
    aiPrimaryInstance = new GoogleGenAI({ apiKey: primaryKey || "placeholder_key" });
  }
  return aiPrimaryInstance;
}

let aiSecondaryInstance: GoogleGenAI | null = null;
export function getAiSecondary(): GoogleGenAI | null {
  if (!aiSecondaryInstance && fallbackKey) {
    aiSecondaryInstance = new GoogleGenAI({ apiKey: fallbackKey });
  }
  return aiSecondaryInstance;
}

/**
 * Mengambil daftar kunci API Groq yang sah dan unik yang dikonfigurasi di lingkungan.
 * Mendukung rotasi otomatis hingga 3 kunci API gratis.
 */
function getGroqApiKeys(): string[] {
  const keys: string[] = [];
  
  const rawKey1 = process.env.GROQ_API_KEY || process.env.GROQ_API_KEY_1 || "";
  const rawKey2 = process.env.GROQ_API_KEY_2 || process.env.GROQ_API_KEY_SECONDARY || process.env.SECONDARY_GROQ_API_KEY || "";
  const rawKey3 = process.env.GROQ_API_KEY_3 || process.env.GROQ_API_KEY_TERTIARY || process.env.TERTIARY_GROQ_API_KEY || "";

  const placeholders = [
    "MY_GROQ_API_KEY",
    "MY_GROQ_API_KEY_1",
    "MY_GROQ_API_KEY_2",
    "MY_GROQ_API_KEY_3",
    "MY_GROQ_API_KEY_SECONDARY",
    "MY_GROQ_API_KEY_TERTIARY"
  ];

  const addKey = (k: string) => {
    const val = k.trim();
    if (val && !placeholders.includes(val) && !keys.includes(val)) {
      keys.push(val);
    }
  };

  addKey(rawKey1);
  addKey(rawKey2);
  addKey(rawKey3);

  return keys;
}

/**
 * Membantu mengonversi nilai apa pun (string, objek, array) menjadi format string murni
 * untuk menghindari kesalahan rendering React (seperti React Error #31 ketika merender objek langsung).
 */
function ensureString(val: any): string {
  if (val === null || val === undefined) return "";
  if (typeof val === "string") {
    let s = val.trim();
    // Strip unwanted prefixes sometimes generated as labels by AI
    const prefixRegex = /^(desain\.tp|desain\.cp|identifikasi\.material|tp|material|cp|desain)\s*:\s*/i;
    if (prefixRegex.test(s)) {
      s = s.replace(prefixRegex, "").trim();
    }
    return s;
  }
  if (Array.isArray(val)) {
    return val.map(v => ensureString(v)).join("\n");
  }
  if (typeof val === "object") {
    const keys = Object.keys(val);
    if (keys.length === 1) {
      return ensureString(val[keys[0]]);
    }
    // Check for common keys and extract them directly
    for (const k of ["tp", "material", "text", "content", "value", "deskripsi", "description"]) {
      if (k in val) {
        return ensureString(val[k]);
      }
    }
    return Object.entries(val)
      .map(([key, value]) => {
        const lowerKey = key.toLowerCase();
        if (["desain", "identifikasi", "tp", "material", "text", "content"].includes(lowerKey)) {
          return ensureString(value);
        }
        const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1);
        return `${capitalizedKey}: ${ensureString(value)}`;
      })
      .join("\n");
  }
  return String(val);
}

/**
 * Memastikan setiap pengalaman belajar diawali dengan nama prinsip pembelajaran mendalam yang tepat,
 * serta memastikan bahwa nama prinsip tersebut tertulis di dalam deskripsi aktivitas.
 */
function ensurePrinciple(text: string, principleName: string, englishTerm: string): string {
  let cleanText = ensureString(text).trim();
  if (!cleanText) return "";

  // Standard uniform header
  const boldHeader = `**Prinsip Pembelajaran: ${principleName} (${englishTerm})**\n`;

  // Remove any pre-existing "Prinsip Pembelajaran: ..." labels from the start (including bold markdown)
  const existingPrefixRegex = /^\**Prinsip\s+Pembelajaran\s*:\s*[A-Za-z\s\(\)]+\**\s*/i;
  cleanText = cleanText.replace(existingPrefixRegex, "").trim();

  // If it already starts with our bold header prefix, return it
  if (cleanText.startsWith(`**Prinsip Pembelajaran: ${principleName}`)) {
    return cleanText;
  }

  // Check if the principleName is mentioned in the text
  const hasKeyword = cleanText.toLowerCase().includes(principleName.toLowerCase()) || 
                     cleanText.toLowerCase().includes(englishTerm.toLowerCase());

  if (!hasKeyword) {
    // If not, prepend a connector so the keyword is explicitly mentioned
    const firstChar = cleanText.charAt(0);
    const isCapital = firstChar === firstChar.toUpperCase() && firstChar !== firstChar.toLowerCase();
    const restText = isCapital ? firstChar.toLowerCase() + cleanText.slice(1) : cleanText;
    
    cleanText = `Melalui penerapan prinsip ${principleName.toLowerCase()}, ${restText}`;
  }

  return `${boldHeader}${cleanText}`;
}

/**
 * Memanggil Groq API secara langsung dengan mekanisme rotasi otomatis multi-kunci (hingga 3 key)
 * serta toleransi kegagalan model (fallback models) secara berlapis jika terkena limit kuota.
 */
async function callGroqDirectly(contents: any): Promise<string> {
  const keys = getGroqApiKeys();
  if (keys.length === 0) {
    throw new Error(
      "Tidak ditemukan GROQ_API_KEY, GROQ_API_KEY_2, atau GROQ_API_KEY_3 yang valid di pengaturan aplikasi Anda.\n" +
      "Pastikan Anda telah mengisi minimal salah satu Groq API Key di Panel Secrets / Setelan Lingkungan."
    );
  }

  // Ekstrak string prompt
  let promptText = "";
  if (typeof contents === "string") {
    promptText = contents;
  } else if (Array.isArray(contents)) {
    promptText = contents.map(c => typeof c === "string" ? c : JSON.stringify(c)).join("\n");
  } else if (contents && typeof contents === "object") {
    promptText = contents.text || JSON.stringify(contents);
  } else {
    promptText = String(contents);
  }

  // Urutan model Groq yang andal dan didukung oleh tipe respon json_object
  const modelsToTry = ["llama-3.3-70b-versatile", "mixtral-8x7b-32768", "llama-3.1-8b-instant"];
  let overallErrors: string[] = [];

  // Looping muter seluruh kunci API yang tersedia
  for (let keyIdx = 0; keyIdx < keys.length; keyIdx++) {
    const apiKey = keys[keyIdx];
    const maskedKey = apiKey.length > 12 
      ? `${apiKey.substring(0, 6)}...${apiKey.substring(apiKey.length - 6)}`
      : "Kunci_Rahasia_Groq";

    console.log(`🔑 [AI ROTASI] Mencoba Kunci API Groq Ke-${keyIdx + 1} dari total ${keys.length} kunci (${maskedKey})...`);

    // Guna meningkatkan keandalan, untuk kunci aktif ini kita coba sekumpulan model
    for (const modelName of modelsToTry) {
      try {
        console.log(`🤖 [AI RUN] Mengirim permintaan ke Groq model: ${modelName} menggunakan Kunci Ke-${keyIdx + 1}...`);
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: modelName,
            messages: [
              {
                role: "system",
                content: "Kembalikan respon murni dalam format JSON objek solid sesuai dengan spesifikasi skema yang diminta pengguna."
              },
              {
                role: "user",
                content: promptText
              }
            ],
            temperature: 0.3,
            response_format: { type: "json_object" }
          })
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`HTTP ${res.status}: ${errText}`);
        }

        const rawJson = await res.json();
        const contentText = rawJson.choices?.[0]?.message?.content;
        
        if (!contentText) {
          throw new Error("Hasil respon teks dari asisten Groq kosong.");
        }

        console.log(`✨ [AI SUCCESS] Berhasil memproses dengan Kunci Ke-${keyIdx + 1} menggunakan model: ${modelName}`);
        return contentText;
      } catch (e: any) {
        const errorDetail = e.message || String(e);
        console.warn(`⚠️ [AI WARNING] Kunci Ke-${keyIdx + 1} gagal dengan model ${modelName}: ${errorDetail}`);
        overallErrors.push(`[Kunci Ke-${keyIdx + 1}][Model ${modelName}]: ${errorDetail}`);
      }
    }
    
    console.warn(`🔄 [AI KEY FAILOVER] Kunci API Groq Ke-${keyIdx + 1} bermasalah/habis kuota untuk seluruh model. Mengalihkan ke kunci berikutnya secara dinamis...`);
  }

  throw new Error(
    `Seluruh (${keys.length}) Kunci API Groq Anda gagal dijalankan.\n` +
    `Detail kesalahan tiap percobaan:\n` + 
    overallErrors.map((err, i) => `${i + 1}. ${err}`).join("\n")
  );
}

/**
 * Melakukan panggilan API Gemini dengan dukungan automatic retry (exponential backoff)
 * dan fallback otomatis ke model 'gemini-1.5-flash' jika model terbaru (2.5/3.5) kelebihan beban/503.
 */
async function fetchWithRetryAndFallback(
  aiInstance: GoogleGenAI,
  params: { model: string; contents: any; config?: any },
  maxRetries = 3
): Promise<any> {
  let attempt = 0;
  let currentModel = params.model;
  let currentMaxRetries = maxRetries;

  while (attempt < currentMaxRetries) {
    try {
      console.log(`[AI TRY] Memanggil ${currentModel} (Percobaan ke-${attempt + 1})...`);
      return await aiInstance.models.generateContent({
        ...params,
        model: currentModel
      });
    } catch (err: any) {
      attempt++;
      const errMsg = err.message || String(err);
      
      console.warn(`[AI WARNING] Percobaan ke-${attempt} pada model ${currentModel} gagal: ${errMsg}`);

      if (attempt >= currentMaxRetries) {
        // Jika model terbaru sibuk (503 / 429), cari cadangan yang amat tangguh secara global: gemini-1.5-flash
        if (currentModel !== "gemini-1.5-flash") {
          console.log(`🔄 [AI FALLBACK MODEL] Model ${currentModel} sedang kelebihan beban (503/429). Otomatis beralih ke model stabil 'gemini-1.5-flash'...`);
          currentModel = "gemini-1.5-flash";
          attempt = 0;
          currentMaxRetries = 2; // Coba model cadangan ini sebanyak 2 kali
          continue;
        }
        throw err;
      }

      // Jeda penambahan progresif (Exponential Backoff: 1.5s, 3s, 4.5s...)
      const delayMs = attempt * 1500;
      console.log(`[AI BACKOFF] Menunggu ${delayMs / 1000} detik sebelum mencoba ulang...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
}

/**
 * Panggilan ter-bungkus (wrapped) untuk menangani peralihan otomatis ke Key kedua jika Key utama terkena limit/kuota habis.
 * Jika kedua Key Gemini gagal, proses akan dialihkan otomatis ke Groq API Key secara mulus di latar belakang.
 */
async function callGeminiWithFallback(params: {
  model: string;
  contents: any;
  config?: any;
}): Promise<any> {
  console.log(`[AI WORKFLOW] Mengalihkan panggilan ${params.model} langsung ke GROQ API...`);
  try {
    const groqResultText = await callGroqDirectly(params.contents);
    return { text: groqResultText };
  } catch (groqErr: any) {
    console.error(`[AI WORKFLOW] Groq API gagal:`, groqErr.message || groqErr);
    throw new Error(
      `Gagal memproses panggilan kecerdasan buatan melalui Groq.\n` +
      `- Detail Error Groq: ${groqErr.message || groqErr}`
    );
  }
}

/**
 * Membuat prompt terstandardisasi untuk kedua enjin (Gemini dan Groq)
 */
function createPrompt(data: ModulFormData): string {
  const listMateri = data.materials && data.materials.filter(Boolean).length > 0 
    ? data.materials.filter(Boolean).map((m, idx) => `${idx + 1}. ${m}`).join("\n")
    : data.material;

  const listTp = data.tps && data.tps.filter(Boolean).length > 0
    ? data.tps.filter(Boolean).map((t, idx) => `${idx + 1}. ${t}`).join("\n")
    : data.tp;

  return `
    Bertindaklah sebagai Ahli Kurikulum Merdeka dan Senior Instructional Designer.
    Bantu saya menghasilkan "Rencana Pelaksanaan Pembelajaran Mendalam (RPPM)" yang kreatif, terstruktur, dan sesuai standar.
    
    DATA INPUT:
    - Satuan Pendidikan: ${data.schoolName}
    - Mapel: ${data.subject}
    - Jenjang/Kelas/Semester: ${data.level} / ${data.grade} / ${data.semester}
    - Capaian Pembelajaran (CP): ${data.cp}
    - Materi Pokok dari Pengguna: 
${listMateri}
    - Tujuan Pembelajaran (TP) dari Pengguna: 
${listTp}
    - Jumlah Pertemuan: ${data.meetings}
    - Durasi: ${data.duration}
    - Praktik Pedagogis: ${data.pedagogy.join(", ")}
    - Dimensi Lulusan: ${data.dimensi.join(", ")}
 
    TUGAS UTAMA & ATURAN YANG SANGAT KETAT:
    1. TUJUAN PEMBELAJARAN (TP) HARUS PERSIS SAMA DENGAN INPUT GURU: Properti "desain.tp" WAJIB diisi persis sama dengan rumusan Tujuan Pembelajaran (TP) dari pengguna di atas (termasuk format penomoran urut jika diisi 2 atau lebih), yaitu:
${listTp}
Jangan diubah, disingkat, dimodifikasi, atau diringkas! AI dilarang keras merumuskan Tujuan Pembelajaran baru secara mandiri. Apapun yang diisi guru harus tampil utuh, rapi, dan persis sama di properti "desain.tp".
    2. CAPAIAN PEMBELAJARAN (CP) TIDAK BOLEH DIUBAH: Properti "desain.cp" WAJIB diisi persis sama dengan CP input: "${data.cp}". Jangan mengubah, meringkas, atau menyingkatnya sedikit pun!
    3. MATERI POKOK / MATERI PELAJARAN: Properti "identifikasi.material" WAJIB diisi persis sama dengan seluruh daftar Materi Pokok dari pengguna di atas (termasuk format penomoran urut jika diisi 2 atau lebih), yaitu:
${listMateri}
Jangan diubah, disingkat, dimodifikasi, atau diringkas! Apapun yang diisi guru harus tampil utuh, rapi, dan persis sama di properti "identifikasi.material".
    4. Rancang Pengalaman Belajar Berbasis TP: Seluruh isi kegiatan awal, inti, dan akhir harus terarah demi memfasilitasi pencapaian Tujuan Pembelajaran (TP) yang baru rumit itu secara konkret dan terdistribusi untuk semua pertemuan.
    5. Identitas Kelas & Semester: Properti "identitas.classSemester" harus berformat "Kelas ${data.grade} / ${data.semester}" (tanpa embel-embel jenjang).
    6. Menyesuaikan Kedalaman Jenjang Kejuruan/Sekolah:
       - Sesuaikan tingkat kedalaman materi, kompleksitas penjelasan, model aktivitas pemecahan masalah, dan ejaan agar sangat cocok dan ramah dengan tingkat pemahaman murid jenjang ${data.level} Kelas ${data.grade}.
    7. Identifikasi Profil Murid: Deskripsikan karakteristik perilaku/psikologi perkembangan anak sesuai jenjang ${data.level} Kelas ${data.grade}. Gunakan istilah "murid" (JANGAN gunakan "siswa" atau "peserta didik").
    8. Pengalaman Belajar Berbasis Pembelajaran Mendalam (Deep Learning):
        - Setiap bagian pengalaman belajar (memahami, mengaplikasi, merefleksi) HARUS diuraikan LANGKAH DEMI LANGKAH dengan sangat detail, operasional, dan BERFOKUS PENUH pada Materi Pelajaran yang diisi:
          ${listMateri}
          dan Tujuan Pembelajaran (TP) yang diisi:
          ${listTp}
          SANGAT DILARANG KERAS uraian kegiatan ini lari/melenceng atau tidak relevan dari materi pelajaran dan Tujuan Pembelajaran di atas! Semua kegiatan harus secara logis membimbing murid menguasai materi pokok dan mencapai TP tersebut secara mendalam.
        - Kalimat deskripsi dan langkah-langkah yang guru harus lakukan harus dibuat SANGAT KREATIF, JELAS, DETIL, dan OPERASIONAL agar guru tidak mengambang atau bingung apa yang harus dilakukan di kelas. Hindari kalimat abstrak atau terlalu umum.
        - Jabarkan langkah-langkah guru dengan poin-poin atau urutan yang sangat rapi dan praktis, mencakup:
          * Instruksi Spesifik Guru (kata-kata pemantik atau aksi konkret guru di kelas).
          * Aktivitas Murid yang Aktif dan Kolaboratif.
          * Skenario Tantangan Kreatif atau Simulasi Menantang.
        - Anda WAJIB mengintegrasikan dan menuliskan ketiga prinsip pembelajaran (**Berkesadaran**, **Bermakna**, dan **Menggembirakan**) secara eksplisit dalam uraian langkah-langkah setiap fase pengalaman belajar (Memahami, Mengaplikasi, Merefleksi) sebagai berikut:

          * **Memahami (Fase Awal Pembelajaran - Membangun Kesadaran & Konstruksi Pengetahuan)**:
            Fase ini bertujuan membangun kesadaran murid terhadap tujuan pembelajaran dan mendorong mereka aktif mengkonstruksi pengetahuan mengenai konsep/materi dari berbagai sumber dan konteks.
            Dalam menuliskan langkah-langkah kegiatan fase Memahami, Anda WAJIB menguraikan integrasi prinsip-prinsip berikut secara jelas:
            1. **Prinsip Berkesadaran**: Memusatkan perhatian spiritual/fokus pikiran murid secara sadar (mindful) terhadap TP dan urgensi materi. Sediakan panduan langkah mindfulness terpandu secara konkret (contoh: hening sejenak, teknik pernapasan 4-7-8, atau mendengarkan instrumen tenang).
            2. **Prinsip Bermakna**: Guru membimbing murid mengeksplorasi dan mengonstruksi pengetahuan yang terdiri dari 3 jenis pengetahuan: *pengetahuan esensial* (konsep inti materi), *pengetahuan aplikatif* (bagaimana materi ini digunakan dalam kehidupan), dan *pengetahuan nilai & karakter* (budi pekerti/profil Pancasila yang dipetik dari materi).
            3. **Prinsip Menggembirakan**: Menyajikan 1 ide ice-breaking kreatif atau game pemantik kognitif singkat yang SANGAT RELEVAN dengan materi pokok di atas, lengkap dengan cara memainkannya agar memotivasi murid sejak awal.

          * **Mengaplikasi (Fase Aktivitas Kontekstual - Penerapan Individu & Kolaboratif)**:
            Fase ini menyajikan aktivitas murid mengaplikasikan pengetahuan secara kontekstual sebagai proses perluasan pengetahuan secara individu maupun kolaboratif (pemecahan masalah nyata, simulasi, pengambilan keputusan, dll).
            Dalam menuliskan langkah-langkah kegiatan fase Mengaplikasi, Anda WAJIB menguraikan integrasi prinsip-prinsip berikut secara jelas:
            1. **Prinsip Menggembirakan**: Menciptakan suasana belajar interaktif, seru, penuh kolaborasi, dan menantang rasa ingin tahu menggunakan sintaks/langkah konkret model pedagogis "${data.pedagogy.join(", ")}". Berikan instruksi pembagian kelompok yang ramah dan suportif.
            2. **Prinsip Bermakna**: Murid secara nyata menerapkan ilmu mereka untuk memecahkan tantangan dunia nyata atau studi kasus yang berakar pada materi pokok. Hubungkan aktivitas ini secara erat dengan Tujuan Pembelajaran.
            3. **Prinsip Berkesadaran**: Guru membimbing murid untuk menumbuhkan empati, saling menghargai pendapat dalam kelompok, mengamati peran masing-masing anggota secara inklusif, dan meregulasi emosi saat menghadapi hambatan/tantangan tugas.

            SANGAT PENTING (ATURAN PERTEMUAN):
            - Jika Jumlah Pertemuan yang diisi adalah 1 pertemuan (atau jika ${data.meetings} bernilai 1), maka pada bagian kegiatan inti ("mengaplikasi") HANYA BOLEH berisi 1 pertemuan saja (JANGAN dibuat menjadi 2 pertemuan atau lebih, dan JANGAN dipisah per pertemuan), meskipun terdapat 2 atau lebih tujuan pembelajaran pada data utama. Semua langkah kegiatan inti harus diuraikan secara runut, komprehensif, dan selesai dalam satu kesatuan rangkaian kegiatan inti berdurasi 1 pertemuan tersebut yang mengintegrasikan ketiga prinsip di atas.
            - Jika Jumlah Pertemuan adalah 2 pertemuan atau lebih (yaitu ${data.meetings} pertemuan), maka Anda WAJIB membagi dan menguraikan penjelasan langkah-demi-langkah Kegiatan Inti ("mengaplikasi") tersebut untuk Masing-Masing Pertemuan secara terpisah, jelas, detail, dan berurutan sesuai Tujuan Pembelajaran (TP) yang ingin dicapai! Setiap pertemuan tetap wajib menerapkan prinsip Menggembirakan, Bermakna, dan Berkesadaran. Tuliskan sub-judul penanda pertemuan yang sangat tegas dan rapi, seperti:
              
              - **Pertemuan 1 (Tujuan Pembelajaran: [tuliskan TP spesifik yang dicapai pada Pertemuan 1])**
                [Uraikan langkah demi langkah kegiatan inti pertemuan 1 dengan mengintegrasikan prinsip Menggembirakan, Bermakna, dan Berkesadaran secara terperinci...]
              - **Pertemuan 2 (Tujuan Pembelajaran: [tuliskan TP spesifik yang dicapai pada Pertemuan 2])**
                [Uraikan langkah demi langkah kegiatan inti pertemuan 2 dengan mengintegrasikan prinsip Menggembirakan, Bermakna, dan Berkesadaran secara terperinci...]
              (Sesuaikan persis dengan jumlah pertemuan asli, yaitu sebanyak ${data.meetings} pertemuan).

          * **Merefleksi (Fase Evaluasi & Regulasi Diri - Pemaknaan & Tindakan Nyata)**:
            Fase ini membimbing murid mengevaluasi dan memaknai proses serta hasil dari tindakan/praktik nyata, mengidentifikasi kekuatan, tantangan, dan hal yang perlu diperbaiki.
            Dalam menuliskan langkah-langkah kegiatan fase Merefleksi, Anda WAJIB menguraikan integrasi prinsip-prinsip berikut secara jelas:
            1. **Prinsip Bermakna**: Murid menguji dan mendiskusikan sejauh mana TP telah tercapai dan bagaimana esensi materi ini berguna dalam kehidupan sehari-hari mereka. Sediakan minimal 2-3 pertanyaan reflektif pemantik kesadaran diri/spiritual yang relevan dengan materi pelajaran yang baru dibahas.
            2. **Prinsip Berkesadaran**: Memfasilitasi regulasi diri (self-regulation) murid sebagai kemampuan mandiri untuk mengelola belajarnya, meliputi perencanaan tindakan lanjutan, memantau kemajuan diri, mengevaluasi kekuatan/kelemahan cara belajar mereka secara jujur.
            3. **Prinsip Menggembirakan**: Melaksanakan langkah penutupan yang berkesan, penuh penghargaan, dan hangat (contoh: tiket keluar kreatif, apresiasi melingkar, jabat tangan bermakna, atau selebrasi keberhasilan bersama) agar murid pulang dengan perasaan bahagia dan bangga atas proses belajarnya.
    9. Pengisian Kolom Desain Pembelajaran (WAJIB diisi lengkap dan detail sesuai standar Kurikulum Merdeka):
       - crossDisciplinary (Lintas Disiplin Ilmu): Wajib diisi lengkap dengan deskripsi konkret integrasi muatan materi dengan bidang ilmu atau mata pelajaran relevan lainnya.
       - partnership (Kemitraan Pembelajaran): Wajib diisi penjelasan terperinci mengenai pelibatan orang tua murid, praktisi industri, warga sekitar, atau pakar dari luar untuk memperkaya materi ajar.
       - environment (Lingkungan Pembelajaran): Wajib diisi gambaran suasana kelas fisik maupun psikologis yang dirancang inklusif, aman, nyaman, dan mendukung fokus belajar murid.
       - digitalUtilization (Pemanfaatan Digital): Wajib diisi jenis pemanfaatan aplikasi interaktif, tayangan video, LMS, software digital, atau gawai penunjang nyata dalam pembelajaran.
    10. Asesmen Pembelajaran: Jabarkan bentuk Asesmen Awal, Asesmen Proses (formatif), dan Asesmen Akhir (sumatif) yang berfokus menguji ketercapaian Tujuan Pembelajaran dan Materi Pokok di atas. Gunakan istilah "murid", JANGAN pakai kata "diagnostik", dan JANGAN generate rubrik penilaian.

    OUTPUT HARUS DALAM BAHASA INDONESIA YANG BAIK DAN BENAR (Ejaan yang Disempurnakan).
    Seluruh output wajib menggunakan istilah "murid" dan tidak boleh menggunakan kata "siswa" atau "peserta didik".
    Format output harus valid JSON objek tanpa ada teks tambahan lain sebelum dan sesudah json. Harus bisa diparsing menggunakan JSON.parse() with skema:
    {
      "identitas": {
        "schoolName": "...",
        "subject": "...",
        "classSemester": "...",
        "duration": "..."
      },
      "identifikasi": {
        "students": "...",
        "material": "...",
        "dimensi": "..."
      },
      "desain": {
        "cp": "...",
        "crossDisciplinary": "...",
        "tp": "...",
        "pedagogy": "...",
        "partnership": "...",
        "environment": "...",
        "digitalUtilization": "..."
      },
      "pengalaman": {
        "memahami": "...",
        "mengaplikasi": "...",
        "merefleksi": "..."
      },
      "asesmen": {
        "awal": "...",
        "proses": "...",
        "akhir": "..."
      }
    }
  `;
}

/**
 * Enjin Pertama: Gemini-2.5-Flash
 */
async function generateWithGemini(data: ModulFormData): Promise<GeneratedModul> {
  const prompt = createPrompt(data);
  const response = await callGeminiWithFallback({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        required: ["identitas", "identifikasi", "desain", "pengalaman", "asesmen"],
        properties: {
          identitas: {
            type: Type.OBJECT,
            required: ["schoolName", "subject", "classSemester", "duration"],
            properties: {
              schoolName: { type: Type.STRING },
              subject: { type: Type.STRING },
              classSemester: { type: Type.STRING },
              duration: { type: Type.STRING }
            }
          },
          identifikasi: {
            type: Type.OBJECT,
            required: ["students", "material", "dimensi"],
            properties: {
              students: { type: Type.STRING },
              material: { type: Type.STRING },
              dimensi: { type: Type.STRING }
            }
          },
          desain: {
            type: Type.OBJECT,
            required: ["cp", "crossDisciplinary", "tp", "pedagogy", "partnership", "environment", "digitalUtilization"],
            properties: {
              cp: { type: Type.STRING },
              crossDisciplinary: { type: Type.STRING },
              tp: { type: Type.STRING },
              pedagogy: { type: Type.STRING },
              partnership: { type: Type.STRING },
              environment: { type: Type.STRING },
              digitalUtilization: { type: Type.STRING }
            }
          },
          pengalaman: {
            type: Type.OBJECT,
            required: ["memahami", "mengaplikasi", "merefleksi"],
            properties: {
              memahami: { type: Type.STRING },
              mengaplikasi: { type: Type.STRING },
              merefleksi: { type: Type.STRING }
            }
          },
          asesmen: {
            type: Type.OBJECT,
            required: ["awal", "proses", "akhir"],
            properties: {
              awal: { type: Type.STRING },
              proses: { type: Type.STRING },
              akhir: { type: Type.STRING }
            }
          }
        }
      }
    }
  });

  if (!response.text) {
    throw new Error("Respon kosong dari enjin Gemini.");
  }

  return JSON.parse(response.text);
}

/**
 * Menghasilkan Modul Ajar menggunakan Groq API ter-otasi.
 */
async function generateWithGroq(data: ModulFormData): Promise<GeneratedModul> {
  const prompt = createPrompt(data);
  console.log("[AI WORKFLOW] Memulai pembuatan Modul Ajar dengan rotasi Groq API...");
  const contentText = await callGroqDirectly(prompt);
  return JSON.parse(contentText);
}

/**
 * Fungsi Utama: Menghasilkan Modul Ajar RPPM
 * Menggunakan mode dual-enjin kooperatif untuk menghasilkan stabilitas tinggi.
 */
export async function generateModulAjar(data: ModulFormData): Promise<GeneratedModul> {
  console.log("Status Konfigurasi Enjin AI: Groq Aktif");

  let parsedResult: GeneratedModul | null = null;
  let lastError: any = null;

  try {
    console.log("Menjalankan Enjin Utama: Groq...");
    parsedResult = await generateWithGroq(data);
  } catch (err: any) {
    console.error("Enjin utama (Groq) gagal:", err.message || err);
    lastError = err;
  }

  // 3. Fallback Terakhir: Coba paksa Groq apa adanya
  if (!parsedResult) {
    try {
      console.log("Mencoba memproses ulang dengan Groq...");
      parsedResult = await generateWithGroq(data);
    } catch (err: any) {
      lastError = err;
    }
  }

  if (parsedResult) {
    // Ganti semua sebutan "peserta didik" dengan "murid" secara rekursif pada konten generator
    const replaceText = (text: string): string => {
      if (typeof text !== 'string') return text;
      return text
        .replace(/PESERTA DIDIK/g, 'MURID')
        .replace(/Peserta Didik/g, 'Murid')
        .replace(/Peserta didik/g, 'Murid')
        .replace(/peserta Didik/g, 'murid')
        .replace(/peserta didik/g, 'murid');
    };

    const deepReplace = (obj: any): any => {
      if (obj === null || obj === undefined) return obj;
      if (typeof obj === 'string') {
        return replaceText(obj);
      }
      if (Array.isArray(obj)) {
        return obj.map(item => deepReplace(item));
      }
      if (typeof obj === 'object') {
        const res: any = {};
        for (const key of Object.keys(obj)) {
          res[key] = deepReplace(obj[key]);
        }
        return res;
      }
      return obj;
    };

    parsedResult = deepReplace(parsedResult);

    // 🛡️ GARANSI KEAMANAN DATA UTUH: Pastikan semua kolom yang seharusnya string bertipe string
    // guna menghindari React Error #31 jika enjin AI (Groq) mengembalikan objek tak terduga.
    if (parsedResult.identitas) {
      parsedResult.identitas.schoolName = ensureString(parsedResult.identitas.schoolName);
      parsedResult.identitas.subject = ensureString(parsedResult.identitas.subject);
      parsedResult.identitas.classSemester = ensureString(parsedResult.identitas.classSemester);
      parsedResult.identitas.duration = ensureString(parsedResult.identitas.duration);
    } else {
      parsedResult.identitas = { schoolName: "", subject: "", classSemester: "", duration: "" };
    }

    if (parsedResult.identifikasi) {
      parsedResult.identifikasi.students = ensureString(parsedResult.identifikasi.students);
      parsedResult.identifikasi.material = ensureString(parsedResult.identifikasi.material);
      parsedResult.identifikasi.dimensi = ensureString(parsedResult.identifikasi.dimensi);
    } else {
      parsedResult.identifikasi = { students: "", material: "", dimensi: "" };
    }

    if (parsedResult.desain) {
      parsedResult.desain.cp = ensureString(parsedResult.desain.cp);
      parsedResult.desain.crossDisciplinary = ensureString(parsedResult.desain.crossDisciplinary);
      parsedResult.desain.tp = ensureString(parsedResult.desain.tp);
      parsedResult.desain.topic = ensureString(parsedResult.desain.topic);
      parsedResult.desain.pedagogy = ensureString(parsedResult.desain.pedagogy);
      parsedResult.desain.partnership = ensureString(parsedResult.desain.partnership);
      parsedResult.desain.environment = ensureString(parsedResult.desain.environment);
      parsedResult.desain.digitalUtilization = ensureString(parsedResult.desain.digitalUtilization);
      parsedResult.desain.adaptasiLokal = ensureString(parsedResult.desain.adaptasiLokal);
    } else {
      parsedResult.desain = {
        cp: "", crossDisciplinary: "", tp: "", topic: "", pedagogy: "",
        partnership: "", environment: "", digitalUtilization: "", adaptasiLokal: ""
      };
    }

    if (parsedResult.pengalaman) {
      parsedResult.pengalaman.memahami = ensurePrinciple(parsedResult.pengalaman.memahami, "Berkesadaran", "Mindful");
      parsedResult.pengalaman.mengaplikasi = ensurePrinciple(parsedResult.pengalaman.mengaplikasi, "Menggembirakan", "Joyful");
      parsedResult.pengalaman.merefleksi = ensurePrinciple(parsedResult.pengalaman.merefleksi, "Bermakna", "Meaningful");
    } else {
      parsedResult.pengalaman = {
        memahami: `**Prinsip Pembelajaran: Berkesadaran (Mindful)**\nMelalui penerapan prinsip berkesadaran, murid dipersiapkan secara spiritual dan fokus pikiran sebelum memulai pelajaran.`,
        mengaplikasi: `**Prinsip Pembelajaran: Menggembirakan (Joyful)**\nMelalui penerapan prinsip menggembirakan, murid dilibatkan secara interaktif dan menantang dalam proses mengaplikasikan materi pembelajaran.`,
        merefleksi: `**Prinsip Pembelajaran: Bermakna (Meaningful)**\nMelalui penerapan prinsip bermakna, murid dibimbing merefleksikan esensi nilai yang didapatkan agar berguna dalam kehidupan sehari-hari.`
      };
    }

    if (parsedResult.asesmen) {
      parsedResult.asesmen.awal = ensureString(parsedResult.asesmen.awal);
      parsedResult.asesmen.proses = ensureString(parsedResult.asesmen.proses);
      parsedResult.asesmen.akhir = ensureString(parsedResult.asesmen.akhir);
    } else {
      parsedResult.asesmen = { awal: "", proses: "", akhir: "" };
    }

    // 🛡️ GARANSI KEAMANAN DATA UTUH: Pastikan CP tidak diubah atau dipangkas oleh AI
    parsedResult.desain.cp = data.cp;
    
    // Format dan bersihkan Tujuan Pembelajaran (TP) secara paksa:
    // Jika ada 2 atau lebih, berikan nomor urut. Jika hanya 1, hilangkan nomor urut.
    const activeTps = data.tps ? data.tps.filter(Boolean) : [];
    if (activeTps.length > 0) {
      if (activeTps.length === 1) {
        parsedResult.desain.tp = activeTps[0].replace(/^\d+[\s\.)\-\:\/]+\s*/, "").trim();
      } else {
        parsedResult.desain.tp = activeTps
          .map((t, idx) => {
            const cleanT = t.replace(/^\d+[\s\.)\-\:\/]+\s*/, "").trim();
            return `${idx + 1}. ${cleanT}`;
          })
          .join("\n");
      }
    } else {
      const singleTp = data.tp || "";
      const lines = singleTp.split("\n").map(l => l.trim()).filter(Boolean);
      if (lines.length === 1) {
        parsedResult.desain.tp = lines[0].replace(/^\d+[\s\.)\-\:\/]+\s*/, "").trim();
      } else if (lines.length > 1) {
        parsedResult.desain.tp = lines
          .map((line, idx) => {
            const cleanLine = line.replace(/^\d+[\s\.)\-\:\/]+\s*/, "").trim();
            return `${idx + 1}. ${cleanLine}`;
          })
          .join("\n");
      } else {
        parsedResult.desain.tp = "";
      }
    }

    // Format dan bersihkan Materi Pokok secara paksa:
    // Jika ada 2 atau lebih, berikan nomor urut. Jika hanya 1, hilangkan nomor urut.
    const activeMaterials = data.materials ? data.materials.filter(Boolean) : [];
    if (activeMaterials.length > 0) {
      if (activeMaterials.length === 1) {
        parsedResult.identifikasi.material = activeMaterials[0].replace(/^\d+[\s\.)\-\:\/]+\s*/, "").trim();
      } else {
        parsedResult.identifikasi.material = activeMaterials
          .map((m, idx) => {
            const cleanM = m.replace(/^\d+[\s\.)\-\:\/]+\s*/, "").trim();
            return `${idx + 1}. ${cleanM}`;
          })
          .join("\n");
      }
    } else {
      const singleMaterial = data.material || "";
      const lines = singleMaterial.split("\n").map(l => l.trim()).filter(Boolean);
      if (lines.length === 1) {
        parsedResult.identifikasi.material = lines[0].replace(/^\d+[\s\.)\-\:\/]+\s*/, "").trim();
      } else if (lines.length > 1) {
        parsedResult.identifikasi.material = lines
          .map((line, idx) => {
            const cleanLine = line.replace(/^\d+[\s\.)\-\:\/]+\s*/, "").trim();
            return `${idx + 1}. ${cleanLine}`;
          })
          .join("\n");
      } else {
        parsedResult.identifikasi.material = "";
      }
    }
    
    // Pastikan nama sekolah dan mapel tetap sinkron sempurna sesuai masukan form
    if (data.schoolName) parsedResult.identitas.schoolName = data.schoolName;
    if (data.subject) parsedResult.identitas.subject = data.subject;
    
    return parsedResult;
  }

  throw new Error(
    lastError?.message || 
    "Gagal menghasilkan rencana pembelajaran dengan enjin kecerdasan buatan. Harap periksa apakah API Key Gemini atau Groq sudah dimasukkan dengan benar."
  );
}

/**
 * Membuat prompt terstandardisasi untuk Kisi-kisi Asesmen Kurikulum Merdeka
 */
function createAsesmenKisiKisiPrompt(data: ModulFormData, config: AsesmenConfig): string {
  const listMateri = data.materials && data.materials.filter(Boolean).length > 0
    ? data.materials.filter(Boolean).map((m, idx) => `${idx + 1}. ${m}`).join("\n")
    : data.material;

  const listTp = data.tps && data.tps.filter(Boolean).length > 0
    ? data.tps.filter(Boolean).map((t, idx) => `${idx + 1}. ${t}`).join("\n")
    : data.tp;

  const allowedTpList = data.tps && data.tps.filter(Boolean).length > 0 
    ? data.tps.filter(Boolean).map(t => `"${t}"`).join(", ") 
    : `"${data.tp}"`;

  return `
    Bertindaklah sebagai Ahli Asesmen Kurikulum Merdeka dan Pembuat Kisi-Kisi Pendidikan senior yang bersertifikasi nasional.
    Bantu saya menghasilkan Kisi-kisi Soal bertaraf AKM (Asesmen Kompetensi Minimum) untuk ${config.jenisAsesmen}, yang berfokus penuh pada penguatan LITERASI MEMBACA dan NUMERASI.
    
    DATA PENYUSUNAN ACUAN KURIKULUM:
    - Satuan Pendidikan: ${data.schoolName}
    - Mapel: ${data.subject}
    - Jenjang / Kelas / Semester: ${data.level} / ${data.grade} / ${data.semester}
    - Capaian Pembelajaran (CP): ${data.cp}
    - Tujuan Pembelajaran (TP) yang Diaktifkan:
${listTp}
    - Materi Pembelajaran:
${listMateri}
    - Jenis Asesmen: ${config.jenisAsesmen}
    
    KONFIGURASI ASESMEN YANG DIPILIH PENGGUNA:
    - Pilihan Ganda (PG): ${config.pgCount} soal
    - Pilihan Ganda Kompleks (PGK): ${config.pgkCount} soal
    - Isian Singkat: ${config.isianCount} soal
    - Uraian: ${config.uraianCount} soal
    - Benar / Salah (BS): ${config.bsCount} soal
    - Menjodohkan: ${config.menjodohkanCount} soal
    - Pilihan Level Kognitif Soal: ${config.levelKognitif.join(", ")}

    STANDARDISASI LITERASI DAN NUMERASI (AKM KURIKULUM MERDEKA):
    Semua kisi-kisi dan indikator soal yang dibuat HARUS mengintegrasikan kompetensi dasar literasi dan numerasi berikut:
    1. LITERASI MEMBACA:
       - Menemukan informasi tersurat (mencari informasi spesifik dalam teks stimulus).
       - Memahami informasi implisit (menafsirkan makna, menyimpulkan niat tokoh, atau merelasikan bab sebab-akibat dari bacaan).
       - Mengevaluasi dan merefleksikan stimulus (menilai kesesuaian gambar dengan isi teks, merekomendasikan solusi atas masalah tokoh).
    2. NUMERASI:
       - Memahami representasi bilangan, pola, pengukuran, geometri, atau analisis data sederhana.
       - Mengaplikasikan serta menafsirkan angka, grafik, diagram, nominal uang/biaya, resep, tabel berat, atau jadwal dalam pemecahan masalah kehidupan sehari-hari (konteks personal, sosio-kultural, atau saintifik).
    
    SANGAT PENTING: DILARANG MEMBUAT INDIKATOR YANG HANYA MENUNTUT HAFALAN ATAU DEFINISI TEORI SEMATA (misalnya "Murid dapat menyebutkan pengertian..."). Gantilah dengan "Disajikan stimulus berupa cerita/skenario/tabel, murid dapat menganalisis/menyimpulkan/menghitung..." sehingga terbukti menguji keterampilan berpikir kritis logis.

    PANDUAN ACUAN LEVEL KOGNITIF (BLOOM'S TAXONOMY):
    Berdasarkan standar evaluasi Kurikulum Merdeka, klasifikasi tingkat kognitif harus diatur sebagai berikut:
    - Level 1 (LOTS): Mengingat dan Memahami. Menguji pencarian fakta langsung dalam stimulus atau mengidentifikasi konsep konkret dalam bacaan pendek.
    - Level 2 (MOTS): Mengaplikasikan. Menguji penerapan rumus, cara, konversi satuan, atau prosedur dasar ke dalam skenario stimulus kontekstual baru.
    - Level 3 (HOTS): Menganalisis, Mengevaluasi, dan Mengkreasi. Menguji pemecahan masalah kompleks, perbandingan data, penyimpulan diagram/tabel, analisis sebab-akibat kejadian dari stimulus cerita, atau penyusunan solusi kreatif.

    ATURAN KALIBRASI BAHASA & KESULITAN BERDASARKAN KELAS (GRADE CALIBRATION):
    SANGAT CRITICAL: Sesuaikan tingkat berpikir (kognitif) dan kompleksitas bahasa dengan jenjang dan usia perkembangan murid di Kelas ${data.grade}. Jangan sampai kelas 1 menerima tingkat kesulitan bahasa atau kerumitan stimulus HOTS yang setara dengan kelas 6!
    - Untuk Kelas Rendah (Kelas 1, 2, 3 SD):
      * Bahasa harus sangat pendek, sederhana, konkret, langsung pada poinnya, serta menggunakan kosakata sehari-hari murid nasional.
      * Level HOTS (Level 3) untuk Kelas Rendah berupa stimulus konkret sehari-hari yang sangat dekat (Contoh: "Tanaman di dalam lemari gelap layu. Mengapa?" atau "Skenario memilih 2 dari 3 mainan sesuai batas uang saku").
    - Untuk Kelas Tinggi (Kelas 4, 5, 6 SD) atau SMP/SMA:
      * Stimulus dapat dibuat lebih menantang menggunakan tabel data, skema grafis, teks informatif ilmiah pendek, atau studi kasus perbandingan.
    
    ============================================================
    🚨 SYARAT WAJIB YANG MUTLAK & KETAT (MUST COMPLY):
    ============================================================
    1. PENYELARASAN DENGAN INPUT PENGGUNA:
       - Mata Pelajaran (Mapel) yang diuji WAJIB secara mutlak: "${data.subject}". Dilarang keras memunculkan konsep atau nama mapel selain itu!
       - Jenjang / Kelas / Semester WAJIB secara mutlak: "${data.level} / Kelas ${data.grade} / Semester ${data.semester}". Kasus, tingkat kesulitan bahasa, dan kompleksitas stimulus harus sejalan dengan psikologi perkembangan usia tingkat kelas tersebut.
       - Materi Pokok WAJIB berasal dari daftar masukan pengguna: ${JSON.stringify(data.materials || [data.material])}. Anda harus mendistribusikan soal secara berimbang dan merata ke materi-materi tersebut.

    2. HUBUNGAN STRUKTURAL KORELASI ANTARA TP, MATERI POKOK, & INDIKATOR:
       - ALUR BERPIKIR WAJIB SINKRON: [Materi Pokok] -> melahirkan [Tujuan Pembelajaran (TP)] -> melahirkan [Indikator Soal] -> melahirkan [Butir Soal].
       - Di setiap baris "kisiKisi", nilai properti "materi" HARUS merupakan salah satu Materi Pokok spesifik dari daftar input pengguna secara utuh dan tepat.
       - Properti "tp" (Tujuan Pembelajaran) pada baris tersebut HARUS dipilih secara tepat dari daftar Tujuan Pembelajaran yang diaktifkan oleh pengguna di atas: [${allowedTpList}]. Dilarang keras merumuskan kata-kata TP yang baru atau memodifikasi rumusan TP tersebut!
       - Properti "indikator" HARUS dikembangkan langsung dari "tp" tersebut. Pola penulisan indikator WAJIB: "Disajikan stimulus [teks cerita / tabel data angka / diagram visual keuangan / grafik], murid dapat [menganalisis/menentukan/menghitung/membandingkan]...". Indikator harus secara nyata menguji kemampuan Literasi atau Numerasi dan dilarang melenceng dari koridor rumusan TP pada baris tersebut.

    3. STRUKTUR LITERASI DAN NUMERASI BERINTEGRITAS TINGGI (AKM):
       - Seluruh indikator soal harus mengarah pada pengerjaan berbasis stimulus kontekstual yang mendalam (TIDAK BOLEH hafalan teori murni).

    SANGAT PENTING:
    1. Buatlah Kisi-kisi Soal yang selaras dalam bentuk tabel. Total baris kisi-kisi (indikator soal) harus sama dengan penjumlahan semua tipe soal di atas (Total = ${config.pgCount + config.pgkCount + config.isianCount + config.uraianCount + config.bsCount + config.menjodohkanCount} soal).
    2. Urutan noSoal harus berurutan secara logis dari No 1 sampai terakhir.
    3. Untuk "kisiKisi":
       - Setiap kisi-kisi item harus memiliki: no (nomor urut), tp (Tujuan Pembelajaran khusus yang dipilih dari daftar [${allowedTpList}]), materi (Materi pokok spesifik untuk baris ini dari daftar di atas), indikator (Deskripsi indikator soal yang spesifik berorientasi literasi/numerasi dan dikembangkan langsung dari TP), levelKognitif (LOTS/MOTS/HOTS), bentukSoal (PG, PGK, Isian, Uraian, BS, atau Menjodohkan), noSoal (string nomor soal, misal "1", "2").
    4. Kembalikan respons dalam format JSON murni dengan skema:
    {
      "identitas": {
        "schoolName": "${data.schoolName}",
        "subject": "${data.subject}",
        "classSemester": "Kelas ${data.grade} / ${data.semester}",
        "tp": "${data.tps && data.tps.filter(Boolean).length > 0 ? data.tps.filter(Boolean).join("; ") : data.tp}",
        "materi": "${data.materials && data.materials.filter(Boolean).length > 0 ? data.materials.filter(Boolean).join(", ") : data.material}",
        "jenisAsesmen": "${config.jenisAsesmen}"
      },
      "kisiKisi": [
        {
          "no": 1,
          "tp": "Tujuan Pembelajaran spesifik dari daftar...",
          "materi": "Materi Pokok spesifik dari input yang sesuai...",
          "indikator": "Menggunakan pola: Disajikan stimulus..., murid dapat...",
          "levelKognitif": "...",
          "bentukSoal": "...",
          "noSoal": "1"
        }
      ]
    }
  `;
}

/**
 * Generate Asesmen Kisi-kisi dengan Gemini 3.5-Flash
 */
async function generateAsesmenKisiKisiWithGemini(data: ModulFormData, config: AsesmenConfig): Promise<GeneratedAsesmen> {
  const prompt = createAsesmenKisiKisiPrompt(data, config);
  const response = await callGeminiWithFallback({
    model: "gemini-3.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        required: ["identitas", "kisiKisi"],
        properties: {
          identitas: {
            type: Type.OBJECT,
            required: ["schoolName", "subject", "classSemester", "tp", "materi"],
            properties: {
              schoolName: { type: Type.STRING },
              subject: { type: Type.STRING },
              classSemester: { type: Type.STRING },
              tp: { type: Type.STRING },
              materi: { type: Type.STRING },
              jenisAsesmen: { type: Type.STRING }
            }
          },
          kisiKisi: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              required: ["no", "tp", "materi", "indikator", "levelKognitif", "bentukSoal", "noSoal"],
              properties: {
                no: { type: Type.INTEGER },
                tp: { type: Type.STRING },
                materi: { type: Type.STRING },
                indikator: { type: Type.STRING },
                levelKognitif: { type: Type.STRING },
                bentukSoal: { type: Type.STRING },
                noSoal: { type: Type.STRING }
              }
            }
          }
        }
      }
    }
  });

  if (!response.text) {
    throw new Error("Respon kosong dari enjin Gemini.");
  }

  const result = JSON.parse(response.text);
  return {
    ...result,
    soal: [],
    kunciPembahasan: []
  };
}

/**
 * Menghasilkan Kisi-kisi Asesmen menggunakan Groq API ter-otasi.
 */
async function generateAsesmenKisiKisiWithGroq(data: ModulFormData, config: AsesmenConfig): Promise<GeneratedAsesmen> {
  const prompt = createAsesmenKisiKisiPrompt(data, config);
  console.log("[AI WORKFLOW] Memulai pembuatan Kisi-kisi Asesmen dengan rotasi Groq API...");
  const contentText = await callGroqDirectly(prompt);
  const result = JSON.parse(contentText);
  return {
    ...result,
    soal: [],
    kunciPembahasan: []
  };
}

/**
 * Fungsi Utama: Menghasilkan Asesmen Lengkap (Kisi-kisi Saja di Tahap Awal)
 */
export async function generateAsesmen(data: ModulFormData, config: AsesmenConfig): Promise<GeneratedAsesmen> {
  let parsedResult: GeneratedAsesmen | null = null;
  let lastError: any = null;

  try {
    console.log("Menjalankan Enjin Kisi-Kisi Utama: Groq...");
    parsedResult = await generateAsesmenKisiKisiWithGroq(data, config);
  } catch (err: any) {
    lastError = err;
  }

  if (!parsedResult) {
    try {
      console.log("Mencoba memproses ulang Kisi-kisi dengan Groq...");
      parsedResult = await generateAsesmenKisiKisiWithGroq(data, config);
    } catch (err: any) {
      lastError = err;
    }
  }

  if (parsedResult) {
    const replaceText = (text: string): string => {
      if (typeof text !== 'string') return text;
      return text
        .replace(/PESERTA DIDIK/g, 'MURID')
        .replace(/Peserta Didik/g, 'Murid')
        .replace(/Peserta didik/g, 'Murid')
        .replace(/peserta Didik/g, 'murid')
        .replace(/peserta didik/g, 'murid');
    };

    const deepReplace = (obj: any): any => {
      if (obj === null || obj === undefined) return obj;
      if (typeof obj === 'string') return replaceText(obj);
      if (Array.isArray(obj)) return obj.map(item => deepReplace(item));
      if (typeof obj === 'object') {
        const res: any = {};
        for (const key of Object.keys(obj)) {
          res[key] = deepReplace(obj[key]);
        }
        return res;
      }
      return obj;
    };

    parsedResult = deepReplace(parsedResult);

    if (data.schoolName) parsedResult.identitas.schoolName = data.schoolName;
    if (data.subject) parsedResult.identitas.subject = data.subject;
    if (data.tp) parsedResult.identitas.tp = data.tp;
    parsedResult.identitas.jenisAsesmen = config.jenisAsesmen;
    const combinedMaterial = data.materials && data.materials.filter(Boolean).length > 0
      ? data.materials.filter(Boolean).join(", ")
      : data.material;
    parsedResult.identitas.materi = combinedMaterial;

    return parsedResult;
  }

  throw new Error(
    lastError?.message || 
    "Gagal menghasilkan kisi-kisi asesmen dengan enjin kecerdasan buatan."
  );
}

/**
 * Generate Lembar Soal Berdasarkan Kisi-kisi (Tahap Kedua)
 */
export async function generateAsesmenSoal(
  data: ModulFormData, 
  config: AsesmenConfig, 
  kisiKisi: KisiKisiItem[]
): Promise<any[]> {
  const prompt = `
    Bertindaklah sebagai Pakar Penyusun Soal Asesmen Nasional (ANBK) dan Pembuat Evaluasi AKM (Asesmen Kompetensi Minimum) senior.
    Bantu saya menghasilkan Lembar Soal Asesmen berdasarkan Kisi-kisi Soal yang sudah disetujui di bawah ini.
    
    ============================================================
    🚨 SYARAT VALIDASI MUTLAK DAN BAHAN RUJUKAN PEMBUATAN SOAL:
    ============================================================
    1. PENYELARASAN IDENTITAS ACUAN:
       - Satuan Pendidikan: "${data.schoolName}"
       - Mata Pelajaran (Mapel) WAJIB MUTLAK: "${data.subject}"
       - Kelas / Semester WAJIB MUTLAK: Kelas ${data.grade} / Semester ${data.semester}
       - Jenjang: "${data.level}"
       - JANGAN memunculkan materi, jenjang, atau mapel lain di luar data acuan ini!

    2. KESESUAIAN TOTAL DENGAN KISI-KISI ACUAN:
       - Anda harus menyusun butir soal yang persis sama kuantitasnya, noSoal-nya, tipe-nya, dan berlandaskan 'materi', 'tp' (Tujuan Pembelajaran), dan 'indikator' dari Kisi-kisi Acuan di bawah.
       - Setiap Nomor Soal X harus menguji 'materi' spesifik yang tertulis pada baris No X Kisi-Kisi Acuan. Pertanyaan dan stimulus HARUS dirancang agar dapat mengukur tercapainya 'tp' (Tujuan Pembelajaran) khusus yang tertera pada baris tersebut.
       - Soal tidak boleh melenceng atau mengabaikan TP dan indikator yang tertulis di kisi-kisi!

    KISI-KISI ACUAN YANG MENJADI DESAIN DASAR SOAL:
    ${JSON.stringify(kisiKisi)}
    
    ============================================================
    ⚠️ SYARAT MUTLAK MODEL UTAMA: INTEGRASI AKM LITERASI & NUMERASI (KURIKULUM MERDEKA)
    ============================================================
    Setiap butir soal yang dihasilkan harus berlandaskan asas Kurikulum Merdeka yang menekankan Literasi dan Numerasi kontekstual untuk melatih nalar kritis dan logika berpikir siswa (HOTS/MOTS). JANGAN membuat soal hafalan kering/teoretis langsung tanpa basis kasus (TIDAK BOLEH "Apa pengertian dari X?" atau "Berapakah hasil dari 25 x 3?").
    
    Setiap soal WAJIB mendahulukan/menampilkan STIMULUS KONTEKSTUAL YANG NYATA, BERMANFAAT, DAN EDUKATIF sesuai indikator kisi-kisi sebelum pertanyaan inti diajukan.

    1. VARIASI BENTUK SOAL & STIMULUS (SANGAT PENTING):
       - DILARANG KERAS menyajikan semua soal matematika/numerasi hanya dalam bentuk tabel, grafik, atau diagram!
       - Anda WAJIB membagi dan meragamkan bentuk soal agar bervariasi:
         * Sekitar 40% - 60% dari seluruh soal matematika/numerasi wajib disajikan berupa cerita deskripsi kehidupan sehari-hari, penggalan bacaan, teks kasus nyata, atau narasi cerita biasa tanpa visualisasi data grafikal/tabel.
         * Sisanya baru disajikan menggunakan stimulus visual interaktif seperti tabel, grafik batang, grafik garis, atau diagram lingkaran jika memang relevan dengan indikator.
       - Untuk soal berbasis cerita/deskripsi/penggalan teks, Anda dapat menuliskan seluruh narasi ceritanya di dalam "pertanyaan" secara lengkap atau menggunakan objek "stimulus" dengan tipe "text" agar siswa dapat melatih nalar membacanya sebelum menghitung.

    2. STRUKTUR STIMULUS LITERASI MEMBACA:
       - Sediakan teks bacaan pendek yang menarik (cerita naratif, potongan berita fiksi/nyata, percakapan harian, rilis info sains sederhana, petualangan tokoh, surat ramah anak).
       - Pertanyaan harus menguji kemampuan:
         * Menemukan Informasi (Retrieve): Menjawab pertanyaan apa/siapa/di mana/kapan yang tertulis langsung pada teks.
         * Memahami (Interpret & Integrate): Menguraikan hubungan sebab-akibat, memprediksi kelanjutan cerita, atau menyimpulkan pesan moral dari cerita.
         * Merefleksi (Evaluate): Memberikan opini logis tentang sikap tokoh demi memecahkan masalah dalam cerita.

    3. STRUKTUR STIMULUS NUMERASI:
       - Sediakan skenario kehidupan nyata atau data konkret terukur (contoh: cerita pembagian resep kue ibu, membantu ayah menata batu bata, membandingkan tarif taksi online untuk berhemat, merencana anggaran jajan mingguan, menghitung jadwal keberangkatan bus, atau mengamati pola baris meja ujian).
       - Pertanyaan harus menguji kemampuan memecahkan masalah praktis menggunakan matematika:
         * Membaca dan mengambil data angka dari tabel/cerita dengan tepat.
         * Melakukan komputasi matematika logis (jumlah, selisih, perkalian, pembagian, pecahan dasar, perbandingan senilai, kelipatan/faktor) yang melekat murni pada alur skenario.
         * Menggunakan logika penalaran kritis: Anak didorong berpikir logis-analitis untuk menyelesaikan suatu kasus nyata, bukan sekadar menghafal rumus kering.
         * Contoh: "Jika Andi hanya memiliki uang Rp15.000, jajanan apa saja di kantin yang bisa ia beli agar sisa uang kembaliannya tepat Rp2.000?"

    ============================================================
    ATURAN KETEKENAN & KALIBRASI BAHASA BERDASARKAN KELAS SOAL:
    ============================================================
    - Kelas Rendah (1, 2, 3 SD):
      * Gunakan stimulus yang pendek (2-4 kalimat sederhana), konkret, dekat dengan dunia anak (hewan piaraan, bermain bersama teman, jajanan kantin, membantu orang tua).
      * Kosakata sederhana, bersahabat, menggunakan kalimat aktif langsung.
      * Contoh numerasi kelas rendah: menghitung sisa kelereng atau buah dalam gambar/cerita belanja sederhana.
    - Kelas Tinggi (4, 5, 6 SD) dan SMP/SMA:
      * Paragraf teks literasi bisa lebih panjang (1-2 paragraf padat).
      * Numerasi menampilkan tabel data nyata 3-5 baris, grafik batang sederhana, atau kombinasi resep masakan dengan proporsi pecahan/skala.

    ============================================================
    ATURAN TEKNIS PEMBUATAN PILIHAN JAWABAN (NO AMBIGUITY):
    ============================================================
    - Pertanyaan harus dirumuskan secara eksplisit, jelas kalimatnya, tata bahasa Indonesia yang baku (PBI), serta tidak bermakna ganda (bebas dari ambiguitas).
    - Bagi Guru/Murid, hanya boleh ada SATU kunci jawaban yang mutlak benar (untuk PG, BS, Isian). 
    - Untuk Tipe PG (Pilihan Ganda):
       - "opsi" berisi tepat ${config.pgOptionsCount} string pilihan jawaban yang logis dan memiliki distralisir (salah namun masuk akal jika murid kurang teliti).
       - SANGAT PENTING: Jangan tuliskan lagi abjad seperti "A. ", "B. ", "C. " di dalam teks opsi karena abjad-abjad tersebut sudah dirender otomatis oleh sistem antarmuka web.
    - Untuk Tipe PGK (Pilihan Ganda Kompleks):
       - Berikan pernyataan stimulus, lalu mintalah murid mencentang seluruh opsi yang benar (misalkan tampilkan 4 pilihan di array "opsi", di mana terdapat 2 atau 3 opsi yang bernilai benar berdasarkan stimulus).
    - Untuk Tipe BS (Benar/Salah):
       - Sediakan 1 kalimat pernyataan tajam/analitis berdasarkan teks stimulus, murid menilai apakah pernyataan tersebut BENAR atau SALAH.
    - Untuk Tipe Menjodohkan:
       - Pastikan ada "matchingLeft" (3 konsep/pertanyaan kiri) and "matchingRight" (4 deskripsi/jawaban kanan sebagai pengecoh) yang selaras dan terhubung erat secara logika kontekstual.
    - SOAL BERGAMBAR: Jika indikator membutuhkan visualisasi skema atau diagram, set "butuhGambar": true dan jelaskan visualisasinya secara detail di dalam "promptGambar" agar AI pembuat ilustrasi kami dapat menggambarnya secara akurat.
 
    ============================================================
    🚨 ATURAN MUTLAK PENYAJIAN DATA STIMULUS (TABEL, GRAFIK, DIAGRAM):
    ============================================================
    Sistem kami memiliki visualisator interaktif canggih (tabel, grafik batang, grafik garis, dan diagram lingkaran). Anda WAJIB memetakan stimulus data ke jenis visualisasi yang tepat dan dilarang keras menurunkan derajat grafik/diagram menjadi tabel biasa!
    
    1. ATURAN PEMILIHAN tipe stimulus ("type" di dalam objek "stimulus"):
       - Jika teks indikator, teks stimulus, atau pertanyaan memuat kata 'grafik batang', 'diagram batang', atau 'bar chart': Anda WAJIB mengeset 'type = "bar_chart"'. JANGAN gunakan "table"!
       - Jika teks indikator, teks stimulus, atau pertanyaan memuat kata 'grafik garis', 'diagram garis', 'line chart', atau kata 'tren / perkembangan' data dari waktu ke waktu: Anda WAJIB mengeset 'type = "line_chart"'. JANGAN gunakan "table"!
       - Jika teks indikator, teks stimulus, atau pertanyaan memuat kata 'diagram lingkaran', 'pie chart', 'diagram persentase', atau pembagian proporsi suatu total: Anda WAJIB mengeset 'type = "pie_chart"'. JANGAN gunakan "table"!
       - Jika menceritakan atau menyajikan 'tabel', 'tabel data', atau daftar klasifikasi data statis: set 'type = "table"'.
       - Jika stimulus berupa cerita narasi / deskripsi teks panjang mandiri tanpa grafik numerikal: set 'type = "text"'.
       - Jika tidak memerlukan stimulus terstruktur karena berupa narasi cerita biasa yang sudah menyatu di dalam pertanyaan, Anda dipersilakan mengeset "stimulus": null.
       
    2. LARANGAN KERAS DUPLIKASI FORMAT TABEL MARKDOWN:
       - JIKA soal memiliki properti "stimulus" terstruktur dengan tipe "bar_chart", "line_chart", "pie_chart", atau "table":
         * DILARANG KERAS menyertakan format tabel markdown ('| ... | ... |') di dalam string "pertanyaan"! Hal ini akan menyebabkan tampilan ganda yang sangat merusak estetika.
         * Di dalam string "pertanyaan", Anda cukup merujuknya dengan kalimat pengantar yang sesuai, misalnya: "Perhatikan grafik batang di bawah ini...", "Berdasarkan diagram lingkaran di samping...", atau "Perhatikan data pada tabel berikut...".
         
    3. STRUKTUR DETAIL OBJEK STIMULUS:
       - Judul: Isi properti "title" dengan judul tabel/grafik yang edukatif (misal: "Data Penjualan Buku Jan-Apr").
       - Label Sumbu: Isi "xAxisLabel" dan "yAxisLabel" jika berupa grafik batang atau garis.
       - Data: Array "data" wajib berisi objek {"label": "Kategori/Nama", "value": AngkaRiilNumerik, "extraInfo": "satuan opsional"}. Pastikan value adalah angka riil (bukan string!).
 
    Kembalikan respons dalam format JSON murni berisi sebuah array objek "soal" dengan skema:
    {
      "soal": [
        {
          "no": 1,
          "tipe": "PG",
          "pertanyaan": "Perhatikan grafik batang di bawah ini untuk menjawab pertanyaan.\\n\\nBerapakah selisih hasil panen...?",
          "opsi": ["...", "...", "..."],
          "levelKognitif": "...",
          "butuhGambar": true,
          "promptGambar": "..."
        }
      ]
    }
  `;

  const response = await callGeminiWithFallback({
    model: "gemini-3.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        required: ["soal"],
        properties: {
          soal: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              required: ["no", "tipe", "pertanyaan", "levelKognitif", "butuhGambar", "promptGambar"],
              properties: {
                no: { type: Type.INTEGER },
                tipe: { type: Type.STRING },
                pertanyaan: { type: Type.STRING },
                opsi: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                levelKognitif: { type: Type.STRING },
                butuhGambar: { type: Type.BOOLEAN },
                promptGambar: { type: Type.STRING },
                matchingLeft: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                matchingRight: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                stimulus: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING, description: "Tipe stimulus: 'text' | 'table' | 'bar_chart' | 'line_chart' | 'pie_chart'" },
                    title: { type: Type.STRING, description: "Judul tabel atau grafik" },
                    xAxisLabel: { type: Type.STRING, description: "Label sumbu X" },
                    yAxisLabel: { type: Type.STRING, description: "Label sumbu Y" },
                    headers: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "Nama-nama header tabel jika berupa tabel"
                    },
                    data: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          label: { type: Type.STRING, description: "Label sumbu X atau baris (misal: 'Jakarta')" },
                          value: { type: Type.NUMBER, description: "Nilai numerik riil (misal: 10200000)" },
                          extraInfo: { type: Type.STRING, description: "Informasi satuan opsional" }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  if (!response.text) {
    throw new Error("Gagal memperoleh lembar soal.");
  }

  const result = JSON.parse(response.text);
  return result.soal || [];
}

/**
 * Generate Kunci Jawaban Berdasarkan Soal (Tahap Ketiga)
 */
export async function generateAsesmenKunci(
  data: ModulFormData,
  config: AsesmenConfig,
  soal: any[]
): Promise<any[]> {
  const prompt = `
    Bertindaklah sebagai Guru Ahli dan Pembuat Pembahasan Soal Kurikulum Merdeka.
    Bantu saya menyusun Lembar Kunci Jawaban dan Pembahasan Materi berdasarkan Lembar Soal di bawah ini.
    
    ACUAN DATA:
    - Satuan Pendidikan: ${data.schoolName}
    - Mapel: ${data.subject}
    - Kelas/Semester: Kelas ${data.grade} / ${data.semester}
    - Jenis Asesmen: ${config.jenisAsesmen}
    
    DAFTAR LEMBAR SOAL ACUAN:
    ${JSON.stringify(soal)}
    
    ATURAN KUNCI JAWABAN & PEMBAHASAN:
    1. Buat jawaban kunci yang akurat untuk setiap butir soal di atas secara berurutan.
    2. SANGAT PENTING untuk format kolom "kunci":
       - Untuk tipe PG (Pilihan Ganda): "kunci" HARUS berisi hanya SATU HURUF ABJAD KAPITAL pilihan jawaban yang benar (contoh: "A", "B", "C", atau "D"). JANGAN menuliskan teks jawaban atau kalimat apa pun di kolom kunci untuk PG!
       - Untuk tipe PGK (Pilihan Ganda Kompleks): "kunci" berisi abjad-abjad pilihan yang benar dipasangkan koma (contoh: "A, C").
       - Untuk tipe BS (Benar/Salah): "kunci" berisi kata "BENAR" atau "SALAH".
       - Untuk tipe Menjodohkan: "kunci" merinci pasangan sebelah kiri dan kanan yang cocok secara ringkas.
       - Untuk tipe Isian/Uraian: "kunci" memberikan kata/frasa kunci jawaban inti.
    3. Hubungkan semua penjelasan konsep ilmiah, alasan mengapa opsi abjad tersebut benar, ulasan materi, atau penjelasan mendidik lainnya ke dalam kolom "pembahasan" agar murid/guru memahaminya secara detail. JANGAN menuliskan pembahasan di dalam kolom "kunci".
    4. Kembalikan respons dalam format JSON murni berisi sebuah array objek "kunciPembahasan" dengan skema:
    {
      "kunciPembahasan": [
        {
          "no": 1,
          "tipe": "...",
          "kunci": "...",
          "pembahasan": "..."
        }
      ]
    }
  `;

  const response = await callGeminiWithFallback({
    model: "gemini-3.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        required: ["kunciPembahasan"],
        properties: {
          kunciPembahasan: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              required: ["no", "tipe", "kunci", "pembahasan"],
              properties: {
                no: { type: Type.INTEGER },
                tipe: { type: Type.STRING },
                kunci: { type: Type.STRING },
                pembahasan: { type: Type.STRING }
              }
            }
          }
        }
      }
    }
  });

  if (!response.text) {
    throw new Error("Gagal memperoleh kunci & bahasan.");
  }

  const result = JSON.parse(response.text);
  return result.kunciPembahasan || [];
}

/**
 * Generate Rubrik Penilaian Berdasarkan Soal (Tahap Keempat)
 */
export async function generateAsesmenRubrik(
  data: ModulFormData,
  config: AsesmenConfig,
  soal: any[]
): Promise<any[]> {
  const prompt = `
    Bertindaklah sebagai Ahli Kurikulum dan Konsultan Evaluasi Pendidikan.
    Bantu saya menyusun Rubrik Penilaian & Kriteria Ketuntasan untuk murni mengukur capaian peserta didik berdasarkan Lembar Soal di bawah ini.
    
    ACUAN DATA:
    - Satuan Pendidikan: ${data.schoolName}
    - Mapel: ${data.subject}
    - Kelas/Semester: Kelas ${data.grade} / ${data.semester}
    - Jenis Asesmen: ${config.jenisAsesmen}
    
    DAFTAR LEMBAR SOAL ACUAN:
    ${JSON.stringify(soal)}
    
    ATURAN RUBRIK PENILAIAN:
    1. "rubrik" berisi rubrikasi penilaian konkret pemarkahan skor untuk soal tersebut.
    2. Jabarkan bobot nilai (skor maksimal) dan kriteria pemberian skor:
       - Misal untuk Soal Isian/Uraian: "Skor 4 jika argumen sangat logis, menyertakan teori secara lengkap. Skor 2-3 jika cukup lengkap. Skor 1 jika kurang relevan. Skor 0 jika salah/kosong."
       - Sediakan kriteria spesifik yang mendidik dan adekuat.
    3. Kembalikan respons dalam format JSON murni berisi array objek "rubrikasi" dengan skema:
    {
      "rubrikasi": [
        {
          "no": 1,
          "tipe": "...",
          "rubrik": "..."
        }
      ]
    }
  `;

  const response = await callGeminiWithFallback({
    model: "gemini-3.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        required: ["rubrikasi"],
        properties: {
          rubrikasi: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              required: ["no", "tipe", "rubrik"],
              properties: {
                no: { type: Type.INTEGER },
                tipe: { type: Type.STRING },
                rubrik: { type: Type.STRING }
              }
            }
          }
        }
      }
    }
  });

  if (!response.text) {
    throw new Error("Gagal memperoleh rubrik penilaian.");
  }

  const result = JSON.parse(response.text);
  return result.rubrikasi || [];
}

/**
 * Menghasilkan Perencanaan Kegiatan Kokurikuler berdasarkan Panduan Kokurikuler 2025.
 * Memanfaatkan Groq API ter-otasi.
 */
export async function generateKokurikuler(data: KokurikulerFormData): Promise<GeneratedKokurikuler> {
  const prompt = `
    Bertindaklah sebagai Ahli Kurikulum Merdeka, Konsultan Pendidikan Senior, dan Senior Instructional Designer yang ahli dalam menyusun Rencana Kegiatan Kokurikuler berdasarkan Panduan Kokurikuler Tahun 2025.
    Bantu saya menghasilkan dokumen "PERENCANAAN KEGIATAN KOKURIKULER" yang kreatif, terstruktur, mendalam, dan operasional.

    KONTEKS PANDUAN KOKURIKULER 2025:
    - 8 Dimensi Profil Lulusan terdiri dari: Keimanan dan Ketakwaan terhadap Tuhan Yang Maha Esa, Kewargaan, Penalaran Kritis, Kreativitas, Kolaborasi, Kemandirian, Kesehatan, dan Komunikasi.
    - Bentuk Kokurikuler dapat berupa: Pembelajaran kolaboratif lintas disiplin ilmu, 7 Kebiasaan Anak Indonesia Hebat (G7KAIH), atau cara lainnya.
    - Pilihan Tema Utama Kokurikuler antara lain: Generasi sehat dan bugar, Peduli dan berbagi, Aku cinta Indonesia, Hidup hemat dan produktif, Berkarya untuk sesama dan bangsa, atau Gaya hidup berkelanjutan.

    DATA INPUT:
    - Satuan Pendidikan: ${data.schoolName || "SD Negeri Kajulangko"}
    - Mata Pelajaran terkait: ${data.subject || "Tematik Terintegrasi"}
    - Bentuk Kokurikuler: ${data.bentukKokurikuler}
    - Tema Kokurikuler: ${data.theme}
    - Fokus Kegiatan Kokurikuler: ${data.fokusKegiatan}
    - Kelas/Fase: ${data.grade}
    - Alokasi Waktu: ${data.alokasiWaktu}
    - Dimensi Profil Lulusan yang Ditargetkan: ${data.dimensi.join(", ")}

    TUGAS UTAMA & ATURAN YANG SANGAT KETAT:
    1. Anda harus merumuskan modul kokurikuler ini secara utuh, detail, praktis, dan siap pakai. JANGAN gunakan teks placeholder atau tanda kurung siku seperti "[Masukkan di sini]".
    2. Istilah "murid" HARUS digunakan secara konsisten (DILARANG menggunakan istilah "siswa" atau "peserta didik").
    3. "Fokus Kegiatan Kokurikuler": Gunakan Fokus Kegiatan yang diisi oleh guru (${data.fokusKegiatan}) sebagai landasan utama dalam menyusun seluruh aktivitas kokurikuler agar bervariasi dan sangat relevan dengan topik yang ditentukan oleh guru. Pastikan fokus kegiatan ini dicantumkan tepat sesuai dengan input pengguna pada bagian "fokusKegiatan" di dalam objek "identitas".
    4. DETAIL INSTRUKSIONAL GURU (SANGAT PENTING): Khusus pada bagian "kegiatan" ("pendahuluan", "inti", "penutup"), Anda harus menjabarkan secara sangat lengkap, komprehensif, dan mendalam mengenai langkah-langkah konkrit apa saja yang harus dikerjakan dan dipandu oleh GURU agar alur kegiatannya jelas, sistematis, dan mudah dipraktikkan secara nyata di lapangan. Detailkan instruksi guru, pertanyaan pemantik, bentuk pemantauan kelompok, serta panduan refleksi secara eksplisit.
    5. Rancang setiap komponen perencanaan kegiatan kokurikuler berdasarkan Panduan Kokurikuler Tahun 2025:
       - **Dimensi Profil Lulusan**: Jabarkan dimensi lulusan yang dipilih (${data.dimensi.join(", ")}) beserta elemen dan sub-elemen terkait yang ingin dikembangkan secara nyata melalui kegiatan ini.
       - **Tujuan Pembelajaran**: Tuliskan minimal 3 Tujuan Pembelajaran Kokurikuler yang spesifik, terukur, berfokus pada pengembangan soft skills dan karakter, serta HARUS dirumuskan agar sangat sesuai dan selaras dengan Fokus Kegiatan (${data.fokusKegiatan}) dan terintegrasi secara harmonis dengan Mata Pelajaran Terkait/Terintegrasi (${data.subject || 'Tematik Terintegrasi'}) yang diisikan oleh guru di form. Jelas hubungkan kaitan kompetensi materi pelajaran dengan tema serta fokus kokurikuler tersebut.
       - **Produk yang dihasilkan**: Jabarkan produk nyata (dapat berupa karya, kampanye, laporan, purwarupa, portofolio, pameran, atau lainnya) yang akan dihasilkan oleh murid di akhir kegiatan.
       - **Praktik Pedagogis**: Deskripsikan pendekatan atau metode pembelajaran yang digunakan (seperti Pembelajaran Berbasis Proyek (PjBL), Inkuiri, Pembelajaran Berbasis Masalah (PBL), dll) secara terperinci dan bagaimana guru memandu murid.
       - **Lingkungan Belajar**: Jelaskan rancangan lingkungan belajar fisik, sosial, dan emosional yang kondusif, aman, inklusif, dan mendukung pengerjaan kokurikuler.
       - **Kemitraan Pembelajaran**: Jabarkan pelibatan pihak luar secara nyata (misal orang tua, komunitas lokal, narasumber ahli, puskesmas, petani, atau instansi terkait yang relevan).
       - **Pemanfaatan Digital**: Jabarkan penggunaan teknologi digital secara praktis dan bermakna untuk mendukung riset, pembuatan produk, kolaborasi, atau presentasi murid (misal platform Canva, Google Workspace, spreadsheet, video editor, dll).
       - **Kegiatan**: Uraikan seluruh langkah-langkah kegiatan secara utuh, sangat terperinci, komprehensif, operasional, dan siap praktik secara berurutan (Step-by-Step) dari awal hingga akhir kegiatan. 
          ATURAN KHUSUS (SANGAT PENTING):
          1. DILARANG KERAS membagi tulisan menjadi sub-bagian atau menyertakan heading/tulisan judul seperti "**Pendahuluan**", "**Inti**", atau "**Penutup**". HILANGKAN seluruh uraian judul-judul sub-fase tersebut dari isi kegiatan!
          2. Seluruh langkah-langkah kegiatan harus digabung ke dalam SATU daftar bernomor tunggal yang berurutan secara logis (1., 2., 3., dst. hingga selesai, misalnya dari nomor 1 s.d. 12).
          3. Setiap butir langkah kegiatan wajib diletakkan pada BARIS BARU tersendiri (dipisahkan oleh karakter baris baru '\n') sehingga nomor-nomornya tersusun rapi berurutan tegak lurus ke bawah. Jangan pernah menggabung atau menyambung butir nomor yang berbeda ke dalam satu paragraf!
          
          CONTOH STRUKTUR DAFTAR LANGKAH KEGIATAN:
          1. Guru menyampaikan secara jelas tujuan pembelajaran kokurikuler dan seluruh rangkaian aktivitas nyata yang akan dilakukan murid.
          2. Murid dibagi oleh guru menjadi beberapa kelompok secara heterogen untuk mendorong kolaborasi yang sehat.
          3. Murid diminta memirsa media/video pemantik atau mendengarkan penjelasan awal guru mengenai topik yang diangkat.
          4. Murid dan guru melakukan diskusi interaktif untuk mengaitkan isi video/media tersebut dengan kondisi nyata yang ada di lingkungan sekitar satuan pendidikan.
          5. Murid melakukan kunjungan langsung atau observasi ke lingkungan sekitar satuan pendidikan untuk mengamati kondisi riil dan mendata objek/fenomena terkait.
          6. Murid berdiskusi aktif di dalam kelompok masing-masing mengenai kondisi lapangan yang ditemui serta mengidentifikasi permasalahan spesifik yang ada.
          7. Murid mengumpulkan data pendukung secara mendalam tentang alternatif solusi yang mungkin diterapkan untuk mengatasi permasalahan tersebut.
          8. Murid merancang draf solusi atau gagasan inovatif terhadap permasalahan yang telah diidentifikasi bersama kelompoknya.
          9. Murid membuat karya nyata (dapat berupa poster, maket, produk fisik, atau media kampanye digital) sebagai bentuk solusi konkrit terhadap permasalahan tersebut menggunakan berbagai media kreatif.
          10. Murid mempresentasikan hasil karya solusi kelompok mereka di hadapan teman-temannya secara bergiliran menggunakan berbagai media interaktif.
          11. Guru dan murid melakukan refleksi mendalam bersama-sama atas seluruh rangkaian aktivitas belajar dan keberhasilan kolaborasi kelompok yang telah dilalui.
          12. Murid bersama guru merumuskan dan menyepakati sebuah kesepakatan tindakan konkret yang akan dipraktikkan bersama pasca-proyek untuk memecahkan masalah atau mengembangkan nilai karakter tersebut secara berkelanjutan.
       
  **Asesmen**:
         * Buat tabel "asesmenTable" berisi Jenis Asesmen Formatif dan Sumatif beserta Bentuk (misal: Observasi, Jurnal, Penilaian Diri, Portofolio, Penilaian Antarteman, dll) dan Instrumen (misal: Lembar Rubrik, Lembar Ceklis, Kuesioner, dll).
         * Buat tabel "formatifRubricTable" yang berisi rubrik penilaian formatif dengan ketentuan: Anda HARUS membuat tepat satu baris rubrik penilaian untuk SETIAP Dimensi Profil Lulusan yang dipilih oleh guru secara lengkap tanpa ada yang terlewat. Jika guru memilih 5 dimensi, maka buatlah tepat 5 baris (satu baris untuk setiap dimensi secara berurutan). Kolom yang harus ada: "dimensi" (HARUS diisi nama dimensi yang dipilih secara lengkap dan persis dari: ${data.dimensi.join(", ")}), "aspek" (Aspek Yang dinilai), "sangatBaik" (kriteria Sangat Baik), "baik" (kriteria Baik), "cukup" (kriteria Cukup), "kurang" (kriteria Kurang).
         * Buat tabel "sumatifRubricTable" yang berisi rubrik penilaian sumatif dengan kolom: Aspek (aspek produk/kinerja akhir), kriteria untuk Skor 4 (Sangat Baik), Skor 3 (Baik), Skor 2 (Cukup), dan Skor 1 (Perlu Bimbingan). Tuliskan minimal 3 baris aspek penilaian.

    OUTPUT HARUS DALAM BAHASA INDONESIA YANG BAIK DAN BENAR (Ejaan yang Disempurnakan).
    Format output harus valid JSON objek tanpa ada teks tambahan lain sebelum dan sesudah json. Harus bisa diparsing menggunakan JSON.parse() dengan skema:
    {
      "identitas": {
        "schoolName": "...",
        "subject": "...",
        "bentukKokurikuler": "...",
        "theme": "...",
        "fokusKegiatan": "...",
        "grade": "...",
        "alokasiWaktu": "..."
      },
      "dimensiProfilLulusan": "...",
      "tujuanPembelajaran": "...",
      "produkDihasilkan": "...",
      "praktikPedagogis": "...",
      "lingkunganBelajar": "...",
      "kemitraanPembelajaran": "...",
      "pemanfaatanDigital": "...",
      "kegiatan": "1. ...\n2. ...\n3. ...",
      "asesmenTable": [
        { "jenis": "Formatif", "bentuk": "...", "instrumen": "..." },
        { "jenis": "Sumatif", "bentuk": "...", "instrumen": "..." }
      ],
      "formatifRubricTable": [
        { "dimensi": "...", "aspek": "...", "sangatBaik": "...", "baik": "...", "cukup": "...", "kurang": "..." },
        { "dimensi": "...", "aspek": "...", "sangatBaik": "...", "baik": "...", "cukup": "...", "kurang": "..." },
        { "dimensi": "...", "aspek": "...", "sangatBaik": "...", "baik": "...", "cukup": "...", "kurang": "..." }
      ],
      "sumatifRubricTable": [
        { "aspek": "...", "skor4": "...", "skor3": "...", "skor2": "...", "skor1": "..." },
        { "aspek": "...", "skor4": "...", "skor3": "...", "skor2": "...", "skor1": "..." },
        { "aspek": "...", "skor4": "...", "skor3": "...", "skor2": "...", "skor1": "..." }
      ]
    }
  `;

  console.log("[AI WORKFLOW] Memulai pembuatan Modul Kokurikuler dengan rotasi Groq API...");
  const contentText = await callGroqDirectly(prompt);
  let parsedResult: any;
  try {
    parsedResult = JSON.parse(contentText);
  } catch (err) {
    // Clean up markdown block wrapping if present
    const cleanContent = contentText.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
    parsedResult = JSON.parse(cleanContent);
  }

  // FORCE exact form inputs onto the parsed results to ensure data fidelity
  if (!parsedResult.identitas) {
    parsedResult.identitas = {};
  }
  parsedResult.identitas.schoolName = data.schoolName || parsedResult.identitas.schoolName || "SD Negeri Kajulangko";
  parsedResult.identitas.subject = data.subject || parsedResult.identitas.subject || "Tematik Terintegrasi";
  parsedResult.identitas.bentukKokurikuler = data.bentukKokurikuler || parsedResult.identitas.bentukKokurikuler || "Pembelajaran kolaboratif lintas disiplin ilmu";
  parsedResult.identitas.theme = data.theme || parsedResult.identitas.theme || "Generasi sehat dan bugar";
  parsedResult.identitas.grade = data.grade || parsedResult.identitas.grade || "Kelas 4";
  parsedResult.identitas.alokasiWaktu = data.alokasiWaktu || parsedResult.identitas.alokasiWaktu || "18 JP";

  // If focusKegiatan was generated blank or placeholder, fallback to a solid title
  if (!parsedResult.identitas.fokusKegiatan || parsedResult.identitas.fokusKegiatan.trim() === "" || parsedResult.identitas.fokusKegiatan.includes("...")) {
    parsedResult.identitas.fokusKegiatan = `Pengembangan Karakter berbasis Tema ${data.theme}`;
  }

  // Force formatifRubricTable's "dimensi" to match the user's selected "data.dimensi" exactly
  if (data.dimensi && data.dimensi.length > 0) {
    const formattedRows: any[] = [];
    const usedDimensions = new Set<string>();

    // 1. Process existing rows and try to map them to unique selected dimensions
    if (Array.isArray(parsedResult.formatifRubricTable)) {
      parsedResult.formatifRubricTable.forEach((row: any) => {
        if (!row) return;
        const currentDimensi = row.dimensi || "";
        // Find a matching selected dimension that hasn't been used yet
        const matched = data.dimensi.find(d => 
          !usedDimensions.has(d) && (
            currentDimensi.toLowerCase().includes(d.toLowerCase()) || 
            d.toLowerCase().includes(currentDimensi.toLowerCase())
          )
        );

        if (matched) {
          formattedRows.push({
            ...row,
            dimensi: matched
          });
          usedDimensions.add(matched);
        } else {
          // Keep the row, we'll match it to any remaining dimension later
          formattedRows.push(row);
        }
      });
    }

    // 2. Identify remaining dimensions that don't have a row yet
    const remainingDimensions = data.dimensi.filter(d => !usedDimensions.has(d));

    // 3. For any rows that weren't matched in step 1, match them to remaining dimensions
    formattedRows.forEach((row: any) => {
      if (row && (!row.dimensi || !data.dimensi.includes(row.dimensi))) {
        if (remainingDimensions.length > 0) {
          const nextDim = remainingDimensions.shift()!;
          row.dimensi = nextDim;
          usedDimensions.add(nextDim);
        }
      }
    });

    // 4. If we still have remaining dimensions, generate high-quality relevant rows for each missing dimension
    while (remainingDimensions.length > 0) {
      const missingDim = remainingDimensions.shift()!;
      let aspek = "Penerapan nilai " + missingDim;
      let sangatBaik = `Murid sangat aktif, konsisten, dan mandiri dalam mengimplementasikan nilai ${missingDim} sepanjang seluruh rangkaian kegiatan kokurikuler.`;
      let baik = `Murid aktif, konsisten, dan menunjukkan kemandirian dalam mengimplementasikan nilai ${missingDim} pada sebagian besar kegiatan kokurikuler.`;
      let cukup = `Murid mulai dapat mengimplementasikan nilai ${missingDim} meskipun terkadang masih perlu diingatkan oleh guru.`;
      let kurang = `Murid masih memerlukan bimbingan intensif dan pengawasan guru untuk mengimplementasikan nilai ${missingDim} dalam kegiatan kokurikuler.`;

      const lowerDim = missingDim.toLowerCase();
      if (lowerDim.includes("iman") || lowerDim.includes("takwa") || lowerDim.includes("akhlak")) {
        aspek = "Penerapan nilai keimanan, ketakwaan, dan akhlak mulia";
        sangatBaik = "Murid secara konsisten dan sadar menunjukkan perilaku berakhlak mulia, berdoa dengan khidmat, dan menghormati sesama sepanjang kegiatan.";
        baik = "Murid menunjukkan perilaku berakhlak mulia, berdoa dengan tertib, dan menghormati sesama pada sebagian besar kegiatan.";
        cukup = "Murid mulai menunjukkan perilaku berakhlak mulia dan berdoa dengan tertib, meskipun sesekali perlu diingatkan.";
        kurang = "Murid masih perlu bimbingan intensif dalam membiasakan perilaku berakhlak mulia dan berdoa dengan tertib.";
      } else if (lowerDim.includes("mandiri")) {
        aspek = "Kemandirian dan tanggung jawab pribadi";
        sangatBaik = "Murid menunjukkan inisiatif tinggi, mampu mengatur waktu belajar mandiri, dan menyelesaikan tugasnya dengan sangat bertanggung jawab tanpa perlu diingatkan.";
        baik = "Murid mampu menyelesaikan tugas secara mandiri dan bertanggung jawab pada sebagian besar aktivitas belajar.";
        cukup = "Murid menunjukkan usaha mandiri dalam menyelesaikan tugas, namun masih membutuhkan arahan di beberapa bagian.";
        kurang = "Murid masih sangat bergantung pada petunjuk dan dorongan guru untuk menyelesaikan tugas kegiatannya.";
      } else if (lowerDim.includes("gotong") || lowerDim.includes("kolaborasi") || lowerDim.includes("kerjasama")) {
        aspek = "Kolaborasi dan gotong royong dalam tim";
        sangatBaik = "Murid berkolaborasi secara luar biasa, aktif membantu anggota kelompok, berbagi peran secara adil, dan menghargai semua perbedaan pendapat.";
        baik = "Murid berkolaborasi dengan baik dalam kelompok, aktif berdiskusi, dan menyelesaikan bagian tugasnya secara bertanggung jawab.";
        cukup = "Murid cukup berpartisipasi dalam diskusi kelompok, namun sesekali masih pasif atau bekerja sendiri.";
        kurang = "Murid kurang menunjukkan partisipasi atau kerja sama dalam kelompok dan perlu bimbingan khusus untuk berkolaborasi.";
      } else if (lowerDim.includes("kreatif")) {
        aspek = "Kreativitas dan pengembangan gagasan orisinal";
        sangatBaik = "Murid mampu melahirkan ide-ide baru yang orisinal, sangat variatif, serta mewujudkannya dalam bentuk karya solusi yang sangat kreatif dan aplikatif.";
        baik = "Murid mampu menyusun ide orisinal dan mewujudkannya dalam bentuk karya yang menarik dan sesuai dengan tujuan.";
        cukup = "Murid mulai menunjukkan kreativitas dengan memodifikasi ide yang sudah ada dalam pembuatan karya.";
        kurang = "Murid belum menunjukkan kreativitas dan memerlukan panduan penuh untuk menuangkan ide ke dalam karya.";
      } else if (lowerDim.includes("kritis")) {
        aspek = "Bernalar kritis dalam pemecahan masalah";
        sangatBaik = "Murid secara mendalam menganalisis data, mengajukan pertanyaan kritis yang berbobot, serta mengidentifikasi alternatif solusi secara logis dan tajam.";
        baik = "Murid mampu menganalisis informasi dengan baik, membedakan fakta, dan merumuskan kesimpulan atau solusi yang masuk akal.";
        cukup = "Murid mulai menunjukkan kemampuan berpikir kritis dengan mengidentifikasi masalah dasar, namun analisisnya belum mendalam.";
        kurang = "Murid kesulitan mengidentifikasi masalah dasar dan membutuhkan bimbingan bertahap untuk menganalisis informasi.";
      } else if (lowerDim.includes("kebinekaan") || lowerDim.includes("global")) {
        aspek = "Mengenal dan menghargai keragaman (Kebinekaan Global)";
        sangatBaik = "Murid menunjukkan sikap keterbukaan yang luar biasa, aktif menghormati perbedaan latar belakang, budaya, dan pendapat dalam seluruh interaksi.";
        baik = "Murid menunjukkan sikap menghargai perbedaan budaya, pendapat, dan latar belakang kelompok dengan baik selama kegiatan.";
        cukup = "Murid mulai menunjukkan sikap inklusif dan menghargai keragaman, meskipun terkadang masih memilih-milih teman.";
        kurang = "Murid belum membiasakan sikap toleransi atau menghargai keragaman dalam interaksi kelompok.";
      }

      formattedRows.push({
        dimensi: missingDim,
        aspek,
        sangatBaik,
        baik,
        cukup,
        kurang
      });
    }

    parsedResult.formatifRubricTable = formattedRows.filter(row => row && row.dimensi);
  }

  // Ganti semua sebutan "peserta didik" dengan "murid" secara rekursif
  const replaceText = (text: string): string => {
    if (typeof text !== 'string') return text;
    return text
      .replace(/PESERTA DIDIK/g, 'MURID')
      .replace(/Peserta Didik/g, 'Murid')
      .replace(/Peserta didik/g, 'Murid')
      .replace(/peserta Didik/g, 'murid')
      .replace(/peserta didik/g, 'murid');
  };

  const deepReplace = (obj: any): any => {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'string') {
      return replaceText(obj);
    }
    if (Array.isArray(obj)) {
      return obj.map(item => deepReplace(item));
    }
    if (typeof obj === 'object') {
      const res: any = {};
      for (const key of Object.keys(obj)) {
        res[key] = deepReplace(obj[key]);
      }
      return res;
    }
    return obj;
  };

  return deepReplace(parsedResult);
}
