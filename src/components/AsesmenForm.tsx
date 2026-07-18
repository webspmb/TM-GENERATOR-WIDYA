import { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Minus, Send, ClipboardCheck, Sparkles, AlertCircle } from 'lucide-react';
import { AsesmenConfig, ModulFormData } from '../types';
import { cn } from '../lib/utils';

interface AsesmenFormProps {
  onSubmit: (config: AsesmenConfig) => void;
  isLoading: boolean;
  savedConfig?: AsesmenConfig | null;
  formData: ModulFormData;
}

export default function AsesmenForm({ onSubmit, isLoading, savedConfig, formData }: AsesmenFormProps) {
  const [config, setConfig] = useState<AsesmenConfig>(() => {
    return savedConfig || {
      pgCount: 5,
      pgkCount: 2,
      isianCount: 5,
      uraianCount: 2,
      bsCount: 5,
      menjodohkanCount: 3,
      pgOptionsCount: 4,
      levelKognitif: ['LOTS', 'MOTS', 'HOTS'],
      jenisAsesmen: 'Asesmen Sumatif'
    };
  });

  const updateCount = (key: keyof Omit<AsesmenConfig, 'pgOptionsCount' | 'levelKognitif'>, val: number) => {
    setConfig(prev => ({
      ...prev,
      [key]: Math.max(0, (prev[key] as number) + val)
    }));
  };

  const toggleLevel = (level: 'LOTS' | 'MOTS' | 'HOTS') => {
    setConfig(prev => {
      const active = prev.levelKognitif.includes(level);
      const updated = active
        ? prev.levelKognitif.filter(l => l !== level)
        : [...prev.levelKognitif, level];
      return {
        ...prev,
        levelKognitif: updated
      };
    });
  };

  const totalQuestions = 
    config.pgCount + 
    config.pgkCount + 
    config.isianCount + 
    config.uraianCount + 
    config.bsCount + 
    config.menjodohkanCount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (totalQuestions === 0) {
      alert("Silakan pilih jumlah soal minimal 1 untuk salah satu tipe soal.");
      return;
    }
    if (config.levelKognitif.length === 0) {
      alert("Silakan pilih minimal satu Level Kognitif (LOTS/MOTS/HOTS).");
      return;
    }
    onSubmit(config);
  };

  const itemClass = "flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 md:p-5 bg-white/40 rounded-2xl border border-blue-100 shadow-sm transition-all hover:bg-white/60";
  const labelClass = "text-sm font-bold text-blue-900";
  const descClass = "text-xs text-slate-500 mt-0.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto pb-16">
      {/* Acuan Informasi Kurikulum (Terkoneksi) */}
      <div className="glass p-6 md:p-8 rounded-[1.5rem] bg-gradient-to-br from-blue-50/50 to-teal-50/50 border border-blue-200">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 rounded-lg bg-teal-100 text-teal-800">
            <ClipboardCheck className="w-4 h-4" />
          </div>
          <span className="text-xs uppercase tracking-wider font-bold text-teal-800">Terkoneksi dengan RPPM</span>
        </div>
        <h3 className="text-lg font-bold text-blue-900 mb-1">{formData.subject || "Tanpa Mapel"}</h3>
        <p className="text-sm font-medium text-slate-600 mb-4">
          Kelas {formData.grade} / Semester {formData.semester} • {formData.schoolName || "Sekolah Umum"}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-white/80 p-3.5 rounded-xl border border-blue-100/30">
            <span className="font-bold text-blue-800 block mb-1">Materi Pokok:</span>
            <span className="text-slate-700 line-clamp-2">{formData.material || "Teridentifikasi Otomatis"}</span>
          </div>
          <div className="bg-white/80 p-3.5 rounded-xl border border-blue-100/30">
            <span className="font-bold text-blue-800 block mb-1">Tujuan Pembelajaran (TP):</span>
            <span className="text-slate-700 line-clamp-2">{formData.tp || "Dirumuskan otomatis oleh AI"}</span>
          </div>
        </div>
      </div>

      {/* Pilihan Bentuk Asesmen */}
      <div className="glass p-6 md:p-8 rounded-[1.5rem] space-y-4">
        <div>
          <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-teal-600" /> Bentuk / Jenis Asesmen
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Silakan pilih bentuk asesmen yang ingin Anda susun untuk murid Anda.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(['Asesmen Awal', 'Asesmen Formatif', 'Asesmen Sumatif'] as const).map((tipe) => {
            const isSel = config.jenisAsesmen === tipe;
            return (
              <button
                key={tipe}
                type="button"
                onClick={() => setConfig(prev => ({ ...prev, jenisAsesmen: tipe }))}
                className={cn(
                  "px-4 py-3 rounded-xl font-bold border text-xs transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer text-center",
                  isSel
                    ? "bg-teal-600 border-teal-600 text-white shadow-teal-500/10"
                    : "bg-white border-blue-200 text-blue-800 hover:border-blue-400"
                )}
              >
                <span>{tipe}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Konfigurasi Tipe Soal */}
      <div className="glass p-6 md:p-8 rounded-[1.5rem] space-y-6">
        <div className="border-b border-blue-100 pb-4">
          <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-teal-600" /> Konfigurasi Tipe & Jumlah Soal
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Silakan sesuaikan jumlah pertanyaan untuk masing-masing bentuk soal Kurikulum Merdeka di bawah ini.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {/* Pilihan Ganda */}
          <div className={itemClass}>
            <div>
              <p className={labelClass}>Pilihan Ganda (PG)</p>
              <p className={descClass}>Pertanyaan mandiri dengan beberapa pilihan jawaban.</p>
              
              {/* Option PG Selection */}
              {config.pgCount > 0 && (
                <div className="flex items-center gap-2 mt-3 bg-blue-50 border border-blue-100/60 rounded-xl p-1.5 w-fit">
                  <span className="text-[10px] font-bold text-blue-800 uppercase px-2">Jumlah Opsi PG:</span>
                  {[3, 4, 5].map((optCount) => (
                    <button
                      key={optCount}
                      type="button"
                      onClick={() => setConfig(prev => ({ ...prev, pgOptionsCount: optCount as 3 | 4 | 5 }))}
                      className={cn(
                        "text-xs px-3 py-1 rounded-lg font-bold transition-all cursor-pointer",
                        config.pgOptionsCount === optCount 
                          ? "bg-teal-600 text-white shadow-sm" 
                          : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                      )}
                    >
                      {optCount} Opsi
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
              <button
                type="button"
                onClick={() => updateCount('pgCount', -1)}
                className="w-10 h-10 rounded-xl border border-blue-200 flex items-center justify-center bg-white hover:bg-blue-50 transition-colors"
              >
                <Minus className="w-4 h-4 text-blue-600" />
              </button>
              <span className="w-10 text-center font-bold text-slate-800 text-base">{config.pgCount}</span>
              <button
                type="button"
                onClick={() => updateCount('pgCount', 1)}
                className="w-10 h-10 rounded-xl border border-blue-200 flex items-center justify-center bg-white hover:bg-blue-50 transition-colors"
              >
                <Plus className="w-4 h-4 text-blue-600" />
              </button>
            </div>
          </div>

          {/* Pilihan Ganda Kompleks */}
          <div className={itemClass}>
            <div>
              <p className={labelClass}>Pilihan Ganda Kompleks (PGK)</p>
              <p className={descClass}>Murid dapat memilih satu atau beberapa jawaban yang benar sekaligus.</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => updateCount('pgkCount', -1)}
                className="w-10 h-10 rounded-xl border border-blue-200 flex items-center justify-center bg-white hover:bg-blue-50 transition-colors"
              >
                <Minus className="w-4 h-4 text-blue-600" />
              </button>
              <span className="w-10 text-center font-bold text-slate-800 text-base">{config.pgkCount}</span>
              <button
                type="button"
                onClick={() => updateCount('pgkCount', 1)}
                className="w-10 h-10 rounded-xl border border-blue-200 flex items-center justify-center bg-white hover:bg-blue-50 transition-colors"
              >
                <Plus className="w-4 h-4 text-blue-600" />
              </button>
            </div>
          </div>

          {/* Isian Singkat */}
          <div className={itemClass}>
            <div>
              <p className={labelClass}>Isian Singkat</p>
              <p className={descClass}>Murid mengisi lembar soal dengan jawaban pendek/pasti.</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => updateCount('isianCount', -1)}
                className="w-10 h-10 rounded-xl border border-blue-200 flex items-center justify-center bg-white hover:bg-blue-50 transition-colors"
              >
                <Minus className="w-4 h-4 text-blue-600" />
              </button>
              <span className="w-10 text-center font-bold text-slate-800 text-base">{config.isianCount}</span>
              <button
                type="button"
                onClick={() => updateCount('isianCount', 1)}
                className="w-10 h-10 rounded-xl border border-blue-200 flex items-center justify-center bg-white hover:bg-blue-50 transition-colors"
              >
                <Plus className="w-4 h-4 text-blue-600" />
              </button>
            </div>
          </div>

          {/* Uraian */}
          <div className={itemClass}>
            <div>
              <p className={labelClass}>Uraian (Essay)</p>
              <p className={descClass}>Pertanyaan yang membutuhkan penjabaran, diskusi materi, atau analisis mendalam.</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => updateCount('uraianCount', -1)}
                className="w-10 h-10 rounded-xl border border-blue-200 flex items-center justify-center bg-white hover:bg-blue-50 transition-colors"
              >
                <Minus className="w-4 h-4 text-blue-600" />
              </button>
              <span className="w-10 text-center font-bold text-slate-800 text-base">{config.uraianCount}</span>
              <button
                type="button"
                onClick={() => updateCount('uraianCount', 1)}
                className="w-10 h-10 rounded-xl border border-blue-200 flex items-center justify-center bg-white hover:bg-blue-50 transition-colors"
              >
                <Plus className="w-4 h-4 text-blue-600" />
              </button>
            </div>
          </div>

          {/* Benar / Salah */}
          <div className={itemClass}>
            <div>
              <p className={labelClass}>Benar / Salah (True or False)</p>
              <p className={descClass}>Menilai kebenaran pernyataan berdasarkan konsep materi ajar.</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => updateCount('bsCount', -1)}
                className="w-10 h-10 rounded-xl border border-blue-200 flex items-center justify-center bg-white hover:bg-blue-50 transition-colors"
              >
                <Minus className="w-4 h-4 text-blue-600" />
              </button>
              <span className="w-10 text-center font-bold text-slate-800 text-base">{config.bsCount}</span>
              <button
                type="button"
                onClick={() => updateCount('bsCount', 1)}
                className="w-10 h-10 rounded-xl border border-blue-200 flex items-center justify-center bg-white hover:bg-blue-50 transition-colors"
              >
                <Plus className="w-4 h-4 text-blue-600" />
              </button>
            </div>
          </div>

          {/* Menjodohkan */}
          <div className={itemClass}>
            <div>
              <p className={labelClass}>Menjodohkan</p>
              <p className={descClass}>Menghubungkan baris pernyataan kiri dengan kolom jawaban/definisi kanan.</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => updateCount('menjodohkanCount', -1)}
                className="w-10 h-10 rounded-xl border border-blue-200 flex items-center justify-center bg-white hover:bg-blue-50 transition-colors"
              >
                <Minus className="w-4 h-4 text-blue-600" />
              </button>
              <span className="w-10 text-center font-bold text-slate-800 text-base">{config.menjodohkanCount}</span>
              <button
                type="button"
                onClick={() => updateCount('menjodohkanCount', 1)}
                className="w-10 h-10 rounded-xl border border-blue-200 flex items-center justify-center bg-white hover:bg-blue-50 transition-colors"
              >
                <Plus className="w-4 h-4 text-blue-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Level Kognitif */}
      <div className="glass p-6 md:p-8 rounded-[1.5rem] space-y-6">
        <div className="border-b border-blue-100 pb-4">
          <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2">
            Level Kognitif Soal
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pilih tingkat kecakapan intelektual soal yang diizinkan untuk digenerate.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {(['LOTS', 'MOTS', 'HOTS'] as const).map((level) => {
            const isActive = config.levelKognitif.includes(level);
            return (
              <button
                key={level}
                type="button"
                onClick={() => toggleLevel(level)}
                className={cn(
                  "px-5 py-3 rounded-xl font-bold border text-sm transition-all shadow-sm flex items-center gap-2 cursor-pointer",
                  isActive
                    ? "bg-teal-600 border-teal-600 text-white shadow-teal-500/10"
                    : "bg-white border-blue-200 text-blue-700 hover:border-blue-400"
                )}
              >
                <span>
                  {level === 'LOTS' 
                    ? 'Level 1: LOTS (Mengingat & Memahami)' 
                    : level === 'MOTS' 
                    ? 'Level 2: MOTS (Mengaplikasikan)' 
                    : 'Level 3: HOTS (Menganalisis, Mengevaluasi, Mengkreasi)'}
                </span>
                {isActive && <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">Aktif</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary Box */}
      {totalQuestions > 0 && (
        <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-2xl flex items-center gap-3 text-xs leading-relaxed text-blue-950">
          <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            Anda akan menyusun perangkat evaluasi pembelajaran komprehensif berisi total <strong>{totalQuestions} pertanyaan</strong> dari tipe soal yang dipilih. Penyusunan asesmen ini disinkronisasikan sempurna dengan materi ajar Kurikulum Merdeka yang aktif.
          </span>
        </div>
      )}

      {/* Submit Button */}
      <motion.button
        whileHover={!isLoading && totalQuestions > 0 ? { scale: 1.01 } : {}}
        whileTap={!isLoading && totalQuestions > 0 ? { scale: 0.99 } : {}}
        type="submit"
        disabled={isLoading || totalQuestions === 0}
        className={cn(
          "w-full bg-gradient-to-r from-teal-700 to-emerald-600 text-white font-bold py-5 rounded-2xl shadow-xl flex items-center justify-center gap-3 transition-all",
          (isLoading || totalQuestions === 0) 
            ? "opacity-40 cursor-not-allowed grayscale" 
            : "opacity-100 shadow-teal-500/20"
        )}
      >
        {isLoading ? (
          <>
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Keamanan AI Menyusun Asesmen...
          </>
        ) : (
          <>
            <Send className="w-5 h-5 animate-pulse" />
            Generate Kisi-kisi, Soal, Pembahasan, & Rubrik
          </>
        )}
      </motion.button>
    </form>
  );
}
