import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, PenTool, User, Star, Sparkles, X, Palette, Info } from 'lucide-react';

interface LogoPhilosophyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LogoPhilosophyModal({ isOpen, onClose }: LogoPhilosophyModalProps) {
  if (!isOpen) return null;

  const elements = [
    {
      id: "elem-c",
      number: "1",
      title: 'Huruf "C"',
      icon: <span className="text-2xl font-black font-sans text-blue-900 select-none">C</span>,
      desc: 'Bentuk lengkung besar menyerupai huruf C melambangkan identitas utama CiptaAjar.',
      points: [
        'Creativity (Kreativitas) dalam menyusun modul ajar.',
        'Continuous Learning atau proses belajar yang terus berkembang.',
        'Perlindungan dan dukungan aplikasi terhadap guru dalam proses mengajar.'
      ],
      color: 'bg-blue-50 border-blue-200 text-blue-950'
    },
    {
      id: "elem-buku",
      number: "2",
      title: 'Buku Terbuka',
      icon: <BookOpen className="w-6 h-6 text-emerald-600" />,
      desc: 'Ikon buku terbuka melambangkan keterbukaan terhadap ide, inovasi, dan perkembangan:',
      points: [
        'Sumber ilmu pengetahuan yang tak terbatas.',
        'Modul ajar dan perangkat pembelajaran terstruktur.',
        'Membantu guru menciptakan pembelajaran yang lebih mudah dipahami.'
      ],
      color: 'bg-emerald-50 border-emerald-200 text-emerald-950'
    },
    {
      id: "elem-pensil",
      number: "3",
      title: 'Pensil',
      icon: <PenTool className="w-6 h-6 text-amber-500" />,
      desc: 'Pensil di tengah logo menjadi simbol produktivitas dan kreativitas guru:',
      points: [
        'Kreativitas dalam merancang berbagai aktivitas pembelajaran.',
        'Proses menyusun modul, soal asesmen, dan perangkat ajar dari nol.',
        'Menunjukkan bahwa guru adalah pusat utama dari proses pendidikan.'
      ],
      color: 'bg-amber-50 border-amber-200 text-amber-950'
    },
    {
      id: "elem-manusia",
      number: "4",
      title: 'Figur Manusia',
      icon: <User className="w-6 h-6 text-teal-600" />,
      desc: 'Siluet manusia aktif melambangkan interaksi dan pertumbuhan dinamis:',
      points: [
        'Guru yang aktif, kreatif, inovatif, dan berjiwa inspiratif.',
        'Semangat pertumbuhan dan perkembangan kompetensi peserta didik.',
        'Sinergi dan kolaborasi erat antara teknologi dan tenaga pendidik.'
      ],
      color: 'bg-teal-50 border-teal-200 text-teal-950'
    },
    {
      id: "elem-bintang",
      number: "5",
      title: 'Bintang',
      icon: <Star className="w-6 h-6 text-amber-400 fill-amber-400" />,
      desc: 'Bintang kecil di bagian atas melambangkan pencapaian orientasi masa depan:',
      points: [
        'Masa depan sukses yang cerah untuk tiap kelas.',
        'Prestasi tinggi dan peningkatan kualitas pendidikan nasional.',
        'Inspirasi serta pencapaian tujuan belajar yang dirancang.'
      ],
      color: 'bg-yellow-50 border-yellow-200 text-yellow-950'
    }
  ];

