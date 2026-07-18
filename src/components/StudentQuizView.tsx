import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ClipboardCheck, ArrowLeft, ArrowRight, CheckCircle2, XCircle, Award, Printer, ChevronRight, HelpCircle, Volume2, Download } from 'lucide-react';
import { QuestionItem, KunciPembahasanItem } from '../types';
import { cn } from '../lib/utils';
import { jsPDF } from 'jspdf';
import FormattedTextWithTable from './FormattedTextWithTable';
import StimulusRenderer from './StimulusRenderer';

interface StudentQuizViewProps {
  quizToken: string;
  onExit: () => void;
}

interface DecodedQuiz {
  schoolName: string;
  subject: string;
  grade: string;
  semester: string;
  jenisAsesmen: string;
  soal: QuestionItem[];
  kunci: KunciPembahasanItem[];
}

export default function StudentQuizView({ quizToken, onExit }: StudentQuizViewProps) {
  const [quizData, setQuizData] = useState<DecodedQuiz | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Student details
  const [studentName, setStudentName] = useState('');
  const [studentAbsen, setStudentAbsen] = useState('');
  const [isStarted, setIsStarted] = useState(false);

  // Test states
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [scoreResult, setScoreResult] = useState<{
    score: number;
    correctCount: number;
    totalGradable: number;
    totalQuestions: number;
  } | null>(null);

  // Time elapsed
  const [timer, setTimer] = useState(0);

  // Decode quiz payload
  useEffect(() => {
    if (!quizToken) return;
    
    // Check if the token is a short quiz ID or a full base64 object
    const isBase64 = quizToken.length > 80 && (quizToken.startsWith("eyJ") || quizToken.includes("ey"));

    if (isBase64) {
      try {
        // Safe base64 decoding for unicode
        const safeAtoB = (str: string) => {
          return decodeURIComponent(
            Array.prototype.map.call(atob(str), (c) => {
              return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join('')
          );
        };

        const decodedStr = safeAtoB(quizToken);
        const parsed = JSON.parse(decodedStr) as DecodedQuiz;
        
        if (!parsed || !parsed.soal || !Array.isArray(parsed.soal)) {
          throw new Error("Format lembar soal online tidak valid.");
        }
        setQuizData(parsed);
      } catch (e: any) {
        console.error(e);
        setErrorMsg("Tautan ujian tidak valid atau terjadi kesalahan decoding.");
      }
    } else {
      // It's a short unique quiz ID (or server quizId), fetch dynamically from the Express backend
      fetch(`/api/quizzes/${encodeURIComponent(quizToken)}`)
        .then(async (res) => {
          if (!res.ok) {
            const errJson = await res.json().catch(() => ({}));
            throw new Error(errJson.error || "Kelas ujian online ini tidak aktif atau lembar soal telah dihapus oleh guru.");
          }
          return res.json();
        })
        .then((data: DecodedQuiz) => {
          if (!data || !data.soal || !Array.isArray(data.soal)) {
            throw new Error("Format data soal dari server tidak valid.");
          }
          setQuizData(data);
        })
        .catch((err: any) => {
          console.error(err);
          setErrorMsg(err.message || "Gagal menyinkronkan data lembar soal online dari server guru.");
        });
    }
  }, [quizToken]);

  // Timer counter
  useEffect(() => {
    if (isStarted && !isCompleted) {
      const interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isStarted, isCompleted]);

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 text-center shadow-2xl border border-slate-200">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl font-bold font-mono">⚠️</div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Tautan Ujian Gagal Dimuat</h2>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">{errorMsg}</p>
          <button
            onClick={onExit}
            className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-md cursor-pointer"
          >
            Kembali ke Portal Guru
          </button>
        </div>
      </div>
    );
  }

  if (!quizData) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent" />
          <p className="text-white font-bold text-sm animate-pulse tracking-wide">Menyiapkan Lembar Ujian Digital Siswa...</p>
        </div>
      </div>
    );
  }

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStartQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) {
      alert("Silakan masukkan nama lengkap Anda terlebih dahulu.");
      return;
    }
    setIsStarted(true);
  };

  const handleAnswerSelect = (qNo: number, value: any, tipe: string) => {
    if (tipe === 'PGK') {
      const current = answers[qNo] || [];
      const updated = current.includes(value)
        ? current.filter((x: any) => x !== value)
        : [...current, value];
      setAnswers({ ...answers, [qNo]: updated });
    } else {
      setAnswers({ ...answers, [qNo]: value });
    }
  };

  const currentSoalItem = quizData.soal[currentIndex];

  const handleNext = () => {
    if (currentIndex < quizData.soal.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleFinishQuiz = () => {
    const confirmSubmit = window.confirm("Apakah Anda yakin telah menyelesaikan semua soal dan ingin mengirim lembar jawaban?");
    if (!confirmSubmit) return;

    // Evaluate answers
    let gradableCount = 0;
    let correctCount = 0;

    quizData.soal.forEach((s) => {
      const studentAns = answers[s.no];
      const matchingKey = quizData.kunci.find((k) => k.no === s.no);

      if (matchingKey && (s.tipe === 'PG' || s.tipe === 'BS')) {
        gradableCount++;
        const normalizeKunci = (matchingKey.kunci || "").trim().toUpperCase();
        const normalizeStudent = (studentAns || "").toString().trim().toUpperCase();

        // Standard checks
        if (s.tipe === 'PG') {
          const cleanOptionTextLocal = (text: string): string => {
            if (!text) return "";
            const prefixRegex = /^[A-Ea-e][\.\)\s-]+\s*/;
            return text.replace(prefixRegex, "").trim().toUpperCase();
          };

          const charCode = normalizeStudent.charCodeAt(0);
          const selectedIdx = charCode - 65; // 'A' is 65
          const rawSelectedOption = (s.opsi && s.opsi[selectedIdx]) ? s.opsi[selectedIdx] : "";
          const cleanSelectedText = cleanOptionTextLocal(rawSelectedOption);
          const cleanKunciText = cleanOptionTextLocal(normalizeKunci);

          const isDirectMatch = normalizeStudent === normalizeKunci || normalizeKunci.startsWith(normalizeStudent);
          const isTextMatch = cleanSelectedText !== "" && (
            cleanSelectedText === cleanKunciText || 
            cleanKunciText.includes(cleanSelectedText) || 
            cleanSelectedText.includes(cleanKunciText)
          );

          if (isDirectMatch || isTextMatch) {
            correctCount++;
          }
        } else if (s.tipe === 'BS') {
          if (normalizeStudent.substring(0, 1) === normalizeKunci.substring(0, 1)) {
            correctCount++;
          }
        }
      }
    });

    const calculatedScore = gradableCount > 0 ? Math.round((correctCount / gradableCount) * 100) : 100;

    const resultPayload = {
      score: calculatedScore,
      correctCount,
      totalGradable: gradableCount,
      totalQuestions: quizData.soal.length,
    };

    setScoreResult(resultPayload);
    setIsCompleted(true);

    // Save submission locally and remotely for the live teacher monitor
    try {
      const localSubmissionsKey = 'tm_online_submissions';
      const existing = localStorage.getItem(localSubmissionsKey);
      const list = existing ? JSON.parse(existing) : [];
      
      const newSubmission = {
        name: studentName,
        absen: studentAbsen || "—",
        score: calculatedScore,
        correctAnswers: correctCount,
        totalQuestions: quizData.soal.length,
        submittedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        duration: formatTime(timer),
        status: 'Selesai'
      };

      list.unshift(newSubmission);
      localStorage.setItem(localSubmissionsKey, JSON.stringify(list));

      // Dispatch storage event to notify other tabs automatically
      window.dispatchEvent(new Event('storage'));

      // Save submission to central database via Express API so teacher monitors globally on separate accounts/devices
      fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizToken,
          name: studentName,
          absen: studentAbsen || "—",
          score: calculatedScore,
          correctAnswers: correctCount,
          totalQuestions: quizData.soal.length,
          duration: formatTime(timer)
        })
      }).catch(err => console.error("Gagal mengirim nilai online ke server:", err));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // colors
      const primaryColor = [13, 148, 136]; 
      const darkColor = [30, 41, 59];      
      const lightBg = [248, 250, 252];     

      // Frame
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setLineWidth(1);
      doc.rect(10, 10, 190, 277);
      
      doc.setDrawColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.setLineWidth(0.3);
      doc.rect(12, 12, 186, 273);

      // Header
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(22);
      doc.text("Laporan Hasil Belajar Mandiri", 105, 35, { align: 'center' });

      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.setFontSize(11);
      doc.setFont("Helvetica", "normal");
      doc.text("Kertas Bukti Capaian Asesmen Kurikulum Merdeka", 105, 42, { align: 'center' });

      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setLineWidth(0.8);
      doc.line(40, 48, 170, 48);

      doc.setFontSize(10);
      doc.setFont("Helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text(`Kuis ID: ${quizToken ? quizToken.substring(0, 15) + "..." : "Online"}`, 105, 54, { align: 'center' });

      // Student Identity Box
      doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
      doc.rect(20, 65, 170, 45, "F");
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.rect(20, 65, 170, 45, "D");

      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(12);
      doc.text("IDENTITAS PESERTA DIDIK", 25, 73);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(11);
      
      doc.text("Nama Lengkap", 25, 83);
      doc.setFont("Helvetica", "bold");
      doc.text(`: ${studentName.toUpperCase()}`, 65, 83);

      doc.setFont("Helvetica", "normal");
      doc.text("Nomor Absen", 25, 91);
      doc.setFont("Helvetica", "bold");
      doc.text(`: ${studentAbsen ? studentAbsen : "—"}`, 65, 91);

      doc.setFont("Helvetica", "normal");
      doc.text("Mata Pelajaran", 25, 99);
      doc.setFont("Helvetica", "bold");
      doc.text(`: ${quizData.subject || "Evaluasi"}`, 65, 99);

      // Score Box
      doc.setFillColor(240, 253, 250); 
      doc.rect(20, 120, 170, 50, "F");
      doc.setDrawColor(15, 118, 110);
      doc.setLineWidth(0.5);
      doc.rect(20, 120, 170, 50, "D");

      doc.setTextColor(15, 118, 110);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(13);
      doc.text("SKOR CAPAIAN HASIL BELAJAR", 105, 130, { align: 'center' });

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(54);
      doc.text(`${scoreResult ? scoreResult.score : 0}`, 105, 155, { align: 'center' });

      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(10.5);
      doc.text(`Rincian Jawaban: ${scoreResult ? scoreResult.correctCount : 0} Benar dari ${scoreResult ? scoreResult.totalGradable : 0} Soal PG & BS`, 105, 164, { align: 'center' });

      // Grades Predicate
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(12);
      const finalScore = scoreResult ? scoreResult.score : 0;
      let predikat = "PERLU BIMBINGAN";
      let keterangan = "Tetap semangat belajar! Tinjaulah kembali pembahasan soal di bawah ini untuk menguasai materi.";
      if (finalScore >= 90) {
        predikat = "SANGAT BAIK (ISTIMEWA)";
        keterangan = "Luar biasa! Kamu telah menguasai seluruh indikator kompetensi KD dengan sangat sempurna.";
      } else if (finalScore >= 75) {
        predikat = "BAIK (TUNTAS)";
        keterangan = "Selamat! Kamu telah mencapai kriteria ketuntasan tujuan pembelajaran dengan hasil yang memuaskan.";
      } else if (finalScore >= 60) {
        predikat = "CUKUP (TUNTAS)";
        keterangan = "Cukup tuntas. Pelajari kembali materi yang belum kamu pahami agar nilaimu semakin meningkat.";
      }

      doc.text(`Predikat: ${predikat}`, 105, 185, { align: 'center' });
      
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(100, 116, 139);
      const splitKeterangan = doc.splitTextToSize(keterangan, 150);
      doc.text(splitKeterangan, 105, 192, { align: 'center' });

      // Signatures
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.setFontSize(9.5);
      doc.setFont("Helvetica", "normal");
      const submissionDate = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      doc.text(`Diunduh pada: ${submissionDate}`, 25, 230);
      doc.text("Diserahkan Mandiri,", 25, 235);
      
      doc.setFont("Helvetica", "bold");
      doc.text(studentName.toUpperCase(), 25, 255);
      doc.setFont("Helvetica", "normal");
      doc.text(`No Absen: ${studentAbsen ? studentAbsen : "—"}`, 25, 259);

      doc.text("Mengetahui,", 140, 230);
      doc.text("Pendidik Kelas,", 140, 235);
      doc.setFont("Helvetica", "bold");
      doc.text("GURU UTAMA", 140, 255);
      doc.setFont("Helvetica", "normal");
      doc.text("Sistem Evaluasi Auto-Audit", 140, 259);

      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("Lembar ini diterbitkan secara sah oleh Platform Asesmen Edukasi Pintas Kurikulum Merdeka.", 105, 275, { align: 'center' });

      doc.save(`Hasil_Ujian_${studentName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`);
    } catch (e) {
      console.error(e);
      window.print();
    }
  };

  const handlePrintResult = () => {
    window.print();
  };

  // Pre-configured CSS specifically for mobile exam
  return (
    <div className="min-h-screen bg-slate-105 bg-slate-900 pb-12 select-none font-sans flex flex-col justify-between">
      
      {/* HEADER BAR */}
      <header className="bg-slate-800 border-b border-slate-700/80 sticky top-0 z-40 px-4 py-3 text-white no-print">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center text-xs font-bold font-sans">
              🏫
            </div>
            <div className="truncate max-w-[170px] xs:max-w-[210px]">
              <h2 className="text-[11px] font-black tracking-wider text-teal-400 uppercase leading-none">{quizData.schoolName || "DOKUMEN ASLI"}</h2>
              <p className="text-[10px] text-slate-400 font-bold tracking-tight mt-0.5 truncate">{quizData.subject} • Kelas {quizData.grade}</p>
            </div>
          </div>
          
          {isStarted && !isCompleted && (
            <div className="bg-teal-950 px-2.5 py-1 rounded-lg border border-teal-800 text-[10px] sm:text-xs font-mono font-bold text-teal-400 animate-pulse shrink-0 flex items-center gap-1.5">
              <span>⏱️</span>
              <span>{formatTime(timer)}</span>
            </div>
          )}

          {!isStarted && (
            <button 
              onClick={onExit}
              className="px-2.5 py-1 text-[10px] uppercase font-bold text-slate-400 hover:text-white bg-slate-700/50 rounded-lg transition-all"
            >
              Exit
            </button>
          )}
        </div>
      </header>

      {/* RENDER INTRUCTION / LOGIN FORM */}
      {!isStarted ? (
        <section className="flex-1 flex items-center justify-center px-4 py-6 no-print">
          <motion.div 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200"
          >
            {/* Exam card identity */}
            <div className="text-center space-y-2">
              <div className="inline-flex py-1 px-3 bg-teal-50 border border-teal-200 rounded-full text-[10px] font-bold text-teal-800 uppercase tracking-widest leading-none">
                {quizData.jenisAsesmen || "Evaluasi Belajar"}
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
                Portal Soal Mandiri Siswa
              </h1>
              <p className="text-xs text-slate-600 font-medium">
                Selamat datang! Isi identitas lengkap di bawah untuk memulai asesmen interaktif dari guru Anda.
              </p>
            </div>

            <div className="divide-y divide-slate-100 bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs font-semibold space-y-2.5 text-slate-700">
              <div className="flex justify-between items-center pb-2">
                <span className="text-slate-500">Mata Pelajaran</span>
                <span className="text-slate-900 font-bold">{quizData.subject}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-500">Kelas / Semester</span>
                <span className="text-slate-900 font-bold">Kelas {quizData.grade} / Sem. {quizData.semester}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-500">Jumlah Pertanyaan</span>
                <span className="text-slate-900 font-bold text-blue-600">{quizData.soal.length} Soal</span>
              </div>
            </div>

            <form onSubmit={handleStartQuiz} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Nama Lengkap Murid</label>
                <input 
                  type="text" 
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Masukkan nama lengkap Anda..."
                  required
                  className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-slate-900 rounded-xl border border-slate-200 focus:border-teal-500 font-medium text-sm outline-none transition-all placeholder:text-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Nomor Absen</label>
                  <input 
                    type="number" 
                    value={studentAbsen}
                    onChange={(e) => setStudentAbsen(e.target.value)}
                    placeholder="Contoh: 15"
                    className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-slate-900 rounded-xl border border-slate-200 focus:border-teal-500 font-medium text-sm outline-none transition-all placeholder:text-slate-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Kelas</label>
                  <input 
                    type="text" 
                    disabled 
                    value={`Kelas ${quizData.grade}`}
                    className="w-full px-4 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-200 text-sm cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-teal-600 hover:bg-teal-700 hover:scale-[1.01] active:scale-[0.99] text-white font-extrabold py-3.5 px-6 rounded-xl transition-all shadow-md shadow-teal-700/10 cursor-pointer flex items-center justify-center gap-2"
                >
                  <ClipboardCheck className="w-5 h-5" />
                  Mulai Ujian Sekarang
                </button>
              </div>
            </form>
          </motion.div>
        </section>
      ) : !isCompleted ? (
        /* ACTIVE CONTEST SCREEN */
        <section className="flex-1 max-w-xl mx-auto w-full px-4 py-6 flex flex-col justify-between no-print">
          <div className="space-y-4 flex-1">
            
            {/* Question Progress Line */}
            <div className="flex items-center justify-between gap-3 text-xs text-slate-400 font-bold">
              <span>PROGRES ASESMEN</span>
              <span className="text-teal-400 bg-slate-800 px-2.5 py-1 rounded-md">Soal {currentIndex + 1} dari {quizData.soal.length}</span>
            </div>
            
            {/* Custom Micro Progress Indicator bar */}
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-teal-500 h-full transition-all duration-300" 
                style={{ width: `${((currentIndex + 1) / quizData.soal.length) * 100}%` }}
              />
            </div>

            {/* MAIN QUESTION CARD */}
            <motion.div 
              key={currentIndex}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xl space-y-5"
            >
              {/* Badge level & Tipe */}
              <div className="flex items-center justify-between">
                <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  Tipe: {currentSoalItem.tipe}
                </span>
                <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  Level: {currentSoalItem.levelKognitif}
                </span>
              </div>

              {/* Question Text */}
              <div className="text-slate-900 font-extrabold text-sm sm:text-base leading-relaxed flex items-start gap-2">
                <span className="text-teal-700 font-bold font-mono text-lg shrink-0">{currentIndex + 1}.</span>
                <FormattedTextWithTable
                  text={currentSoalItem.pertanyaan}
                  isEditable={false}
                  className="flex-1"
                />
              </div>

              {/* Dynamic Stimulus Chart/Table */}
              {currentSoalItem.stimulus && (
                <div className="my-3 w-full max-w-xl">
                  <StimulusRenderer stimulus={currentSoalItem.stimulus} />
                </div>
              )}

              {/* IMAGE HOOK WITH MAX-WIDTH CONSTRAINTS (As requested, not too wide to save space) */}
              {currentSoalItem.butuhGambar && (
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-2.5 flex flex-col items-center justify-center text-center">
                  {currentSoalItem.imageUrl ? (
                    <div className="max-w-[280px] max-h-[180px] rounded-xl overflow-hidden shadow-xs border border-slate-200 bg-white p-1">
                      <img 
                        src={currentSoalItem.imageUrl} 
                        alt={`Visualisasi Soal ${currentSoalItem.no}`} 
                        className="max-w-[260px] max-h-[160px] object-contain rounded"
                      />
                    </div>
                  ) : (
                    <div className="max-w-[280px] w-full p-3 bg-amber-50/50 border border-amber-200 rounded-xl text-left text-[11px] leading-relaxed text-amber-900">
                      <span className="block font-bold mb-1">🖼️ Petunjuk Visual Soal:</span>
                      <p className="italic font-medium">"{currentSoalItem.promptGambar || 'Ilustrasi pendukung materi'}"</p>
                    </div>
                  )}
                </div>
              )}

              {/* RESPONSIVE OPTION SELECTOR BASED ON TYPE */}
              <div className="space-y-3 pt-2">
                {/* 1. Multiple Choice (PG) */}
                {currentSoalItem.tipe === 'PG' && currentSoalItem.opsi && (
                  <div className="grid grid-cols-1 gap-2.5">
                    {currentSoalItem.opsi.map((opt, i) => {
                      const optCode = String.fromCharCode(65 + i); // A, B, C...
                      const isSelected = answers[currentSoalItem.no] === optCode;
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleAnswerSelect(currentSoalItem.no, optCode, 'PG')}
                          className={cn(
                            "w-full text-left px-4 py-3 rounded-xl border font-bold text-xs sm:text-sm flex items-center gap-3 transition-all cursor-pointer",
                            isSelected
                              ? "bg-teal-50 border-teal-500 text-teal-900 shadow-md ring-1 ring-teal-500/20"
                              : "bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100"
                          )}
                        >
                          <span className={cn(
                            "w-7 h-7 rounded-lg font-bold font-mono flex items-center justify-center shrink-0 border text-xs shadow-xs",
                            isSelected
                              ? "bg-teal-600 text-white border-teal-600"
                              : "bg-white text-slate-500 border-slate-300"
                          )}>
                            {optCode}
                          </span>
                          <span className="leading-snug">{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* 2. Benar / Salah (BS) */}
                {currentSoalItem.tipe === 'BS' && (
                  <div className="grid grid-cols-2 gap-3 pb-2">
                    {['BENAR', 'SALAH'].map((val) => {
                      const isSelected = answers[currentSoalItem.no] === val;
                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleAnswerSelect(currentSoalItem.no, val, 'BS')}
                          className={cn(
                            "py-4 rounded-2xl border font-black text-sm text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2",
                            isSelected
                              ? val === 'BENAR' 
                                ? "bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/15" 
                                : "bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-500/15"
                              : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                          )}
                        >
                          <span className="text-xl">{val === 'BENAR' ? '✔️' : '❌'}</span>
                          <span>{val}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* 3. Pilihan Ganda Kompleks (PGK) */}
                {currentSoalItem.tipe === 'PGK' && currentSoalItem.opsi && (
                  <div className="space-y-2">
                    <p className="text-[10px] sm:text-xs text-blue-800 font-bold italic mb-2">⭐ Anda boleh memilih lebih dari satu jawaban benar:</p>
                    {currentSoalItem.opsi.map((opt, i) => {
                      const optCode = String.fromCharCode(65 + i);
                      const selectedList = answers[currentSoalItem.no] || [];
                      const isChecked = selectedList.includes(optCode);
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleAnswerSelect(currentSoalItem.no, optCode, 'PGK')}
                          className={cn(
                            "w-full text-left px-4 py-3 rounded-xl border text-xs sm:text-sm font-bold flex items-center gap-3 transition-all cursor-pointer",
                            isChecked
                              ? "bg-blue-50 border-blue-500 text-blue-900 shadow-md"
                              : "bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100"
                          )}
                        >
                          <span className={cn(
                            "w-5 h-5 rounded-md flex items-center justify-center border text-xs font-bold leading-none shrink-0",
                            isChecked ? "bg-blue-600 text-white border-blue-600" : "bg-white border-slate-300"
                          )}>
                            {isChecked && "✓"}
                          </span>
                          <span className="leading-tight">{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* 4. Menjodohkan */}
                {currentSoalItem.tipe === 'Menjodohkan' && currentSoalItem.matchingLeft && (
                  <div className="space-y-4">
                    <p className="text-[10px] sm:text-xs text-blue-800 font-bold italic mb-2">🧩 Jodohkanlah dengan memilih pasangan yang tepat di kolom kanan:</p>
                    {currentSoalItem.matchingLeft.map((leftItem, lIdx) => {
                      const currentSelection = answers[currentSoalItem.no]?.[lIdx] || "";
                      return (
                        <div key={lIdx} className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex flex-col xs:flex-row xs:items-center justify-between gap-3 text-xs font-bold text-slate-800">
                          <span className="xs:w-1/2 leading-relaxed">{lIdx + 1}. {leftItem}</span>
                          <select
                            value={currentSelection}
                            onChange={(e) => {
                              const currAnswers = answers[currentSoalItem.no] || {};
                              setAnswers({
                                ...answers,
                                [currentSoalItem.no]: { ...currAnswers, [lIdx]: e.target.value }
                              });
                            }}
                            className="bg-white border border-slate-300 px-3 py-2 rounded-xl text-xs text-slate-700 outline-none focus:border-teal-500 font-bold xs:w-1/2 cursor-pointer shadow-xs"
                          >
                            <option value="">-- Pilih Jodoh --</option>
                            {currentSoalItem.matchingRight?.map((rightItem, rIdx) => (
                              <option key={rIdx} value={rightItem}>
                                {String.fromCharCode(65 + rIdx)}. {rightItem}
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 5. Isian Singkat */}
                {currentSoalItem.tipe === 'Isian' && (
                  <div className="space-y-2">
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">Jawab Singkat Pada Kolom Di Bawah</label>
                    <input
                      type="text"
                      value={answers[currentSoalItem.no] || ""}
                      onChange={(e) => handleAnswerSelect(currentSoalItem.no, e.target.value, 'Isian')}
                      placeholder="Ketikkan jawaban singkat Anda di sini..."
                      className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-slate-900 rounded-xl border border-slate-200 focus:border-teal-500 font-medium text-sm outline-none transition-all placeholder:text-slate-400"
                    />
                  </div>
                )}

                {/* 6. Uraian */}
                {currentSoalItem.tipe === 'Uraian' && (
                  <div className="space-y-2">
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">Lembar Jawaban Panjang (Analisis Esai)</label>
                    <textarea
                      value={answers[currentSoalItem.no] || ""}
                      onChange={(e) => handleAnswerSelect(currentSoalItem.no, e.target.value, 'Uraian')}
                      rows={4}
                      placeholder="Tuliskan penjelasan lengkap Anda di sini..."
                      className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/55 focus:bg-white text-slate-900 rounded-2xl border border-slate-200 focus:border-teal-500 font-medium text-sm outline-none transition-all placeholder:text-slate-400 resize-none"
                    />
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* CONTROL BOARD LOWER PANEL */}
          <div className="mt-8 flex items-center justify-between gap-4">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="px-4 py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Kembali
            </button>

            {currentIndex < quizData.soal.length - 1 ? (
              <button
                onClick={handleNext}
                className="px-5 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
              >
                Lanjut <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleFinishQuiz}
                className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:opacity-95 text-white rounded-xl text-xs font-extrabold transition-all shadow-md cursor-pointer flex items-center gap-2 animate-bounce"
              >
                Kumpulkan Jawaban 🚀
              </button>
            )}
          </div>
        </section>
      ) : (
        /* RESULT REPORT CARD VIEW (PRINT FRIENDLY AT ONCE) */
        <section className="flex-1 max-w-xl mx-auto w-full px-4 py-6 text-slate-900">
          
          {/* Main Success Visual Box */}
          <motion.div 
            initial={{ scale: 0.96, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200/80 mb-6 no-print"
          >
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-605 rounded-2xl flex items-center justify-center mx-auto text-4xl mb-2 animate-bounce">
                🎉
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
                Asesmen Berhasil Dikirim!
              </h1>
              <p className="text-xs text-slate-600 font-medium max-w-sm mx-auto leading-relaxed">
                Kerja bagus, <strong className="text-slate-800">{studentName}</strong>! Lembar jawaban Anda telah tersimpan dan terkirim otomatis ke dasbor evaluasi guru.
              </p>
            </div>

            {/* Assessment results (Only shows if they had PG or BS questions) */}
            {scoreResult && scoreResult.totalGradable > 0 && (
              <div className="bg-gradient-to-tr from-slate-900 to-slate-800 rounded-2xl p-5 text-center text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/10 rounded-full blur-xl pointer-events-none" />
                <p className="text-[10px] font-bold text-teal-400 uppercase tracking-widest">NILAI HASIL BELAJAR MANDIRI</p>
                <div className="text-[4rem] font-sans font-black leading-none mt-2 text-teal-300">
                  {scoreResult.score}
                </div>
                <p className="text-xs text-slate-300 mt-2 font-medium">
                  Menjawab <strong className="text-white font-bold">{scoreResult.correctCount}</strong> benar dari <strong className="text-white font-bold">{scoreResult.totalGradable}</strong> Soal Pilihan Ganda/Evaluatif
                </p>
              </div>
            )}

            {/* Signature & download block */}
            <div className="flex flex-col sm:flex-row gap-3 pt-3">
              <button
                onClick={handleDownloadPDF}
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-xl text-xs transition-colors shadow-md cursor-pointer flex items-center justify-center gap-1.5 min-h-[44px]"
              >
                <Download className="w-4 h-4" /> Unduh PDF Bukti Nilai (Rapor)
              </button>
              
              <button
                onClick={onExit}
                className="flex-1 bg-slate-700 hover:bg-slate-650 text-slate-100 font-bold py-3 px-4 rounded-xl text-xs transition-colors border border-slate-600 cursor-pointer min-h-[44px]"
              >
                Keluar ke Lembar Utama
              </button>
            </div>
          </motion.div>

          {/* DETAILED RESULTS FOR EDUCATIONAL DISCUSSION & DISCOVERY */}
          <div className="space-y-5 no-print mb-12">
            <h3 className="text-sm font-black text-slate-150 text-white uppercase tracking-wider mb-2">🔍 KAJIAN BAHASAN SOAL ANDA</h3>
            {quizData.soal.map((s, idx) => {
              const studentAns = answers[s.no];
              const matchingKey = quizData.kunci.find((k) => k.no === s.no);
              
              const isGradable = s.tipe === 'PG' || s.tipe === 'BS';
              let isCorrect = false;
              if (matchingKey && isGradable) {
                const normalizeKunci = (matchingKey.kunci || "").trim().toUpperCase();
                const normalizeStudent = (studentAns || "").toString().trim().toUpperCase();
                if (s.tipe === 'PG') {
                  isCorrect = normalizeStudent === normalizeKunci || normalizeKunci.startsWith(normalizeStudent);
                } else if (s.tipe === 'BS') {
                  isCorrect = normalizeStudent.substring(0,1) === normalizeKunci.substring(0,1);
                }
              }

              return (
                <div key={idx} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-md space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <span className="font-extrabold text-xs text-slate-800">Soal Nomor {s.no} <span className="text-[10px] text-slate-400">({s.tipe})</span></span>
                    
                    {isGradable ? (
                      isCorrect ? (
                        <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 border border-emerald-100">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Benar (+10)
                        </span>
                      ) : (
                        <span className="bg-rose-50 text-rose-850 px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 border border-rose-100">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" /> Salah (+0)
                        </span>
                      )
                    ) : (
                      <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded-lg text-[10px] font-bold border border-amber-100">
                        ✍️ Jawaban Esai Terkirim
                      </span>
                    )}
                  </div>

                  <FormattedTextWithTable
                    text={s.pertanyaan}
                    isEditable={false}
                    size="sm"
                  />
                  
                  {s.stimulus && (
                    <div className="my-2.5 w-full max-w-sm">
                      <StimulusRenderer stimulus={s.stimulus} size="sm" />
                    </div>
                  )}
                  
                  {s.butuhGambar && s.imageUrl && (
                    <div className="max-w-[120px] max-h-[100px] rounded-lg overflow-hidden border border-slate-100 bg-slate-50 p-1 flex items-center justify-center">
                      <img src={s.imageUrl} className="max-w-[110px] max-h-[90px] object-contain rounded" alt="Ilustrasi" />
                    </div>
                  )}

                  <div className="space-y-1.5 p-3 bg-slate-50 rounded-xl text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-bold block">Jawaban Anda:</span>
                      <span className="font-extrabold text-slate-900 text-right uppercase">
                        {isGradable 
                          ? `${studentAns || 'Belum Dijawab'}` 
                          : typeof studentAns === 'object' 
                            ? JSON.stringify(studentAns)
                            : `${studentAns || 'Belum Dijawab'}`
                        }
                      </span>
                    </div>

                    {matchingKey && (
                      <div className="border-t border-slate-200/80 pt-2 mt-2 space-y-1.5">
                        <div className="flex justify-between items-center text-slate-600">
                          <span className="font-bold">Kunci Jawaban Guru:</span>
                          <span className="font-extrabold text-teal-800 uppercase leading-none">{matchingKey.kunci}</span>
                        </div>
                        {matchingKey.pembahasan && (
                          <div className="text-slate-800 text-[10.5px] leading-relaxed pt-1 whitespace-pre-line border-t border-slate-200/50 mt-1 uppercase text-left font-sans italic border-l-2 border-teal-600 pl-2">
                            <span className="block font-black text-[9px] text-teal-605 tracking-wider uppercase mb-0.5">📚 Penjelasan Kajian Konseptual:</span>
                            {matchingKey.pembahasan}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* PRINT-ONLY STUDENT REPORT CARD STYLED IN ELEKTRONIK KOP */}
          <div className="print-only hidden py-8 px-6 border-2 border-slate-900 rounded-3xl bg-white text-slate-950 font-serif w-full max-w-4xl mx-auto space-y-6">
            <div className="text-center pb-4 border-b-4 border-double border-slate-900 space-y-1.5">
              <h2 className="text-base font-bold uppercase tracking-tight leading-none">{quizData.schoolName || "DOKUMEN ASLI"}</h2>
              <p className="text-lg font-black uppercase">LAPORAN EVALUASI HASIL BELAJAR DIGITAL MANDIRI</p>
              <p className="text-xs uppercase font-bold text-slate-600">UJIAN ONLINE SISWA • KURIKULUM MERDEKA</p>
            </div>

            <table className="w-full border-collapse border border-slate-400 text-xs">
              <tbody>
                <tr>
                  <td className="p-2 border border-slate-400 font-bold w-1/3">NAMA LENGKAP</td>
                  <td className="p-2 border border-slate-400 uppercase font-black">{studentName}</td>
                </tr>
                <tr>
                  <td className="p-2 border border-slate-400 font-bold">NOMOR ABSEN</td>
                  <td className="p-2 border border-slate-400 font-black">{studentAbsen || "—"}</td>
                </tr>
                <tr>
                  <td className="p-2 border border-slate-400 font-bold">KATA KUNCI KELAS</td>
                  <td className="p-2 border border-slate-400">Kelas {quizData.grade} / Semester {quizData.semester}</td>
                </tr>
                <tr>
                  <td className="p-2 border border-slate-400 font-bold">MATA PELAJARAN</td>
                  <td className="p-2 border border-slate-400">{quizData.subject}</td>
                </tr>
                <tr>
                  <td className="p-2 border border-slate-400 font-bold">TANGGAL PENYUMPANAN</td>
                  <td className="p-2 border border-slate-400 font-mono">{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
                </tr>
              </tbody>
            </table>

            {scoreResult && scoreResult.totalGradable > 0 && (
              <div className="border border-slate-400 rounded-xl p-4 text-center">
                <p className="text-sm tracking-widest font-bold">SKOR PENGERJAAN EVALUATOR</p>
                <div className="text-5xl font-sans font-black my-2">{scoreResult.score} / 100</div>
                <p className="text-xs">Catatan: Menjawab {scoreResult.correctCount} Soal Benar dari {scoreResult.totalGradable} Bentuk Soal Menyeluruh.</p>
              </div>
            )}

            <div className="pt-24 flex justify-between gap-12 text-xs">
              <div className="text-center w-1/3 border-t border-slate-400 pt-1.5 mt-10">
                <p>Orang Tua / Wali Murid</p>
                <div className="h-16" />
                <p className="font-bold">.........................................</p>
              </div>
              
              <div className="text-center w-1/3 border-t border-slate-400 pt-1.5 mt-10">
                <p>Murid Ybs.</p>
                <div className="h-16" />
                <p className="font-bold underline">{studentName}</p>
              </div>
            </div>
          </div>

        </section>
      )}

      {/* FOOTER COOPERATIVE LOG */}
      <footer className="no-print mt-auto py-6 border-t border-slate-800 text-center text-[10px] text-slate-500 font-bold tracking-widest uppercase">
        Cipta Ajar Suit • Evaluator Mandiri Edukasi Digital
      </footer>
    </div>
  );
}
