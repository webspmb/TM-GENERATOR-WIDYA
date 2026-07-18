import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Lock, Unlock, Key, RefreshCw, CheckCircle, Check, X, ShieldAlert, GraduationCap, Briefcase, Eye, EyeOff, LayoutGrid } from 'lucide-react';
import { AdminConfig } from '../types';
import { cn } from '../lib/utils';
import { SUBJECTS_BY_LEVEL } from './GeneratorForm';

interface AdminPanelProps {
  config: AdminConfig;
  onSaveConfig: (updatedConfig: AdminConfig) => void;
  onBack: () => void;
}

export default function AdminPanel({ config, onSaveConfig, onBack }: AdminPanelProps) {
  const [pinInput, setPinInput] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [unlockError, setUnlockError] = useState('');
  const [showPin, setShowPin] = useState(false);

  // Form states copy
  const [localPin, setLocalPin] = useState(config.pin);
  const [showLocalPin, setShowLocalPin] = useState(false);
  const [enabledPositions, setEnabledPositions] = useState<string[]>(config.enabledPositions);
  const [enabledSubjects, setEnabledSubjects] = useState<Record<'SD' | 'SMP' | 'SMA' | 'SMK', string[]>>(config.enabledSubjects);
  const [activeTab, setActiveTab] = useState<'SD' | 'SMP' | 'SMA' | 'SMK'>('SD');
  
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync state if prop changes
  useEffect(() => {
    setLocalPin(config.pin);
    setEnabledPositions(config.enabledPositions);
    setEnabledSubjects(config.enabledSubjects);
  }, [config]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === config.pin) {
      setIsUnlocked(true);
      setUnlockError('');
    } else {
      setUnlockError('PIN yang Anda masukkan salah. Silakan coba kembali.');
    }
  };

  const handleTogglePosition = (pos: string) => {
    setEnabledPositions(prev => {
      if (prev.includes(pos)) {
        // Prevent disabling all positions
        if (prev.length <= 1) {
          alert('Minimal harus ada 1 Jabatan yang aktif agar aplikasi dapat digunakan.');
          return prev;
        }
        return prev.filter(p => p !== pos);
      } else {
        return [...prev, pos];
      }
    });
  };

  const handleToggleSubject = (level: 'SD' | 'SMP' | 'SMA' | 'SMK', subject: string) => {
    setEnabledSubjects(prev => {
      const currentList = prev[level] || [];
      let updatedList: string[];
      if (currentList.includes(subject)) {
        updatedList = currentList.filter(s => s !== subject);
      } else {
        updatedList = [...currentList, subject];
      }
      return {
        ...prev,
        [level]: updatedList
      };
    });
  };

  const handleSelectAllSubjects = (level: 'SD' | 'SMP' | 'SMA' | 'SMK') => {
    const all = SUBJECTS_BY_LEVEL[level] || [];
    setEnabledSubjects(prev => ({
      ...prev,
      [level]: [...all]
    }));
  };

  const handleClearAllSubjects = (level: 'SD' | 'SMP' | 'SMA' | 'SMK') => {
    setEnabledSubjects(prev => ({
      ...prev,
      [level]: []
    }));
  };

  const handleResetToDefault = () => {
    if (confirm('Apakah Anda yakin ingin menyetel ulang seluruh pengaturan admin ke setelan awal?')) {
      const defaultSubjects: Record<'SD' | 'SMP' | 'SMA' | 'SMK', string[]> = {
        SD: [...SUBJECTS_BY_LEVEL.SD],
        SMP: [...SUBJECTS_BY_LEVEL.SMP],
        SMA: [...SUBJECTS_BY_LEVEL.SMA],
        SMK: [...SUBJECTS_BY_LEVEL.SMK],
      };
      
      const defaultPositions = ['Guru Kelas', 'Guru Mata Pelajaran', 'Wali Kelas'];
      
      setLocalPin('252301');
      setEnabledPositions(defaultPositions);
      setEnabledSubjects(defaultSubjects);
      
      onSaveConfig({
        pin: '252301',
        enabledPositions: defaultPositions,
        enabledSubjects: defaultSubjects
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleSave = () => {
    if (!localPin.trim()) {
      alert('PIN Keamanan tidak boleh kosong.');
      return;
    }

    if (localPin.trim().length !== 6 || !/^\d+$/.test(localPin)) {
      alert('PIN Keamanan baru harus berupa 6 digit angka.');
      return;
    }
    
    // Check if at least one subject is selected per level (or confirm if empty)
    const levels: ('SD' | 'SMP' | 'SMA' | 'SMK')[] = ['SD', 'SMP', 'SMA', 'SMK'];
    const hasEmptyLevel = levels.some(lvl => (enabledSubjects[lvl] || []).length === 0);
    
    if (hasEmptyLevel) {
      if (!confirm('Peringatan: Ada jenjang pendidikan yang tidak memiliki mata pelajaran aktif sama sekali. Lanjutkan penyimpanan?')) {
        return;
      }
    }

    onSaveConfig({
      pin: localPin,
      enabledPositions,
      enabledSubjects
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  if (!isUnlocked) {
    return (
      <div className="max-w-md mx-auto my-12" id="admin-pin-lock-container">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-8 rounded-3xl border border-slate-200/80 shadow-xl space-y-6 text-center relative overflow-hidden"
        >
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600" />
          
          <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Keamanan & Kontrol Admin</h2>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
              Halaman ini dilindungi oleh PIN Keamanan untuk mencegah perubahan konfigurasi jabatan dan mata pelajaran oleh pengguna umum.
            </p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-4 pt-2">
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-emerald-500" /> Masukkan PIN Keamanan
              </label>
              <div className="relative">
                <input 
                  type={showPin ? "text" : "password"} 
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="PIN Keamanan (6-Digit)"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-xl py-3 px-4 pr-12 text-center font-bold tracking-widest text-lg outline-none transition-all"
                  maxLength={12}
                  autoFocus
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {unlockError && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-50 text-red-700 text-xs font-medium rounded-xl border border-red-100 flex items-center gap-2 text-left"
              >
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{unlockError}</span>
              </motion.div>
            )}

            <div className="pt-2 flex gap-3">
              <button 
                type="button"
                onClick={onBack}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl text-xs transition-all cursor-pointer"
              >
                Kembali
              </button>
              <button 
                type="submit"
                className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-xs shadow-md shadow-emerald-600/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Unlock className="w-4 h-4" /> Buka Kontrol
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8" id="admin-panel-container">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <ShieldCheck className="w-5 h-5 animate-pulse" />
            </div>
            <span className="text-xs font-black text-emerald-600 tracking-widest uppercase">KONTROL KEAMANAN</span>
          </div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Panel Pengaturan Admin</h2>
          <p className="text-xs text-slate-500">
            Kelola pembatasan akses jabatan guru serta filter mata pelajaran yang diizinkan untuk aktif di aplikasi.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={handleResetToDefault}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Setel Ulang Default
          </button>
          <button 
            onClick={onBack}
            className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            <X className="w-3.5 h-3.5" /> Tutup Panel
          </button>
        </div>
      </div>

      {saveSuccess && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 flex items-center gap-3 shadow-sm"
        >
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="text-xs font-semibold">
            Konfigurasi Admin Berhasil Disimpan & Diterapkan ke Sistem!
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: General Settings & Position Controls */}
        <div className="lg:col-span-1 space-y-6">
          {/* General Security & PIN */}
          <div className="glass p-6 rounded-3xl border border-slate-200/60 shadow-sm space-y-5">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Key className="w-4 h-4 text-emerald-600" />
              <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">Akses PIN Keamanan</h3>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500">PIN Keamanan Baru</label>
              <div className="relative">
                <input 
                  type={showLocalPin ? "text" : "password"} 
                  value={localPin}
                  onChange={(e) => setLocalPin(e.target.value)}
                  placeholder="PIN Baru"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 rounded-xl py-2.5 px-4 pr-12 font-bold tracking-widest text-center text-sm outline-none transition-all"
                  maxLength={12}
                />
                <button
                  type="button"
                  onClick={() => setShowLocalPin(!showLocalPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
                >
                  {showLocalPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Ubah PIN untuk menjaga kerahasiaan panel ini. PIN baru harus berupa 6 digit angka.
              </p>
            </div>
          </div>

          {/* Teacher Position Controls */}
          <div className="glass p-6 rounded-3xl border border-slate-200/60 shadow-sm space-y-5">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Briefcase className="w-4 h-4 text-emerald-600" />
              <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">Kontrol Jabatan Guru</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Atur opsi jabatan guru mana saja yang diaktifkan pada menu Data Utama. Centang jabatan yang ingin ditampilkan:
            </p>

            <div className="space-y-3 pt-1">
              {['Guru Kelas', 'Guru Mata Pelajaran', 'Wali Kelas'].map((pos) => {
                const isActive = enabledPositions.includes(pos);
                return (
                  <div 
                    key={pos}
                    onClick={() => handleTogglePosition(pos)}
                    className={cn(
                      "flex items-center justify-between p-3.5 rounded-xl border cursor-pointer select-none transition-all",
                      isActive 
                        ? "bg-emerald-50/50 border-emerald-200/80 text-slate-800 font-bold" 
                        : "bg-slate-50/50 border-slate-200/80 text-slate-400"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-4 h-4 rounded border flex items-center justify-center transition-all",
                        isActive ? "bg-emerald-600 border-emerald-600 text-white" : "bg-white border-slate-300"
                      )}>
                        {isActive && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="text-xs">{pos}</span>
                    </div>
                    <span className={cn(
                      "text-[9px] font-bold px-2 py-0.5 rounded-full",
                      isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-400"
                    )}>
                      {isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Subjects Controls grouped by level */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass p-6 rounded-3xl border border-slate-200/60 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">Kontrol Mata Pelajaran Aktif</h3>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleSelectAllSubjects(activeTab)}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-3 py-1.5 rounded-lg text-[10px] border border-emerald-100 transition-colors"
                >
                  Pilih Semua
                </button>
                <button
                  onClick={() => handleClearAllSubjects(activeTab)}
                  className="bg-red-50 hover:bg-red-100 text-red-700 font-bold px-3 py-1.5 rounded-lg text-[10px] border border-red-100 transition-colors"
                >
                  Hapus Semua
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Pilih dan tentukan mata pelajaran apa saja yang akan dimunculkan bagi guru pada masing-masing jenjang pendidikan. Mata pelajaran yang tidak dicentang akan disembunyikan.
            </p>

            {/* Level Tabs */}
            <div className="flex border-b border-slate-150 gap-1 overflow-x-auto pb-1 scrollbar-none">
              {(['SD', 'SMP', 'SMA', 'SMK'] as const).map((lvl) => {
                const total = (SUBJECTS_BY_LEVEL[lvl] || []).length;
                const activeCount = (enabledSubjects[lvl] || []).length;
                return (
                  <button
                    key={lvl}
                    onClick={() => setActiveTab(lvl)}
                    className={cn(
                      "px-4 py-2.5 font-bold text-xs rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer flex items-center gap-2",
                      activeTab === lvl
                        ? "border-emerald-600 text-emerald-700 bg-emerald-50/40"
                        : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                    )}
                  >
                    <span>Jenjang {lvl}</span>
                    <span className={cn(
                      "text-[9px] px-1.5 py-0.5 rounded-full font-sans font-black",
                      activeTab === lvl ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500"
                    )}>
                      {activeCount}/{total}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Subject Checkboxes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-2 pt-1 border border-slate-100 rounded-2xl p-3 bg-slate-50/40">
              {(SUBJECTS_BY_LEVEL[activeTab] || []).map((sub) => {
                const isChecked = (enabledSubjects[activeTab] || []).includes(sub);
                return (
                  <div
                    key={sub}
                    onClick={() => handleToggleSubject(activeTab, sub)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border cursor-pointer select-none transition-all hover:bg-white",
                      isChecked 
                        ? "bg-white border-emerald-200 text-slate-800 shadow-sm" 
                        : "bg-white/40 border-slate-200/50 text-slate-400"
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all",
                      isChecked ? "bg-emerald-600 border-emerald-600 text-white" : "bg-white border-slate-300"
                    )}>
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="text-xs font-medium text-justify">{sub}</span>
                  </div>
                );
              })}
            </div>
            
            <div className="p-3 bg-blue-50/50 border border-blue-150 rounded-2xl text-blue-800 flex items-start gap-2.5">
              <LayoutGrid className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <div className="text-[10px] leading-relaxed">
                <strong>Catatan Khusus Jenjang SD:</strong> Filter pembagian jabatan guru kelas vs guru mata pelajaran tetap berlaku secara otomatis. Jabatan <strong>Guru Kelas</strong> di SD hanya akan menampilkan sub-kategori dari mata pelajaran aktif yang Anda setujui di atas yang termasuk dalam Bahasa Indonesia, Matematika, IPAS, Pendidikan Pancasila, Seni Rupa, Seni Musik, Seni Tari, dan Seni Teater.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-150">
        <button 
          onClick={onBack}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-6 py-3 rounded-xl text-xs transition-all cursor-pointer"
        >
          Batalkan
        </button>
        <button 
          onClick={handleSave}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-3 rounded-xl text-xs shadow-md shadow-emerald-600/10 hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <CheckCircle className="w-4 h-4" /> Simpan & Terapkan Konfigurasi
        </button>
      </div>
    </div>
  );
}
