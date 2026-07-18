import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Send, Plus, Minus, School, User as UserIcon, Briefcase, GraduationCap, Calendar, Clock, BookOpen, Layers, Trash2, FileText, RefreshCw, ArrowRight } from 'lucide-react';
import { ModulFormData, AdminConfig } from '../types';
import { cn } from '../lib/utils';
import { getCPList } from '../data/cp_data';
import { syncGoogleSheetsCP, fetchKontrolSheet, KontrolRow } from '../lib/sheets';

// Daftar sekolah yang diperbolehkan
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

// Daftar nama guru yang diperbolehkan (Gunakan huruf kapital/uppercase untuk konsistensi)
const ALLOWED_TEACHERS = [
  "Widya Agista Eka Pradita, S.E",
  "WIDYA AGISTA EKA PRADITA, S.E",
  "Widya Agista Eka Pradita,S.E"
];

interface GeneratorFormProps {
  onSubmit: (data: ModulFormData) => void;
  isLoading: boolean;
  savedData?: ModulFormData | null; 
  onViewPrevious?: () => void; 
  activeSection: 'data' | 'modul';
  onNavigateSection?: (section: 'data' | 'modul') => void;
  adminConfig?: AdminConfig;
  onUpdateAdminConfig?: (updatedConfig: AdminConfig) => void;
}

const DIMENSI_LULUSAN = [
  'Keimanan & Ketakwaan', 'Kewargaan', 'Penalaran Kritis', 'Kreativitas', 
  'Kolaborasi', 'Kemandirian', 'Kesehatan', 'Komunikasi'
];

const PEDAGOGY_OPTIONS = [
  'Inkuiri-Discovery', 'PjBL', 'Problem Solving', 'Game Based Learning', 'Station Learning'
];

const GRADES_BY_LEVEL: Record<'SD' | 'SMP' | 'SMA' | 'SMK', string[]> = {
  SD: ['1', '2', '3', '4', '5', '6'],
  SMP: ['7', '8', '9'],
  SMA: ['10', '11', '12'],
  SMK: ['10', '11', '12']
};

export const SUBJECTS_BY_LEVEL: Record<'SD' | 'SMP' | 'SMA' | 'SMK', string[]> = {
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
    "Seni Tari",
    "Seni Teater",
    "Dasar-Dasar Program Keahlian",
    "Konsentrasi Keahlian",
    "Projek Kreatif dan Kewirausahaan (PKK)",
    "Praktik Kerja Lapangan (PKL)"
  ]
};

const SD_GURU_KELAS_SUBJECTS = [
  "Bahasa Indonesia",
  "Matematika",
  "Ilmu Pengetahuan Alam dan Sosial (IPAS)",
  "Pendidikan Pancasila",
  "Seni Rupa",
  "Seni Musik",
  "Seni Tari",
  "Seni Teater"
];

const detectLevelFromSchoolName = (schoolName: string): 'SD' | 'SMP' | 'SMA' | 'SMK' | null => {
  if (!schoolName) return null;
  const upper = schoolName.toUpperCase();
  
  if (/\bSD\b|\bSDN\b|\bSDS\b|SEKOLAH DASAR/i.test(upper)) {
    return 'SD';
  }
  if (/\bSMP\b|\bSMPN\b|\bSMPS\b|SEKOLAH MENENGAH PERTAMA/i.test(upper)) {
    return 'SMP';
  }
  if (/\bSMA\b|\bSMAN\b|\bSMAS\b|SEKOLAH MENENGAH ATAS/i.test(upper)) {
    return 'SMA';
  }
  if (/\bSMK\b|\bSMKN\b|\bSMKS\b|SEKOLAH MENENGAH KEJURUAN/i.test(upper)) {
    return 'SMK';
  }
  
  if (upper.includes('SDN') || upper.includes('SD ')) {
    return 'SD';
  }
  if (upper.includes('SMPN') || upper.includes('SMP ')) {
    return 'SMP';
  }
  if (upper.includes('SMAN') || upper.includes('SMA ')) {
    return 'SMA';
  }
  if (upper.includes('SMKN') || upper.includes('SMK ')) {
    return 'SMK';
  }
  
  return null;
};

const normalizeStr = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '').trim();

const getFilteredSubjects = (level: string, position: string, adminConfig?: AdminConfig, hasKontrolMatch?: boolean): string[] => {
  let allSubjects = SUBJECTS_BY_LEVEL[level as 'SD' | 'SMP' | 'SMA' | 'SMK'] || [];
  if (adminConfig && adminConfig.enabledSubjects && adminConfig.enabledSubjects[level as 'SD' | 'SMP' | 'SMA' | 'SMK']) {
    allSubjects = adminConfig.enabledSubjects[level as 'SD' | 'SMP' | 'SMA' | 'SMK'];
  }
  
  if (hasKontrolMatch) {
    return allSubjects;
  }
  
  if (level !== 'SD') {
    return allSubjects;
  }
  
  const isGuruKelas = position === 'Guru Kelas' || position === 'Wali Kelas';
  const isGuruMapel = position === 'Guru Mata Pelajaran';
  
  if (isGuruKelas) {
    return allSubjects.filter(sub => SD_GURU_KELAS_SUBJECTS.includes(sub));
  } else if (isGuruMapel) {
    return allSubjects.filter(sub => !SD_GURU_KELAS_SUBJECTS.includes(sub));
  }
  
  return allSubjects;
};

