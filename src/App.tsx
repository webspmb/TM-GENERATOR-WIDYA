/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import Login from './components/Login';
import GeneratorForm from './components/GeneratorForm';
import ModulTable from './components/ModulTable';
import AsesmenForm from './components/AsesmenForm';
import AsesmenResult from './components/AsesmenResult';
import KokurikulerForm from './components/KokurikulerForm';
import KokurikulerResult from './components/KokurikulerResult';
import StudentQuizView from './components/StudentQuizView';
import LogoPhilosophyModal from './components/LogoPhilosophyModal';
import Dashboard from './components/Dashboard';
import { ModulFormData, GeneratedModul, AsesmenConfig, GeneratedAsesmen, AdminConfig, KokurikulerFormData, GeneratedKokurikuler } from './types';
import { generateModulAjar, generateAsesmen, generateKokurikuler } from './lib/gemini';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, LogOut, FileText, ArrowRight, ClipboardCheck, Layers, Menu, ChevronLeft, ChevronDown, Upload, Trash2, LayoutDashboard, ShieldAlert } from 'lucide-react';
import { cn } from './lib/utils';
import AdminPanel from './components/AdminPanel';

export default function App() {
  // Session-based authentication and persistent navigation state across reloads
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return sessionStorage.getItem('ciptajar_is_logged_in') === 'true';
  });
  const [quizToken, setQuizToken] = useState<string | null>(null);

  // Check for student quiz URL token on mount
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const token = searchParams.get('quiz');
    if (token) {
      setQuizToken(token);
    }
  }, []);

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<ModulFormData | null>(() => {
    try {
      const saved = localStorage.getItem('tm_generator_form_data');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  // Load generated modules and assessments from sessionStorage if available to survive reloading
  const [generatedModul, setGeneratedModul] = useState<GeneratedModul | null>(() => {
    try {
      const saved = sessionStorage.getItem('ciptajar_generated_modul');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  
  // TAMBAHAN: State kontrol navigasi halaman ('form' atau 'result')
  const [currentView, setCurrentView] = useState<'form' | 'result'>(() => {
    return (sessionStorage.getItem('ciptajar_current_view') as any) || 'form';
  });

  // ASESMEN ADDITIONS STATE
  const [activeMenu, setActiveMenu] = useState<'dashboard' | 'data' | 'modul' | 'asesmen' | 'kokurikuler' | 'admin'>(() => {
    return (sessionStorage.getItem('ciptajar_active_menu') as any) || 'dashboard';
  });

  const [adminConfig, setAdminConfig] = useState<AdminConfig>(() => {
    try {
      const saved = localStorage.getItem('ciptajar_admin_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Automatically migrate older default PINs to the new standard 252301
        if (parsed.pin === '1985' || parsed.pin === '198500') {
          parsed.pin = '252301';
          localStorage.setItem('ciptajar_admin_config', JSON.stringify(parsed));
        }
        return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    // Default config
    return {
      pin: '252301',
      enabledPositions: ['Guru Kelas', 'Guru Mata Pelajaran', 'Wali Kelas'],
      enabledSubjects: {
        SD: [
          "Bahasa Indonesia",
          "Matematika",
          "Ilmu Pengetahuan Alam dan Sosial (IPAS)",
          "Pendidikan Pancasila",
          "Pendidikan Agama Islam",
          "Pendidikan Agama Kristen",
          "Pendidikan Agama Katolik",
          "Pendidikan Agama Hindu",
          "Pendidikan Agama Buddha",
          "Pendidikan Agama Khonghucu",
          "Seni Rupa",
          "Seni Musik",
          "Seni Tari",
          "Seni Teater",
          "Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)",
          "Bahasa Inggris",
          "Muatan Lokal"
        ],
        SMP: [
          "Pendidikan Pancasila",
          "Bahasa Indonesia",
          "Matematika",
          "Ilmu Pengetahuan Alam (IPA)",
          "Ilmu Pengetahuan Sosial (IPS)",
          "Bahasa Inggris",
          "Pendidikan Agama Islam",
          "Pendidikan Agama Kristen",
          "Pendidikan Agama Katolik",
          "Pendidikan Agama Hindu",
          "Pendidikan Agama Buddha",
          "Pendidikan Agama Khonghucu",
          "Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)",
          "Informatika",
          "Seni Rupa",
          "Seni Musik",
          "Seni Tari",
          "Seni Teater",
          "Prakarya Kerajinan",
          "Prakarya Rekayasa",
          "Prakarya Pengolahan",
          "Prakarya Budidaya",
          "Muatan Lokal"
        ],
        SMA: [
          "Pendidikan Pancasila",
          "Bahasa Indonesia",
          "Matematika",
          "Bahasa Inggris",
          "Pendidikan Agama Islam",
          "Pendidikan Agama Kristen",
          "Pendidikan Agama Katolik",
          "Pendidikan Agama Hindu",
          "Pendidikan Agama Buddha",
          "Pendidikan Agama Khonghucu",
          "Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)",
          "Sejarah",
          "Seni Rupa",
          "Seni Musik",
          "Seni Tari",
          "Seni Teater",
          "Fisika",
          "Kimia",
          "Biologi",
          "Sosiologi",
          "Ekonomi",
          "Geografi",
          "Antropologi",
          "Informatika"
        ],
        SMK: [
          "Pendidikan Pancasila",
          "Bahasa Indonesia",
          "Matematika",
          "Bahasa Inggris",
          "Pendidikan Agama Islam",
          "Pendidikan Agama Kristen",
          "Pendidikan Agama Katolik",
          "Pendidikan Agama Hindu",
          "Pendidikan Agama Buddha",
          "Pendidikan Agama Khonghucu",
          "Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)",
          "Sejarah",
          "Informatika",
          "Projek Ilmu Pengetahuan Alam dan Sosial (IPAS)",
          "Seni Rupa",
          "Seni Musik",
          "Seni Tari"
        ]
      }
    };
  });

  const handleSaveAdminConfig = (updated: AdminConfig) => {
    setAdminConfig(updated);
    localStorage.setItem('ciptajar_admin_config', JSON.stringify(updated));
  };
  const [asesmenConfig, setAsesmenConfig] = useState<AsesmenConfig | null>(() => {
    try {
      const saved = sessionStorage.getItem('ciptajar_asesmen_config');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [generatedAsesmen, setGeneratedAsesmen] = useState<GeneratedAsesmen | null>(() => {
    try {
      const saved = sessionStorage.getItem('ciptajar_generated_asesmen');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [asesmenView, setAsesmenView] = useState<'form' | 'result'>(() => {
    return (sessionStorage.getItem('ciptajar_asesmen_view') as any) || 'form';
  });
  const [isGeneratingAsesmen, setIsGeneratingAsesmen] = useState(false);

  // KOKURIKULER STATES
  const [kokurikulerFormData, setKokurikulerFormData] = useState<KokurikulerFormData | null>(() => {
    try {
      const saved = localStorage.getItem('ciptajar_kokurikuler_form_data');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [generatedKokurikuler, setGeneratedKokurikuler] = useState<GeneratedKokurikuler | null>(() => {
    try {
      const saved = sessionStorage.getItem('ciptajar_generated_kokurikuler');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [kokurikulerView, setKokurikulerView] = useState<'form' | 'result'>(() => {
    return (sessionStorage.getItem('ciptajar_kokurikuler_view') as any) || 'form';
  });
  const [isGeneratingKokurikuler, setIsGeneratingKokurikuler] = useState(false);
  const [isPhilosophyOpen, setIsPhilosophyOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [customLogo, setCustomLogo] = useState<string | null>(() => localStorage.getItem('ciptajar_custom_logo'));

  // Profil Customization States
  const [profileName, setProfileName] = useState(() => localStorage.getItem('ciptajar_profile_name') || "Fidhal Touna");
  const [profileAvatar, setProfileAvatar] = useState<string | null>(() => localStorage.getItem('ciptajar_profile_avatar'));
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isEditingProfileName, setIsEditingProfileName] = useState(false);
  const [tempProfileName, setTempProfileName] = useState("");

  // Sync state configuration changes to sessionStorage automatically
  useEffect(() => {
    sessionStorage.setItem('ciptajar_active_menu', activeMenu);
  }, [activeMenu]);

  useEffect(() => {
    sessionStorage.setItem('ciptajar_current_view', currentView);
  }, [currentView]);

  useEffect(() => {
    sessionStorage.setItem('ciptajar_asesmen_view', asesmenView);
  }, [asesmenView]);

  useEffect(() => {
    sessionStorage.setItem('ciptajar_kokurikuler_view', kokurikulerView);
  }, [kokurikulerView]);

  useEffect(() => {
    try {
      if (generatedKokurikuler) {
        sessionStorage.setItem('ciptajar_generated_kokurikuler', JSON.stringify(generatedKokurikuler));
      } else {
        sessionStorage.removeItem('ciptajar_generated_kokurikuler');
      }
    } catch (e) {
      console.warn("Storage quota exceeded for generatedKokurikuler:", e);
    }
  }, [generatedKokurikuler]);

  useEffect(() => {
    try {
      if (kokurikulerFormData) {
        localStorage.setItem('ciptajar_kokurikuler_form_data', JSON.stringify(kokurikulerFormData));
      } else {
        localStorage.removeItem('ciptajar_kokurikuler_form_data');
      }
    } catch (e) {
      console.warn(e);
    }
  }, [kokurikulerFormData]);

  useEffect(() => {
    try {
      if (generatedModul) {
        sessionStorage.setItem('ciptajar_generated_modul', JSON.stringify(generatedModul));
      } else {
        sessionStorage.removeItem('ciptajar_generated_modul');
      }
    } catch (e) {
      console.warn("Storage quota exceeded for generatedModul:", e);
    }
  }, [generatedModul]);

  useEffect(() => {
    try {
      if (generatedAsesmen) {
        sessionStorage.setItem('ciptajar_generated_asesmen', JSON.stringify(generatedAsesmen));
      } else {
        sessionStorage.removeItem('ciptajar_generated_asesmen');
      }
    } catch (e) {
      console.warn("Storage quota exceeded for generatedAsesmen:", e);
    }
  }, [generatedAsesmen]);

  useEffect(() => {
    try {
      if (asesmenConfig) {
        sessionStorage.setItem('ciptajar_asesmen_config', JSON.stringify(asesmenConfig));
      } else {
        sessionStorage.removeItem('ciptajar_asesmen_config');
      }
    } catch (e) {
      console.warn("Storage quota exceeded for asesmenConfig:", e);
    }
  }, [asesmenConfig]);

  const isDataUtamaChanged = (form1: ModulFormData | null, form2: ModulFormData | null | undefined) => {
    if (!form1 || !form2) return false;
    const fieldsToCompare: (keyof ModulFormData)[] = [
      'schoolName', 'teacherName', 'level', 'grade', 'semester', 'subject', 'material', 'tp'
    ];
    const anyFieldChanged = fieldsToCompare.some(f => {
      return String(form1[f] || '') !== String(form2[f] || '');
    });
    const mat1 = (form1.materials || []).filter(Boolean).join(",");
    const mat2 = (form2.materials || []).filter(Boolean).join(",");
    if (mat1 !== mat2) return true;
    const tp1 = (form1.tps || []).filter(Boolean).join(",");
    const tp2 = (form2.tps || []).filter(Boolean).join(",");
    if (tp1 !== tp2) return true;
    return anyFieldChanged;
  };

  useEffect(() => {
    if (generatedAsesmen && formData) {
      if (isDataUtamaChanged(formData, generatedAsesmen.formInput)) {
        console.log("[DATA UTAMA CHANGED] Clearing old assessment to force fresh generation.");
        setGeneratedAsesmen(null);
        sessionStorage.removeItem('ciptajar_generated_asesmen');
        setAsesmenConfig(null);
        sessionStorage.removeItem('ciptajar_asesmen_config');
        setAsesmenView('form');
      }
    }
  }, [formData, generatedAsesmen]);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Ukuran foto maksimal 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setProfileAvatar(base64String);
      localStorage.setItem('ciptajar_profile_avatar', base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Optional: Size limit check (2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("Ukuran logo maksimal 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setCustomLogo(base64String);
      localStorage.setItem('ciptajar_custom_logo', base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteLogo = () => {
    setCustomLogo(null);
    localStorage.removeItem('ciptajar_custom_logo');
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
    sessionStorage.setItem('ciptajar_is_logged_in', 'true');
  };
  
  const handleLogout = () => {
    setIsLoggedIn(false);
    sessionStorage.removeItem('ciptajar_is_logged_in');
    sessionStorage.removeItem('ciptajar_generated_modul');
    sessionStorage.removeItem('ciptajar_generated_asesmen');
    sessionStorage.removeItem('ciptajar_asesmen_config');
    sessionStorage.removeItem('ciptajar_current_view');
    sessionStorage.removeItem('ciptajar_active_menu');
    sessionStorage.removeItem('ciptajar_asesmen_view');
    sessionStorage.removeItem('ciptajar_generated_kokurikuler');
    sessionStorage.removeItem('ciptajar_kokurikuler_view');
    localStorage.removeItem('ciptajar_kokurikuler_form_data');
    setGeneratedModul(null);
    setFormData(null);
    setCurrentView('form');
    setGeneratedAsesmen(null);
    setAsesmenConfig(null);
    setAsesmenView('form');
    setGeneratedKokurikuler(null);
    setKokurikulerFormData(null);
    setKokurikulerView('form');
    setActiveMenu('dashboard');
    setIsProfileDropdownOpen(false);
  };

  const handleKokurikulerSubmit = async (data: KokurikulerFormData) => {
    setIsGeneratingKokurikuler(true);
    setKokurikulerFormData(data);
    try {
      const result = await generateKokurikuler(data);
      setGeneratedKokurikuler(result);
      setKokurikulerView('result');
    } catch (error) {
      alert("Terjadi kesalahan saat menyusun Perencanaan Kegiatan Kokurikuler. Silakan coba lagi.");
      console.error(error);
    } finally {
      setIsGeneratingKokurikuler(false);
    }
  };

  const handleUpdateKokurikuler = (updated: GeneratedKokurikuler) => {
    setGeneratedKokurikuler(updated);
  };

  const handleSubmit = async (data: ModulFormData) => {
    setIsLoading(true);
    setFormData(data);
    try {
      const result = await generateModulAjar(data);
      setGeneratedModul(result);
      
      // Simpan TP yang di-generate otomatis oleh AI kembali ke form data agar dapat digunakan di modul & kisi-kisi berikutnya
      const updatedData = { ...data, tp: result.desain.tp };
      setFormData(updatedData);
      localStorage.setItem('tm_generator_form_data', JSON.stringify(updatedData));
      
      setCurrentView('result'); // Alihkan ke halaman tabel hasil jika sukses
    } catch (error) {
      alert("Terjadi kesalahan saat generate modul. Silakan coba lagi.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAsesmenMenu = () => {
    try {
      const saved = localStorage.getItem('tm_generator_form_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        setFormData(parsed);
      }
    } catch (e) {
      console.error(e);
    }
    
    if (generatedAsesmen) {
      setAsesmenView('result');
    } else {
      setAsesmenView('form');
    }
    setActiveMenu('asesmen');
  };

  const handleAsesmenSubmit = async (config: AsesmenConfig) => {
    let activeForm = formData;
    try {
      const saved = localStorage.getItem('tm_generator_form_data');
      if (saved) {
        activeForm = JSON.parse(saved);
        setFormData(activeForm);
      }
    } catch (e) {
      console.error(e);
    }

    if (!activeForm || !activeForm.schoolName || !activeForm.teacherName || !activeForm.material) {
      alert("Silakan lengkapi Identitas & Isian Materi Pokok di Menu Data Utama terlebih dahulu agar data terkoneksi otomatis.");
      setActiveMenu('data');
      setCurrentView('form');
      return;
    }

    setIsGeneratingAsesmen(true);
    setAsesmenConfig(config);
    try {
      const result = await generateAsesmen(activeForm, config);
      result.formInput = activeForm; // Store the input form data used for generation
      setGeneratedAsesmen(result);
      setAsesmenView('result');
    } catch (error) {
      alert("Terjadi kesalahan saat menyusun asesmen Kurikulum Merdeka. Silakan coba lagi.");
      console.error(error);
    } finally {
      setIsGeneratingAsesmen(false);
    }
  };

  const handleUpdateAsesmen = (updated: GeneratedAsesmen) => {
    setGeneratedAsesmen(updated);
  };

  if (quizToken) {
    return (
      <StudentQuizView 
        quizToken={quizToken}
        onExit={() => {
          const url = new URL(window.location.href);
          url.searchParams.delete('quiz');
          window.history.replaceState({}, '', url.toString());
          setQuizToken(null);
        }}
      />
    );
  }

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navigation Rail / Header */}
      <nav className="no-print bg-gradient-to-r from-orange-600 via-amber-500 to-green-700 sticky top-0 z-50 px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          {/* Sidebar Toggle Button */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 -ml-2 text-orange-100 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer mr-2"
            title={isSidebarOpen ? "Sembunyikan Sidebar" : "Tampilkan Sidebar"}
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="relative group w-11 h-11 bg-white/10 rounded-xl flex items-center justify-center p-1 border border-white/25 transition-all hover:bg-white/15 overflow-visible">
            <img 
              src={customLogo || "/logo.png"} 
              alt="Logo" 
              className="w-full h-full object-contain select-none" 
            />
            {/* Overlay action controls */}
            <div className="absolute -bottom-1 -right-1.5 flex gap-1 z-10 scale-90 md:opacity-0 group-hover:opacity-100 transition-all duration-300">
              <label 
                htmlFor="school-logo-input"
                className="w-5 h-5 bg-teal-600 hover:bg-teal-700 hover:scale-105 text-white flex items-center justify-center rounded-full cursor-pointer shadow-md border border-white transition-all"
                title="Ganti Logo Sekolah"
              >
                <Upload className="w-3 h-3" />
              </label>
              {customLogo && (
                <button
                  type="button"
                  onClick={handleDeleteLogo}
                  className="w-5 h-5 bg-red-600 hover:bg-red-700 hover:scale-105 text-white flex items-center justify-center rounded-full cursor-pointer shadow-md border border-white transition-all"
                  title="Hapus Logo Kustom"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
            <input 
              id="school-logo-input"
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">SD NEGERI SUMOLI</h1>
            <p className="text-[10px] text-yellow-300 uppercase tracking-widest font-bold">CIPTA AJAR SUIT PRO</p>
          </div>
        </div>

        {/* Profile Dropdown Menu */}
        <div className="relative no-print z-50">
          <button
            onClick={() => {
              setTempProfileName(profileName);
              setIsProfileDropdownOpen(!isProfileDropdownOpen);
            }}
            className="flex items-center gap-2 text-white hover:bg-white/10 transition-all px-3 py-1.5 rounded-xl border border-white/20 font-bold text-xs select-none cursor-pointer"
          >
            {profileAvatar ? (
              <img 
                src={profileAvatar} 
                alt="Profile" 
                className="w-7 h-7 rounded-full object-cover border border-white/50 shrink-0" 
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-teal-500 text-white font-extrabold flex items-center justify-center border border-white/55 text-[10px] font-mono shadow-sm shrink-0">
                {profileName.substring(0, 2).toUpperCase()}
              </div>
            )}
            <span className="max-w-[120px] truncate hidden md:inline">{profileName}</span>
            <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200 shrink-0", isProfileDropdownOpen ? "rotate-180" : "rotate-0")} />
          </button>

          {isProfileDropdownOpen && (
            <>
              {/* Overlay Backdrop to close the dropdown */}
              <div 
                className="fixed inset-0 z-40 bg-transparent" 
                onClick={() => {
                  setIsProfileDropdownOpen(false);
                  setIsEditingProfileName(false);
                }} 
              />
              
              <div className="absolute right-0 mt-2.5 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 flex flex-col gap-4 text-slate-800 animate-fade-in">
                
                {/* Header Avatar Edit */}
                <div className="flex flex-col items-center gap-2.5 text-center p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="relative group w-16 h-16 rounded-full overflow-hidden border-2 border-teal-550 border-teal-500 hover:opacity-95 transition-opacity shadow-sm">
                    {profileAvatar ? (
                      <img 
                        src={profileAvatar} 
                        alt="Profile avatar" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-teal-500 text-white font-black text-xl flex items-center justify-center font-mono">
                        {profileName.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white text-[9px] font-extrabold cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>GANTI</span>
                      <span>FOTO</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleAvatarUpload} 
                        className="hidden" 
                      />
                    </label>
                  </div>
                  
                  {/* Name Edit */}
                  <div className="w-full">
                    {isEditingProfileName ? (
                      <div className="flex items-center gap-1.5 mt-1">
                        <input 
                          type="text"
                          value={tempProfileName}
                          onChange={(e) => setTempProfileName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              if (tempProfileName.trim()) {
                                setProfileName(tempProfileName.trim());
                                localStorage.setItem('ciptajar_profile_name', tempProfileName.trim());
                              }
                              setIsEditingProfileName(false);
                            } else if (e.key === 'Escape') {
                              setIsEditingProfileName(false);
                            }
                          }}
                          placeholder="Nama Profil"
                          className="w-full border border-teal-300 rounded-lg px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-teal-500 bg-white"
                          autoFocus
                        />
                        <button
                          onClick={() => {
                            if (tempProfileName.trim()) {
                              setProfileName(tempProfileName.trim());
                              localStorage.setItem('ciptajar_profile_name', tempProfileName.trim());
                            }
                            setIsEditingProfileName(false);
                          }}
                          className="bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-bold px-2 py-1 rounded-md shrink-0 cursor-pointer"
                        >
                          Simpan
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-1">
                        <div className="font-extrabold text-xs text-slate-800 tracking-tight truncate max-w-[170px]">{profileName}</div>
                        <button
                          onClick={() => {
                            setTempProfileName(profileName);
                            setIsEditingProfileName(true);
                          }}
                          className="p-1 text-slate-400 hover:text-teal-600 transition-colors rounded-md hover:bg-white cursor-pointer"
                          title="Ubah Nama"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                      </div>
                    )}
                    <span className="text-[8.5px] text-slate-400 font-bold uppercase tracking-wider leading-none">Pendidik Profesional</span>
                  </div>
                </div>

                {/* Dropdown Options */}
                <div className="flex flex-col gap-1.5">
                  <a
                    href="https://wa.me/6285796566825?text=Halo%20Admin%20Cipta%20Ajar,%20saya%20butuh%20bantuan%20mengenai%20aplikasi%20Cipta%20Ajar."
                    target="_blank"
                    rel="noreferrer noopener"
                    className="flex items-center gap-2 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-150 text-emerald-800 font-bold text-xs rounded-xl transition-all shadow-sm shadow-emerald-500/5 justify-center cursor-pointer select-none"
                  >
                    <svg className="w-4 h-4 shrink-0 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.022-.015-.022-.015-.55-.278-.528-.26-1.24-.61-1.39-.69-.15-.08-.26-.12-.37.04s-.43.55-.53.66c-.1.12-.2.13-.42.03-.22-.12-.93-.34-1.78-1.1-.66-.59-1.11-1.32-1.24-1.54-.13-.22-.01-.34.1-.45.1-.1.22-.26.33-.39.11-.13.15-.22.22-.37.07-.15.03-.28-.02-.38-.05-.1-.47-1.14-.64-1.57-.17-.4-.34-.34-.47-.35-.13 0-.27-.01-.41-.01-.14 0-.37.05-.56.26-.2.2-1.74 1.71-1.74 4.18s1.8 4.88 2.05 5.22c.24.33 3.53 5.39 8.54 7.57 1.2.52 2.14.83 2.88 1.06 1.2.38 2.29.33 3.16.2 1-.15 3.06-1.25 3.5-2.45.43-1.2.43-2.23.3-2.45-.13-.22-.49-.36-.71-.47zm.4.2c.22.12.58.26.71.47.13.22.13 1.25-.3 2.45-.44 1.2-2.5 2.3-3.5 2.45-.87.13-1.96.18-3.16-.2-5.01-2.18-8.3-7.24-8.54-7.57-.25-.34-2.05-2.75-2.05-5.22s1.54-3.98 1.74-4.18c.19-.21.42-.26.56-.26.14 0 .28.01.41.01.13.01.3.05.47.35.17.43.59 1.47.64 1.57.05.1.09.23.02.38-.07.15-.11.24-.22.37-.11.13-.23.29-.33.39-.11.11-.23.23-.1.45.13.22.58.95 1.24 1.54.85.76 1.56.98 1.78 1.1.22.1.32.09.42-.03.1-.11.43-.5.53-.66.11-.11.22-.12.37-.04.15.08.86.43 1.39.69.52.26.52.26.55.27.02.11-.34.4-.71.47z" />
                    </svg>
                    Butuh Bantuan?
                  </a>

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-rose-50 text-rose-600 font-bold text-xs rounded-xl transition-all justify-center border border-transparent hover:border-rose-100 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 shrink-0" />
                    Logout
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </nav>

      {/* Main Container with Collapsible Sidebar and Content Area */}
      <div className="flex-1 flex flex-col md:flex-row relative min-h-[calc(100vh-72.8px)]">
        
        {/* Collapsible Sidebar */}
        <aside 
          className={cn(
            "no-print shrink-0 border-r border-slate-200 bg-white flex flex-col transition-all duration-300 ease-in-out overflow-hidden z-40 md:sticky md:top-[72.8px] md:h-[calc(100vh-72.8px)] md:overflow-y-auto",
            isSidebarOpen 
              ? "w-full md:w-72 opacity-100" 
              : "w-0 opacity-0 pointer-events-none md:border-r-0"
          )}
        >
          {/* Inner wrapper to maintain size when collapsing */}
          <div className="w-full md:w-72 p-5 flex flex-col justify-between h-full space-y-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">MENU NAVIGASI</span>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  title="Sembunyikan Menu"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>

              {/* Navigation Options */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    setActiveMenu('dashboard');
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs transition-all cursor-pointer justify-start text-left",
                    activeMenu === 'dashboard'
                      ? "bg-gradient-to-r from-orange-500 via-amber-400 to-green-600 text-white shadow-md shadow-orange-500/15"
                      : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/50"
                  )}
                >
                  <LayoutDashboard className="w-4 h-4 shrink-0" />
                  <span>Dashboard Utama</span>
                </button>

                <button
                  onClick={() => {
                    setActiveMenu('data');
                    setCurrentView('form');
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs transition-all cursor-pointer justify-start text-left",
                    activeMenu === 'data'
                      ? "bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-md shadow-orange-600/15"
                      : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/50"
                  )}
                >
                  <FileText className="w-4 h-4 shrink-0" />
                  <span>1. Data Utama (Identitas)</span>
                </button>

                <button
                  onClick={() => {
                    setActiveMenu('modul');
                    if (!generatedModul) {
                      setCurrentView('form');
                    }
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs transition-all cursor-pointer justify-start text-left",
                    activeMenu === 'modul'
                      ? "bg-gradient-to-r from-orange-500 to-green-600 text-white shadow-md shadow-orange-500/15"
                      : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/50"
                  )}
                >
                  <Layers className="w-4 h-4 shrink-0" />
                  <span>2. Modul & RPPM</span>
                </button>

                <button
                  onClick={handleSelectAsesmenMenu}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs transition-all cursor-pointer justify-start text-left",
                    activeMenu === 'asesmen'
                      ? "bg-gradient-to-r from-amber-500 via-green-600 to-emerald-700 text-white shadow-md shadow-green-600/15"
                      : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/50"
                  )}
                >
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>3. Asesmen Kurikulum</span>
                </button>

                <button
                  onClick={() => {
                    setActiveMenu('kokurikuler');
                    if (generatedKokurikuler) {
                      setKokurikulerView('result');
                    } else {
                      setKokurikulerView('form');
                    }
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs transition-all cursor-pointer justify-start text-left",
                    activeMenu === 'kokurikuler'
                      ? "bg-gradient-to-r from-green-600 to-emerald-800 text-white shadow-md shadow-green-700/15"
                      : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/50"
                  )}
                >
                  <ClipboardCheck className="w-4 h-4 shrink-0" />
                  <span>4. Modul Kokurikuler</span>
                </button>
              </div>

              <hr className="border-slate-100" />

              {/* Clickable Banner right under the Assessment menu */}
              <div className="space-y-2">
                <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase block">INFO & FILOSOFI LOGO</span>
                <div 
                  onClick={() => setIsPhilosophyOpen(true)}
                  title="Klik untuk melihat arti dan filosofi logo Cipta Ajar"
                  className="w-full overflow-hidden rounded-xl shadow-sm border border-slate-150 cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98] duration-300 relative group"
                >
                  <img 
                    src="/banner.png" 
                    alt="Banner Utama Cipta Ajar" 
                    className="w-full h-auto object-contain select-none block"
                    referrerPolicy="no-referrer"
                  />
                  {/* Hover visual label decoration */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center p-2 rounded-xl">
                    <span className="bg-white/95 text-blue-900 text-[9px] font-bold px-2 py-1 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-1 border border-slate-100 whitespace-nowrap">
                      <Sparkles className="w-2.5 h-2.5 text-amber-500 animate-pulse" /> Filosofi Logo
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar Bottom Metadata */}
            <div className="pt-4 border-t border-slate-100 text-[10px] text-slate-400 leading-snug">
              <p className="font-bold text-slate-500">SD NEGERI SUMOLI</p>
              <p>Kurikulum Merdeka</p>
            </div>
          </div>
        </aside>

        {/* Floating Toggle Button when sidebar is collapsed */}
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="no-print absolute top-4 left-4 z-40 bg-white hover:bg-slate-50 text-slate-700 font-bold p-2 md:p-2.5 rounded-xl border border-slate-200 shadow-md transition-all cursor-pointer flex items-center gap-1 px-3"
            title="Tampilkan Menu"
          >
            <Menu className="w-4 h-4 text-blue-900 animate-pulse" />
            <span className="text-[11px]">Tampilkan Menu</span>
          </button>
        )}

        {/* Content Panel Area */}
        <div className="flex-1 min-w-0 flex flex-col justify-between overflow-x-hidden">
          <main className={cn(
            "max-w-5xl mx-auto px-4 md:px-6 w-full py-8",
            !isSidebarOpen ? "pt-16" : "pt-8"
          )}>
            <AnimatePresence mode="wait">
              {activeMenu === 'dashboard' ? (
                <motion.div
                  key="dashboard-view"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                >
                  <Dashboard 
                    profileName={profileName}
                    hasMainData={!!(formData && formData.schoolName && formData.teacherName)}
                    hasModul={!!generatedModul}
                    hasAsesmen={!!generatedAsesmen}
                    hasKokurikuler={!!generatedKokurikuler}
                    onNavigateMenu={(menu) => {
                      if (menu === 'asesmen') {
                        handleSelectAsesmenMenu();
                      } else if (menu === 'kokurikuler') {
                        setActiveMenu('kokurikuler');
                        if (generatedKokurikuler) {
                          setKokurikulerView('result');
                        } else {
                          setKokurikulerView('form');
                        }
                      } else {
                        setActiveMenu(menu);
                        if (menu === 'data' || menu === 'modul') {
                          setCurrentView('form');
                        }
                      }
                    }}
                  />
                </motion.div>
              ) : activeMenu === 'data' ? (
                <motion.div
                  key="data-form"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-8"
                >
                  <div className="text-center space-y-2 mb-12">
                    <h2 className="text-4xl font-extrabold text-blue-900 tracking-tight">Pengisian Data Utama</h2>
                    <p className="text-teal-800 max-w-xl mx-auto font-medium">
                      Atur Identitas Satuan Pendidikan, Informasi Pembelajaran, dan Isian Materi Pokok Pembelajaran terlebih dahulu.
                    </p>
                  </div>
                  <GeneratorForm 
                    onSubmit={handleSubmit} 
                    isLoading={isLoading} 
                    savedData={formData} 
                    activeSection="data"
                    onNavigateSection={(sec) => {
                      if (sec === 'modul') {
                        setActiveMenu('modul');
                        setCurrentView('form');
                      } else {
                        setActiveMenu('data');
                      }
                    }}
                    onViewPrevious={() => setCurrentView('result')} 
                    adminConfig={adminConfig}
                    onUpdateAdminConfig={handleSaveAdminConfig}
                  />
                </motion.div>
              ) : activeMenu === 'modul' ? (
                currentView === 'form' ? (
                  <motion.div
                    key="modul-form"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="space-y-8"
                  >
                    <div className="text-center space-y-2 mb-12">
                      <h2 className="text-4xl font-extrabold text-blue-900 tracking-tight">Penyusunan Modul Ajar (RPPM)</h2>
                      <p className="text-teal-800 max-w-xl mx-auto font-medium">
                        Atur model pertemuan, durasi per sesi pengerjaan murni, dan dimensi lulusan sebelum generate.
                      </p>
                    </div>
                    
                    <GeneratorForm 
                      onSubmit={handleSubmit} 
                      isLoading={isLoading} 
                      savedData={formData} 
                      activeSection="modul"
                      onNavigateSection={(sec) => {
                        if (sec === 'data') {
                          setActiveMenu('data');
                        } else {
                          setActiveMenu('modul');
                        }
                      }}
                      onViewPrevious={() => setCurrentView('result')} 
                      adminConfig={adminConfig}
                      onUpdateAdminConfig={handleSaveAdminConfig}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="modul-result"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    {/* Visual connection to Assessment */}
                    <div className="mb-6 p-5 bg-gradient-to-r from-blue-50 to-teal-50 border border-blue-200/50 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 no-print shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold font-sans shadow-sm">
                          <Sparkles className="w-5 h-5 animate-pulse" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm">Menyusun Asesmen Kurikulum Merdeka Terkoneksi</h3>
                          <p className="text-xs text-slate-600">Sempurnakan materi dengan lembar kisi-kisi, kunci jawaban, dan rubrik penilaian terpisah.</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          handleSelectAsesmenMenu();
                        }}
                        className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
                      >
                        Mulai Susun Asesmen <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <ModulTable 
                      data={generatedModul!} 
                      formInput={formData!} 
                      onBack={() => setCurrentView('form')} 
                    />
                  </motion.div>
                )
              ) : activeMenu === 'asesmen' ? (
                // MENU PENYUSUNAN ASESMEN
                asesmenView === 'form' ? (
                  <motion.div
                    key="asesmen-form"
                    initial={{ opacity: 0, x: -25 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 25 }}
                    className="space-y-8"
                  >
                    <div className="text-center space-y-2 mb-12">
                      <h2 className="text-4xl font-extrabold text-teal-900 tracking-tight">Susun Asesmen Baru</h2>
                      <p className="text-teal-800 max-w-xl mx-auto font-medium">
                        Atur spesifikasi, tipe, dan level kognitif soal (LOTS, MOTS, HOTS) berdasarkan materi ajar yang aktif.
                      </p>
                    </div>

                    {(!formData || !formData.schoolName || !formData.materials || formData.materials.filter(Boolean).length === 0) ? (
                      <div className="glass p-8 rounded-[1.5rem] text-center border-2 border-dashed border-slate-200 max-w-2xl mx-auto space-y-4">
                        <ClipboardCheck className="w-12 h-12 text-slate-400 mx-auto" />
                        <h3 className="text-lg font-bold text-slate-800">Form Identitas & Materi Pokok Belum Lengkap</h3>
                        <p className="text-sm text-slate-600 leading-relaxed">
                          Layanan Asesmen terintegrasi langsung dengan draf dan materi pokok di form Modul Ajar. Silakan lengkapi Identitas Satuan, Nama Guru, dan Materi Pokok terlebih dahulu di halaman Data Utama.
                        </p>
                        <button
                          onClick={() => {
                            setActiveMenu('data');
                            setCurrentView('form');
                          }}
                          className="bg-blue-900 hover:bg-blue-950 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer inline-flex items-center gap-1.5"
                        >
                          Buka Menu Data Utama
                        </button>
                      </div>
                    ) : (
                      <AsesmenForm
                        formData={formData}
                        onSubmit={handleAsesmenSubmit}
                        isLoading={isGeneratingAsesmen}
                        savedConfig={asesmenConfig}
                      />
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="asesmen-result"
                    initial={{ opacity: 0, x: 25 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -25 }}
                  >
                    <AsesmenResult
                      data={generatedAsesmen!}
                      formInput={formData!}
                      onBack={() => setAsesmenView('form')}
                      config={asesmenConfig}
                      onUpdateAsesmen={handleUpdateAsesmen}
                    />
                  </motion.div>
                )
              ) : activeMenu === 'kokurikuler' ? (
                kokurikulerView === 'form' ? (
                  <motion.div
                    key="kokurikuler-form"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="space-y-8"
                  >
                    <div className="text-center space-y-2 mb-12">
                      <h2 className="text-4xl font-extrabold text-teal-900 tracking-tight">Modul Kegiatan Kokurikuler</h2>
                      <p className="text-teal-800 max-w-xl mx-auto font-medium">
                        Rancang perencanaan kegiatan kokurikuler yang bermakna sesuai Panduan Kokurikuler Tahun 2025.
                      </p>
                    </div>

                    <KokurikulerForm
                      formData={formData}
                      onSubmit={handleKokurikulerSubmit}
                      isLoading={isGeneratingKokurikuler}
                      savedData={kokurikulerFormData}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="kokurikuler-result"
                    initial={{ opacity: 0, x: 25 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -25 }}
                  >
                    <KokurikulerResult
                      data={generatedKokurikuler!}
                      formInput={kokurikulerFormData!}
                      onBack={() => setKokurikulerView('form')}
                      onUpdateData={handleUpdateKokurikuler}
                    />
                  </motion.div>
                )
              ) : (
                <motion.div
                  key="admin-view"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                >
                  <AdminPanel
                    config={adminConfig}
                    onSaveConfig={handleSaveAdminConfig}
                    onBack={() => setActiveMenu('dashboard')}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          <footer className="no-print mt-auto border-t border-slate-100 py-8 text-center bg-white">
            <p className="text-xs font-bold text-teal-800 uppercase tracking-widest select-none">
              CIPTA AJAR SUIT © {new Date().getFullYear()} • <span onClick={() => setActiveMenu('admin')} className="text-amber-600 hover:text-amber-700 font-bold cursor-pointer transition-colors hover:underline" title="Akses Admin Kontrol">Fidhal Touna AI</span>
            </p>
            <p className="text-[10px] text-blue-500 mt-1">
              version : 2026.7.1
            </p>
          </footer>
        </div>
      </div>

      {/* Render Philosophy Modal only when active is true */}
      <AnimatePresence>
        {isPhilosophyOpen && (
          <LogoPhilosophyModal 
            isOpen={isPhilosophyOpen} 
            onClose={() => setIsPhilosophyOpen(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
