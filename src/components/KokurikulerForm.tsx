import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ClipboardCheck, Send, Sparkles, School, User, Layers, BookOpen, Clock, Tag, MessageSquare } from 'lucide-react';
import { KokurikulerFormData, ModulFormData } from '../types';
import { cn } from '../lib/utils';
import { fetchKontrolSheet, KontrolRow } from '../lib/sheets';

interface KokurikulerFormProps {
  onSubmit: (data: KokurikulerFormData) => void;
  isLoading: boolean;
  savedData?: KokurikulerFormData | null;
  formData: ModulFormData | null;
}

const ALLOWED_SCHOOLS = [
  "SD Negeri Sumoli",
  "SD NEGERI SUMOLI",
  "SDN 1 MERDEKA",
  "SMP Negeri 1 Merdeka",
  "SMP NEGERI 1 MERDEKA",
  "SMPN 1 MERDEKA",
  "SMA Negeri 1 Merdeka",
  "SMA NEGERI 1 MERDEKA",
  "SMAN 1 MERDEKA",
  "SMK Negeri 1 Merdeka",
  "SMK NEGERI 1 MERDEKA",
  "SMKN 1 MERDEKA"
];

const ALLOWED_TEACHERS = [
  "Widya Agista Eka Pradita, S.E",
  "WIDYA AGISTA EKA PRADITA, S.E",
  "Widya Agista Eka Pradita,S.E"
];

const BENTUK_KOKURIKULER = [
  'Pembelajaran kolaboratif lintas disiplin ilmu',
  '7 Kebiasaan Anak Indonesia Hebat (G7KAIH)',
  'Cara lainnya'
];

const TEMA_KOKURIKULER = [
  'Generasi sehat dan bugar',
  'Peduli dan berbagi',
  'Aku cinta Indonesia',
  'Hidup hemat dan produktif',
  'Berkarya untuk sesama dan bangsa',
  'Gaya hidup berkelanjutan',
  'Tema Kustom (Tulis Manual)'
];

const DIMENSI_KOKURIKULER = [
  'Keimanan dan Ketakwaan terhadap Tuhan Yang Maha Esa',
  'Kewargaan',
  'Penalaran Kritis',
  'Kreativitas',
  'Kolaborasi',
  'Kemandirian',
  'Kesehatan',
  'Komunikasi'
];

const normalizeStr = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '').trim();

