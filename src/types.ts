export interface ModulFormData {
  schoolName: string;
  teacherName: string;
  teacherNip: string;
  position: string;
  principalName: string;
  principalNip: string;
  signaturePlace: string;
  level: 'SD' | 'SMP' | 'SMA' | 'SMK';
  grade: string;
  semester: string;
  subject: string;
  cp: string;
  tp: string;
  tps?: string[]; // Multiple Tujuan Pembelajaran
  material: string;
  materials?: string[];
  meetings: number;
  duration: string;
  pedagogy: string[]; // Pedagogical practice per meeting
  dimensi: string[]; // Multi-select Dimensi Lulusan
}

export interface GeneratedModul {
  identitas: {
    schoolName: string;
    subject: string;
    classSemester: string;
    duration: string;
  };
  identifikasi: {
    students: string;
    material: string;
    dimensi: string;
  };
  desain: {
    cp: string;
    crossDisciplinary: string;
    tp: string;
    topic: string;
    pedagogy: string;
    partnership: string;
    environment: string;
    digitalUtilization: string;
    adaptasiLokal: string;
  };
  pengalaman: {
    memahami: string;
    mengaplikasi: string;
    merefleksi: string;
  };
  asesmen: {
    awal: string;
    proses: string;
    akhir: string;
  };
}

export interface AsesmenConfig {
  pgCount: number;
  pgkCount: number;
  isianCount: number;
  uraianCount: number;
  bsCount: number;
  menjodohkanCount: number;
  pgOptionsCount: 3 | 4 | 5;
  levelKognitif: ('LOTS' | 'MOTS' | 'HOTS')[];
  jenisAsesmen: 'Asesmen Awal' | 'Asesmen Formatif' | 'Asesmen Sumatif';
}

export interface KisiKisiItem {
  no: number;
  tp: string;
  materi: string;
  indikator: string;
  levelKognitif: string;
  bentukSoal: string;
  noSoal: string;
}

export interface StimulusDataPoint {
  label: string;
  value: number;
  extraInfo?: string;
}

export interface StimulusItem {
  type: 'text' | 'table' | 'bar_chart' | 'line_chart' | 'pie_chart';
  title: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  headers?: string[];
  data?: StimulusDataPoint[];
}

export interface QuestionItem {
  no: number;
  tipe: 'PG' | 'PGK' | 'Isian' | 'Uraian' | 'BS' | 'Menjodohkan';
  pertanyaan: string;
  opsi?: string[];       // Khusus PG (3, 4, atau 5 option) dan PGK jika ada
  levelKognitif: 'LOTS' | 'MOTS' | 'HOTS';
  matchingLeft?: string[];  // Khusus Menjodohkan
  matchingRight?: string[]; // Khusus Menjodohkan
  butuhGambar?: boolean;
  promptGambar?: string;
  imageUrl?: string;
  stimulus?: StimulusItem;
}

export interface KunciPembahasanItem {
  no: number;
  tipe: string;
  kunci: string;         // Kunci jawaban (misal "A" untuk PG, "Ya - Benar" untuk BS, atau deskripsi singkat)
  pembahasan: string;    // Pembahasan materi lengkap
  rubrik: string;        // Rubrik penilaian masing-masing bentuk soal
}

export interface GeneratedAsesmen {
  identitas: {
    schoolName: string;
    subject: string;
    classSemester: string;
    tp: string;
    materi: string;
    jenisAsesmen?: string;
  };
  kisiKisi: KisiKisiItem[];
  soal: QuestionItem[];
  kunciPembahasan: KunciPembahasanItem[];
  rubrik?: Record<number, string>;
  formInput?: ModulFormData;
}

export interface AdminConfig {
  pin: string;
  enabledPositions: string[];
  enabledSubjects: Record<'SD' | 'SMP' | 'SMA' | 'SMK', string[]>;
}

export interface KokurikulerFormData {
  schoolName: string;
  subject: string;
  bentukKokurikuler: string;
  theme: string;
  fokusKegiatan: string;
  grade: string;
  alokasiWaktu: string;
  dimensi: string[];
  catatan?: string;
  
  // Signatures
  teacherName: string;
  teacherNip: string;
  principalName: string;
  principalNip: string;
  signaturePlace: string;
}

export interface KokurikulerAsesmenRow {
  jenis: 'Formatif' | 'Sumatif';
  bentuk: string;
  instrumen: string;
}

export interface KokurikulerFormatifRubrikRow {
  dimensi: string;
  aspek: string;
  sangatBaik: string;
  baik: string;
  cukup: string;
  kurang: string;
}

export interface KokurikulerSumatifRubrikRow {
  aspek: string;
  skor4: string;
  skor3: string;
  skor2: string;
  skor1: string;
}

export interface GeneratedKokurikuler {
  identitas: {
    schoolName: string;
    subject: string;
    bentukKokurikuler: string;
    theme: string;
    fokusKegiatan: string;
    grade: string;
    alokasiWaktu: string;
  };
  dimensiProfilLulusan: string;
  tujuanPembelajaran: string;
  produkDihasilkan: string;
  praktikPedagogis: string;
  lingkunganBelajar: string;
  kemitraanPembelajaran: string;
  pemanfaatanDigital: string;
  kegiatan: string;
  asesmenTable: KokurikulerAsesmenRow[];
  formatifRubricTable: KokurikulerFormatifRubrikRow[];
  sumatifRubricTable: KokurikulerSumatifRubrikRow[];
}


