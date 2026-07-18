import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Download, FileText, Printer, CheckCircle, HelpCircle, Table, Award, AlertCircle } from 'lucide-react';
import { GeneratedAsesmen, ModulFormData, AsesmenConfig, QuestionItem, KunciPembahasanItem } from '../types';
import { cn } from '../lib/utils';
import { generateAsesmenSoal, generateAsesmenKunci, generateAsesmenRubrik } from '../lib/gemini';
import * as QRCodeLib from 'qrcode';
import FormattedTextWithTable from './FormattedTextWithTable';
import StimulusRenderer from './StimulusRenderer';

interface AsesmenResultProps {
  data: GeneratedAsesmen;
  formInput: ModulFormData;
  onBack: () => void;
  config?: AsesmenConfig | null;
  onUpdateAsesmen?: (updated: GeneratedAsesmen) => void;
}

type ActiveTab = 'kisi-kisi' | 'soal' | 'kunci' | 'rubrik';

function getTahunPelajaran(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0 is January, 5 is June, 6 is July.
  if (month >= 6) {
    return `${year}/${year + 1}`;
  } else {
    return `${year - 1}/${year}`;
  }
}

// Client-side image compression helper to prevent large payload and QuotaExceededError crashes
const compressImage = (file: File, maxWidth = 800, maxHeight = 600, quality = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string); // Fallback to raw base64
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.onerror = () => {
        reject(new Error("Gagal memuat gambar untuk kompresi."));
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Gagal membaca file gambar."));
    reader.readAsDataURL(file);
  });
};

