import { Download, ChevronLeft, FileText, Printer, Edit2, Check } from 'lucide-react';
import { GeneratedModul, ModulFormData } from '../types';
import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ModulTableProps {
  data: GeneratedModul;
  formInput: ModulFormData;
  onBack: () => void;
}

export default function ModulTable({ data, formInput, onBack }: ModulTableProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // States untuk menyimpan hasil pengeditan manual
  const [editedModul, setEditedModul] = useState<GeneratedModul>(data);
  const [schoolName, setSchoolName] = useState("");
  const [subject, setSubject] = useState("");
  const [classSemester, setClassSemester] = useState("");
  const [meetings, setMeetings] = useState("");
  const [duration, setDuration] = useState("");
  const [principalName, setPrincipalName] = useState("");
  const [principalNip, setPrincipalNip] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [teacherNip, setTeacherNip] = useState("");
  const [position, setPosition] = useState("");
  const [signaturePlace, setSignaturePlace] = useState("");

  // Sinkronisasikan state lokal jika data baru di-generate
  useEffect(() => {
    setEditedModul(data);
    setSchoolName(data.identitas.schoolName || formInput.schoolName || "");
    setSubject(data.identitas.subject || formInput.subject || "");
    setClassSemester(data.identitas.classSemester || `Kelas ${formInput.grade} / ${formInput.semester}` || "");
    setMeetings(formInput.meetings?.toString() || "");
    setDuration(formInput.duration || "");
    setPrincipalName(formInput.principalName || "");
    setPrincipalNip(formInput.principalNip || "");
    setTeacherName(formInput.teacherName || "");
    setTeacherNip(formInput.teacherNip || "");
    setPosition(formInput.position || "Guru Kelas");
    setSignaturePlace(formInput.signaturePlace || "");
  }, [data, formInput]);

  const updateIdentifikasi = (field: keyof typeof editedModul.identifikasi, val: string) => {
    setEditedModul(prev => ({
      ...prev,
      identifikasi: {
        ...prev.identifikasi,
        [field]: val
      }
    }));
  };

  const updateDesain = (field: keyof typeof editedModul.desain, val: string) => {
    setEditedModul(prev => ({
      ...prev,
      desain: {
        ...prev.desain,
        [field]: val
      }
    }));
  };

  const updatePengalaman = (field: keyof typeof editedModul.pengalaman, val: string) => {
    setEditedModul(prev => ({
      ...prev,
      pengalaman: {
        ...prev.pengalaman,
        [field]: val
      }
    }));
  };

  const updateAsesmen = (field: keyof typeof editedModul.asesmen, val: string) => {
    setEditedModul(prev => ({
      ...prev,
      asesmen: {
        ...prev.asesmen,
        [field]: val
      }
    }));
  };

  const downloadWord = () => {
    // Matikan mode edit manual terlebih dahulu agar input/textarea tidak ikut ter-render sebagai kontrol form di dokumen Word
    setIsEditing(false);
    setShowExportOptions(false);
    
    setTimeout(() => {
      if (!containerRef.current) return;
      const content = containerRef.current.innerHTML;
      const schoolNameStr = schoolName || "DOKUMEN ASLI"; 
      
      const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>RPPM</title>
        <style>
          @page { size: A4; margin: 2cm; mso-footer: f1; }
          body { font-family: 'Times New Roman', serif; line-height: 1.5; color: #1e293b; background-color: #ffffff; }
          table { border-collapse: collapse; width: 100%; margin-bottom: 1.5rem; }
          td, th { border: 0.5pt solid #cbd5e1; padding: 10px; font-size: 11pt; vertical-align: top; text-align: left; }
          
          /* Hide watermark and non-printable elements in Word */
          .print-watermark { display: none !important; mso-hide: all; }
          .no-print { display: none !important; mso-hide: all; }
          
          /* Table widths & specific styles */
          .spreadsheet-table { width: 100%; border-collapse: collapse; margin-top: 4px; page-break-inside: avoid; }
          .spreadsheet-table td { border: 1px solid #cbd5e1; padding: 10px; word-wrap: break-word; white-space: pre-line; }
          .w-1/3 { width: 33.333% !important; }
          .w-1/2 { width: 50% !important; }
          .w-full { width: 100% !important; }
          
          /* Typography */
          h1 { font-size: 16pt; font-weight: bold; text-align: center; text-transform: uppercase; margin-bottom: 2px; color: #000000; }
          h2 { font-size: 11pt; font-weight: bold; background-color: #f0f7ff; color: #1e3a8a; padding: 8px; border: 1px solid #cbd5e1; margin-top: 20px; margin-bottom: 8px; text-transform: uppercase; }
          p { margin: 0 0 8px 0; font-size: 11pt; }
          .text-justify { text-align: justify; text-justify: inter-word; }
          .text-center { text-align: center; }
          .text-left { text-align: left; }
          .font-semibold { font-weight: bold; }
          .font-bold { font-weight: bold; }
          .uppercase { text-transform: uppercase; }
          .underline { text-decoration: underline; }
          .text-sm { font-size: 10pt; }
          .text-lg { font-size: 13pt; font-weight: bold; }
          .text-xl { font-size: 15pt; font-weight: bold; }
          .leading-relaxed { line-height: 1.6; }
          
          /* Coloring & background */
          .bg-blue-50 { background-color: #eff6ff !important; }
          .text-blue-900 { color: #1e3a8a !important; }
          .text-teal-800 { color: #115e59 !important; }
          .text-slate-600 { color: #475569 !important; }
          .text-slate-800 { color: #1e293b !important; }
          .text-slate-700 { color: #334155 !important; }
          
          /* Margins & paddings */
          .mb-0 { margin-bottom: 0px !important; }
          .mb-1 { margin-top: 4px !important; }
          .mb-10 { margin-bottom: 40px !important; }
          .mt-0 { margin-top: 0px !important; }
          .mt-1 { margin-top: 4px !important; }
          .mt-16 { margin-top: 64px !important; }
          .mt-20 { margin-top: 80px !important; }
          .p-0 { padding: 0px !important; }
          .p-2 { padding: 8px !important; }
          
          /* Layout */
          .border-none { border: none !important; }
          .border-none td { border: none !important; }
          .align-top { vertical-align: top !important; }
          
          div.Section1 { page: Section1; }
          p.MsoFooter { margin: 0in; font-size: 9pt; }
        </style></head>
        <body>
          <div class="Section1">
            ${content}
            <div style='mso-element:footer' id='f1'>
              <p class="MsoFooter" style="border-top: 1pt solid black; padding-top: 5pt; color: #666666;">
                ${schoolNameStr} — Cipta Ajar Suit
                <span style='mso-tab-count:2'></span>
                Halaman <span style='mso-field-code: PAGE '></span>
              </p>
            </div>
          </div>
        </body></html>`;

      const blob = new Blob(['\ufeff', header], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `RPPM_${subject || 'Dokumen'}.doc`;
      link.click();
      URL.revokeObjectURL(url);
    }, 150);
  };

  const handlePrint = () => {
    setShowExportOptions(false);
    setIsEditing(false);
    setTimeout(() => {
      window.print();
    }, 250);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-32 px-4 relative">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .print-watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 5.5rem;
            font-weight: 900;
            color: rgba(220, 220, 220, 0.15) !important;
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
        .spreadsheet-table { width: 100%; border-collapse: collapse; margin-top: 4px; table-layout: fixed; }
        .spreadsheet-table td { border: 1px solid #cbd5e1; padding: 8px; word-wrap: break-word; white-space: pre-line; }
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
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <button onClick={onBack} className="flex items-center gap-2 text-blue-700 font-bold hover:text-blue-900 transition-colors">
          <ChevronLeft className="w-5 h-5" /> Kembali Ke Form
        </button>

        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => setIsEditing(!isEditing)} 
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold border transition-all shadow-md ${
              isEditing 
                ? "bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700 active:scale-95" 
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-95"
            }`}
          >
            {isEditing ? (
              <>
                <Check className="w-5 h-5 animate-pulse" /> Selesai Mengedit
              </>
            ) : (
              <>
                <Edit2 className="w-5 h-5" /> Edit Isi Manual
              </>
            )}
          </button>

          <div className="relative">
            <button onClick={() => setShowExportOptions(!showExportOptions)} className="bg-gradient-to-r from-blue-700 to-teal-600 hover:opacity-90 text-white px-6 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2 transition-all">
              <Download className="w-5 h-5" /> Unduh / Cetak
            </button>
            
            <AnimatePresence>
              {showExportOptions && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50">
                  <button onClick={downloadWord} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-slate-700 border-b border-slate-100 transition-colors">
                    <FileText className="w-5 h-5 text-blue-500" /> Format Word (.doc)
                  </button>
                  <button onClick={handlePrint} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-slate-700 transition-colors">
                    <Printer className="w-5 h-5 text-teal-500" /> Cetak / Print Browser
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="w-full overflow-x-auto no-print-scrollbar">
        <div ref={containerRef} className="document-sheet bg-white p-6 md:p-12 shadow-sm border border-slate-200 text-slate-900 relative box-border">
          <div className="print-watermark">
            {schoolName || "DOKUMEN ASLI"}
          </div>
          
          <div className="text-center mb-10">
            <h1 className="text-xl font-bold uppercase">RENCANA PELAKSANAAN PEMBELAJARAN MENDALAM</h1>
            <p className="text-lg font-bold uppercase mt-1">(RPPM)</p>
          </div>

          <div className="space-y-6">
            {/* Section 1: Identitas */}
            <section>
              <h2 className="text-sm font-bold bg-blue-50 p-2 border border-slate-300 text-blue-900">1. IDENTITAS</h2>
              <table className="spreadsheet-table">
                <tbody>
                  <tr>
                    <td className="w-1/3 font-semibold">Nama Satuan Pendidikan</td>
                    <td>
                      {isEditing ? (
                        <input
                          type="text"
                          value={schoolName}
                          onChange={(e) => setSchoolName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-normal text-sm"
                        />
                      ) : (
                        schoolName
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="font-semibold">Mata Pelajaran</td>
                    <td>
                      {isEditing ? (
                        <input
                          type="text"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-normal text-sm"
                        />
                      ) : (
                        subject
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="font-semibold">Kelas/Semester</td>
                    <td>
                      {isEditing ? (
                        <input
                          type="text"
                          value={classSemester}
                          onChange={(e) => setClassSemester(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-normal text-sm"
                        />
                      ) : (
                        classSemester?.replace(/Kelas\s*/i, '').trim()
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="font-semibold">Jumlah Pertemuan</td>
                    <td>
                      {isEditing ? (
                        <input
                          type="text"
                          value={meetings}
                          onChange={(e) => setMeetings(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-normal text-sm"
                        />
                      ) : (
                        meetings ? `${meetings} Pertemuan` : ""
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="font-semibold">Durasi Pertemuan</td>
                    <td>
                      {isEditing ? (
                        <input
                          type="text"
                          value={duration}
                          onChange={(e) => setDuration(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-normal text-sm"
                        />
                      ) : (
                        duration
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </section>

            {/* Section 2: Identifikasi */}
            <section>
              <h2 className="text-sm font-bold bg-blue-50 p-2 border border-slate-300 text-blue-900">2. IDENTIFIKASI</h2>
              <table className="spreadsheet-table">
                <tbody>
                  <tr>
                    <td className="w-1/3 font-semibold">Murid</td>
                    <td className="text-justify leading-relaxed">
                      {isEditing ? (
                        <textarea
                          value={editedModul.identifikasi.students}
                          onChange={(e) => updateIdentifikasi("students", e.target.value)}
                          rows={3}
                          className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-justify leading-relaxed font-normal text-sm resize-y"
                        />
                      ) : (
                        editedModul.identifikasi.students
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="font-semibold">Materi Pelajaran</td>
                    <td className="text-justify leading-relaxed whitespace-pre-line">
                      {isEditing ? (
                        <textarea
                          value={editedModul.identifikasi.material}
                          onChange={(e) => updateIdentifikasi("material", e.target.value)}
                          rows={3}
                          className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-justify leading-relaxed font-normal text-sm resize-y"
                        />
                      ) : (
                        editedModul.identifikasi.material
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="font-semibold">Dimensi Profil Lulusan</td>
                    <td className="text-justify leading-relaxed">
                      {isEditing ? (
                        <textarea
                          value={editedModul.identifikasi.dimensi}
                          onChange={(e) => updateIdentifikasi("dimensi", e.target.value)}
                          rows={3}
                          className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-justify leading-relaxed font-normal text-sm resize-y"
                        />
                      ) : (
                        editedModul.identifikasi.dimensi
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </section>

            {/* Section 3: Desain Pembelajaran */}
            <section>
              <h2 className="text-sm font-bold bg-blue-50 p-2 border border-slate-300 text-blue-900">3. DESAIN PEMBELAJARAN</h2>
              <table className="spreadsheet-table">
                <tbody>
                  <tr>
                    <td className="w-1/3 font-semibold">Capaian Pembelajaran</td>
                    <td className="text-justify leading-relaxed">
                      {isEditing ? (
                        <textarea
                          value={editedModul.desain.cp}
                          onChange={(e) => updateDesain("cp", e.target.value)}
                          rows={4}
                          className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-justify leading-relaxed font-normal text-sm resize-y"
                        />
                      ) : (
                        editedModul.desain.cp
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="font-semibold">Lintas Disiplin Ilmu</td>
                    <td className="text-justify leading-relaxed">
                      {isEditing ? (
                        <textarea
                          value={editedModul.desain.crossDisciplinary}
                          onChange={(e) => updateDesain("crossDisciplinary", e.target.value)}
                          rows={3}
                          className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-justify leading-relaxed font-normal text-sm resize-y"
                        />
                      ) : (
                        editedModul.desain.crossDisciplinary
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="font-semibold">Tujuan Pembelajaran</td>
                    <td className="text-justify leading-relaxed whitespace-pre-line">
                      {isEditing ? (
                        <textarea
                          value={editedModul.desain.tp}
                          onChange={(e) => updateDesain("tp", e.target.value)}
                          rows={3}
                          className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-justify leading-relaxed font-normal text-sm resize-y"
                        />
                      ) : (
                        editedModul.desain.tp
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="font-semibold">Praktik Pedagogis</td>
                    <td className="text-justify leading-relaxed">
                      {isEditing ? (
                        <textarea
                          value={editedModul.desain.pedagogy}
                          onChange={(e) => updateDesain("pedagogy", e.target.value)}
                          rows={3}
                          className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-justify leading-relaxed font-normal text-sm resize-y"
                        />
                      ) : (
                        editedModul.desain.pedagogy
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="font-semibold">Kemitraan Pembelajaran</td>
                    <td className="text-justify leading-relaxed">
                      {isEditing ? (
                        <textarea
                          value={editedModul.desain.partnership}
                          onChange={(e) => updateDesain("partnership", e.target.value)}
                          rows={3}
                          className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-justify leading-relaxed font-normal text-sm resize-y"
                        />
                      ) : (
                        editedModul.desain.partnership
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="font-semibold">Lingkungan Pembelajaran</td>
                    <td className="text-justify leading-relaxed">
                      {isEditing ? (
                        <textarea
                          value={editedModul.desain.environment}
                          onChange={(e) => updateDesain("environment", e.target.value)}
                          rows={3}
                          className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-justify leading-relaxed font-normal text-sm resize-y"
                        />
                      ) : (
                        editedModul.desain.environment
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="font-semibold">Pemanfaatan Digital</td>
                    <td className="text-justify leading-relaxed">
                      {isEditing ? (
                        <textarea
                          value={editedModul.desain.digitalUtilization}
                          onChange={(e) => updateDesain("digitalUtilization", e.target.value)}
                          rows={3}
                          className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-justify leading-relaxed font-normal text-sm resize-y"
                        />
                      ) : (
                        editedModul.desain.digitalUtilization
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </section>

            {/* Section 4: Pengalaman Belajar */}
            <section>
              <h2 className="text-sm font-bold bg-blue-50 p-2 border border-slate-300 text-blue-900">4. PENGALAMAN BELAJAR</h2>
              <table className="spreadsheet-table">
                <tbody>
                  <tr>
                    <td className="w-1/3 font-semibold">Memahami (Understanding)</td>
                    <td className="text-justify leading-relaxed">
                      {isEditing ? (
                        <textarea
                          value={editedModul.pengalaman.memahami}
                          onChange={(e) => updatePengalaman("memahami", e.target.value)}
                          rows={6}
                          className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-justify leading-relaxed font-normal text-sm resize-y"
                        />
                      ) : (
                        editedModul.pengalaman.memahami
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="font-semibold">Mengaplikasi (Applying)</td>
                    <td className="text-justify leading-relaxed">
                      {isEditing ? (
                        <textarea
                          value={editedModul.pengalaman.mengaplikasi}
                          onChange={(e) => updatePengalaman("mengaplikasi", e.target.value)}
                          rows={8}
                          className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-justify leading-relaxed font-normal text-sm resize-y"
                        />
                      ) : (
                        editedModul.pengalaman.mengaplikasi
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="font-semibold">Merefleksi (Reflecting)</td>
                    <td className="text-justify leading-relaxed">
                      {isEditing ? (
                        <textarea
                          value={editedModul.pengalaman.merefleksi}
                          onChange={(e) => updatePengalaman("merefleksi", e.target.value)}
                          rows={6}
                          className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-justify leading-relaxed font-normal text-sm resize-y"
                        />
                      ) : (
                        editedModul.pengalaman.merefleksi
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </section>

            {/* Section 5: Asesmen */}
            <section>
              <h2 className="text-sm font-bold bg-blue-50 p-2 border border-slate-300 text-blue-900">5. ASESMEN PEMBELAJARAN</h2>
              <table className="spreadsheet-table">
                <tbody>
                  <tr>
                    <td className="w-1/3 font-semibold">Asesmen Awal</td>
                    <td className="text-justify leading-relaxed">
                      {isEditing ? (
                        <textarea
                          value={editedModul.asesmen.awal}
                          onChange={(e) => updateAsesmen("awal", e.target.value)}
                          rows={4}
                          className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-justify leading-relaxed font-normal text-sm resize-y"
                        />
                      ) : (
                        editedModul.asesmen.awal
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="font-semibold">Asesmen Proses</td>
                    <td className="text-justify leading-relaxed">
                      {isEditing ? (
                        <textarea
                          value={editedModul.asesmen.proses}
                          onChange={(e) => updateAsesmen("proses", e.target.value)}
                          rows={4}
                          className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-justify leading-relaxed font-normal text-sm resize-y"
                        />
                      ) : (
                        editedModul.asesmen.proses
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="font-semibold">Asesmen Akhir</td>
                    <td className="text-justify leading-relaxed">
                      {isEditing ? (
                        <textarea
                          value={editedModul.asesmen.akhir}
                          onChange={(e) => updateAsesmen("akhir", e.target.value)}
                          rows={4}
                          className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-justify leading-relaxed font-normal text-sm resize-y"
                        />
                      ) : (
                        editedModul.asesmen.akhir
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </section>
          </div>
          
          {/* Signature */}
          <div className="mt-16 w-full">
            <table className="w-full border-none border-collapse">
              <tbody>
                <tr>
                  <td className="w-1/2 text-left align-top p-0 border-none">
                    <p className="mb-1">Mengetahui,</p>
                    <p className="mb-0">Kepala Sekolah</p>
                    <div className="mt-20"> 
                      <p className="font-bold underline mb-0">{principalName}</p>
                      <p className="text-sm mt-0">NIP. {principalNip}</p>
                    </div>
                  </td>
                  <td className="w-1/2 text-left align-top p-0 border-none">
                    <p className="mb-1">
                      {isEditing ? (
                        <input
                          type="text"
                          value={signaturePlace}
                          onChange={(e) => setSignaturePlace(e.target.value)}
                          placeholder="Tempat tanda tangan"
                          className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-normal text-xs inline-block max-w-[140px]"
                        />
                      ) : (
                        signaturePlace ? `${signaturePlace}` : '.................'
                      )}, ................... 20....
                    </p>
                    <p className="mb-0">
                      {isEditing ? (
                        <input
                          type="text"
                          value={position}
                          onChange={(e) => setPosition(e.target.value)}
                          placeholder="Jabatan"
                          className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-normal text-xs max-w-[180px]"
                        />
                      ) : (
                        position || 'Guru Kelas'
                      )}
                    </p>
                    <div className="mt-20">
                      <p className="font-bold underline mb-0">{teacherName}</p>
                      <p className="text-sm mt-0">NIP. {teacherNip}</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

