import { useState } from 'react';
import { motion } from 'motion/react';
import { Send, Plus, Minus, School, User as UserIcon, Briefcase, GraduationCap, Calendar, Clock, BookOpen, Layers } from 'lucide-react';
import { ModulFormData } from '../types';
import { cn } from '../lib/utils';

// Daftar sekolah yang diperbolehkan
const ALLOWED_SCHOOLS = [
  "SD Negeri Sumoli",
  "SD NEGERI SUMOLI",
  "SDN SUMOLI"
];

// Daftar nama guru yang diperbolehkan (Gunakan huruf kapital/uppercase untuk konsistensi)
const ALLOWED_TEACHERS = [
  "Widya Agista Eka Pradita, S.E",
  "WIDYA AGISTA EKA PRADITA, S.E",
  "FIDHAL TOUNA" // Tambahkan nama guru lainnya di sini
];

interface GeneratorFormProps {
  onSubmit: (data: ModulFormData) => void;
  isLoading: boolean;
  // Tambahkan props opsional untuk menampung data lama dari parent komponen
  savedData?: ModulFormData | null; 
}

const DIMENSI_LULUSAN = [
  'Keimanan & Ketakwaan',
  'Kewargaan',
  'Penalaran Kritis',
  'Kreativitas',
  'Kolaborasi',
  'Kemandirian',
  'Kesehatan',
  'Komunikasi'
];

const PEDAGOGY_OPTIONS = [
  'Inkuiri-Discovery',
  'PjBL',
  'Problem Solving',
  'Game Based Learning',
  'Station Learning'
];