export default function GeneratorForm({ onSubmit, isLoading, savedData, onViewPrevious, activeSection, onNavigateSection, adminConfig, onUpdateAdminConfig }: GeneratorFormProps) {
  const [formData, setFormData] = useState<ModulFormData>(() => {
    try {
      const localData = localStorage.getItem('tm_generator_form_data');
      if (localData) {
        const parsed = JSON.parse(localData);
        if (!parsed.materials) {
          parsed.materials = parsed.material ? [parsed.material] : [''];
        }
        if (!parsed.tps) {
          parsed.tps = parsed.tp ? [parsed.tp] : [''];
        }
        return parsed;
      }
    } catch (e) {
      console.error("Gagal memuat data dari localStorage", e);
    }

    const initialLevel = savedData?.level || 'SD';
    const initMaterials = savedData?.materials || (savedData?.material ? [savedData.material] : ['']);
    const initTps = savedData?.tps || (savedData?.tp ? [savedData.tp] : ['']);
    return {
      schoolName: savedData?.schoolName || '',
      teacherName: savedData?.teacherName || '',
      teacherNip: savedData?.teacherNip || '',
      position: savedData?.position || 'Guru Kelas',
      principalName: savedData?.principalName || '',
      principalNip: savedData?.principalNip || '',
      signaturePlace: savedData?.signaturePlace || '',
      level: initialLevel,
      grade: savedData?.grade || GRADES_BY_LEVEL[initialLevel][0],
      semester: savedData?.semester || 'I / Ganjil',
      subject: savedData?.subject || SUBJECTS_BY_LEVEL[initialLevel][0],
      cp: savedData?.cp || '',
      tp: savedData?.tp || '',
      tps: initTps,
      material: savedData?.material || '',
      materials: initMaterials,
      meetings: savedData?.meetings || 1,
      duration: savedData?.duration || '',
      pedagogy: savedData?.pedagogy || [],
      dimensi: savedData?.dimensi || []
    };
  });

  const [isCustomSubject, setIsCustomSubject] = useState(() => {
    const levelVal = formData.level || 'SD';
    const currentSubjects = SUBJECTS_BY_LEVEL[levelVal] || [];
    return formData.subject ? !currentSubjects.includes(formData.subject) : false;
  });

  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncErrorMessage, setSyncErrorMessage] = useState<string>("");
  const [syncTrigger, setSyncTrigger] = useState<number>(0);
  const [lastSyncedTime, setLastSyncedTime] = useState<string>(() => {
    return localStorage.getItem('cp_sheet_last_synced') || "";
  });

  useEffect(() => {
    const performSyncOnMount = async () => {
      setSyncStatus('syncing');
      const res = await syncGoogleSheetsCP();
      if (res.success) {
        setSyncStatus('success');
        setLastSyncedTime(localStorage.getItem('cp_sheet_last_synced') || "");
      } else {
        setSyncStatus('error');
        setSyncErrorMessage(res.error || "");
      }
    };
    
    performSyncOnMount();

    const handleSyncedEvent = () => {
      setSyncTrigger(prev => prev + 1);
      setLastSyncedTime(localStorage.getItem('cp_sheet_last_synced') || "");
    };

    window.addEventListener('cp_database_synced', handleSyncedEvent);
    return () => window.removeEventListener('cp_database_synced', handleSyncedEvent);
  }, []);

  useEffect(() => {
    localStorage.setItem('tm_generator_form_data', JSON.stringify(formData));
  }, [formData]);

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

  const typedSchool = normalizeStr(formData.schoolName);
  const typedTeacher = normalizeStr(formData.teacherName);
  
  const hasKontrolMatch = kontrolRows.length > 0 && !!formData.schoolName && !!formData.teacherName && kontrolRows.some(row => 
    normalizeStr(row.schoolName) === typedSchool &&
    normalizeStr(row.teacherName) === typedTeacher
  );

  // Auto-update adminConfig when schoolName/teacherName matches any KONTROL spreadsheet row
  useEffect(() => {
    if (!onUpdateAdminConfig || !adminConfig) {
      return;
    }
    
    // Default configs for resetting
    const defaultPositions = ['Guru Kelas', 'Guru Mata Pelajaran', 'Wali Kelas'];
    const defaultSubjects = SUBJECTS_BY_LEVEL;
    
    if (!formData.schoolName || !formData.teacherName || kontrolRows.length === 0) {
      // Revert/Reset if input is cleared
      const sortedDefaultPositions = [...defaultPositions].sort();
      const sortedAdminPositions = [...adminConfig.enabledPositions].sort();
      const positionsChanged = JSON.stringify(sortedDefaultPositions) !== JSON.stringify(sortedAdminPositions);
      
      const subjectsChanged = 
        JSON.stringify([...(adminConfig.enabledSubjects?.SD || [])].sort()) !== JSON.stringify([...defaultSubjects.SD].sort()) ||
        JSON.stringify([...(adminConfig.enabledSubjects?.SMP || [])].sort()) !== JSON.stringify([...defaultSubjects.SMP].sort()) ||
        JSON.stringify([...(adminConfig.enabledSubjects?.SMA || [])].sort()) !== JSON.stringify([...defaultSubjects.SMA].sort()) ||
        JSON.stringify([...(adminConfig.enabledSubjects?.SMK || [])].sort()) !== JSON.stringify([...defaultSubjects.SMK].sort());
        
      if (positionsChanged || subjectsChanged) {
        onUpdateAdminConfig({
          ...adminConfig,
          enabledPositions: defaultPositions,
          enabledSubjects: {
            SD: [...defaultSubjects.SD],
            SMP: [...defaultSubjects.SMP],
            SMA: [...defaultSubjects.SMA],
            SMK: [...defaultSubjects.SMK]
          }
        });
      }
      return;
    }
    
    const matches = kontrolRows.filter(row => 
      normalizeStr(row.schoolName) === typedSchool &&
      normalizeStr(row.teacherName) === typedTeacher
    );
    
    if (matches.length === 0) {
      // Revert/Reset if no match found
      const sortedDefaultPositions = [...defaultPositions].sort();
      const sortedAdminPositions = [...adminConfig.enabledPositions].sort();
      const positionsChanged = JSON.stringify(sortedDefaultPositions) !== JSON.stringify(sortedAdminPositions);
      
      const subjectsChanged = 
        JSON.stringify([...(adminConfig.enabledSubjects?.SD || [])].sort()) !== JSON.stringify([...defaultSubjects.SD].sort()) ||
        JSON.stringify([...(adminConfig.enabledSubjects?.SMP || [])].sort()) !== JSON.stringify([...defaultSubjects.SMP].sort()) ||
        JSON.stringify([...(adminConfig.enabledSubjects?.SMA || [])].sort()) !== JSON.stringify([...defaultSubjects.SMA].sort()) ||
        JSON.stringify([...(adminConfig.enabledSubjects?.SMK || [])].sort()) !== JSON.stringify([...defaultSubjects.SMK].sort());
        
      if (positionsChanged || subjectsChanged) {
        onUpdateAdminConfig({
          ...adminConfig,
          enabledPositions: defaultPositions,
          enabledSubjects: {
            SD: [...defaultSubjects.SD],
            SMP: [...defaultSubjects.SMP],
            SMA: [...defaultSubjects.SMA],
            SMK: [...defaultSubjects.SMK]
          }
        });
      }
      return;
    }
    
    // 1. Get positions from matching rows
    const sheetPositions = Array.from(new Set(
      matches
        .map(m => m.position)
        .filter(Boolean)
    ));
    
    // Map sheet positions to standard positions
    const standardPositions = ['Guru Kelas', 'Guru Mata Pelajaran', 'Wali Kelas'];
    const positionsToEnable = standardPositions.filter(pos => 
      sheetPositions.some(sp => normalizeStr(sp) === normalizeStr(pos))
    );
    
    const finalPositions = positionsToEnable.length > 0 ? positionsToEnable : adminConfig.enabledPositions;
    
    // 2. Get subjects per level from matching rows. Default to standard subjects for non-matched levels.
    const finalSubjects = {
      SD: [...SUBJECTS_BY_LEVEL.SD],
      SMP: [...SUBJECTS_BY_LEVEL.SMP],
      SMA: [...SUBJECTS_BY_LEVEL.SMA],
      SMK: [...SUBJECTS_BY_LEVEL.SMK],
    };
    
    // Track levels that were matched so we can update them
    const matchedLevels = new Set<string>();
    matches.forEach(m => {
      if (m.level) {
        matchedLevels.add(m.level.toUpperCase());
      }
    });
    
    matchedLevels.forEach(lvl => {
      const matchedLvl = lvl as 'SD' | 'SMP' | 'SMA' | 'SMK';
      if (['SD', 'SMP', 'SMA', 'SMK'].includes(matchedLvl)) {
        const rawSheetSubjects = matches
          .filter(m => m.level.toUpperCase() === matchedLvl)
          .flatMap(m => m.subject ? m.subject.split(/[,;\n\r]/) : [])
          .map(s => s.trim())
          .filter(Boolean);
          
        if (rawSheetSubjects.length > 0) {
          const standardList = SUBJECTS_BY_LEVEL[matchedLvl] || [];
          const finalLvlSubjects = Array.from(new Set(
            rawSheetSubjects.map(sub => {
              const normalizedSub = sub.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
              if (!normalizedSub) return sub;
              
              // Try exact normalized match first
              let matchedStandard = standardList.find(std => 
                std.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedSub
              );
              
              // Try partial/fuzzy match if not matched
              if (!matchedStandard && normalizedSub.length > 3) {
                matchedStandard = standardList.find(std => {
                  const stdNorm = std.toLowerCase().replace(/[^a-z0-9]/g, '');
                  return stdNorm.includes(normalizedSub) || normalizedSub.includes(stdNorm);
                });
              }
              
              return matchedStandard || sub;
            })
          ));
          
          finalSubjects[matchedLvl] = finalLvlSubjects;
        } else {
          // If level matched but no subjects specified, default to ALL standard subjects for that level
          finalSubjects[matchedLvl] = [...SUBJECTS_BY_LEVEL[matchedLvl]];
        }
      }
    });
    
    const sortedFinalSubjects = {
      SD: [...(finalSubjects.SD || [])].sort(),
      SMP: [...(finalSubjects.SMP || [])].sort(),
      SMA: [...(finalSubjects.SMA || [])].sort(),
      SMK: [...(finalSubjects.SMK || [])].sort(),
    };
    
    const sortedAdminSubjects = {
      SD: [...(adminConfig.enabledSubjects?.SD || [])].sort(),
      SMP: [...(adminConfig.enabledSubjects?.SMP || [])].sort(),
      SMA: [...(adminConfig.enabledSubjects?.SMA || [])].sort(),
      SMK: [...(adminConfig.enabledSubjects?.SMK || [])].sort(),
    };
    
    const positionsChanged = JSON.stringify(finalPositions.sort()) !== JSON.stringify(adminConfig.enabledPositions.sort());
    const subjectsChanged = JSON.stringify(sortedFinalSubjects) !== JSON.stringify(sortedAdminSubjects);
    
    if (positionsChanged || subjectsChanged) {
      onUpdateAdminConfig({
        ...adminConfig,
        enabledPositions: finalPositions,
        enabledSubjects: {
          SD: sortedFinalSubjects.SD,
          SMP: sortedFinalSubjects.SMP,
          SMA: sortedFinalSubjects.SMA,
          SMK: sortedFinalSubjects.SMK,
        }
      });
    }
  }, [formData.schoolName, formData.teacherName, kontrolRows, adminConfig, onUpdateAdminConfig, typedSchool, typedTeacher]);

  // Auto-detect level from school name and auto-select
  useEffect(() => {
    const detected = detectLevelFromSchoolName(formData.schoolName);
    if (detected && detected !== formData.level) {
      const subjects = getFilteredSubjects(detected, formData.position, adminConfig, hasKontrolMatch);
      setFormData(prev => ({
        ...prev,
        level: detected,
        grade: GRADES_BY_LEVEL[detected][0],
        subject: subjects[0] || ''
      }));
      setIsCustomSubject(false);
    }
  }, [formData.schoolName]);

  // Adjust subject when position or level changes for SD
  useEffect(() => {
    const currentLevel = formData.level;
    const currentPosition = formData.position;
    const filtered = getFilteredSubjects(currentLevel, currentPosition, adminConfig, hasKontrolMatch);
    
    if (currentLevel === 'SD' && !isCustomSubject) {
      if (formData.subject && !filtered.includes(formData.subject)) {
        setFormData(prev => ({
          ...prev,
          subject: filtered[0] || ''
        }));
      }
    }
  }, [formData.level, formData.position, isCustomSubject, adminConfig, hasKontrolMatch]);

  // Sync position if it becomes disabled by adminConfig
  useEffect(() => {
    if (adminConfig?.enabledPositions && adminConfig.enabledPositions.length > 0) {
      if (!adminConfig.enabledPositions.includes(formData.position)) {
        setFormData(prev => ({
          ...prev,
          position: adminConfig.enabledPositions[0]
        }));
      }
    }
  }, [adminConfig?.enabledPositions, formData.position]);

  useEffect(() => {
    const levelVal = formData.level || 'SD';
    const currentSubjects = SUBJECTS_BY_LEVEL[levelVal] || [];
    if (formData.subject && !currentSubjects.includes(formData.subject)) {
      setIsCustomSubject(true);
    } else if (formData.subject === "") {
      // Keep custom subject input active while user types
    } else {
      setIsCustomSubject(false);
    }
  }, [formData.level, formData.subject]);

  const prevLevelRef = useRef<string>(formData.level);
  const prevGradeRef = useRef<string>(formData.grade);
  const prevSubjectRef = useRef<string>(formData.subject);

  useEffect(() => {
    const levelChanged = prevLevelRef.current !== formData.level;
    const gradeChanged = prevGradeRef.current !== formData.grade;
    const subjectChanged = prevSubjectRef.current !== formData.subject;

    prevLevelRef.current = formData.level;
    prevGradeRef.current = formData.grade;
    prevSubjectRef.current = formData.subject;

    const levelVal = formData.level as 'SD' | 'SMP' | 'SMA' | 'SMK';
    const cpOptions = getCPList(levelVal, formData.grade, formData.subject);

    if (levelChanged || gradeChanged || subjectChanged) {
      if (cpOptions.length > 0) {
        setFormData(prev => ({ ...prev, cp: cpOptions[0] }));
      } else {
        setFormData(prev => ({ ...prev, cp: '' }));
      }
    } else {
      // Jika dipicu oleh Sinkronisasi Spreadsheet (syncTrigger berubah)
      // Update CP jika CP saat ini kosong, atau jika CP saat ini adalah CP generik/fallback, 
      // atau jika CP saat ini bukan bagian dari cpOptions yang ter-update.
      const isFallback = !formData.cp || (formData.cp && (
        formData.cp.includes("alternatif CP generik") || 
        formData.cp.includes("Murid mampu memahami konsep utama pembelajaran") ||
        formData.cp.includes("Murid menganalisis, mengulas, serta mendesain projek") ||
        formData.cp.includes("Murid menunjukkan penguasaan kompetensi dasar")
      ));
      
      if (isFallback || (cpOptions.length > 0 && !cpOptions.includes(formData.cp))) {
        if (cpOptions.length > 0) {
          setFormData(prev => ({ ...prev, cp: cpOptions[0] }));
        }
      }
    }
  }, [formData.level, formData.grade, formData.subject, syncTrigger]);

  const handleClearForm = () => {
    if (confirm("Apakah Anda yakin ingin membersihkan semua draf data yang telah diisi?")) {
      localStorage.removeItem('tm_generator_form_data');
      setFormData({
        schoolName: '', teacherName: '', teacherNip: '', position: 'Guru Kelas',
        principalName: '', principalNip: '', signaturePlace: '', level: 'SD', grade: '1',
        semester: 'I / Ganjil', subject: 'Bahasa Indonesia', cp: '', tp: '', tps: [''], material: '',
        materials: [''],
        meetings: 1, duration: '', pedagogy: [], dimensi: []
      });
      setIsCustomSubject(false);
    }
  };

  const handleMaterialItemChange = (index: number, value: string) => {
    const list = [...(formData.materials || [''])];
    list[index] = value;
    const combined = list.filter(Boolean).join(", ");
    setFormData(prev => ({
      ...prev,
      materials: list,
      material: combined
    }));
  };

  const handleAddMaterialItem = () => {
    const list = [...(formData.materials || ['']), ''];
    setFormData(prev => ({
      ...prev,
      materials: list
    }));
  };

  const handleRemoveMaterialItem = (index: number) => {
    const list = (formData.materials || ['']).filter((_, i) => i !== index);
    const combined = list.filter(Boolean).join(", ");
    setFormData(prev => ({
      ...prev,
      materials: list.length > 0 ? list : [''],
      material: combined
    }));
  };

  const handleTpItemChange = (index: number, value: string) => {
    const list = [...(formData.tps || [''])];
    list[index] = value;
    const combined = list.filter(Boolean).join("; ");
    setFormData(prev => ({
      ...prev,
      tps: list,
      tp: combined
    }));
  };

  const handleAddTpItem = () => {
    const list = [...(formData.tps || ['']), ''];
    setFormData(prev => ({
      ...prev,
      tps: list
    }));
  };

  const handleRemoveTpItem = (index: number) => {
    const list = (formData.tps || ['']).filter((_, i) => i !== index);
    const combined = list.filter(Boolean).join("; ");
    setFormData(prev => ({
      ...prev,
      tps: list.length > 0 ? list : [''],
      tp: combined
    }));
  };

  const handleLoadPreviousDocument = () => {
    if (savedData) {
      setFormData(savedData);
      if (onViewPrevious) {
        onViewPrevious();
      } else {
        onSubmit(savedData);
      }
    }
  };
  
  const isSchoolAllowed = ALLOWED_SCHOOLS.some(
    school => normalizeStr(school) === normalizeStr(formData.schoolName)
  ) || kontrolRows.some(
    row => normalizeStr(row.schoolName) === normalizeStr(formData.schoolName)
  );

  const isTeacherAllowed = ALLOWED_TEACHERS.some(
    teacher => normalizeStr(teacher) === normalizeStr(formData.teacherName)
  ) || kontrolRows.some(
    row => normalizeStr(row.teacherName) === normalizeStr(formData.teacherName)
  );
  
  const isAccessAllowed = isSchoolAllowed && isTeacherAllowed;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'level') {
      const selectedLevel = value as 'SD' | 'SMP' | 'SMA' | 'SMK';
      setFormData(prev => ({
        ...prev,
        level: selectedLevel,
        grade: GRADES_BY_LEVEL[selectedLevel][0],
        subject: SUBJECTS_BY_LEVEL[selectedLevel][0]
      }));
      setIsCustomSubject(false);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubjectSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "__custom__") {
      setIsCustomSubject(true);
      setFormData(prev => ({ ...prev, subject: "" }));
    } else {
      setIsCustomSubject(false);
      setFormData(prev => ({ ...prev, subject: val }));
    }
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
      onNavigateSection?.('data');
      return;
    }
    if (!formData.schoolName || !formData.teacherName) {
      alert("Silakan lengkapi Data Utama (Identitas Satuan & Nama Guru) terlebih dahulu.");
      onNavigateSection?.('data');
      return;
    }
    const cleanMaterials = (formData.materials || []).filter(Boolean);
    if (cleanMaterials.length === 0) {
      alert("Silakan lengkapi minimal satu Materi Pokok terlebih dahulu.");
      onNavigateSection?.('data');
      return;
    }
    const cleanTps = (formData.tps || []).filter(Boolean);
    if (cleanTps.length === 0) {
      alert("Silakan lengkapi minimal satu Tujuan Pembelajaran terlebih dahulu.");
      onNavigateSection?.('data');
      return;
    }
    onSubmit(formData);
  };

  const cpOptions = getCPList(
    formData.level as 'SD' | 'SMP' | 'SMA' | 'SMK',
    formData.grade,
    formData.subject
  );

  const sectionClass = "glass p-6 md:p-8 rounded-[1.5rem] space-y-6";
  const labelClass = "text-sm font-bold text-blue-800 flex items-center gap-2";
  const inputClass = "w-full bg-white/50 border border-blue-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all";

  const showWarning = (formData.schoolName || formData.teacherName) && !isAccessAllowed;

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8 pb-20">
      {activeSection === 'data' && (
        <>
          {/* Tombol Aksi di Bagian Atas */}
          <div className="flex justify-end gap-3 px-2">
            {savedData && (
              <button
                type="button"
                onClick={handleLoadPreviousDocument}
                className="flex items-center gap-2 text-xs font-semibold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-xl transition-all shadow-sm border border-blue-100 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" /> Lihat Hasil Sebelumnya
              </button>
            )}
            <button
              type="button"
              onClick={handleClearForm}
              className="flex items-center gap-2 text-xs font-semibold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-xl transition-all shadow-sm border border-red-100 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Bersihkan Draf Form
            </button>
          </div>

      {/* Identitas Satuan Pendidikan */}
      <div className={sectionClass}>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
            <School className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-blue-900">Identitas Satuan Pendidikan</h2>
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
              {(adminConfig?.enabledPositions || ['Guru Kelas', 'Guru Mata Pelajaran', 'Wali Kelas']).map((pos) => (
                <option key={pos} value={pos}>{pos}</option>
              ))}
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
          <div className="space-y-2">
            <label className={labelClass}><Briefcase className="w-4 h-4"/> Tempat Penandatanganan</label>
            <input name="signaturePlace" value={formData.signaturePlace} onChange={handleChange} required className={inputClass} placeholder="Contoh: Merdeka, Jakarta, Barru, dll" />
          </div>
        </div>
      </div>

      {/* Informasi Pembelajaran */}
      <div className={sectionClass}>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
            <GraduationCap className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-blue-900">Informasi Pembelajaran</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className={labelClass}>
              Jenjang Pendidikan
              {!!detectLevelFromSchoolName(formData.schoolName) && (
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 font-bold ml-1.5 animate-pulse">
                  Terkunci otomatis
                </span>
              )}
            </label>
            <select 
              name="level" 
              value={formData.level} 
              onChange={handleChange} 
              className={cn(inputClass, !!detectLevelFromSchoolName(formData.schoolName) && "bg-slate-100/80 border-slate-300 text-slate-500 cursor-not-allowed")}
              disabled={!!detectLevelFromSchoolName(formData.schoolName)}
            >
              <option value="SD">SD</option>
              <option value="SMP">SMP</option>
              <option value="SMA">SMA</option>
              <option value="SMK">SMK</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className={labelClass}>Kelas</label>
            <select name="grade" value={formData.grade} onChange={handleChange} className={inputClass} required>
              {(GRADES_BY_LEVEL[formData.level as 'SD' | 'SMP' | 'SMA' | 'SMK'] || []).map((classVal) => (
                <option key={classVal} value={classVal}>Kelas {classVal}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className={labelClass}><Calendar className="w-4 h-4"/> Semester</label>
            <select name="semester" value={formData.semester} onChange={handleChange} className={inputClass}>
              <option value="I / Ganjil">I / Ganjil</option>
              <option value="II / Genap">II / Genap</option>
            </select>
          </div>
        </div>
        
        <div className="space-y-3">
          <label className={labelClass}><BookOpen className="w-4 h-4"/> Mata Pelajaran (Mapel)</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select 
              value={isCustomSubject ? "__custom__" : (formData.subject || "")} 
              onChange={handleSubjectSelectChange} 
              className={inputClass}
            >
              <option value="">-- Pilih Mata Pelajaran --</option>
              {getFilteredSubjects(formData.level, formData.position, adminConfig, hasKontrolMatch).map((sub) => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>

            {isCustomSubject && (
              <input 
                type="text"
                name="subject" 
                value={formData.subject} 
                onChange={handleChange} 
                className={inputClass} 
                placeholder="Masukkan Nama Mata Pelajaran Kustom"
                required 
              />
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <label className={labelClass}>
              <Layers className="w-4 h-4"/> {
                (formData.subject.toLowerCase().includes("pendidikan agama") || 
                 formData.subject.toLowerCase().includes("pendidika agama") || 
                 formData.subject.toLowerCase().includes("agama"))
                  ? "Capaian Pembelajaran (CP) - Keputusan Kepala BKPDM Nomor 020 Tahun 2026"
                  : "Capaian Pembelajaran (CP) - Keputusan Kepala BSKAP No. 046/H/KR/2025"
              }
            </label>
            <span className="text-xs text-teal-800 font-bold bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-lg">
              Fase {formData.level === 'SD' ? (['1','2'].includes(formData.grade) ? 'A' : (['3','4'].includes(formData.grade) ? 'B' : 'C')) : (formData.level === 'SMP' ? 'D' : (formData.grade === '10' ? 'E' : 'F'))}
            </span>
          </div>

          {/* Indikator Sinkronisasi Google Sheets */}
          <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-blue-950">
              {syncStatus === 'syncing' ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                  <span className="font-medium">Sinkronisasi CP dari spreadsheet Cloud...</span>
                </>
              ) : syncStatus === 'success' ? (
                <>
                  <span className="text-emerald-500 font-bold">●</span>
                  <span>
                    <strong className="text-emerald-950">CP cloud sinkron otomatis</strong>{" "}
                    {lastSyncedTime && (
                      <span className="text-slate-500 font-mono text-[10px]">
                        (Selesai: {new Date(lastSyncedTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })})
                      </span>
                    )}
                  </span>
                </>
              ) : syncStatus === 'error' ? (
                <>
                  <span className="text-amber-500 font-bold">●</span>
                  <span className="text-slate-600">
                    Gagal sinkron ({syncErrorMessage || "Koneksi terputus"}). Menggunakan data cadangan lokal.
                  </span>
                </>
              ) : (
                <>
                  <span className="text-slate-400 font-bold">●</span>
                  <span>Tekan tombol sinkron untuk memuat dari Spreadsheet.</span>
                </>
              )}
            </div>
            
            <button
              type="button"
              onClick={async () => {
                setSyncStatus('syncing');
                const res = await syncGoogleSheetsCP();
                if (res.success) {
                  setSyncStatus('success');
                } else {
                  setSyncStatus('error');
                  setSyncErrorMessage(res.error || "");
                }
              }}
              disabled={syncStatus === 'syncing'}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white hover:bg-slate-50 text-blue-800 border border-blue-200 transition-all font-semibold select-none disabled:opacity-50 text-xs shadow-sm cursor-pointer"
              title="Sinkronkan data terupdate dari Google Spreadsheet"
            >
              <RefreshCw className={cn("w-3 h-3 text-blue-600", syncStatus === 'syncing' && "animate-spin")} />
              <span>Sinkron</span>
            </button>
          </div>

          <div className="space-y-3">
            <select
              value={cpOptions.includes(formData.cp) ? formData.cp : "__custom__"}
              onChange={(e) => {
                const val = e.target.value;
                if (val !== "__custom__") {
                  setFormData(prev => ({ ...prev, cp: val }));
                }
              }}
              className={inputClass}
            >
              {cpOptions.map((cpOpt, oIdx) => (
                <option key={oIdx} value={cpOpt}>
                  Pilihan {oIdx + 1}: {cpOpt.substring(0, 80)}...
                </option>
              ))}
              <option value="__custom__">✍️ Kustom / Edit atau Tulis Sendiri...</option>
            </select>

            <textarea
              name="cp"
              value={formData.cp}
              onChange={handleChange}
              className={cn(inputClass, "h-32 resize-none text-justify leading-relaxed")}
              placeholder="Pilih opsi di atas atau tulis Capaian Pembelajaran secara manual di sini..."
              required
            />
          </div>
        </div>

        {/* Isian Ganda Materi Pokok */}
        <div className="space-y-3 pt-2">
          <label className={labelClass}><Layers className="w-4 h-4"/> Isian Materi Pokok</label>
          <div className="space-y-3">
            {(formData.materials || ['']).map((mat, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-500 min-w-[24px] text-right">{index + 1}.</span>
                <input
                  type="text"
                  value={mat || ''}
                  onChange={(e) => handleMaterialItemChange(index, e.target.value)}
                  className={cn(inputClass, "py-2 px-3")}
                  placeholder={`Masukkan Materi Pokok ke-${index + 1}`}
                  required
                />
                {(formData.materials || ['']).length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveMaterialItem(index)}
                    className="p-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl border border-red-200 transition-all cursor-pointer shadow-sm shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          
          <button
            type="button"
            onClick={handleAddMaterialItem}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-all font-semibold text-xs cursor-pointer inline-flex shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Materi Pokok</span>
          </button>
        </div>

        {/* Isian Ganda Tujuan Pembelajaran */}
        <div className="space-y-3 pt-4 border-t border-blue-100/60">
          <label className={labelClass}><Layers className="w-4 h-4"/> Isian Tujuan Pembelajaran (TP)</label>
          <div className="space-y-3">
            {(formData.tps || ['']).map((tpItem, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-500 min-w-[24px] text-right">{index + 1}.</span>
                <input
                  type="text"
                  value={tpItem || ''}
                  onChange={(e) => handleTpItemChange(index, e.target.value)}
                  className={cn(inputClass, "py-2 px-3")}
                  placeholder={`Masukkan Tujuan Pembelajaran ke-${index + 1}`}
                  required
                />
                {(formData.tps || ['']).length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveTpItem(index)}
                    className="p-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl border border-red-200 transition-all cursor-pointer shadow-sm shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          
          <button
            type="button"
            onClick={handleAddTpItem}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-all font-semibold text-xs cursor-pointer inline-flex shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Tujuan Pembelajaran</span>
          </button>

          <p className="text-xs text-blue-800 font-bold mt-1 bg-blue-50/60 p-2.5 rounded-xl border border-blue-100 flex items-start gap-2 animate-fade-in">
            <span>💡</span>
            <span>Tujuan Pembelajaran (TP) yang Anda isi di atas akan digunakan secara mutlak dan persis sama pada seluruh dokumen modul, kisi-kisi, dan soal.</span>
          </p>
        </div>
      </div>

      {/* Button Lanjut ke Modul Ajar (RPPM) */}
      <div className="flex justify-end pt-4">
        <button
          type="button"
          onClick={() => {
            if (!formData.schoolName || !formData.teacherName) {
              alert("Silakan lengkapi Nama Satuan Pendidikan dan Nama Guru terlebih dahulu.");
              return;
            }
            if (!isAccessAllowed) {
              alert(`Maaf, kombinasi Satuan Pendidikan dan Nama Guru belum terdaftar dalam sistem.`);
              return;
            }
            const activeMaterials = (formData.materials || []).filter(Boolean);
            if (activeMaterials.length === 0) {
              alert("Harap isi minimal satu Materi Pokok terlebih dahulu.");
              return;
            }
            const activeTps = (formData.tps || []).filter(Boolean);
            if (activeTps.length === 0) {
              alert("Harap isi minimal satu Tujuan Pembelajaran terlebih dahulu.");
              return;
            }
            onNavigateSection?.('modul');
          }}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-700 to-teal-600 hover:from-blue-800 hover:to-teal-700 text-white font-bold px-6 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer text-sm"
        >
          Lanjutkan Penyusunan Modul Ajar <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </>
  )}

  {activeSection === 'modul' && (
    <>
      {/* Metode & Durasi */}
      <div className={sectionClass}>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
            <Clock className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-blue-900">Metode & Durasi</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <label className={labelClass}>Jumlah Pertemuan</label>
            <div className="flex items-center gap-4">
              <button 
                type="button" 
                onClick={() => updateMeetings(-1)} 
                className="w-12 h-12 rounded-xl border-2 border-blue-200 flex items-center justify-center hover:bg-blue-50 transition-colors cursor-pointer"
              >
                <Minus className="w-5 h-5 text-blue-600"/>
              </button>

              <input
                type="number"
                name="meetings"
                value={formData.meetings}
                onChange={(e) => {
                  const val = Math.max(1, parseInt(e.target.value) || 1);
                  const diff = val - formData.meetings;
                  updateMeetings(diff);
                }}
                className="w-20 h-12 text-center text-xl font-bold bg-white/50 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                min="1"
              />

              <button 
                type="button" 
                onClick={() => updateMeetings(1)} 
                className="w-12 h-12 rounded-xl border-2 border-blue-200 flex items-center justify-center hover:bg-blue-50 transition-colors cursor-pointer"
              >
                <Plus className="w-5 h-5 text-blue-600"/>
              </button>
            </div>
          </div>
          <div className="space-y-4">
            <label className={labelClass}><Clock className="w-4 h-4"/> Durasi Per Pertemuan</label>
            <input name="duration" value={formData.duration} onChange={handleChange} className={inputClass} placeholder="Contoh: 2 x 35 menit" required />
          </div>
        </div>

        <div className="space-y-4">
          <label className={labelClass}>Praktik Pedagogis Per Pertemuan</label>
          <div className="grid grid-cols-1 gap-4">
            {Array.from({ length: formData.meetings }).map((_, idx) => (
              <div key={idx} className="flex flex-col md:flex-row md:items-center gap-4 bg-white/30 p-4 rounded-xl border border-blue-100">
                <span className="text-sm font-bold text-teal-700 shrink-0">Pertemuan {idx + 1}:</span>
                <div className="flex flex-wrap gap-2">
                  {PEDAGOGY_OPTIONS.map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handlePedagogyChange(idx, opt)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer",
                        formData.pedagogy[idx] === opt 
                          ? "bg-teal-600 border-teal-600 text-white shadow-sm shadow-teal-600/30" 
                          : "bg-white border-blue-200 text-blue-700 hover:border-blue-400"
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dimensi Lulusan */}
      <div className={sectionClass}>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
            <Layers className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-blue-900">Dimensi Lulusan</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          {DIMENSI_LULUSAN.map(item => (
            <button
              key={item}
              type="button"
              onClick={() => handleDimensiToggle(item)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-semibold border transition-all cursor-pointer",
                formData.dimensi.includes(item)
                  ? "bg-teal-600 border-teal-600 text-white shadow-md shadow-teal-600/20"
                  : "bg-white border-blue-200 text-blue-700 hover:border-blue-400"
              )}
            >
              {item}
            </button>
          ))}
        </div>
        {formData.dimensi.length === 0 && (
          <p className="text-xs text-amber-600 italic font-medium">Pilih minimal satu dimensi lulusan.</p>
        )}
      </div>

      {/* PERINGATAN VISUAL */}
      {showWarning && (
        <div className="mx-4 p-4 bg-orange-50 border border-orange-200 rounded-xl animate-pulse">
          <p className="text-sm text-orange-700 font-medium">
            ⚠️ Lisensi Anda Tidak Terdaftar, Hubungi Developer Cipta Ajar Suit (Fidhal Touna AI).
          </p>
        </div>
      )}

      {/* CONTROLS & SUBMIT BUTTON */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
        <button
          type="button"
          onClick={() => onNavigateSection?.('data')}
          className="flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-950 px-5 py-3.5 rounded-xl border border-blue-200 bg-white hover:bg-slate-50 transition-all cursor-pointer shadow-sm w-full sm:w-auto justify-center"
        >
          ⬅️ Kembali ke Pengisian Data Utama
        </button>

        <motion.button
          whileHover={!isLoading && formData.dimensi.length > 0 && isAccessAllowed ? { scale: 1.01 } : {}}
          whileTap={!isLoading && formData.dimensi.length > 0 && isAccessAllowed ? { scale: 0.99 } : {}}
          type="submit"
          disabled={isLoading || formData.dimensi.length === 0 || !isAccessAllowed}
          className={cn(
            "bg-gradient-to-r from-blue-700 to-teal-600 text-white font-bold py-4 px-8 rounded-xl shadow-xl flex items-center justify-center gap-3 transition-all cursor-pointer w-full sm:w-auto",
            (isLoading || formData.dimensi.length === 0 || !isAccessAllowed) 
              ? "opacity-40 cursor-not-allowed grayscale" 
              : "opacity-100 shadow-blue-500/20"
          )}
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating Modul...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Generate RPPM
            </>
          )}
        </motion.button>
      </div>
    </>
  )}
</form>
  );
}
