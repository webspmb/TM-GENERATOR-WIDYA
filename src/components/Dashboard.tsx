import { motion } from 'motion/react';
import { 
  Sparkles, 
  FileText, 
  Layers, 
  ClipboardCheck, 
  BookOpen, 
  CheckCircle, 
  ArrowRight, 
  Zap, 
  HelpCircle, 
  User, 
  Clock, 
  LayoutDashboard
} from 'lucide-react';
import { useState, useEffect } from 'react';

interface DashboardProps {
  profileName: string;
  hasMainData: boolean;
  hasModul: boolean;
  hasAsesmen: boolean;
  hasKokurikuler?: boolean;
  onNavigateMenu: (menu: 'data' | 'modul' | 'asesmen' | 'kokurikuler') => void;
}

export default function Dashboard({ 
  profileName, 
  hasMainData, 
  hasModul, 
  hasAsesmen, 
  hasKokurikuler = false,
  onNavigateMenu 
}: DashboardProps) {
  const [greeting, setGreeting] = useState('Selamat Datang');
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const hrs = new Date().getHours();
    if (hrs < 11) {
      setGreeting('Selamat Pagi');
    } else if (hrs < 15) {
      setGreeting('Selamat Siang');
    } else if (hrs < 18) {
      setGreeting('Selamat Sore');
    } else {
      setGreeting('Selamat Malam');
    }

    const getTzSuffix = (date: Date): string => {
      // Get offset in hours
      const offsetHours = -date.getTimezoneOffset() / 60;
      if (offsetHours === 7) return 'WIB';
      if (offsetHours === 8) return 'WITA';
      if (offsetHours === 9) return 'WIT';

      try {
        const tzName = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (tzName.includes('Jakarta') || tzName.includes('Bangkok') || tzName.includes('Saigon')) {
          return 'WIB';
        } else if (tzName.includes('Makassar') || tzName.includes('Singapore') || tzName.includes('Kuala_Lumpur') || tzName.includes('Manila') || tzName.includes('Taipei') || tzName.includes('Hong_Kong')) {
          return 'WITA';
        } else if (tzName.includes('Jayapura') || tzName.includes('Tokyo') || tzName.includes('Seoul')) {
          return 'WIT';
        }

        // Alternative check of timeZoneName properties in modern browser
        const parts = Intl.DateTimeFormat('id-ID', { timeZoneName: 'short' }).formatToParts(date);
        const namePart = parts.find(p => p.type === 'timeZoneName');
        if (namePart && namePart.value) {
          return namePart.value.toUpperCase();
        }
      } catch (err) {
        // Fallback below
      }

      const sign = offsetHours >= 0 ? '+' : '';
      return `GMT${sign}${offsetHours}`;
    };

    const interval = setInterval(() => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' ' + getTzSuffix(now));
    }, 1000);

    const now = new Date();
    setTimeStr(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' ' + getTzSuffix(now));

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8">
      {/* Welcome Banner Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-800 via-green-800/90 to-amber-700/25 p-8 md:p-10 text-white shadow-xl border border-emerald-800/20"
      >
        {/* Background Visual Flair */}
        <div className="absolute right-0 top-0 -mt-12 -mr-12 w-72 h-72 rounded-full bg-yellow-400/10 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 -mb-16 w-80 h-80 rounded-full bg-orange-400/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/25 text-yellow-200 text-[10px] font-bold tracking-widest uppercase">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Ruang Pendidik Cipta Ajar
            </div>
            
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white drop-shadow-sm">
              {greeting}, Bapak/Ibu {profileName}!
            </h2>
            
            <p className="text-emerald-50/90 text-sm max-w-2xl leading-relaxed font-normal">
              Selamat datang di asisten digital penyusunan perangkat ajar terintegrasi Kurikulum Merdeka. 
              Platform ini dirancang khusus untuk membantu pendidik menyelaraskan RPPM / Modul Ajar, 
              serta Asesmen interaktif online & cetak secara otomatis, cerdas, dan efisien.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex flex-col items-center justify-center min-w-[140px] text-center self-start md:self-center shrink-0">
            <Clock className="w-6 h-6 text-amber-300 mb-1" />
            <span className="text-[10px] text-yellow-100 tracking-wider font-bold">WAKTU AKTIF</span>
            <span className="text-xl font-bold font-mono tracking-tight text-white mt-1">{timeStr}</span>
          </div>
        </div>
      </motion.div>

      {/* Overview & Quick Stats Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Stat 1: Identitas */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onClick={() => onNavigateMenu('data')}
          className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm hover:shadow-md hover:border-slate-305 transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">ID Satuan Pendidikan</span>
            <span className="font-extrabold text-sm text-slate-800">1. Data Utama</span>
            <div className="flex items-center gap-1.5 mt-2">
              <span className={`w-2 h-2 rounded-full ${hasMainData ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              <span className="text-[10px] font-bold text-slate-500">
                {hasMainData ? 'Terisi & Siap' : 'Belum Lengkap'}
              </span>
            </div>
          </div>
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${hasMainData ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'}`}>
            <FileText className="w-5 h-5" />
          </div>
        </motion.div>

        {/* Stat 2: Modul */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          onClick={() => onNavigateMenu('modul')}
          className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm hover:shadow-md hover:border-slate-305 transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Struktur Pembelajaran</span>
            <span className="font-extrabold text-sm text-slate-800">2. Modul & RPPM</span>
            <div className="flex items-center gap-1.5 mt-2">
              <span className={`w-2 h-2 rounded-full ${hasModul ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
              <span className="text-[10px] font-bold text-slate-500">
                {hasModul ? 'Modul Aktif' : 'Belum Tersusun'}
              </span>
            </div>
          </div>
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${hasModul ? 'bg-blue-50 text-blue-700' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'}`}>
            <Layers className="w-5 h-5" />
          </div>
        </motion.div>

        {/* Stat 3: Asesmen */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onClick={() => onNavigateMenu('asesmen')}
          className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm hover:shadow-md hover:border-slate-305 transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Kisi, Kunci & Rubrik</span>
            <span className="font-extrabold text-sm text-slate-800">3. Kisi & Asesmen</span>
            <div className="flex items-center gap-1.5 mt-2">
              <span className={`w-2 h-2 rounded-full ${hasAsesmen ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
              <span className="text-[10px] font-bold text-slate-500">
                {hasAsesmen ? 'Soal Tersedia' : 'Belum Dibuat'}
              </span>
            </div>
          </div>
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${hasAsesmen ? 'bg-teal-50 text-teal-700' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'}`}>
            <ClipboardCheck className="w-5 h-5" />
          </div>
        </motion.div>

        {/* Stat 4: Kokurikuler */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.23 }}
          onClick={() => onNavigateMenu('kokurikuler')}
          className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm hover:shadow-md hover:border-slate-305 transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">P5 & Kokurikuler</span>
            <span className="font-extrabold text-sm text-slate-800">4. Kokurikuler</span>
            <div className="flex items-center gap-1.5 mt-2">
              <span className={`w-2 h-2 rounded-full ${hasKokurikuler ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
              <span className="text-[10px] font-bold text-slate-500">
                {hasKokurikuler ? 'Tersusun' : 'Belum Dibuat'}
              </span>
            </div>
          </div>
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${hasKokurikuler ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'}`}>
            <ClipboardCheck className="w-5 h-5" />
          </div>
        </motion.div>

        {/* Stat 5: Cloud Status */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Mode Database</span>
            <span className="font-extrabold text-sm text-slate-800">Sinkronisasi Cloud</span>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-bold text-emerald-600">Terbuka & Aktif</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Zap className="w-5 h-5 animate-bounce" />
          </div>
        </motion.div>
      </div>

      {/* Main Workflow & Short Description Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Step-by-Step Interactive Guide */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 md:p-8 border border-slate-200/70 shadow-sm space-y-6">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-orange-100 rounded-xl text-orange-900">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-lg">Tahapan Penyusunan Dokumen Ajar</h3>
              <p className="text-xs text-slate-500">Ikuti langkah-langkah terstruktur di bawah ini secara runut:</p>
            </div>
          </div>

          <div className="relative border-l-2 border-slate-100 pl-6 ml-4 py-1 space-y-8">
            {/* Step 1 */}
            <div className="relative">
              <span className={`absolute -left-10 top-0.5 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ring-4 ring-white ${hasMainData ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {hasMainData ? <CheckCircle className="w-4 h-4 shrink-0" /> : '1'}
              </span>
              <div className="space-y-1.5">
                <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                  Langkah 1: Lengkapi Data Utama (Identitas)
                </h4>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Isi data satuan pendidikan, guru pendidik, mata pelajaran, NIP, serta isian materi pokok bahan ajar. Data ini akan menjadi pilar utama serta referensi dinamis yang terhubung langsung pada pembuatan modul maupun asesmen.
                </p>
                <button
                  onClick={() => onNavigateMenu('data')}
                  className="text-xs font-bold text-orange-600 hover:text-orange-800 flex items-center gap-1 pt-1 cursor-pointer transition-colors"
                >
                  Buka Data Utama <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <span className={`absolute -left-10 top-0.5 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ring-4 ring-white ${hasModul ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {hasModul ? <CheckCircle className="w-4 h-4 shrink-0" /> : '2'}
              </span>
              <div className="space-y-1.5">
                <h4 className="font-extrabold text-slate-800 text-sm">
                  Langkah 2: Susun Rencana Pembelajaran & Modul Ajar
                </h4>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Definisikan modul sesi ajar yang diinginkan, pilih durasi pengerjaan, model pedagogi, materi pokok kognitif, serta dimensi pelajar pancasila. Sistem Artificial Intelligence kami akan merumuskan draf modul ajar secara dinamis.
                </p>
                <button
                  onClick={() => {
                    onNavigateMenu('modul');
                  }}
                  className="text-xs font-bold text-amber-600 hover:text-amber-800 flex items-center gap-1 pt-1 cursor-pointer transition-colors"
                >
                  Susun Modul <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <span className={`absolute -left-10 top-0.5 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ring-4 ring-white ${hasAsesmen ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {hasAsesmen ? <CheckCircle className="w-4 h-4 shrink-0" /> : '3'}
              </span>
              <div className="space-y-1.5">
                <h4 className="font-extrabold text-slate-800 text-sm">
                  Langkah 3: Rancang Asesmen & Ujian Siswa (QR Code)
                </h4>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Generate kisi-kisi soal (LOTS, MOTS, HOTS), kunci jawaban terstandar, rubrik nilai terstruktur, serta format naskah soal. Dari sini, Anda juga dapat mengaktifkan **Layanan Ujian Online** siswa dengan QR code yang siap dipindai untuk pengerjaan murni mandiri.
                </p>
                <button
                  onClick={() => onNavigateMenu('asesmen')}
                  className="text-xs font-bold text-green-600 hover:text-green-800 flex items-center gap-1 pt-1 cursor-pointer transition-colors"
                >
                  Buat Asesmen Soal <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Step 4 */}
            <div className="relative">
              <span className={`absolute -left-10 top-0.5 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ring-4 ring-white ${hasKokurikuler ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {hasKokurikuler ? <CheckCircle className="w-4 h-4 shrink-0" /> : '4'}
              </span>
              <div className="space-y-1.5">
                <h4 className="font-extrabold text-slate-800 text-sm">
                  Langkah 4: Rancang Modul Kokurikuler (Panduan 2025)
                </h4>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Definisikan dan susun perencanaan kegiatan Kokurikuler & Projek Penguatan Profil Pelajar Pancasila (P5) yang berpusat pada murid berdasarkan Panduan Kokurikuler Terbaru Tahun 2025.
                </p>
                <button
                  onClick={() => onNavigateMenu('kokurikuler')}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1 pt-1 cursor-pointer transition-colors"
                >
                  Susun Modul Kokurikuler <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Professional Tips & Educational Corner */}
        <div className="lg:col-span-5 space-y-6">
          {/* Quick Guide Card */}
          <div className="bg-gradient-to-br from-orange-50/70 via-amber-50/40 to-green-50/50 rounded-3xl p-6 border border-orange-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-orange-900">
              <BookOpen className="w-5 h-5 shrink-0" />
              <h3 className="font-extrabold text-sm tracking-tight">Kelebihan Cipta Ajar Suit Pro</h3>
            </div>
            
            <p className="text-slate-700 text-xs leading-relaxed">
              Platform Cipta Ajar dibangun khusus menggunakan pilar kemudahan asesmen:
            </p>

            <ul className="space-y-3.5 text-xs text-slate-700">
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 shrink-0"></span>
                <span><strong>Sinkronisasi Instan:</strong> Identitas dan materi yang Anda masukkan di Data Utama secara otomatis tersinkronisasi ke draft modul ajar dan kisi asesmen.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 shrink-0"></span>
                <span><strong>Bank Soal Otomatis:</strong> Generator menyusun sebaran variasi soal kognitif (Pilihan Ganda, PG Kompleks, Isian, Benar/Salah, Menjodohkan, Uraian) terstruktur.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 shrink-0"></span>
                <span><strong>Evaluasi QR Code & Online:</strong> Sediakan QR code agar murid Anda dapat langsung memindai dengan smartphone / tablet untuk memulai pengerjaan online. Simpan naskah PDF dengan instan.</span>
              </li>
            </ul>
          </div>

          {/* Tips Guru Profesional */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/70 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-green-800">
              <Sparkles className="w-4 h-4 shrink-0" />
              <h3 className="font-extrabold text-sm tracking-tight">Kiat Praktis Pendidik</h3>
            </div>
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-100 text-slate-700 text-xs leading-relaxed">
              <p className="font-bold text-amber-900 mb-1 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-amber-600" /> Apakah Anda tahu?
              </p>
              Dengan menambahkan materi gambar di lampiran soal ujian, murid akan jauh lebih mudah memvisualisasikan korelasi soal cerita. Di Cipta Ajar, gambar soal secara cerdas diintegrasikan langsung pada platform pengerjaan interaktif online maupun PDF!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