  const colors = [
    {
      id: "col-biru",
      name: 'Biru',
      meaning: 'Kepercayaan, profesionalisme, serta ketangguhan teknologi pendidikan modern.',
      class: 'bg-blue-600'
    },
    {
      id: "col-hijau",
      name: 'Hijau',
      meaning: 'Pertumbuhan berkelanjutan, inovasi tanpa henti, dan semangat belajar mendalam.',
      class: 'bg-emerald-600'
    },
    {
      id: "col-emas",
      name: 'Kuning / Emas',
      meaning: 'Kreativitas tinggi, ide-ide cemerlang, dan optimisme menyambut masa depan.',
      class: 'bg-amber-400'
    }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
      />

      {/* Modal Card content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative bg-white w-full max-w-4xl max-h-[85vh] overflow-y-auto rounded-3xl shadow-2xl border border-slate-100 flex flex-col no-print"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md px-6 py-5 border-b border-slate-100 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-900 to-teal-800 text-white flex items-center justify-center shadow-md">
              <Info className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Makna & Filosofi Logo CiptaAjar</h3>
              <p className="text-xs text-slate-500">Filosofi yang terhubung untuk masa depan pendidikan inovatif</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors border border-slate-100 cursor-pointer text-slate-400 hover:text-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 space-y-8 overflow-y-visible">
          {/* Tagline section */}
          <div className="bg-gradient-to-r from-blue-500/10 via-teal-500/5 to-transparent p-5 rounded-2xl border border-blue-100">
            <p className="text-sm text-slate-700 leading-relaxed font-medium">
              Logo <span className="font-bold text-blue-900">CiptaAjar</span> dirancang untuk merepresentasikan semangat inovasi pendidikan, kreativitas guru, serta kemudahan dalam merancang pembelajaran dan asesmen modern. Setiap elemen memiliki filosofi yang saling terhubung untuk menggambarkan visi utama aplikasi.
            </p>
          </div>

          {/* Elements Grid */}
          <div className="space-y-4">
            <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-600" />
              Elemen Visual Logo
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {elements.map((el) => (
                <div 
                  key={el.id}
                  className={`p-5 rounded-2xl border transition-all hover:shadow-md duration-300 flex flex-col justify-between ${el.color}`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-11 h-11 rounded-xl bg-white shadow-sm flex items-center justify-center border border-slate-100 font-bold">
                        {el.icon}
                      </div>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-white/60 border border-black/5 text-slate-700">
                        Elemen {el.number}
                      </span>
                    </div>
                    <h5 className="font-bold text-slate-900 text-sm mb-1">{el.title}</h5>
                    <p className="text-xs text-slate-600 leading-relaxed mb-3">{el.desc}</p>
                  </div>
                  
                  <ul className="space-y-1.5 border-t border-slate-900/5 pt-2.5">
                    {el.points.map((p, idx) => (
                      <li key={idx} className="text-[11px] text-slate-700 flex items-start gap-1 leading-snug">
                        <span className="text-slate-400 mt-0.5">•</span>
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              {/* Slogan card */}
              <div className="p-5 rounded-2xl border border-dashed border-teal-300 bg-gradient-to-b from-teal-50/50 to-emerald-50/20 flex flex-col justify-center items-center text-center">
                <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center mb-3">
                  <Sparkles className="w-6 h-6 text-teal-600 animate-spin-slow" />
                </div>
                <h5 className="font-extrabold text-teal-900 text-xs uppercase tracking-widest mb-1">Motto Utama</h5>
                <p className="text-sm font-extrabold text-teal-950 italic px-4">
                  “Mudahnya Merancang Masa Depan Kelas.”
                </p>
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Color Section */}
          <div className="space-y-4">
            <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Palette className="w-4 h-4 text-blue-800" />
              Filosofi Warna Logo
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {colors.map((c) => (
                <div 
                  key={c.id}
                  className="p-4 rounded-xl border border-slate-150 flex items-center gap-3 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                >
                  <div className={`w-8 h-8 rounded-full shadow-inner shrink-0 ${c.class}`} />
                  <div>
                    <h5 className="font-bold text-slate-900 text-xs">{c.name}</h5>
                    <p className="text-[11px] text-slate-600 leading-relaxed">{c.meaning}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-100 px-6 py-4 flex justify-between items-center z-10 text-[10px] text-slate-500 font-medium">
          <span>CiptaAjar Suit • Platform Generator Kurikulum Merdeka</span>
          <button
            onClick={onClose}
            className="bg-blue-900 hover:bg-blue-950 text-white font-bold px-4 py-2 rounded-lg leading-none cursor-pointer transition-colors"
          >
            Tutup Informasi
          </button>
        </div>
      </motion.div>
    </div>
  );
}