export default function GeneratorForm({ onSubmit, isLoading, savedData }: GeneratorFormProps) {
  // Gunakan savedData sebagai nilai awal jika ada, jika tidak ada baru gunakan nilai default kosong
  const [formData, setFormData] = useState<ModulFormData>({
    schoolName: savedData?.schoolName || '',
    teacherName: savedData?.teacherName || '',
    teacherNip: savedData?.teacherNip || '',
    position: savedData?.position || 'Guru Kelas',
    principalName: savedData?.principalName || '',
    principalNip: savedData?.principalNip || '',
    level: savedData?.level || 'SD',
    grade: savedData?.grade || '',
    semester: savedData?.semester || 'I / Ganjil',
    subject: savedData?.subject || '',
    cp: savedData?.cp || '',
    tp: savedData?.tp || '',
    material: savedData?.material || '',
    meetings: savedData?.meetings || 1,
    duration: savedData?.duration || '',
    pedagogy: savedData?.pedagogy || [],
    dimensi: savedData?.dimensi || []
  });
  
  // Fungsi pengecekan keamanan ganda (Sekolah DAN Guru harus valid)
  const isSchoolAllowed = ALLOWED_SCHOOLS.includes(formData.schoolName.toUpperCase().trim());
  const isTeacherAllowed = ALLOWED_TEACHERS.includes(formData.teacherName.toUpperCase().trim());
  
  // Akses hanya diberikan jika nama sekolah dan nama guru terdaftar
  const isAccessAllowed = isSchoolAllowed && isTeacherAllowed;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDimensiToggle = (item: string) => {
    setFormData(prev => ({
      ...prev,
      dimensi: prev.dimensi.includes(item)
        ? prev.dimensi.filter(i => i !== item)
        : [...prev.dimensi, item]
    }));
  };

  const handlePedagogyChange = (index: number, value: string) => {
    const newPedagogy = [...formData.pedagogy];
    newPedagogy[index] = value;
    setFormData(prev => ({ ...prev, pedagogy: newPedagogy }));
  };

  const updateMeetings = (val: number) => {
    const newCount = Math.max(1, formData.meetings + val);
    const newPedagogy = [...formData.pedagogy];
    if (val > 0) {
      newPedagogy.push('Inkuiri-Discovery');
    } else if (newCount < formData.meetings) {
      newPedagogy.pop();
    }
    setFormData(prev => ({ ...prev, meetings: newCount, pedagogy: newPedagogy }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAccessAllowed) {
      alert(`Maaf, kombinasi Satuan Pendidikan dan Nama Guru belum terdaftar dalam sistem.`);
      return;
    }
    onSubmit(formData);
  };

  // Konfigurasi style terpusat bertema Lime & Emerald
  const sectionClass = "glass p-6 md:p-8 rounded-[1.5rem] space-y-6 border border-white/40";
  const labelClass = "text-sm font-bold text-emerald-900 flex items-center gap-2";
  const inputClass = "w-full bg-white/60 border border-emerald-100 rounded-xl py-3 px-4 focus:ring-2 focus:ring-lime-500 focus:border-transparent outline-none transition-all text-emerald-950 placeholder:text-emerald-300";
  const iconContainerClass = "p-2 rounded-lg bg-lime-100 text-lime-700";

  // Kondisi untuk memunculkan warning visual
  const showWarning = (formData.schoolName || formData.teacherName) && !isAccessAllowed;

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8 pb-20 px-4 md:px-0">
      {/* Header Info */}
      <div className={sectionClass}>
        <div className="flex items-center gap-3 mb-2">
          <div className={iconContainerClass}>
            <School className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-emerald-950">Identitas Satuan Pendidikan</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className={labelClass}><School className="w-4 h-4"/> Nama Satuan Pendidikan</label>
            <input name="schoolName" value={formData.schoolName} onChange={handleChange} required className={inputClass} placeholder="Contoh: SD Negeri 1 Merdeka" />
          </div>
          <div className="space-y-2">
            <label className={labelClass}><UserIcon className="w-4 h-4"/> Nama Guru</label>
            <input name="teacherName" value={formData.teacherName} onChange={handleChange} required className={inputClass} placeholder="Nama Lengkap" />
          </div>
          <div className="space-y-2">
            <label className={labelClass}>NIP Guru</label>
            <input name="teacherNip" value={formData.teacherNip} onChange={handleChange} required className={inputClass} placeholder="NIP" />
          </div>
          <div className="space-y-2">
            <label className={labelClass}><Briefcase className="w-4 h-4"/> Jabatan</label>
            <select name="position" value={formData.position} onChange={handleChange} className={inputClass}>
              <option value="Guru Kelas">Guru Kelas</option>
              <option value="Guru Mata Pelajaran">Guru Mata Pelajaran</option>
              <option value="Wali Kelas">Wali Kelas</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className={labelClass}><UserIcon className="w-4 h-4"/> Nama Kepala Sekolah</label>
            <input name="principalName" value={formData.principalName} onChange={handleChange} required className={inputClass} />
          </div>
          <div className="space-y-2">
            <label className={labelClass}>NIP Kepala Sekolah</label>
            <input name="principalNip" value={formData.principalNip} onChange={handleChange} required className={inputClass} />
          </div>
        </div>
      </div>

      {/* Curriculum Details */}
      <div className={sectionClass}>
        <div className="flex items-center gap-3 mb-2">
          <div className={iconContainerClass}>
            <GraduationCap className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-emerald-950">Informasi Pembelajaran</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className={labelClass}>Jenjang Pendidikan</label>
            <select name="level" value={formData.level} onChange={handleChange} className={inputClass}>
              <option value="SD">SD</option>
              <option value="SMP">SMP</option>
              <option value="SMA">SMA</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className={labelClass}>Kelas</label>
            <input name="grade" value={formData.grade} onChange={handleChange} className={inputClass} placeholder="Contoh: 1, 7, 10" required />
          </div>
          <div className="space-y-2">
            <label className={labelClass}><Calendar className="w-4 h-4"/> Semester</label>
            <select name="semester" value={formData.semester} onChange={handleChange} className={inputClass}>
              <option value="I / Ganjil">I / Ganjil</option>
              <option value="II / Genap">II / Genap</option>
            </select>
          </div>
        </div>
        
        <div className="space-y-2">
          <label className={labelClass}><BookOpen className="w-4 h-4"/> Mata Pelajaran (Mapel)</label>
          <input name="subject" value={formData.subject} onChange={handleChange} className={inputClass} required />
        </div>

        <div className="space-y-2">
          <label className={labelClass}><Layers className="w-4 h-4"/> Capaian Pembelajaran (CP)</label>
          <textarea name="cp" value={formData.cp} onChange={handleChange} className={cn(inputClass, "h-24 resize-none")} required />
        </div>

        <div className="space-y-2">
          <label className={labelClass}>Tujuan Pembelajaran (TP)</label>
          <textarea name="tp" value={formData.tp} onChange={handleChange} className={cn(inputClass, "h-24 resize-none")} required />
        </div>

        <div className="space-y-2">
          <label className={labelClass}>Materi Pelajaran</label>
          <input name="material" value={formData.material} onChange={handleChange} className={inputClass} required />
        </div>
      </div>

      {/* Logistics & Pedagogy */}
      <div className={sectionClass}>
        <div className="flex items-center gap-3 mb-2">
          <div className={iconContainerClass}>
            <Clock className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-emerald-950">Metode & Durasi</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <label className={labelClass}>Jumlah Pertemuan</label>
            <div className="flex items-center gap-4">
              <button 
                type="button" 
                onClick={() => updateMeetings(-1)} 
                className="w-12 h-12 rounded-xl border-2 border-emerald-100 flex items-center justify-center bg-white/80 hover:bg-lime-50 hover:border-lime-300 transition-colors"
              >
                <Minus className="w-5 h-5 text-emerald-700"/>
              </button>

              <input
                type="number"
                name="meetings"
                value={formData.meetings}
                onChange={(e) => {