export default function AsesmenResult({ data, formInput, onBack, config, onUpdateAsesmen }: AsesmenResultProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('kisi-kisi');
  const [showExportOptions, setShowExportOptions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Editable Title State (allows direct text-editing)
  const [editableTitle, setEditableTitle] = useState(() => {
    const base = data.identitas.jenisAsesmen || "Asesmen";
    return base.toLowerCase().includes("kurikulum") ? base : `${base} Kurikulum Merdeka`;
  });

  // Online Interactive Quiz states
  const [isOnlineActive, setIsOnlineActive] = useState(false);
  const [studentSubmissions, setStudentSubmissions] = useState<any[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [quizId, setQuizId] = useState<string | null>(null);
  const [isRegisteringQuiz, setIsRegisteringQuiz] = useState(false);

  // Lazy loading states
  const [currentKisiKisi, setCurrentKisiKisi] = useState(data.kisiKisi || []);
  const [currentSoal, setCurrentSoal] = useState<QuestionItem[]>(data.soal || []);
  const [currentKunci, setCurrentKunci] = useState<KunciPembahasanItem[]>(data.kunciPembahasan || []);
  const [currentRubrik, setCurrentRubrik] = useState<Record<number, string>>(data.rubrik || {});

  const [loadingSoal, setLoadingSoal] = useState(false);
  const [loadingKunci, setLoadingKunci] = useState(false);
  const [loadingRubrik, setLoadingRubrik] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [copiedNo, setCopiedNo] = useState<number | null>(null);

  // Helper to sync edited quiz with Express server if online mode is active
  const syncQuizWithServer = async (soalToSync: QuestionItem[], kunciToSync: KunciPembahasanItem[]) => {
    if (soalToSync.length === 0 || kunciToSync.length === 0) return;
    try {
      const optimizedSoal = soalToSync.map(s => ({
        no: s.no,
        tipe: s.tipe,
        pertanyaan: s.pertanyaan,
        opsi: s.opsi,
        levelKognitif: s.levelKognitif,
        matchingLeft: s.matchingLeft,
        matchingRight: s.matchingRight,
        butuhGambar: s.butuhGambar,
        promptGambar: s.promptGambar,
        imageUrl: s.imageUrl
      }));

      const quizPayload = {
        quizId: quizId || undefined,
        schoolName: data.identitas.schoolName || formInput.schoolName || "SD NEGERI 1 MERDEKA",
        subject: data.identitas.subject,
        grade: formInput.grade,
        semester: formInput.semester,
        jenisAsesmen: editableTitle,
        soal: optimizedSoal,
        kunci: kunciToSync
      };

      await fetch("/api/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quizPayload)
      });
    } catch (err) {
      console.error("Gagal menyinkronkan kuis ke server:", err);
    }
  };

  const updateKisiKisi = (idx: number, field: keyof typeof currentKisiKisi[0], value: any) => {
    setCurrentKisiKisi(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const updateSoalPertanyaan = (idx: number, value: string) => {
    setCurrentSoal(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], pertanyaan: value };
      syncQuizWithServer(next, currentKunci);
      return next;
    });
  };

  const updateSoalOpsi = (sIdx: number, oIdx: number, value: string) => {
    setCurrentSoal(prev => {
      const next = [...prev];
      const nextOpsi = next[sIdx].opsi ? [...next[sIdx].opsi!] : [];
      nextOpsi[oIdx] = value;
      next[sIdx] = { ...next[sIdx], opsi: nextOpsi };
      syncQuizWithServer(next, currentKunci);
      return next;
    });
  };

  const updateSoalMatchingLeft = (sIdx: number, mIdx: number, value: string) => {
    setCurrentSoal(prev => {
      const next = [...prev];
      const nextLeft = next[sIdx].matchingLeft ? [...next[sIdx].matchingLeft!] : [];
      nextLeft[mIdx] = value;
      next[sIdx] = { ...next[sIdx], matchingLeft: nextLeft };
      syncQuizWithServer(next, currentKunci);
      return next;
    });
  };

  const updateSoalMatchingRight = (sIdx: number, mIdx: number, value: string) => {
    setCurrentSoal(prev => {
      const next = [...prev];
      const nextRight = next[sIdx].matchingRight ? [...next[sIdx].matchingRight!] : [];
      nextRight[mIdx] = value;
      next[sIdx] = { ...next[sIdx], matchingRight: nextRight };
      syncQuizWithServer(next, currentKunci);
      return next;
    });
  };

  const updateKunciJawaban = (idx: number, value: string) => {
    setCurrentKunci(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], kunci: value };
      syncQuizWithServer(currentSoal, next);
      return next;
    });
  };

  const updateKunciPembahasan = (idx: number, value: string) => {
    setCurrentKunci(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], pembahasan: value };
      syncQuizWithServer(currentSoal, next);
      return next;
    });
  };

  const updateRubrikText = (no: number, value: string) => {
    setCurrentRubrik(prev => ({
      ...prev,
      [no]: value
    }));
  };

  // Synchronize state back to the parent component automatically whenever local states change
  useEffect(() => {
    if (onUpdateAsesmen) {
      onUpdateAsesmen({
        ...data,
        kisiKisi: currentKisiKisi,
        soal: currentSoal,
        kunciPembahasan: currentKunci,
        rubrik: currentRubrik
      });
    }
  }, [currentKisiKisi, currentSoal, currentKunci, currentRubrik]);

  // Auto-generate Soal and Kunci in the background when Online mode is activated
  useEffect(() => {
    const autoGenerateForOnline = async () => {
      if (!isOnlineActive) return;

      const actualConfig = {
        ...config,
        pgCount: config?.pgCount || 0,
        pgkCount: config?.pgkCount || 0,
        isianCount: config?.isianCount || 0,
        uraianCount: config?.uraianCount || 0,
        bsCount: config?.bsCount || 0,
        menjodohkanCount: config?.menjodohkanCount || 0,
      } as AsesmenConfig;

      let activeSoal = currentSoal;
      if (currentSoal.length === 0 && !loadingSoal) {
        setLoadingSoal(true);
        try {
          console.log("[BACKGROUND] Auto-generating soal for online exam...");
          const generated = await generateAsesmenSoal(formInput, actualConfig, currentKisiKisi);
          setCurrentSoal(generated);
          activeSoal = generated;
        } catch (err: any) {
          console.error("Gagal melakukan generator soal latar belakang:", err);
          setLoadingError("Gagal merumuskan lembar soal otomatis untuk ujian online.");
        } finally {
          setLoadingSoal(false);
        }
      }

      if (currentKunci.length === 0 && !loadingKunci && activeSoal.length > 0) {
        setLoadingKunci(true);
        try {
          console.log("[BACKGROUND] Auto-generating kunci for online exam...");
          const generatedKeys = await generateAsesmenKunci(formInput, actualConfig, activeSoal);
          setCurrentKunci(generatedKeys);
        } catch (err: any) {
          console.error("Gagal melakukan generator kunci latar belakang:", err);
          setLoadingError("Gagal merumuskan kunci jawaban otomatis untuk ujian online.");
        } finally {
          setLoadingKunci(false);
        }
      }
    };

    autoGenerateForOnline();
  }, [isOnlineActive, currentSoal.length, currentKunci.length, currentKisiKisi, config, formInput]);

  // Register online interactive quiz structure on Express server in exchange for small unique id proactively on mount
  useEffect(() => {
    const registerQuiz = async () => {
      if (quizId || isRegisteringQuiz || currentSoal.length === 0 || currentKunci.length === 0) return;
      setIsRegisteringQuiz(true);
      try {
        const optimizedSoal = currentSoal.map(s => ({
          no: s.no,
          tipe: s.tipe,
          pertanyaan: s.pertanyaan,
          opsi: s.opsi,
          levelKognitif: s.levelKognitif,
          matchingLeft: s.matchingLeft,
          matchingRight: s.matchingRight,
          butuhGambar: s.butuhGambar,
          promptGambar: s.promptGambar,
          imageUrl: s.imageUrl
        }));

        const quizPayload = {
          schoolName: data.identitas.schoolName || formInput.schoolName || "SD NEGERI 1 MERDEKA",
          subject: data.identitas.subject,
          grade: formInput.grade,
          semester: formInput.semester,
          jenisAsesmen: editableTitle,
          soal: optimizedSoal,
          kunci: currentKunci
        };

        const res = await fetch("/api/quizzes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(quizPayload)
        });
        if (res.ok) {
          const resData = await res.json();
          if (resData.quizId) {
            setQuizId(resData.quizId);
          }
        }
      } catch (err) {
        console.error("Gagal mendaftarkan kuis ke server:", err);
      } finally {
        setIsRegisteringQuiz(false);
      }
    };
    registerQuiz();
  }, [currentSoal, currentKunci, quizId]);

  // Generate robust local QR code on link changes
  useEffect(() => {
    if (isOnlineActive) {
      try {
        const link = generateStudentLink();
        const qrLib = (QRCodeLib as any).default || QRCodeLib;
        if (qrLib && typeof qrLib.toDataURL === 'function') {
          qrLib.toDataURL(link, { width: 300, margin: 2, errorCorrectionLevel: 'M' })
            .then((url: string) => {
              setQrCodeUrl(url);
            })
            .catch((err: any) => {
              console.error("Gagal men-generate QR Code secara lokal:", err);
              // Safe, lightning-fast fallback API
              setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(link)}`);
            });
        } else {
          console.error("Modul QRCode tidak dapat dimuat secara kompatibel. Menggunakan fallback API...");
          setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(link)}`);
        }
      } catch (e) {
        console.error(e);
        const link = generateStudentLink();
        setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(link)}`);
      }
    }
  }, [isOnlineActive, editableTitle, currentSoal, currentKunci, quizId]);

  // Real-time synchronization of student responses via LOCAL + SERVER HYBRID POLLING
  useEffect(() => {
    const loadLocalSubmissions = () => {
      try {
        const saved = localStorage.getItem('tm_online_submissions');
        return saved ? JSON.parse(saved) : [];
      } catch (e) {
        console.error(e);
        return [];
      }
    };

    if (!isOnlineActive) {
      setStudentSubmissions(loadLocalSubmissions());
      return;
    }

    const fetchServerSubmissions = async () => {
      try {
        const link = generateStudentLink();
        const urlParams = new URL(link).searchParams;
        const token = urlParams.get('quiz') || "";

        const res = await fetch(`/api/submissions?token=${encodeURIComponent(token)}`);
        if (res.ok) {
          const serverData = await res.json();
          const localData = loadLocalSubmissions();
          
          // Gabungkan data server (dari HP lain) dan lokal (jika ada) secara unik
          const combined = [...serverData];
          localData.forEach((loc: any) => {
            const alreadyInServer = combined.some(
              (s: any) => s.name.toLowerCase() === loc.name.toLowerCase() && s.absen === loc.absen
            );
            if (!alreadyInServer) {
              combined.push(loc);
            }
          });

          setStudentSubmissions(combined);
        }
      } catch (e) {
        console.error("Gagal menyinkronkan data kuis siswa:", e);
      }
    };

    fetchServerSubmissions();
    const interval = setInterval(fetchServerSubmissions, 3000); // Polling setiap 3 detik

    const handleStorageChange = () => {
      fetchServerSubmissions();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isOnlineActive, editableTitle, currentSoal, currentKunci, quizId]);

  // Serializes questions, key map, and header parameters to lightweight base64 URI or server short ID
  const generateStudentLink = () => {
    if (quizId) {
      return `${window.location.origin}${window.location.pathname}?quiz=${encodeURIComponent(quizId)}`;
    }

    const safeBtoA = (str: string) => {
      try {
        return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
          return String.fromCharCode(parseInt(p1, 16));
        }));
      } catch (e) {
        console.error(e);
        return "";
      }
    };

    const optimizedSoal = currentSoal.map(s => ({
      no: s.no,
      tipe: s.tipe,
      pertanyaan: s.pertanyaan,
      opsi: s.opsi,
      levelKognitif: s.levelKognitif,
      matchingLeft: s.matchingLeft,
      matchingRight: s.matchingRight,
      butuhGambar: s.butuhGambar,
      promptGambar: s.promptGambar,
      imageUrl: (s.imageUrl && !s.imageUrl.startsWith("data:")) ? s.imageUrl : undefined
    }));

    const quizPayload = {
      schoolName: data.identitas.schoolName || formInput.schoolName || "SD NEGERI 1 MERDEKA",
      subject: data.identitas.subject,
      grade: formInput.grade,
      semester: formInput.semester,
      jenisAsesmen: editableTitle,
      soal: optimizedSoal,
      kunci: currentKunci
    };

    const token = safeBtoA(JSON.stringify(quizPayload));
    return `${window.location.origin}${window.location.pathname}?quiz=${encodeURIComponent(token)}`;
  };

  // Helper to remove double abjad prefixes like "A. Fotosintesis" -> "Fotosintesis"
  const cleanOptionText = (text: string): string => {
    if (!text) return "";
    const prefixRegex = /^[A-Ea-e][\.\)\s-]+\s*/;
    return text.replace(prefixRegex, "").trim();
  };

  // Helper to safely extract and display PG answer keys with letter option prefix (A, B, C, or D) plus texts
  const getDisplayKunciPG = (kunciStr: string, questionNo: number): string => {
    const soalItem = currentSoal.find(s => s.no === questionNo);
    if (!soalItem || soalItem.tipe !== 'PG' || !soalItem.opsi || soalItem.opsi.length === 0) {
      return kunciStr;
    }
    
    const cleanKunci = (kunciStr || "").trim().toUpperCase();
    
    // 1. If key in DB is already a single letter (A, B, C, D)
    const isSingleLetter = /^[A-E]$/.test(cleanKunci);
    if (isSingleLetter) {
      const charCode = cleanKunci.charCodeAt(0);
      const idx = charCode - 65; // 'A' is 65
      if (soalItem.opsi[idx]) {
        const optionText = cleanOptionText(soalItem.opsi[idx]);
        return `${cleanKunci}. ${optionText}`;
      }
      return cleanKunci;
    }

    // 2. If key in DB contains the full text
    for (let idx = 0; idx < soalItem.opsi.length; idx++) {
      const rawOpsi = soalItem.opsi[idx];
      const cleanOpsiText = cleanOptionText(rawOpsi).toUpperCase();
      const cleanKunciText = cleanOptionText(cleanKunci).toUpperCase();
      
      if (cleanOpsiText.includes(cleanKunciText) || cleanKunciText.includes(cleanOpsiText) || cleanKunci.startsWith(String.fromCharCode(65 + idx))) {
        const letter = String.fromCharCode(65 + idx);
        const optionText = cleanOptionText(rawOpsi);
        return `${letter}. ${optionText}`;
      }
    }

    return kunciStr;
  };

  // Lazy loading tab transition generator handler
  const handleTabChange = async (tab: ActiveTab) => {
    setActiveTab(tab);
    setLoadingError(null);

    const actualConfig = config || {
      pgCount: 5,
      pgkCount: 2,
      isianCount: 5,
      uraianCount: 2,
      bsCount: 5,
      menjodohkanCount: 3,
      pgOptionsCount: 4,
      levelKognitif: ['LOTS', 'MOTS', 'HOTS'],
      jenisAsesmen: 'Asesmen Sumatif'
    } as AsesmenConfig;

    if (tab === 'soal' && currentSoal.length === 0) {
      setLoadingSoal(true);
      try {
        const generated = await generateAsesmenSoal(formInput, actualConfig, currentKisiKisi);
        setCurrentSoal(generated);
      } catch (err: any) {
        console.error(err);
        setLoadingError("Gagal merumuskan lembar soal. Harap periksa koneksi atau coba klik segarkan kembali.");
      } finally {
        setLoadingSoal(false);
      }
    }

    if (tab === 'kunci' && currentKunci.length === 0) {
      setLoadingKunci(true);
      try {
        let activeSoal = currentSoal;
        if (currentSoal.length === 0) {
          activeSoal = await generateAsesmenSoal(formInput, actualConfig, currentKisiKisi);
          setCurrentSoal(activeSoal);
        }
        const generatedKeys = await generateAsesmenKunci(formInput, actualConfig, activeSoal);
        setCurrentKunci(generatedKeys);
      } catch (err: any) {
        console.error(err);
        setLoadingError("Gagal memformulasikan kunci jawaban & pembahasan materi Kurikulum Merdeka.");
      } finally {
        setLoadingKunci(false);
      }
    }

    if (tab === 'rubrik' && Object.keys(currentRubrik).length === 0) {
      setLoadingRubrik(true);
      try {
        let activeSoal = currentSoal;
        if (currentSoal.length === 0) {
          activeSoal = await generateAsesmenSoal(formInput, actualConfig, currentKisiKisi);
          setCurrentSoal(activeSoal);
        }
        const generatedRubrics = await generateAsesmenRubrik(formInput, actualConfig, activeSoal);
        const rubMap: Record<number, string> = {};
        generatedRubrics.forEach((item: any) => {
          rubMap[item.no] = item.rubrik;
        });
        setCurrentRubrik(rubMap);
      } catch (err: any) {
        console.error(err);
        setLoadingError("Gagal menyusun rubrik kriteria penilaian evaluasi hasil belajar murid.");
      } finally {
        setLoadingRubrik(false);
      }
    }
  };

  // Download DOC format for currently active tab
  const downloadWord = () => {
    if (!containerRef.current) return;

    if (activeTab === 'soal' && currentSoal.length === 0) {
      alert("Silakan buka atau muat tab 'Lembar Soal' terlebih dahulu sebelum mengunduh.");
      return;
    }
    if (activeTab === 'kunci' && currentKunci.length === 0) {
      alert("Silakan buka atau muat tab 'Kunci & Bahasan' terlebih dahulu sebelum mengunduh.");
      return;
    }
    if (activeTab === 'rubrik' && Object.keys(currentRubrik).length === 0) {
      alert("Silakan buka atau muat tab 'Rubrik Penilaian' terlebih dahulu sebelum mengunduh.");
      return;
    }

    const content = containerRef.current.innerHTML;
    const schoolName = data.identitas.schoolName || formInput.schoolName || "DOKUMEN ASLI";
    const jAsesmen = data.identitas.jenisAsesmen || "Asesmen";

    const titleMap: Record<ActiveTab, string> = {
      'kisi-kisi': `Kisi-kisi_${jAsesmen}_${data.identitas.subject}`,
      'soal': `Lembar_Soal_${jAsesmen}_${data.identitas.subject}`,
      'kunci': `Kunci_Jawaban_${jAsesmen}_${data.identitas.subject}`,
      'rubrik': `Rubrik_Penilaian_${jAsesmen}_${data.identitas.subject}`,
    };

    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>${titleMap[activeTab]}</title>
      <style>
        @page { size: A4; margin: 2cm; mso-footer: f1; }
        body { font-family: 'Times New Roman', serif; line-height: 1.5; color: #1e293b; background-color: #ffffff; }
        table { border-collapse: collapse; width: 100%; margin-bottom: 1.5rem; }
        td, th { border: 0.5pt solid #cbd5e1; padding: 8px; font-size: 11pt; vertical-align: top; text-align: left; }
        th { background-color: #f1f5f9; font-weight: bold; }
        
        /* Hide watermark and non-printable elements in Word */
        .print-watermark { display: none !important; mso-hide: all; }
        .no-print { display: none !important; mso-hide: all; }
        
        .spreadsheet-table { width: 100%; border-collapse: collapse; margin-top: 4px; page-break-inside: avoid; }
        .spreadsheet-table td, .spreadsheet-table th { border: 1px solid #cbd5e1; padding: 10px; }
        
        h1 { font-size: 16pt; font-weight: bold; text-align: center; text-transform: uppercase; margin-bottom: 2px; color: #000000; }
        h2 { font-size: 11pt; font-weight: bold; background-color: #f8fafc; color: #0f172a; padding: 8px; border: 1px solid #cbd5e1; margin-top: 20px; margin-bottom: 8px; text-transform: uppercase; }
        p { margin: 0 0 8px 0; font-size: 11pt; }
        .text-justify { text-align: justify; text-justify: inter-word; }
        .text-center { text-align: center; }
        .font-semibold { font-weight: bold; }
        .font-bold { font-weight: bold; }
        
        /* Opsi PG styles */
        .option-item { margin-left: 20px; margin-bottom: 4px; }
        
        /* Grid matching */
        .matching-grid { width: 100%; margin-bottom: 10px; }
        .matching-grid td { width: 50%; padding: 6px; border: 1px solid #cbd5e1; }
        
        /* Borderless table signature / info headers */
        .border-none { border: none !important; }
        .border-none td { border: none !important; }

        /* General widths & clean outlines */
        .w-full { width: 100%; }
        .w-1/2 { width: 50%; }
        .w-fit { width: auto; }
        .w-\[18\%\] { width: 18%; }
        .pl-6 { padding-left: 24px !important; }
        .pl-4 { padding-left: 16px !important; }
        .py-1.5 { padding-top: 6px !important; padding-bottom: 6px !important; }
        .p-2 { padding: 8px !important; }
        .p-1 { padding: 4px !important; }
        
        /* Coloring & backgrounds */
        .text-teal-800 { color: #115e59 !important; }
        .text-blue-900 { color: #1e3a8a !important; }
        .text-slate-600 { color: #475569 !important; }
        .text-slate-700 { color: #334155 !important; }
        .text-slate-800 { color: #1e293b !important; }
        .bg-slate-50 { background-color: #f8fafc !important; }
        .bg-slate-100 { background-color: #f1f5f9 !important; }
        
        /* Spacings */
        .mb-4 { margin-bottom: 16px !important; }
        .mb-6 { margin-bottom: 24px !important; }
        .mb-8 { margin-bottom: 32px !important; }
        .mt-1.5 { margin-top: 6px !important; }
        .mt-20 { margin-top: 80px !important; }
        
        /* Borders */
        .border-b-2 { border-bottom: 2px solid #1e293b !important; }
        .border-b-4 { border-bottom: 4px double #1e293b !important; }
        .border-l-4 { border-left: 4px solid #1e293b !important; }
        .border-t { border-top: 1px solid #e1e8f0 !important; }
        .border-slate-400 { border-color: #cbd5e1 !important; }
      </style></head>
      <body>
        <div class="Section1">
          ${content}
          <div style='mso-element:footer' id='f1'>
            <p style="border-top: 1pt solid black; padding-top: 5pt; font-size: 9pt; color: #666666;">
              ${schoolName} — Cipta Ajar Suit
              <span style='mso-tab-count:2'></span>
              Halaman <span style='mso-field-code: PAGE '></span>
            </p>
          </div>
        </div>
      </body></html>`;

    // Crucial fix: convert JSX className to class for parsing in MS Word
    const cleanedHeader = header.replace(/className=/g, 'class=');

    const blob = new Blob(['\ufeff', cleanedHeader], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${titleMap[activeTab].replace(/\s+/g, '_')}.doc`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    setShowExportOptions(false);
    setTimeout(() => {
      window.print();
    }, 250);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-32 px-4 relative">
      {/* Print styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .print-watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 4.5rem;
            font-weight: 900;
            color: rgba(220, 220, 220, 0.12) !important;
            z-index: -1;
            pointer-events: none;
            white-space: nowrap;
            display: block !important;
            text-transform: uppercase;
            -webkit-print-color-adjust: exact;
          }
          .no-print { display: none !important; }
          @page { margin: 1.5cm; size: portrait; }
          body { background: white !important; -webkit-print-color-adjust: exact; }
          .document-sheet { 
            width: 100% !important; 
            box-shadow: none !important; 
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            border-radius: 0 !important;
          }
        }
        .print-watermark { display: none; }
        @media screen {
          .document-sheet {
            min-height: 29.7cm;
            width: 100%;
            max-width: 21cm;
            margin: 0 auto 2rem;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1); 
            overflow: visible;
          }
        }
      ` }}></style>

      {/* Navigation & Tab selectors */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print border-b border-slate-200 pb-4">
        <button onClick={onBack} className="flex items-center gap-2 text-blue-700 font-bold hover:text-blue-900 transition-colors cursor-pointer">
          <ChevronLeft className="w-5 h-5" /> Kembali ke draf
        </button>

        {/* Tab controller inside visual menu */}
        <div className="flex flex-wrap gap-1 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          <button
            onClick={() => handleTabChange('kisi-kisi')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer",
              activeTab === 'kisi-kisi' ? "bg-teal-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-200"
            )}
          >
            <Table className="w-3.5 h-3.5" /> Kisi-kisi
          </button>
          <button
            onClick={() => handleTabChange('soal')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer",
              activeTab === 'soal' ? "bg-teal-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-200"
            )}
          >
            <FileText className="w-3.5 h-3.5" /> Lembar Soal
          </button>
          <button
            onClick={() => handleTabChange('kunci')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer",
              activeTab === 'kunci' ? "bg-teal-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-200"
            )}
          >
            <CheckCircle className="w-3.5 h-3.5" /> Kunci & Bahasan
          </button>
          <button
            onClick={() => handleTabChange('rubrik')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer",
              activeTab === 'rubrik' ? "bg-teal-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-200"
            )}
          >
            <Award className="w-3.5 h-3.5" /> Rubrik Penilaian
          </button>
        </div>

        {/* Actions */}
        <div className="relative shrink-0">
          <button 
            disabled={loadingSoal || loadingKunci || loadingRubrik}
            onClick={() => setShowExportOptions(!showExportOptions)} 
            className="bg-gradient-to-r from-teal-700 to-emerald-600 hover:opacity-90 disabled:opacity-55 text-white px-5 py-2.5 rounded-xl font-bold shadow-md flex items-center gap-2 transition-all text-xs cursor-pointer"
          >
            <Download className="w-4 h-4" /> Unduh / Cetak Aktif
          </button>
          
          <AnimatePresence>
            {showExportOptions && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50 text-xs">
                <button onClick={downloadWord} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-slate-700 border-b border-slate-100 transition-colors pointer-events-auto">
                  <FileText className="w-5 h-5 text-blue-500" /> Format Word (.doc)
                </button>
                <button onClick={handlePrint} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-slate-700 transition-colors pointer-events-auto">
                  <Printer className="w-5 h-5 text-teal-500" /> Cetak / Print Browser
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Note above SHEET */}
      <div className="no-print p-4 bg-teal-50/75 border border-teal-100 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs leading-relaxed text-teal-950">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-teal-900">✍️ Mode Edit Manual Aktif</p>
            <p className="text-teal-950/90 mt-0.5">
              Anda dapat **mengedit teks apa saja secara langsung** di lembar dokumen di bawah ini (Kisi-kisi, Pertanyaan, Pilihan Ganda, Kunci Jawaban, Pembahasan, & Rubrik). Cukup klik bagian teks yang ingin Anda ubah, lalu ketik secara manual. Perubahan Anda akan otomatis disimpan untuk pencetakan, unduhan Word, maupun pendaftaran kuis online murid secara real-time!
            </p>
          </div>
        </div>
      </div>

      {/* Document layout container */}
      <div className="w-full overflow-x-auto no-print-scrollbar">
        <div ref={containerRef} className="document-sheet bg-white p-6 md:p-12 shadow-sm border border-slate-200 text-slate-900 relative box-border leading-relaxed text-sm">
          <div className="print-watermark">
            {data.identitas.schoolName || formInput.schoolName || "DOKUMEN ASLI"}
          </div>

          {/* TAB 1: KISI-KISI SOAL */}
          {activeTab === 'kisi-kisi' && (
            <div className="space-y-6">
              {/* Kop Surat Header */}
              <div className="text-center pb-6 border-b-2 border-slate-800 mb-6" style={{ textAlign: 'center' }}>
                <h1 className="text-lg font-bold uppercase tracking-tight" style={{ textAlign: 'center' }}>{data.identitas.schoolName}</h1>
                <p className="text-xl font-extrabold uppercase mt-1" style={{ textAlign: 'center' }}>KISI-KISI PENYUSUNAN SOAL {data.identitas.jenisAsesmen ? data.identitas.jenisAsesmen.toUpperCase() : "ASESMEN"}</p>
                <p className="text-xs uppercase mt-0.5 text-slate-600" style={{ textAlign: 'center' }}>Kurikulum Merdeka • Tahun Pelajaran {getTahunPelajaran()}</p>
              </div>

              {/* metadata table (realigned, removed top standalone TP row) */}
              <table className="w-full border-none border-collapse text-xs mb-6" style={{ width: '100%', marginBottom: '24px' }}>
                <tbody>
                  <tr className="border-none" style={{ border: 'none' }}>
                    <td className="w-[20%] font-bold p-1 bg-transparent border-none text-slate-800" style={{ border: 'none', padding: '4px 0', width: '20%', fontWeight: 'bold' }}>Mata Pelajaran</td>
                    <td className="w-[30%] p-1 bg-transparent border-none text-slate-700" style={{ border: 'none', padding: '4px 0', width: '30%' }}>: {data.identitas.subject}</td>
                    <td className="w-[20%] font-bold p-1 bg-transparent border-none text-slate-800" style={{ border: 'none', padding: '4px 0', width: '20%', fontWeight: 'bold' }}>Kelas / Semester</td>
                    <td className="w-[30%] p-1 bg-transparent border-none text-slate-700" style={{ border: 'none', padding: '4px 0', width: '30%' }}>: Kelas {formInput.grade} / {formInput.semester}</td>
                  </tr>
                </tbody>
              </table>

              {/* Kisi-kisi Table with CP and TP merged */}
              <div className="overflow-x-auto">
                <table className="spreadsheet-table w-full text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-900 font-bold">
                      <th className="w-[4%] text-center">No</th>
                      <th className="w-[34%]">Capaian & Tujuan Pembelajaran (CP / TP)</th>
                      <th className="w-[16%]">Materi Pokok</th>
                      <th className="w-[26%]">Indikator Pencapaian Soal</th>
                      <th className="w-[6%] text-center">Level</th>
                      <th className="w-[8%] text-center">Bentuk</th>
                      <th className="w-[6%] text-center">No Soal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentKisiKisi.map((k, idx) => (
                      <tr key={idx}>
                        <td className="text-center">{k.no}</td>
                        <td className="text-justify space-y-1.5 p-2">
                          <div>
                            <span className="font-bold text-teal-800 block text-[9px] uppercase leading-none mb-1">Capaian Pembelajaran (CP):</span>
                            <p className="text-slate-600 text-[10.5px] leading-relaxed">{formInput.cp || "Sesuai standar Kurikulum Merdeka"}</p>
                          </div>
                          <div className="border-t border-slate-100 pt-1.5 mt-1.5">
                            <span className="font-bold text-blue-900 block text-[9px] uppercase leading-none mb-1">Tujuan Pembelajaran (TP):</span>
                            <p 
                              className="text-slate-800 font-medium text-[10.5px] leading-relaxed outline-none hover:bg-teal-50/40 focus:bg-white focus:ring-1 focus:ring-teal-500 rounded p-1 transition-all cursor-text"
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={(e) => updateKisiKisi(idx, 'tp', e.currentTarget.textContent || "")}
                            >
                              {k.tp}
                            </p>
                          </div>
                        </td>
                        <td>
                          <div 
                            className="outline-none hover:bg-teal-50/40 focus:bg-white focus:ring-1 focus:ring-teal-500 rounded p-1 transition-all cursor-text min-h-[30px]"
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => updateKisiKisi(idx, 'materi', e.currentTarget.textContent || "")}
                          >
                            {k.materi}
                          </div>
                        </td>
                        <td className="text-justify">
                          <div 
                            className="outline-none hover:bg-teal-50/40 focus:bg-white focus:ring-1 focus:ring-teal-500 rounded p-1 transition-all cursor-text min-h-[30px]"
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => updateKisiKisi(idx, 'indikator', e.currentTarget.textContent || "")}
                          >
                            {k.indikator}
                          </div>
                        </td>
                        <td className="text-center font-semibold">
                          <div 
                            className="outline-none hover:bg-teal-50/40 focus:bg-white focus:ring-1 focus:ring-teal-500 rounded p-1 transition-all cursor-text text-center"
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => updateKisiKisi(idx, 'levelKognitif', e.currentTarget.textContent || "")}
                          >
                            {k.levelKognitif}
                          </div>
                        </td>
                        <td className="text-center">
                          <div 
                            className="outline-none hover:bg-teal-50/40 focus:bg-white focus:ring-1 focus:ring-teal-500 rounded p-1 transition-all cursor-text text-center"
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => updateKisiKisi(idx, 'bentukSoal', e.currentTarget.textContent || "")}
                          >
                            {k.bentukSoal}
                          </div>
                        </td>
                        <td className="text-center font-bold text-slate-800">
                          <div 
                            className="outline-none hover:bg-teal-50/40 focus:bg-white focus:ring-1 focus:ring-teal-500 rounded p-1 transition-all cursor-text text-center font-bold"
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => updateKisiKisi(idx, 'noSoal', e.currentTarget.textContent || "")}
                          >
                            {k.noSoal}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: LEMBAR SOAL */}
          {activeTab === 'soal' && (
            <div className="space-y-6">
              {/* --- CONTROL CENTER MODE SOAL ONLINE INTERAKTIF (HANYA LAYAR GURU) --- */}
              <div className="no-print bg-slate-50 border border-slate-200 rounded-3xl p-5 mb-6 space-y-4 shadow-sm select-none">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white flex items-center justify-center font-bold font-sans shadow-md">
                      <span className="text-lg">🌐</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Mode Soal Online Interaktif Siswa</h3>
                      <p className="text-xs text-slate-500 font-medium">Aktifkan agar murid dapat langsung mengerjakan soal-soal ini secara interaktif melalui HP mereka masing-masing.</p>
                    </div>
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsOnlineActive(!isOnlineActive);
                      }}
                      className={cn(
                        "w-full md:w-auto font-extrabold py-2.5 px-5 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer border",
                        isOnlineActive 
                          ? "bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-700" 
                          : "bg-blue-600 border-blue-500 text-white hover:bg-blue-700 shadow-blue-500/10"
                      )}
                    >
                      <span className="relative flex h-2 w-2 shrink-0">
                        <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", isOnlineActive ? "bg-emerald-450 bg-emerald-400" : "bg-blue-400")}></span>
                        <span className={cn("relative inline-flex rounded-full h-2 w-2", isOnlineActive ? "bg-emerald-500" : "bg-blue-500")}></span>
                      </span>
                      <span>{isOnlineActive ? "Ujian Online Aktif (Kelola)" : "Aktifkan Soal Online Sekarang"}</span>
                    </button>
                  </div>
                </div>

                {isOnlineActive && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-3 border-t border-slate-200/80 animate-fade-in">
                    
                    {/* QR and Share Link Panel */}
                    <div className="lg:col-span-5 space-y-4 bg-white p-4 border border-slate-200 rounded-2xl">
                      <div className="text-center font-bold text-[11px] text-slate-500 uppercase tracking-wider">QR Code Pindai HP Siswa</div>
                      
                      {/* Live QR generator rendered locally with node-qrcode */}
                      <div className="w-40 h-40 mx-auto bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center p-2.5 shadow-inner text-center">
                        {loadingSoal || loadingKunci ? (
                          <div className="text-[10px] text-slate-500 font-bold animate-pulse px-2 leading-relaxed">
                            ⏳ Menyusun butir soal & kunci evaluasi...
                          </div>
                        ) : qrCodeUrl ? (
                          <img 
                            src={qrCodeUrl}
                            alt="QR Code Siswa"
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="text-[10px] text-slate-400 font-bold animate-pulse">Menyiapkan QR Code...</div>
                        )}
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tautan Pengerjaan Siswa:</label>
                        <div className="flex gap-1.5">
                          <input 
                            type="text" 
                            readOnly 
                            value={generateStudentLink()}
                            className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-600 flex-1 outline-none truncate"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(generateStudentLink());
                              setCopiedLink(true);
                              setTimeout(() => setCopiedLink(false), 3000);
                            }}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors border border-slate-200 select-none shrink-0 cursor-pointer"
                          >
                            {copiedLink ? "Tersalin!" : "Salin Link"}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Live Monitoring Panel */}
                    <div className="lg:col-span-7 bg-white p-4 border border-slate-200 rounded-2xl flex flex-col justify-between">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <span className="font-extrabold text-xs text-slate-800 tracking-tight flex items-center gap-1.5">
                          <span>📊 Pengawasan Ujian Real-Time</span>
                          <span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded-full text-[9px] font-mono leading-none border border-blue-100 font-bold animate-pulse">LIVE MONITOR</span>
                        </span>
                        <button
                          type="button"
                          onClick={async () => {
                            if (window.confirm("Apakah Anda yakin ingin mengosongkan seluruh riwayat lembar jawaban siswa saat ini?")) {
                              try {
                                const link = generateStudentLink();
                                const urlParams = new URL(link).searchParams;
                                const token = urlParams.get('quiz') || "";
                                await fetch(`/api/submissions?token=${encodeURIComponent(token)}`, {
                                  method: 'DELETE'
                                });
                              } catch (e) {
                                console.error(e);
                              }
                              localStorage.removeItem('tm_online_submissions');
                              setStudentSubmissions([]);
                            }
                          }}
                          className="text-[9px] font-bold text-rose-600 hover:underline hover:text-rose-700 uppercase cursor-pointer"
                        >
                          Reset Hasil
                        </button>
                      </div>

                      <div className="flex-1 overflow-y-auto max-h-56 mt-2 pr-1 space-y-2 no-print-scrollbar">
                        {studentSubmissions.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center py-8 text-center text-slate-400">
                            <span className="text-2xl animate-pulse">⏳</span>
                            <p className="text-[11px] font-bold mt-1">Belum ada siswa yang masuk atau mengumpulkan ujian...</p>
                            <p className="text-[10px] text-slate-400 max-w-xs mt-0.5">Mintalah siswa memindai QR Code atau membuka tautan di HP mereka untuk mulai mengumpulkan.</p>
                          </div>
                        ) : (
                          studentSubmissions.map((sub, sIdx) => (
                            <div key={sIdx} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-150 rounded-xl hover:bg-slate-100/50 transition-colors text-[11px] font-sans">
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-lg bg-teal-50 text-teal-850 text-teal-800 border border-teal-250 flex items-center justify-center font-bold text-[10px]">
                                  {sub.absen}
                                </span>
                                <div className="text-left">
                                  <div className="font-extrabold text-slate-800 leading-tight">{sub.name}</div>
                                  <div className="text-[9px] text-slate-400 font-medium">Selesai pada {sub.submittedAt} • Durasi {sub.duration}</div>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="font-black text-sm text-teal-600">{sub.score} <span className="text-[10px] text-slate-400 font-bold">/ 100</span></div>
                                <div className="text-[8.5px] uppercase font-bold text-slate-400 tracking-tight leading-none">Skor Pilihan Ganda</div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                  </div>
                )}
              </div>

              {/* Informative customizable heading tips */}
              <div className="no-print bg-teal-50 border border-teal-100 rounded-2xl p-3 text-[11px] leading-relaxed text-teal-900 flex items-center gap-2">
                <span>💡</span>
                <span><strong>Tips Kustomisasi:</strong> Anda dapat mengklik dan mengedit langsung tulisan judul <u>"{editableTitle}"</u> di bawah ini untuk mengubah KOP lembar ujian sebelum dicetak atau diunduh!</span>
              </div>

              {/* Kop Ujian */}
              <div className="border-b-4 border-double border-slate-900 pb-3 mb-6 text-center" style={{ textAlign: 'center' }}>
                <h1 className="text-base font-extrabold tracking-tight uppercase" style={{ textAlign: 'center' }}>{data.identitas.schoolName}</h1>
                <p className="text-lg font-black uppercase mt-1" style={{ textAlign: 'center' }}>LEMBAR PENILAIAN / EVALUASI HASIL BELAJAR MURID</p>
                <div style={{ textAlign: 'center' }}>
                  <p 
                    className="text-xs uppercase font-bold text-teal-800 mt-1 outline-none border border-dashed border-teal-200 hover:bg-teal-50/60 focus:bg-teal-50/70 p-1 rounded cursor-pointer inline-block mx-auto min-w-[200px]" 
                    style={{ textAlign: 'center' }}
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => {
                      setEditableTitle(e.currentTarget.textContent || "");
                    }}
                    title="Klik untuk mengedit langsung judul evaluasi"
                  >
                    {editableTitle}
                  </p>
                </div>
              </div>

              {/* Lembar Kelas & Nama */}
              <table className="w-full border border-slate-400 mb-6 text-xs text-slate-900">
                <tbody>
                  <tr>
                    <td className="w-1/2 p-2 border border-slate-400" style={{ verticalAlign: 'top' }}>
                      <div className="flex justify-between"><span className="font-bold">MATA PELAJARAN</span><span>: {data.identitas.subject}</span></div>
                      <div className="flex justify-between mt-1.5"><span className="font-bold">KELAS / SEMESTER</span><span>: Kelas {formInput.grade} / {formInput.semester}</span></div>
                    </td>
                    <td className="w-1/2 p-2 border border-slate-400" style={{ verticalAlign: 'top' }}>
                      <div className="flex justify-between"><span className="font-bold">NAMA LENGKAP</span><span>: .................................................</span></div>
                      <div className="flex justify-between mt-1.5"><span className="font-bold">NOMOR ABSEN</span><span>: .................................................</span></div>
                      <div className="flex justify-between mt-1.5"><span className="font-bold">HARI / TANGGAL</span><span>: ........................./.............. 20...</span></div>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Petunjuk Umum */}
              <div className="border-l-4 border-slate-800 pl-4 py-1.5 mb-8 text-xs text-slate-700 bg-slate-50">
                <p className="font-bold text-slate-900 mb-1">PETUNJUK UMUM UJIAN:</p>
                <p className="mb-0.5">1. Bacalah basmalah dan doa sebelum Anda mulai menjawab lembar ujian.</p>
                <p className="mb-0.5">2. Tuliskan Nama, Kelas, dan Hari/Tanggal secara lengkap pada kolom atas.</p>
                <p className="mb-0.5">3. Teliti kembali seluruh jawaban Anda sebelum dikumpulkan kepada guru.</p>
              </div>

              {loadingSoal ? (
                <div className="py-24 text-center space-y-4 no-print">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-teal-500 border-t-transparent" />
                  <p className="text-sm font-bold text-teal-800 animate-pulse">Sedang menyusun Lembar Soal Asesmen berdasarkan kisi-kisi...</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">Kami mengutamakan penyusunan akademis terstruktur sesuai kaidah Kurikulum Merdeka Cipta Ajar.</p>
                </div>
              ) : loadingError ? (
                <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-3 no-print">
                  <p className="text-sm font-bold text-rose-800">{loadingError}</p>
                  <button onClick={() => handleTabChange('soal')} className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all">Hubungi Enjin Ulang</button>
                </div>
              ) : (
                /* Rendering Soal Berurutan */
                <div className="space-y-8">
                  {currentSoal.map((s, idx) => (
                    <div key={idx} className="space-y-2.5 break-inside-avoid">
                      <table className="w-full border-none border-collapse" style={{ width: '100%', border: 'none', borderCollapse: 'collapse' }}>
                        <tbody>
                          <tr className="border-none" style={{ border: 'none' }}>
                            <td className="align-top font-extrabold text-slate-900 text-sm border-none p-0" style={{ border: 'none', padding: '0 4px 0 0', width: '28px', verticalAlign: 'top', fontWeight: 'bold' }}>
                              {s.no}.
                            </td>
                            <td className="align-top text-sm leading-relaxed text-justify border-none p-0" style={{ border: 'none', padding: '0', verticalAlign: 'top' }}>
                              <span className="no-print inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-700/10 mr-2" style={{ display: 'inline-flex', verticalAlign: 'middle', marginRight: '8px' }}>
                                {s.tipe} - {s.levelKognitif}
                              </span>
                              <FormattedTextWithTable
                                text={s.pertanyaan}
                                isEditable={true}
                                onSave={(newText) => updateSoalPertanyaan(idx, newText)}
                                className="inline-block w-full"
                              />
                              {s.stimulus && (
                                <div className="mt-2.5 ml-0 w-full max-w-xl">
                                  <StimulusRenderer stimulus={s.stimulus} />
                                </div>
                              )}
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      {/* --- KONTROL SOAL BERGAMBAR SINKRON (HANYA LAYAR) --- */}
                      <div className="pl-6 no-print flex flex-col gap-1.5 mb-2 select-none">
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <button
                            type="button"
                            onClick={() => {
                              setCurrentSoal(prev => prev.map(item => item.no === s.no ? { 
                                ...item, 
                                butuhGambar: !item.butuhGambar,
                                promptGambar: item.promptGambar || `Ilustrasi pendidikan hitam-putih sederhana untuk mendukung soal nomor ${item.no} tentang: "${item.pertanyaan}"`
                              } : item));
                            }}
                            className={cn(
                              "px-2.5 py-1 rounded-lg border font-bold transition-all cursor-pointer flex items-center gap-1.5 text-[11px] shrink-0",
                              s.butuhGambar 
                                ? "bg-cyan-50 text-cyan-800 border-cyan-200 hover:bg-cyan-100" 
                                : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                            )}
                          >
                            <span>🖼️</span>
                            <span>{s.butuhGambar ? "Soal Bergambar Aktif" : "Sertakan Gambar / Ilustrasi"}</span>
                          </button>
                          
                          {s.butuhGambar && s.promptGambar && (
                            <span className="italic truncate max-w-[280px] text-slate-400">
                              Prompt: "{s.promptGambar}"
                            </span>
                          )}
                        </div>

                        {s.butuhGambar && (
                          <div className="flex flex-wrap items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-2.5 max-w-xl text-[11px] mt-1">
                            <button
                              type="button"
                              onClick={() => {
                                const defaultPrompt = `Buatkan gambar atau ilustrasi pendidikan hitam-putih sederhana gaya sketsa garis (line art) minimalis untuk mendukung lembar soal anak sekolah mengenai: ${s.pertanyaan}`;
                                const promptToCopy = s.promptGambar || defaultPrompt;
                                navigator.clipboard.writeText(promptToCopy).then(() => {
                                  setCopiedNo(s.no);
                                  setTimeout(() => setCopiedNo(null), 3000);
                                }).catch(err => {
                                  console.error("Gagal menyalin prompt: ", err);
                                });
                                // Buka ChatGPT dengan isian prompt langsung di query URL q
                                window.open(`https://chatgpt.com/?q=${encodeURIComponent("Bantu buatkan gambar DALL-E 3 dengan deskripsi: " + promptToCopy)}`, '_blank');
                              }}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold transition-all cursor-pointer shadow-xs"
                            >
                              <span>🤖</span>
                              <span>{copiedNo === s.no ? "Tersalin & Terbuka!" : "Cari Gambar di ChatGPT"}</span>
                            </button>

                            <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-all cursor-pointer shadow-xs">
                              <span>📤</span>
                              <span>Unggah Gambar</span>
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    try {
                                      const compressedRes = await compressImage(file, 800, 600, 0.7);
                                      setCurrentSoal(prev => {
                                        const next = prev.map(item => item.no === s.no ? { ...item, imageUrl: compressedRes, butuhGambar: true } : item);
                                        syncQuizWithServer(next, currentKunci);
                                        return next;
                                      });
                                    } catch (err) {
                                      console.error("Gagal mengompresi gambar:", err);
                                      // Fallback to raw base64 if compression fails
                                      const reader = new FileReader();
                                      reader.onload = (ev) => {
                                        const res = ev.target?.result as string;
                                        setCurrentSoal(prev => {
                                          const next = prev.map(item => item.no === s.no ? { ...item, imageUrl: res, butuhGambar: true } : item);
                                          syncQuizWithServer(next, currentKunci);
                                          return next;
                                        });
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }
                                }}
                              />
                            </label>

                            {s.imageUrl && (
                              <button
                                type="button"
                                onClick={() => {
                                  setCurrentSoal(prev => {
                                    const next = prev.map(item => item.no === s.no ? { ...item, imageUrl: undefined } : item);
                                    syncQuizWithServer(next, currentKunci);
                                    return next;
                                  });
                                }}
                                className="px-2.5 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg font-bold transition-all cursor-pointer"
                              >
                                Hapus Gambar
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* --- RENDERING GAMBAR DI SOAL (PRINTABLE / EDITABLE) --- */}
                      {s.butuhGambar && s.imageUrl && (
                        <div className="pl-6 pb-2 break-inside-avoid">
                          <div className="max-w-[160px] max-h-[120px] rounded-lg border border-slate-200 overflow-hidden bg-slate-50/50 p-1 flex items-center justify-center shadow-xs">
                            <img 
                              src={s.imageUrl} 
                              alt={`Ilustrasi Soal ${s.no}`} 
                              className="max-w-[150px] max-h-[110px] object-contain rounded" 
                            />
                          </div>
                        </div>
                      )}

                      {/* Rendering Pilihan Ganda (PG) with cleaned double option tags */}
                      {s.tipe === 'PG' && s.opsi && (
                        <div className="pl-6 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-800">
                          {s.opsi.map((opt, oIdx) => (
                            <div key={oIdx} className="flex items-start gap-1">
                              <span className="font-bold">{String.fromCharCode(65 + oIdx)}.</span>
                              <span
                                className="outline-none hover:bg-teal-50/40 focus:bg-white focus:ring-1 focus:ring-teal-500 rounded px-1.5 py-0.5 transition-all cursor-text flex-1"
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => updateSoalOpsi(idx, oIdx, e.currentTarget.textContent || "")}
                              >
                                {cleanOptionText(opt)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Rendering Pilihan Ganda Kompleks (PGK) */}
                      {s.tipe === 'PGK' && s.opsi && (
                        <div className="pl-6 space-y-1.5 text-xs text-slate-700">
                          <p className="italic text-[11px] text-teal-800 font-bold mb-1">[Pilihlah semua jawaban yang Anda anggap benar!]</p>
                          {s.opsi.map((opt, oIdx) => (
                            <div key={oIdx} className="flex items-center gap-2">
                              <div className="w-3.5 h-3.5 border border-slate-400 rounded shrink-0" />
                              <span
                                className="outline-none hover:bg-teal-50/40 focus:bg-white focus:ring-1 focus:ring-teal-500 rounded px-1.5 py-0.5 transition-all cursor-text flex-1 text-sm"
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => updateSoalOpsi(idx, oIdx, e.currentTarget.textContent || "")}
                              >
                                {cleanOptionText(opt)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Benar / Salah */}
                      {s.tipe === 'BS' && (
                        <div className="pl-6 flex gap-4 text-xs font-bold text-slate-800">
                          <label className="flex items-center gap-2 border border-slate-300 px-4 py-1.5 rounded-lg hover:bg-slate-50 select-none">
                            <div className="w-3 h-3 border border-slate-400 rounded-full" />
                            <span>BENAR</span>
                          </label>
                          <label className="flex items-center gap-2 border border-slate-300 px-4 py-1.5 rounded-lg hover:bg-slate-50 select-none">
                            <div className="w-3 h-3 border border-slate-400 rounded-full" />
                            <span>SALAH</span>
                          </label>
                        </div>
                      )}

                      {/* Menjodohkan */}
                      {s.tipe === 'Menjodohkan' && s.matchingLeft && s.matchingRight && (
                        <div className="pl-6 pt-2 select-none break-inside-avoid">
                          <p className="text-xs italic text-blue-800 font-bold mb-2">[Jodohkanlah item di kolom kiri dengan pasangan di kolom kanan!]</p>
                          <table className="matching-grid w-full text-xs">
                            <thead>
                              <tr className="bg-slate-50">
                                <th className="font-bold p-1.5 border border-slate-350">Kolom Pernyataan</th>
                                <th className="font-bold p-1.5 border border-slate-350" colSpan={2}>Pilihan Jawaban (Menjodohkan)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Array.from({ length: Math.max(s.matchingLeft.length, s.matchingRight.length) }).map((_, mIdx) => (
                                <tr key={mIdx}>
                                  <td className="p-2 border border-slate-300">
                                    {s.matchingLeft?.[mIdx] ? (
                                      <div className="flex items-start gap-1">
                                        <span className="font-bold">{mIdx + 1}.</span>
                                        <span
                                          className="outline-none hover:bg-teal-50/40 focus:bg-white focus:ring-1 focus:ring-teal-500 rounded px-1.5 py-0.5 transition-all cursor-text flex-1"
                                          contentEditable
                                          suppressContentEditableWarning
                                          onBlur={(e) => updateSoalMatchingLeft(idx, mIdx, e.currentTarget.textContent || "")}
                                        >
                                          {s.matchingLeft[mIdx]}
                                        </span>
                                      </div>
                                    ) : ""}
                                  </td>
                                  <td className="text-center w-[8%] border border-slate-300 font-semibold font-mono text-slate-400">
                                    {s.matchingRight?.[mIdx] ? String.fromCharCode(65 + mIdx) : ""}
                                  </td>
                                  <td className="p-2 border border-slate-300">
                                    {s.matchingRight?.[mIdx] ? (
                                      <span
                                        className="outline-none hover:bg-teal-50/40 focus:bg-white focus:ring-1 focus:ring-teal-500 rounded px-1.5 py-0.5 transition-all cursor-text flex-1 block"
                                        contentEditable
                                        suppressContentEditableWarning
                                        onBlur={(e) => updateSoalMatchingRight(idx, mIdx, e.currentTarget.textContent || "")}
                                      >
                                        {s.matchingRight[mIdx]}
                                      </span>
                                    ) : ""}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Isian Singkat */}
                      {s.tipe === 'Isian' && (
                        <div className="pl-6 pt-1">
                          <span className="text-xs text-slate-600 font-semibold block">Jawaban:</span>
                          <div className="border-b border-dashed border-slate-400 w-full max-w-sm mt-3 pb-1" />
                        </div>
                      )}

                      {/* Uraian */}
                      {s.tipe === 'Uraian' && (
                        <div className="pl-6 pt-1 space-y-2">
                          <span className="text-xs text-slate-600 font-semibold block">Lembar Jawaban Murid:</span>
                          <div className="border border-slate-200 rounded-xl h-24 bg-slate-50/50 w-full" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: KUNCI JAWABAN & PEMBAHASAN */}
          {activeTab === 'kunci' && (
            <div className="space-y-6">
              <div className="text-center pb-6 border-b-2 border-slate-900 mb-6">
                <h1 className="text-lg font-bold uppercase tracking-tight">{data.identitas.schoolName}</h1>
                <p className="text-xl font-extrabold uppercase mt-1">LEMBAR KUNCI JAWABAN DAN PEMBAHASAN MATERI</p>
                <p className="text-xs uppercase font-bold text-amber-600 mt-0.5">Panduan Khusus Pendidik • Rahasia Pendidikan</p>
              </div>

              {loadingKunci ? (
                <div className="py-24 text-center space-y-4 no-print">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-amber-500 border-t-transparent" />
                  <p className="text-sm font-bold text-amber-800 animate-pulse">Sedang merancang Kunci Jawaban & Pembahasan...</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">Kami menyusun kajian akademis serta penalaran ilmiah yang mudah dipahami demi penjelasan materi maksimal.</p>
                </div>
              ) : loadingError ? (
                <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-3 no-print">
                  <p className="text-sm font-bold text-rose-800">{loadingError}</p>
                  <button onClick={() => handleTabChange('kunci')} className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all">Mulai Ulang</button>
                </div>
              ) : (
                /* List Kunci & Pembahasan */
                <div className="overflow-x-auto">
                  <table className="spreadsheet-table w-full text-xs" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '16px' }}>
                    <thead>
                      <tr className="bg-slate-100 text-slate-900 font-bold">
                        <th className="w-[6%] text-center" style={{ width: '6%', padding: '10px', textAlign: 'center', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1' }}>No</th>
                        <th className="w-[14%] text-center" style={{ width: '14%', padding: '10px', textAlign: 'center', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1' }}>Bentuk Soal</th>
                        <th className="w-[35%]" style={{ width: '35%', padding: '10px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1' }}>Kunci Jawaban</th>
                        <th className="w-[45%]" style={{ width: '45%', padding: '10px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1' }}>Pembahasan Konsep</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentKunci.map((k, idx) => (
                        <tr key={idx} style={{ pageBreakInside: 'avoid' }}>
                          <td className="text-center font-bold" style={{ textAlign: 'center', padding: '10px', border: '1px solid #cbd5e1' }}>{k.no}</td>
                          <td className="text-center font-semibold text-slate-600" style={{ textAlign: 'center', padding: '10px', border: '1px solid #cbd5e1' }}>{k.tipe}</td>
                          <td style={{ padding: '10px', border: '1px solid #cbd5e1', verticalAlign: 'top' }} className="text-justify whitespace-pre-line font-semibold text-slate-800">
                            <div
                              className="outline-none hover:bg-teal-50/40 focus:bg-white focus:ring-1 focus:ring-teal-500 rounded p-1 transition-all cursor-text"
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={(e) => updateKunciJawaban(idx, e.currentTarget.textContent || "")}
                            >
                              {getDisplayKunciPG(k.kunci, k.no)}
                            </div>
                          </td>
                          <td style={{ padding: '10px', border: '1px solid #cbd5e1', verticalAlign: 'top' }} className="text-justify text-slate-700 leading-relaxed">
                            <FormattedTextWithTable
                              text={k.pembahasan}
                              isEditable={true}
                              onSave={(newText) => updateKunciPembahasan(idx, newText)}
                              size="sm"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: RUBRIK PENILAIAN */}
          {activeTab === 'rubrik' && (
            <div className="space-y-6">
              <div className="text-center pb-6 border-b-2 border-slate-900 mb-6">
                <h1 className="text-base font-bold uppercase tracking-tight">{data.identitas.schoolName}</h1>
                <p className="text-xl font-extrabold uppercase mt-1">PANDUAN RUBRIK PENILAIAN ASESMEN</p>
                <p className="text-xs uppercase mt-0.5 text-slate-600">Panduan Teknis Guru • Kriteria Ketuntasan Tujuan Pembelajaran</p>
              </div>

              {loadingRubrik ? (
                <div className="py-24 text-center space-y-4 no-print">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent" />
                  <p className="text-sm font-bold text-indigo-800 animate-pulse">Sedang memformulasikan kriteria rubrik skor...</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">Berdasarkan bobot evaluasi Kurikulum Merdeka Cipta Ajar.</p>
                </div>
              ) : loadingError ? (
                <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-3 no-print">
                  <p className="text-sm font-bold text-rose-800">{loadingError}</p>
                  <button onClick={() => handleTabChange('rubrik')} className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all">Mulai Ulang</button>
                </div>
              ) : (
                /* Rubric layout bound directly with question indexes */
                <div className="overflow-x-auto">
                  <table className="spreadsheet-table w-full text-xs" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '16px' }}>
                    <thead>
                      <tr className="bg-slate-100 text-slate-905 font-bold">
                        <th className="w-[10%] text-center" style={{ width: '10%', padding: '10px', textAlign: 'center', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1' }}>No Soal</th>
                        <th className="w-[18%] text-center" style={{ width: '18%', padding: '10px', textAlign: 'center', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1' }}>Bentuk Soal</th>
                        <th className="w-[72%]" style={{ width: '72%', padding: '10px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1' }}>Kriteria & Rubrik Skor Penilaian</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentSoal.map((s, idx) => {
                        const rText = currentRubrik[s.no] || "Sedang memetakan rubrik penilaian khusus...";
                        return (
                          <tr key={idx} style={{ pageBreakInside: 'avoid' }}>
                            <td className="text-center font-bold" style={{ textAlign: 'center', padding: '10px', border: '1px solid #cbd5e1' }}>{s.no}</td>
                            <td className="text-center font-semibold text-slate-600" style={{ textAlign: 'center', padding: '10px', border: '1px solid #cbd5e1' }}>{s.tipe}</td>
                            <td style={{ padding: '10px', border: '1px solid #cbd5e1', verticalAlign: 'top' }} className="text-justify whitespace-pre-line text-slate-705 leading-relaxed">
                              <div
                                className="outline-none hover:bg-teal-50/40 focus:bg-white focus:ring-1 focus:ring-teal-500 rounded p-1 transition-all cursor-text whitespace-pre-line"
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => updateRubrikText(s.no, e.currentTarget.innerText || "")}
                              >
                                {rText}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tanda Tangan Hasil (Removed strictly ONLY when viewing activeTab === 'soal') */}
          {activeTab !== 'soal' && (
            <div className="mt-16 w-full">
              <table className="w-full border-none border-collapse">
                <tbody>
                  <tr className="border-none">
                    <td className="w-1/2 text-left align-top p-0 border-none">
                      <p className="mb-1">Mengetahui,</p>
                      <p className="mb-0">Kepala Sekolah</p>
                      <div className="mt-20"> 
                        <p className="font-bold underline mb-0">{formInput.principalName}</p>
                        <p className="text-xs mt-0">NIP. {formInput.principalNip}</p>
                      </div>
                    </td>
                    <td className="w-1/2 text-left align-top p-0 border-none">
                      <p className="mb-1">
                        {formInput.signaturePlace ? `${formInput.signaturePlace}` : '.................'}, ................... 20....
                      </p>
                      <p className="mb-0">{formInput.position || 'Guru Kelas'}</p>
                      <div className="mt-20">
                        <p className="font-bold underline mb-0">{formInput.teacherName}</p>
                        <p className="text-xs mt-0">NIP. {formInput.teacherNip}</p>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
