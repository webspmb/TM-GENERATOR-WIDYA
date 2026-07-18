import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, ChevronLeft, FileText, Printer, Edit2, Check } from 'lucide-react';
import { GeneratedKokurikuler, KokurikulerFormData } from '../types';

interface KokurikulerResultProps {
  data: GeneratedKokurikuler;
  formInput: KokurikulerFormData;
  onBack: () => void;
  onUpdateData?: (updated: GeneratedKokurikuler) => void;
}

export default function KokurikulerResult({ data, formInput, onBack, onUpdateData }: KokurikulerResultProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // States for manual editing
  const [editedData, setEditedData] = useState<GeneratedKokurikuler>(data);
  const [schoolName, setSchoolName] = useState("");
  const [subject, setSubject] = useState("");
  const [bentukKokurikuler, setBentukKokurikuler] = useState("");
  const [theme, setTheme] = useState("");
  const [fokusKegiatan, setFokusKegiatan] = useState("");
  const [grade, setGrade] = useState("");
  const [alokasiWaktu, setAlokasiWaktu] = useState("");
  const [principalName, setPrincipalName] = useState("");
  const [principalNip, setPrincipalNip] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [teacherNip, setTeacherNip] = useState("");
  const [signaturePlace, setSignaturePlace] = useState("");
  const [signatureDateLine, setSignatureDateLine] = useState("");

  useEffect(() => {
    setEditedData(data);
    setSchoolName(data.identitas?.schoolName || formInput.schoolName || "");
    setSubject(data.identitas?.subject || formInput.subject || "");
    setBentukKokurikuler(data.identitas?.bentukKokurikuler || formInput.bentukKokurikuler || "");
    setTheme(data.identitas?.theme || formInput.theme || "");
    setFokusKegiatan(data.identitas?.fokusKegiatan || formInput.fokusKegiatan || "");
    setGrade(data.identitas?.grade || formInput.grade || "");
    setAlokasiWaktu(data.identitas?.alokasiWaktu || formInput.alokasiWaktu || "");
    setPrincipalName(formInput.principalName || "");
    setPrincipalNip(formInput.principalNip || "");
    setTeacherName(formInput.teacherName || "");
    setTeacherNip(formInput.teacherNip || "");
    setSignaturePlace(formInput.signaturePlace || "");
    const place = formInput.signaturePlace || "Kajulangko";
    setSignatureDateLine(`${place}, ...................`);
  }, [data, formInput]);

  const updateField = (field: keyof Omit<GeneratedKokurikuler, 'identitas' | 'kegiatan' | 'asesmenTable' | 'formatifRubricTable' | 'sumatifRubricTable'>, val: string) => {
    setEditedData(prev => ({ ...prev, [field]: val }));
  };

  const updateKegiatan = (val: string) => {
    setEditedData(prev => ({
      ...prev,
      kegiatan: val
    }));
  };

  const updateAsesmenRow = (index: number, field: 'bentuk' | 'instrumen', val: string) => {
    setEditedData(prev => {
      const updatedRows = [...prev.asesmenTable];
      updatedRows[index] = { ...updatedRows[index], [field]: val };
      return { ...prev, asesmenTable: updatedRows };
    });
  };

  const updateFormatifRow = (index: number, field: keyof typeof editedData.formatifRubricTable[0], val: string) => {
    setEditedData(prev => {
      const updatedRows = [...prev.formatifRubricTable];
      updatedRows[index] = { ...updatedRows[index], [field]: val } as any;
      return { ...prev, formatifRubricTable: updatedRows };
    });
  };

  const updateSumatifRow = (index: number, field: keyof typeof editedData.sumatifRubricTable[0], val: string) => {
    setEditedData(prev => {
      const updatedRows = [...prev.sumatifRubricTable];
      updatedRows[index] = { ...updatedRows[index], [field]: val } as any;
      return { ...prev, sumatifRubricTable: updatedRows };
    });
  };

  const downloadWord = () => {
    setIsEditing(false);
    setShowExportOptions(false);

    setTimeout(() => {
      if (!containerRef.current) return;
      const content = containerRef.current.innerHTML;
      const schoolNameStr = schoolName || "DOKUMEN ASLI";

      const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>Perencanaan Kegiatan Kokurikuler</title>
        <style>
          @page { size: A4; margin: 2cm; mso-footer: f1; }
          body { font-family: 'Times New Roman', serif; line-height: 1.4; color: #000000; background-color: #ffffff; }
          
          /* Watermark and non-print hide in Word */
          .print-watermark { display: none !important; mso-hide: all; }
          .no-print { display: none !important; mso-hide: all; }
          
          /* Table style */
          table { width: 100%; border-collapse: collapse; margin-bottom: 1.5rem; page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          td, th { border: 1px solid #000000; padding: 6px; font-size: 11pt; vertical-align: top; text-align: left; }
          
          /* Specific column layouts */
          .w-1/3 { width: 33.333% !important; }
          .w-1/2 { width: 50% !important; }
          .w-1/4 { width: 25% !important; }
          
          /* Typography & Colors matching PDF style */
          h1 { font-size: 14pt; font-weight: bold; text-align: center; text-transform: uppercase; margin-bottom: 20px; }
          h2 { font-size: 11pt; font-weight: bold; background-color: #fca5a5; padding: 6px; border: 1px solid #000000; margin-top: 15px; margin-bottom: 8px; text-transform: uppercase; }
          .section-title-yellow { font-size: 11pt; font-weight: bold; background-color: #fca5a5; padding: 6px; border: 1px solid #000000; margin-top: 12px; margin-bottom: 8px; }
          p { margin: 0 0 6px 0; font-size: 11pt; }
          .text-justify { text-align: justify; }
          .text-center { text-align: center; }
          .font-semibold { font-weight: bold; }
          .font-bold { font-weight: bold; }
          .uppercase { text-transform: uppercase; }
          .underline { text-decoration: underline; }
          
          .no-border-table td { border: none !important; }
          .page-break { page-break-before: always; }
          .avoid-break { page-break-inside: avoid; break-inside: avoid; }
        </style></head>
        <body>
          <div class="Section1">
            ${content}
            <div style='mso-element:footer' id='f1'>
              <p class="MsoFooter" style="border-top: 1pt solid black; padding-top: 5pt; color: #666666; font-size: 9pt;">
                ${schoolNameStr} — Perencanaan Kegiatan Kokurikuler 2025
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
      link.download = `Modul_Kokurikuler_${subject || 'P5'}.doc`;
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

  const saveEdits = () => {
    setIsEditing(false);
    if (onUpdateData) {
      onUpdateData(editedData);
    }
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
            font-size: 5rem;
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
          .page-break { page-break-before: always; }
          .avoid-break { page-break-inside: avoid; break-inside: avoid; }
        }
        .print-watermark { display: none; }
        .document-table { width: 100%; border-collapse: collapse; margin-top: 4px; }
        .document-table td, .document-table th { border: 1px solid #000000; padding: 6px; vertical-align: top; font-size: 11.5px; }
        .yellow-header { background-color: #f59e0b !important; color: #000000 !important; font-weight: bold; }
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

      {/* Control Buttons Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <button onClick={onBack} className="flex items-center gap-2 text-teal-700 font-bold hover:text-teal-900 transition-colors cursor-pointer text-xs">
          <ChevronLeft className="w-5 h-5" /> Kembali Ke Form
        </button>

        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => {
              if (isEditing) {
                saveEdits();
              } else {
                setIsEditing(true);
              }
            }} 
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold border transition-all text-xs shadow-md cursor-pointer ${
              isEditing 
                ? "bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700 active:scale-95" 
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-95"
            }`}
          >
            {isEditing ? (
              <>
                <Check className="w-4 h-4 animate-pulse" /> Simpan Perubahan
              </>
            ) : (
              <>
                <Edit2 className="w-4 h-4" /> Edit Isi Manual
              </>
            )}
          </button>

          <div className="relative">
            <button onClick={() => setShowExportOptions(!showExportOptions)} className="bg-gradient-to-r from-teal-700 to-emerald-600 hover:opacity-90 text-white px-6 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2 transition-all cursor-pointer text-xs">
              <Download className="w-4 h-4" /> Unduh / Cetak
            </button>
            
            <AnimatePresence>
              {showExportOptions && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50 text-xs">
                  <button onClick={downloadWord} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-slate-700 border-b border-slate-100 transition-colors cursor-pointer text-left font-bold">
                    <FileText className="w-4 h-4 text-blue-500" /> Format Word (.doc)
                  </button>
                  <button onClick={handlePrint} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer text-left font-bold">
                    <Printer className="w-4 h-4 text-emerald-500" /> Cetak / Print Browser
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Sheet Content Wrapper */}
      <div className="w-full overflow-x-auto no-print-scrollbar">
        <div ref={containerRef} className="document-sheet bg-white p-6 md:p-12 shadow-sm border border-slate-200 text-slate-900 relative box-border font-serif">
          <div className="print-watermark">
            {schoolName || "DOKUMEN ASLI"}
          </div>

          {/* PAGE 1 */}
          <div className="text-center mb-6">
            <h1 className="text-base font-bold uppercase tracking-wide leading-tight" style={{ fontSize: '14pt' }}>
              PERENCANAAN KEGIATAN KOKURIKULER
            </h1>
          </div>

          {/* Identitas Table matching PDF (no border layout style with colons) */}
          <div className="mb-6 text-[11.5px] leading-relaxed">
            <table className="w-full" style={{ borderCollapse: 'collapse', border: 'none' }}>
              <tbody>
                <tr style={{ border: 'none' }}>
                  <td style={{ width: '28%', fontWeight: 'bold', border: 'none', padding: '2px 0' }}>Satuan Pendidikan</td>
                  <td style={{ width: '2%', fontWeight: 'bold', border: 'none', padding: '2px 0' }}>:</td>
                  <td style={{ border: 'none', padding: '2px 0' }}>
                    {schoolName || "-"}
                  </td>
                </tr>
                <tr style={{ border: 'none' }}>
                  <td style={{ fontWeight: 'bold', border: 'none', padding: '2px 0' }}>Mata Pelajaran</td>
                  <td style={{ fontWeight: 'bold', border: 'none', padding: '2px 0' }}>:</td>
                  <td style={{ border: 'none', padding: '2px 0' }}>
                    {isEditing ? (
                      <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full border-b border-slate-300 outline-none text-xs" />
                    ) : (
                      subject || "Terintegrasi"
                    )}
                  </td>
                </tr>
                <tr style={{ border: 'none' }}>
                  <td style={{ fontWeight: 'bold', border: 'none', padding: '2px 0' }}>Bentuk Kokurikuler</td>
                  <td style={{ fontWeight: 'bold', border: 'none', padding: '2px 0' }}>:</td>
                  <td style={{ border: 'none', padding: '2px 0' }}>
                    {isEditing ? (
                      <input type="text" value={bentukKokurikuler} onChange={(e) => setBentukKokurikuler(e.target.value)} className="w-full border-b border-slate-300 outline-none text-xs" />
                    ) : (
                      bentukKokurikuler || "-"
                    )}
                  </td>
                </tr>
                <tr style={{ border: 'none' }}>
                  <td style={{ fontWeight: 'bold', border: 'none', padding: '2px 0' }}>Tema</td>
                  <td style={{ fontWeight: 'bold', border: 'none', padding: '2px 0' }}>:</td>
                  <td style={{ border: 'none', padding: '2px 0' }}>
                    {isEditing ? (
                      <input type="text" value={theme} onChange={(e) => setTheme(e.target.value)} className="w-full border-b border-slate-300 outline-none text-xs" />
                    ) : (
                      theme || "-"
                    )}
                  </td>
                </tr>
                <tr style={{ border: 'none' }}>
                  <td style={{ fontWeight: 'bold', border: 'none', padding: '2px 0' }}>Fokus Kegiatan</td>
                  <td style={{ fontWeight: 'bold', border: 'none', padding: '2px 0' }}>:</td>
                  <td style={{ border: 'none', padding: '2px 0' }}>
                    {isEditing ? (
                      <input type="text" value={fokusKegiatan} onChange={(e) => setFokusKegiatan(e.target.value)} className="w-full border-b border-slate-300 outline-none text-xs" />
                    ) : (
                      fokusKegiatan || "-"
                    )}
                  </td>
                </tr>
                <tr style={{ border: 'none' }}>
                  <td style={{ fontWeight: 'bold', border: 'none', padding: '2px 0' }}>Kelas/ Fase</td>
                  <td style={{ fontWeight: 'bold', border: 'none', padding: '2px 0' }}>:</td>
                  <td style={{ border: 'none', padding: '2px 0' }}>
                    {isEditing ? (
                      <input type="text" value={grade} onChange={(e) => setGrade(e.target.value)} className="w-full border-b border-slate-300 outline-none text-xs" />
                    ) : (
                      grade || "-"
                    )}
                  </td>
                </tr>
                <tr style={{ border: 'none' }}>
                  <td style={{ fontWeight: 'bold', border: 'none', padding: '2px 0' }}>Alokasi Waktu</td>
                  <td style={{ fontWeight: 'bold', border: 'none', padding: '2px 0' }}>:</td>
                  <td style={{ border: 'none', padding: '2px 0' }}>
                    {isEditing ? (
                      <input type="text" value={alokasiWaktu} onChange={(e) => setAlokasiWaktu(e.target.value)} className="w-full border-b border-slate-300 outline-none text-xs" />
                    ) : (
                      alokasiWaktu || "-"
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Sections A to H (Page 1) */}
          <div className="space-y-4">
            {/* A. Dimensi Profil Lulusan */}
            <div>
              <div className="yellow-header text-[12px] p-1.5 border border-black mb-1.5 uppercase font-bold">
                A. Dimensi Profil Lulusan :
              </div>
              <div className="text-[11.5px] pl-2 text-justify whitespace-pre-line leading-relaxed">
                {isEditing ? (
                  <textarea value={editedData.dimensiProfilLulusan} onChange={(e) => updateField('dimensiProfilLulusan', e.target.value)} className="w-full border border-slate-300 p-2 text-xs" rows={3} />
                ) : (
                  editedData.dimensiProfilLulusan
                )}
              </div>
            </div>

            {/* B. Tujuan Pembelajaran */}
            <div>
              <div className="yellow-header text-[12px] p-1.5 border border-black mb-1.5 uppercase font-bold">
                B. Tujuan Pembelajaran
              </div>
              <div className="text-[11.5px] pl-2 text-justify whitespace-pre-line leading-relaxed">
                {isEditing ? (
                  <textarea value={editedData.tujuanPembelajaran} onChange={(e) => updateField('tujuanPembelajaran', e.target.value)} className="w-full border border-slate-300 p-2 text-xs" rows={4} />
                ) : (
                  editedData.tujuanPembelajaran
                )}
              </div>
            </div>

            {/* C. Produk yang dihasilkan */}
            <div>
              <div className="yellow-header text-[12px] p-1.5 border border-black mb-1.5 uppercase font-bold">
                C. Produk yang dihasilkan
              </div>
              <div className="text-[11.5px] pl-2 text-justify whitespace-pre-line leading-relaxed">
                {isEditing ? (
                  <textarea value={editedData.produkDihasilkan} onChange={(e) => updateField('produkDihasilkan', e.target.value)} className="w-full border border-slate-300 p-2 text-xs" rows={2} />
                ) : (
                  editedData.produkDihasilkan
                )}
              </div>
            </div>

            {/* D. Praktik Pedagogis */}
            <div>
              <div className="yellow-header text-[12px] p-1.5 border border-black mb-1.5 uppercase font-bold">
                D. Praktik Pedagogis
              </div>
              <div className="text-[11.5px] pl-2 text-justify whitespace-pre-line leading-relaxed">
                {isEditing ? (
                  <textarea value={editedData.praktikPedagogis} onChange={(e) => updateField('praktikPedagogis', e.target.value)} className="w-full border border-slate-300 p-2 text-xs" rows={3} />
                ) : (
                  editedData.praktikPedagogis
                )}
              </div>
            </div>

            {/* E. Lingkungan Belajar */}
            <div>
              <div className="yellow-header text-[12px] p-1.5 border border-black mb-1.5 uppercase font-bold">
                E. Lingkungan Belajar
              </div>
              <div className="text-[11.5px] pl-2 text-justify whitespace-pre-line leading-relaxed">
                {isEditing ? (
                  <textarea value={editedData.lingkunganBelajar} onChange={(e) => updateField('lingkunganBelajar', e.target.value)} className="w-full border border-slate-300 p-2 text-xs" rows={3} />
                ) : (
                  editedData.lingkunganBelajar
                )}
              </div>
            </div>

            {/* F. Kemitraan Pembelajaran */}
            <div>
              <div className="yellow-header text-[12px] p-1.5 border border-black mb-1.5 uppercase font-bold">
                F. Kemitraan Pembelajaran (Optional)
              </div>
              <div className="text-[11.5px] pl-2 text-justify whitespace-pre-line leading-relaxed">
                {isEditing ? (
                  <textarea value={editedData.kemitraanPembelajaran} onChange={(e) => updateField('kemitraanPembelajaran', e.target.value)} className="w-full border border-slate-300 p-2 text-xs" rows={2} />
                ) : (
                  editedData.kemitraanPembelajaran || "Tidak ada kemitraan khusus"
                )}
              </div>
            </div>

            {/* G. Pemanfaatan Digital */}
            <div>
              <div className="yellow-header text-[12px] p-1.5 border border-black mb-1.5 uppercase font-bold">
                G. Pemanfaatan Digital (Optional)
              </div>
              <div className="text-[11.5px] pl-2 text-justify whitespace-pre-line leading-relaxed">
                {isEditing ? (
                  <textarea value={editedData.pemanfaatanDigital} onChange={(e) => updateField('pemanfaatanDigital', e.target.value)} className="w-full border border-slate-300 p-2 text-xs" rows={2} />
                ) : (
                  editedData.pemanfaatanDigital || "Tidak menggunakan perangkat digital khusus"
                )}
              </div>
            </div>

            {/* H. Kegiatan */}
            <div>
              <div className="yellow-header text-[12px] p-1.5 border border-black mb-1.5 uppercase font-bold">
                H. Kegiatan
              </div>
              <div className="text-[11.5px] pl-2 text-justify leading-relaxed">
                {isEditing ? (
                  <textarea 
                    value={editedData.kegiatan} 
                    onChange={(e) => updateKegiatan(e.target.value)} 
                    className="w-full border border-slate-300 p-2 text-xs font-mono" 
                    rows={12} 
                  />
                ) : (
                  <div className="whitespace-pre-line pl-2 mt-0.5">{editedData.kegiatan}</div>
                )}
              </div>
            </div>
          </div>

          {/* NO PAGE BREAK FOR ASSESSMENT AND RUBRIC */}
          <div className="mt-12 pt-8 border-t border-dashed border-slate-300">
            {/* I. Asesmen */}
            <div>
              <div className="yellow-header text-[12px] p-1.5 border border-black mb-4 uppercase font-bold">
                I. Asesmen
              </div>

              {/* Asesmen Table (Formatif / Sumatif) */}
              <table className="document-table mb-6 w-full">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="font-bold w-1/4 text-center">Jenis Asesmen</th>
                    <th className="font-bold text-center">Bentuk</th>
                    <th className="font-bold text-center">Instrumen</th>
                  </tr>
                </thead>
                <tbody>
                  {editedData.asesmenTable?.map((row, idx) => (
                    <tr key={idx}>
                      <td className="font-semibold text-center align-middle">{row.jenis}</td>
                      <td>
                        {isEditing ? (
                          <input type="text" value={row.bentuk} onChange={(e) => updateAsesmenRow(idx, 'bentuk', e.target.value)} className="w-full outline-none border-b border-transparent focus:border-slate-300 text-[11.5px]" />
                        ) : (
                          row.bentuk
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input type="text" value={row.instrumen} onChange={(e) => updateAsesmenRow(idx, 'instrumen', e.target.value)} className="w-full outline-none border-b border-transparent focus:border-slate-300 text-[11.5px]" />
                        ) : (
                          row.instrumen
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Formatif Rubric Details */}
              <div className="mb-6">
                <span className="font-bold block text-[11.5px] uppercase mb-2">Formatif : __________________________</span>
                <table className="document-table w-full">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="font-bold w-[20%] text-center">Dimensi Profil Lulusan</th>
                      <th className="font-bold w-[20%] text-center">Aspek Yang dinilai</th>
                      <th className="font-bold text-center">Sangat Baik</th>
                      <th className="font-bold text-center">Baik</th>
                      <th className="font-bold text-center">Cukup</th>
                      <th className="font-bold text-center">Kurang</th>
                    </tr>
                  </thead>
                  <tbody>
                    {editedData.formatifRubricTable?.map((row, idx) => (
                      <tr key={idx}>
                        <td className="font-semibold text-center">
                          {isEditing ? (
                            <input type="text" value={row.dimensi} onChange={(e) => updateFormatifRow(idx, 'dimensi', e.target.value)} className="w-full text-center outline-none" />
                          ) : (
                            row.dimensi
                          )}
                        </td>
                        <td className="font-semibold text-center">
                          {isEditing ? (
                            <input type="text" value={row.aspek} onChange={(e) => updateFormatifRow(idx, 'aspek', e.target.value)} className="w-full text-center outline-none" />
                          ) : (
                            row.aspek
                          )}
                        </td>
                        <td>
                          {isEditing ? (
                            <textarea value={row.sangatBaik} onChange={(e) => updateFormatifRow(idx, 'sangatBaik', e.target.value)} className="w-full border-none outline-none resize-none" rows={2} />
                          ) : (
                            row.sangatBaik
                          )}
                        </td>
                        <td>
                          {isEditing ? (
                            <textarea value={row.baik} onChange={(e) => updateFormatifRow(idx, 'baik', e.target.value)} className="w-full border-none outline-none resize-none" rows={2} />
                          ) : (
                            row.baik
                          )}
                        </td>
                        <td>
                          {isEditing ? (
                            <textarea value={row.cukup} onChange={(e) => updateFormatifRow(idx, 'cukup', e.target.value)} className="w-full border-none outline-none resize-none" rows={2} />
                          ) : (
                            row.cukup
                          )}
                        </td>
                        <td>
                          {isEditing ? (
                            <textarea value={row.kurang} onChange={(e) => updateFormatifRow(idx, 'kurang', e.target.value)} className="w-full border-none outline-none resize-none" rows={2} />
                          ) : (
                            row.kurang
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Sumatif Rubric Details */}
              <div className="mb-8">
                <span className="font-bold block text-[11.5px] uppercase mb-2">Sumatif : __________________________</span>
                <table className="document-table w-full">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="font-bold w-[25%] text-center">Aspek</th>
                      <th className="font-bold text-center">Skor 4 (Sangat Baik)</th>
                      <th className="font-bold text-center">Skor 3 (Baik)</th>
                      <th className="font-bold text-center">Skor 2 (Cukup)</th>
                      <th className="font-bold text-center">Skor 1 (Perlu Bimbingan)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {editedData.sumatifRubricTable?.map((row, idx) => (
                      <tr key={idx}>
                        <td className="font-semibold text-center">
                          {isEditing ? (
                            <input type="text" value={row.aspek} onChange={(e) => updateSumatifRow(idx, 'aspek', e.target.value)} className="w-full text-center outline-none" />
                          ) : (
                            row.aspek
                          )}
                        </td>
                        <td>
                          {isEditing ? (
                            <textarea value={row.skor4} onChange={(e) => updateSumatifRow(idx, 'skor4', e.target.value)} className="w-full border-none outline-none resize-none" rows={2} />
                          ) : (
                            row.skor4
                          )}
                        </td>
                        <td>
                          {isEditing ? (
                            <textarea value={row.skor3} onChange={(e) => updateSumatifRow(idx, 'skor3', e.target.value)} className="w-full border-none outline-none resize-none" rows={2} />
                          ) : (
                            row.skor3
                          )}
                        </td>
                        <td>
                          {isEditing ? (
                            <textarea value={row.skor2} onChange={(e) => updateSumatifRow(idx, 'skor2', e.target.value)} className="w-full border-none outline-none resize-none" rows={2} />
                          ) : (
                            row.skor2
                          )}
                        </td>
                        <td>
                          {isEditing ? (
                            <textarea value={row.skor1} onChange={(e) => updateSumatifRow(idx, 'skor1', e.target.value)} className="w-full border-none outline-none resize-none" rows={2} />
                          ) : (
                            row.skor1
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Signature Area */}
            <div className="mt-12 text-[11.5px] avoid-break" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
              <table className="w-full" style={{ borderCollapse: 'collapse', border: 'none' }}>
                <tbody>
                  <tr style={{ border: 'none' }}>
                    <td style={{ width: '50%', border: 'none', padding: 0 }}>
                      <p>Mengetahui,</p>
                      <p className="font-semibold">Kepala {schoolName || "SD Negeri 1 Merdeka"}</p>
                      <br /><br /><br /><br />
                      <p className="font-bold underline">
                        {principalName || "........................................"}
                      </p>
                      <p>NIP. {principalNip || "........................................"}</p>
                    </td>
                    <td style={{ width: '50%', border: 'none', padding: 0 }}>
                      <p>
                        {isEditing ? (
                          <input 
                            type="text" 
                            value={signatureDateLine} 
                            onChange={(e) => setSignatureDateLine(e.target.value)} 
                            className="border-b border-slate-300 outline-none w-full max-w-[240px]" 
                          />
                        ) : (
                          signatureDateLine || `${formInput.signaturePlace || "Kajulangko"}, ...................`
                        )}
                      </p>
                      <p className="font-semibold">Guru Kelas</p>
                      <br /><br /><br /><br />
                      <p className="font-bold underline">
                        {teacherName || "........................................"}
                      </p>
                      <p>NIP. {teacherNip || "........................................"}</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