export default function KokurikulerForm({ onSubmit, isLoading, savedData, formData }: KokurikulerFormProps) {
  const [data, setData] = useState<KokurikulerFormData>(() => {
    if (savedData) return savedData;
    
    // Default values fallback to main formData if exists
    return {
      schoolName: formData?.schoolName || '',
      subject: formData?.subject || '',
      bentukKokurikuler: 'Pembelajaran kolaboratif lintas disiplin ilmu',
      theme: 'Generasi sehat dan bugar',
      fokusKegiatan: '',
      grade: formData ? `Kelas ${formData.grade}` : 'Kelas 4',
      alokasiWaktu: '18 JP',
      dimensi: ['Kolaborasi', 'Kreativitas'],
      catatan: '',
      teacherName: formData?.teacherName || '',
      teacherNip: formData?.teacherNip || '',
      principalName: formData?.principalName || '',
      principalNip: formData?.principalNip || '',
      signaturePlace: formData?.signaturePlace || ''
    };
  });

  const [validationError, setValidationError] = useState<string | null>(null);
  const [kontrolRows, setKontrolRows] = useState<KontrolRow[]>(() => {
    try {
      const cached = localStorage.getItem('ciptajar_kontrol_rows');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const loadKontrol = async () => {
      const rows = await fetchKontrolSheet();
      if (rows && rows.length > 0) {
        setKontrolRows(rows);
      }
    };
    loadKontrol();
  }, []);

  const handleToggleDimensi = (dim: string) => {
    setData(prev => {
      const isSelected = prev.dimensi.includes(dim);
      const updated = isSelected 
        ? prev.dimensi.filter(d => d !== dim)
        : [...prev.dimensi, dim];
      return { ...prev, dimensi: updated };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!data.schoolName.trim()) {
      setValidationError("Nama Satuan Pendidikan wajib diisi.");
      return;
    }
    if (!data.teacherName.trim()) {
      setValidationError("Nama Guru wajib diisi.");
      return;
    }

    const typedSchool = normalizeStr(data.schoolName);
    const typedTeacher = normalizeStr(data.teacherName);
    
    const isSchoolAllowed = ALLOWED_SCHOOLS.some(
      school => normalizeStr(school) === typedSchool
    ) || kontrolRows.some(
      row => normalizeStr(row.schoolName) === typedSchool
    );

    const isTeacherAllowed = ALLOWED_TEACHERS.some(
      teacher => normalizeStr(teacher) === typedTeacher
    ) || kontrolRows.some(
      row => normalizeStr(row.teacherName) === typedTeacher
    );
    
    const isAccessAllowed = isSchoolAllowed && isTeacherAllowed;

    if (!isAccessAllowed) {
      setValidationError("Maaf, kombinasi Satuan Pendidikan dan Nama Guru belum terdaftar dalam sistem.");
      return;
    }

    if (!data.fokusKegiatan.trim()) {
      setValidationError("Fokus Kegiatan wajib diisi (misal: Pengolahan Sampah Organik Menjadi Kompos Cair & Padat Berharga).");
      return;
    }

    if (!data.alokasiWaktu.trim()) {
      setValidationError("Alokasi Waktu wajib diisi (misal: 18 JP).");
      return;
    }
    if (data.dimensi.length === 0) {
      setValidationError("Pilih minimal satu Dimensi Profil Lulusan.");
      return;
    }

    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto pb-24">
      {/* Informational Header Connection */}
      <div className="glass p-6 md:p-8 rounded-[1.5rem] bg-gradient-to-br from-teal-50/60 to-emerald-50/60 border border-teal-200 shadow-sm">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-1.5 rounded-xl bg-teal-100 text-teal-800">
            <ClipboardCheck className="w-4.5 h-4.5" />
          </div>
          <span className="text-xs uppercase tracking-widest font-black text-teal-800">SISTEM KOKURIKULER MANDIRI TAHUN 2025</span>
        </div>
        <h3 className="text-xl font-bold text-teal-950 mb-1">Penyusunan Perencanaan Kegiatan Kokurikuler</h3>
        <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
          Rancang modul kokurikuler secara utuh berdasarkan fokus dimensi lulusan, tujuan pembelajaran kokurikuler, produk, praktik pedagogis, kemitraan, pemanfaatan digital, dan rubrik penilaian formatif & sumatif lengkap.
        </p>
      </div>

      {/* Identitas Section */}
      <div className="glass p-6 md:p-8 rounded-[1.5rem] bg-white/70 border border-slate-200 space-y-6">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <School className="w-5 h-5 text-teal-700" />
          <h4 className="text-sm font-bold text-teal-950 uppercase tracking-wider">Identitas Kegiatan</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          {/* Satuan Pendidikan */}
          <div className="space-y-2">
            <label className="block font-bold text-slate-700">Nama Satuan Pendidikan</label>
            <input 
              type="text" 
              value={data.schoolName}
              onChange={(e) => setData(prev => ({ ...prev, schoolName: e.target.value }))}
              placeholder="Contoh: SD Negeri Kajulangko"
              className="w-full border border-slate-200 focus:border-teal-500 rounded-xl px-4 py-3 outline-none transition-all bg-white/95 text-slate-800 text-xs font-medium"
            />
          </div>

          {/* Mata Pelajaran */}
          <div className="space-y-2">
            <label className="block font-bold text-slate-700">Mata Pelajaran Terkait / Terintegrasi</label>
            <input 
              type="text" 
              value={data.subject}
              onChange={(e) => setData(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Contoh: IPAS, Bahasa Indonesia, Matematika (opsional)"
              className="w-full border border-slate-200 focus:border-teal-500 rounded-xl px-4 py-3 outline-none transition-all bg-white/95 text-slate-800 text-xs font-medium"
            />
          </div>

          {/* Bentuk Kokurikuler */}
          <div className="space-y-2">
            <label className="block font-bold text-slate-700">Bentuk Kokurikuler</label>
            <select
              value={data.bentukKokurikuler}
              onChange={(e) => setData(prev => ({ ...prev, bentukKokurikuler: e.target.value }))}
              className="w-full border border-slate-200 focus:border-teal-500 rounded-xl px-4 py-3 outline-none transition-all bg-white/95 text-slate-800 text-xs font-semibold cursor-pointer"
            >
              {BENTUK_KOKURIKULER.map(item => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>

          {/* Tema */}
          <div className="space-y-2">
            <label className="block font-bold text-slate-700">Tema Kokurikuler</label>
            <select
              value={TEMA_KOKURIKULER.includes(data.theme) ? data.theme : 'Tema Kustom (Tulis Manual)'}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'Tema Kustom (Tulis Manual)') {
                  setData(prev => ({ ...prev, theme: 'Tema Kustom' }));
                } else {
                  setData(prev => ({ ...prev, theme: val }));
                }
              }}
              className="w-full border border-slate-200 focus:border-teal-500 rounded-xl px-4 py-3 outline-none transition-all bg-white/95 text-slate-800 text-xs font-semibold cursor-pointer"
            >
              {TEMA_KOKURIKULER.map(item => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>

            {(!TEMA_KOKURIKULER.filter(t => t !== 'Tema Kustom (Tulis Manual)').includes(data.theme)) && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="pt-1.5"
              >
                <input 
                  type="text" 
                  value={data.theme === 'Tema Kustom' ? '' : data.theme}
                  onChange={(e) => {
                    const typed = e.target.value;
                    setData(prev => ({ ...prev, theme: typed }));
                  }}
                  placeholder="Ketik Tema Kokurikuler Kustom Anda..."
                  className="w-full border border-teal-200 focus:border-teal-500 rounded-xl px-4 py-3 outline-none transition-all bg-white text-slate-800 text-xs font-medium"
                />
              </motion.div>
            )}
          </div>

          {/* Fokus Kegiatan */}
          <div className="space-y-2 md:col-span-2">
            <label className="block font-bold text-slate-700">Fokus Kegiatan Kokurikuler</label>
            <input 
              type="text" 
              value={data.fokusKegiatan}
              onChange={(e) => setData(prev => ({ ...prev, fokusKegiatan: e.target.value }))}
              placeholder="Contoh: Pengolahan Sampah Organik Menjadi Kompos Cair & Padat Berharga"
              className="w-full border border-slate-200 focus:border-teal-500 rounded-xl px-4 py-3 outline-none transition-all bg-white/95 text-slate-800 text-xs font-medium"
            />
          </div>

          {/* Kelas / Fase */}
          <div className="space-y-2">
            <label className="block font-bold text-slate-700">Kelas / Fase</label>
            <input 
              type="text" 
              value={data.grade}
              onChange={(e) => setData(prev => ({ ...prev, grade: e.target.value }))}
              placeholder="Contoh: Kelas IV / Fase B"
              className="w-full border border-slate-200 focus:border-teal-500 rounded-xl px-4 py-3 outline-none transition-all bg-white/95 text-slate-800 text-xs font-medium"
            />
          </div>

          {/* Alokasi Waktu */}
          <div className="space-y-2">
            <label className="block font-bold text-slate-700">Alokasi Waktu (JP)</label>
            <input 
              type="text" 
              value={data.alokasiWaktu}
              onChange={(e) => setData(prev => ({ ...prev, alokasiWaktu: e.target.value }))}
              placeholder="Contoh: 18 JP atau 36 JP"
              className="w-full border border-slate-200 focus:border-teal-500 rounded-xl px-4 py-3 outline-none transition-all bg-white/95 text-slate-800 text-xs font-medium"
            />
          </div>
        </div>
      </div>

      {/* Dimensi Profil Lulusan Checkbox Group */}
      <div className="glass p-6 md:p-8 rounded-[1.5rem] bg-white/70 border border-slate-200 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Layers className="w-5 h-5 text-teal-700" />
          <h4 className="text-sm font-bold text-teal-950 uppercase tracking-wider">Dimensi Profil Lulusan</h4>
        </div>
        <p className="text-[11px] text-slate-500 leading-normal">
          Pilih dimensi Profil Lulusan yang paling disasar dan dikembangkan melalui rentetan rangkaian aktivitas kokurikuler ini.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {DIMENSI_KOKURIKULER.map((dim) => {
            const isSelected = data.dimensi.includes(dim);
            return (
              <button
                type="button"
                key={dim}
                onClick={() => handleToggleDimensi(dim)}
                className={cn(
                  "flex items-start gap-3 p-4 rounded-xl border text-left transition-all select-none cursor-pointer",
                  isSelected
                    ? "bg-teal-50/80 border-teal-300 text-teal-900 shadow-sm"
                    : "bg-white border-slate-150 hover:bg-slate-50 text-slate-700"
                )}
              >
                <div className={cn(
                  "w-4.5 h-4.5 rounded-md border flex items-center justify-center shrink-0 text-white font-extrabold text-[10px] mt-0.5 transition-all",
                  isSelected ? "bg-teal-600 border-teal-600" : "border-slate-300 bg-white"
                )}>
                  {isSelected && "✓"}
                </div>
                <span className="text-xs font-bold tracking-tight leading-tight">{dim}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Signatures & Place */}
      <div className="glass p-6 md:p-8 rounded-[1.5rem] bg-white/70 border border-slate-200 space-y-6">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <User className="w-5 h-5 text-teal-700" />
          <h4 className="text-sm font-bold text-teal-950 uppercase tracking-wider">Identitas Guru & Tanda Tangan</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          {/* Tempat Tanda Tangan */}
          <div className="space-y-2 md:col-span-2">
            <label className="block font-bold text-slate-700">Tempat Tanda Tangan</label>
            <input 
              type="text" 
              value={data.signaturePlace}
              onChange={(e) => setData(prev => ({ ...prev, signaturePlace: e.target.value }))}
              placeholder="Contoh: Kajulangko"
              className="w-full border border-slate-200 focus:border-teal-500 rounded-xl px-4 py-3 outline-none transition-all bg-white/95 text-slate-800 text-xs font-medium"
            />
          </div>

          {/* Nama Guru */}
          <div className="space-y-2">
            <label className="block font-bold text-slate-700">Nama Guru Kelas</label>
            <input 
              type="text" 
              value={data.teacherName}
              onChange={(e) => setData(prev => ({ ...prev, teacherName: e.target.value }))}
              placeholder="Contoh: Rista Kasaraeng, S.Pd"
              className="w-full border border-slate-200 focus:border-teal-500 rounded-xl px-4 py-3 outline-none transition-all bg-white/95 text-slate-800 text-xs font-medium"
            />
          </div>

          {/* NIP Guru */}
          <div className="space-y-2">
            <label className="block font-bold text-slate-700">NIP Guru Kelas</label>
            <input 
              type="text" 
              value={data.teacherNip}
              onChange={(e) => setData(prev => ({ ...prev, teacherNip: e.target.value }))}
              placeholder="Contoh: 198501012010121001 atau -"
              className="w-full border border-slate-200 focus:border-teal-500 rounded-xl px-4 py-3 outline-none transition-all bg-white/95 text-slate-800 text-xs font-medium"
            />
          </div>

          {/* Nama Kepala Sekolah */}
          <div className="space-y-2">
            <label className="block font-bold text-slate-700">Nama Kepala Sekolah</label>
            <input 
              type="text" 
              value={data.principalName}
              onChange={(e) => setData(prev => ({ ...prev, principalName: e.target.value }))}
              placeholder="Contoh: Bariyah Abd. Rahman Baso Jasa, S.Pd"
              className="w-full border border-slate-200 focus:border-teal-500 rounded-xl px-4 py-3 outline-none transition-all bg-white/95 text-slate-800 text-xs font-medium"
            />
          </div>

          {/* NIP Kepala Sekolah */}
          <div className="space-y-2">
            <label className="block font-bold text-slate-700">NIP Kepala Sekolah</label>
            <input 
              type="text" 
              value={data.principalNip}
              onChange={(e) => setData(prev => ({ ...prev, principalNip: e.target.value }))}
              placeholder="Contoh: 197501012000031002"
              className="w-full border border-slate-200 focus:border-teal-500 rounded-xl px-4 py-3 outline-none transition-all bg-white/95 text-slate-800 text-xs font-medium"
            />
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex flex-col items-center md:items-end gap-4">
        <button
          type="submit"
          disabled={isLoading}
          className={cn(
            "bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold px-8 py-4 rounded-2xl shadow-lg hover:shadow-teal-600/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer w-full md:w-auto text-sm disabled:opacity-50 disabled:pointer-events-none"
          )}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Sedang men-generate Modul...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 animate-pulse text-amber-300" />
              <span>Generate Modul</span>
              <Send className="w-4 h-4 ml-1" />
            </>
          )}
        </button>

        {validationError && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold flex items-center gap-2 w-full max-w-xl self-center md:self-end">
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse shrink-0" />
            {validationError}
          </div>
        )}
      </div>
    </form>
  );
}
