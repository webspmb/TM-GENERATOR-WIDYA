/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SHEET_CP_DATABASE } from '../data/cp_data';

const SPREADSHEET_ID = "11ge9fae0Lyopjvm2IzXKYJxgyasYx6ptsLZpcd4-6X4";
const SHEETS_LIST = ["SD", "SMP", "SMA", "SMK"] as const;

export interface SyncStatus {
  state: 'idle' | 'syncing' | 'success' | 'error';
  errorMessage?: string;
  lastSynced?: string;
}

/**
 * Standard-compliant CSV parser that respects double quotes and handles newlines within fields.
 */
function parseCSV(text: string): string[][] {
  const result: string[][] = [];
  let row: string[] = [];
  let inQuotes = false;
  let entry = "";
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        entry += '"';
        i++; // skip second quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(entry.trim());
      entry = "";
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      row.push(entry.trim());
      // Only push non-empty rows
      if (row.some(cell => cell.length > 0)) {
        result.push(row);
      }
      row = [];
      entry = "";
    } else {
      entry += char;
    }
  }
  
  if (entry || row.length > 0) {
    row.push(entry.trim());
    if (row.some(cell => cell.length > 0)) {
      result.push(row);
    }
  }
  
  return result;
}

/**
 * Normalizes grade values (Arabic numbers & Roman numerals) to a unified Arabic string format ("1" to "12")
 * Returns an array of grades to handle groupings like "Kelas 7, 8 & 9" or "Kelas 11 & 12"
 */
function mapToArabicGrade(rawClass: string): string[] {
  const clean = rawClass.trim().toUpperCase();
  
  // Ubah angka romawi ke angka arab standard
  let processed = clean
    .replace(/\bXII\b/g, '12')
    .replace(/\bXI\b/g, '11')
    .replace(/\bX\b/g, '10')
    .replace(/\bIX\b/g, '9')
    .replace(/\bVIII\b/g, '8')
    .replace(/\bVII\b/g, '7')
    .replace(/\bVI\b/g, '6')
    .replace(/\bV\b/g, '5')
    .replace(/\bIV\b/g, '4')
    .replace(/\bIII\b/g, '3')
    .replace(/\bII\b/g, '2')
    .replace(/\bI\b/g, '1');

  // Ekstrak semua barisan angka (misalnya ["7", "8", "9"] dari "7, 8 & 9")
  const matches = processed.match(/\d+/g);
  if (matches && matches.length > 0) {
    return matches;
  }
  
  // Fallback
  const fallback = clean.replace(/kelas/gi, '').trim();
  return [fallback];
}

/**
 * Normalizes keys to handle subtle changes in spelling or spacing
 */
function normalizeKey(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Parse fetched spreadsheet CSV rows into our CP Schema structure:
 * Record<Level, Record<Class/Grade, Record<Subject, CP_Array[]>>>
 */
function parseSheetRows(rows: string[][], level: string, targetDb: any) {
  if (rows.length < 2) return;
  
  // Find header row (usually the first row where some columns match target headers)
  let headerIndex = 0;
  let headers = rows[0].map(h => h.trim().toLowerCase());
  
  // Search for typical headers if the first row is empty or incorrect
  let hasClass = headers.some(h => h.includes('kelas'));
  let hasSubject = headers.some(h => h.includes('mata pelajaran') || h.includes('mapel') || h.includes('pelajaran'));
  
  if (!hasClass || !hasSubject) {
    for (let r = 1; r < Math.min(rows.length, 5); r++) {
      const prospectiveHeaders = rows[r].map(h => h.trim().toLowerCase());
      if (prospectiveHeaders.some(h => h.includes('kelas')) && prospectiveHeaders.some(h => h.includes('mata pelajaran') || h.includes('mapel'))) {
        headers = prospectiveHeaders;
        headerIndex = r;
        break;
      }
    }
  }
  
  // Define column mappings
  const classIdx = headers.findIndex(h => h.includes('kelas'));
  const mapelIdx = headers.findIndex(h => h.includes('mata pelajaran') || h.includes('mapel') || h.includes('pelajaran'));
  const CPIdx = headers.findIndex(h => h.includes('capaian') || h.includes('cp'));
  
  if (classIdx === -1 || mapelIdx === -1 || CPIdx === -1) {
    console.warn(`Columns not fully found in sheet ${level}. Headers parsed:`, headers);
    return;
  }
  
  targetDb[level] = targetDb[level] || {};
  
  // Parse rows (skip the header and empty lines)
  for (let r = headerIndex + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length <= Math.max(classIdx, mapelIdx, CPIdx)) continue;
    
    let rawClass = row[classIdx]?.trim() || "";
    let rawSubject = row[mapelIdx]?.trim() || "";
    let rawCp = row[CPIdx]?.trim() || "";
    
    if (!rawClass || !rawSubject || !rawCp) continue;
    
    // Clean up class prefix and normalize into standard grade numbers "1" - "12"
    const cleanedClasses = mapToArabicGrade(rawClass);
    
    for (const cleanedClass of cleanedClasses) {
      // Group in structure
      targetDb[level][cleanedClass] = targetDb[level][cleanedClass] || {};
      targetDb[level][cleanedClass][rawSubject] = targetDb[level][cleanedClass][rawSubject] || [];
      
      const cpText = rawCp;
        
      // Prevent duplicate entries
      if (!targetDb[level][cleanedClass][rawSubject].includes(cpText)) {
        targetDb[level][cleanedClass][rawSubject].push(cpText);
      }
    }
  }
}

/**
 * Public facing function to fetch and sync from the Google Spreadsheet ID.
 */
export async function syncGoogleSheetsCP(): Promise<{ success: boolean; error?: string }> {
  const tempDb: Record<string, any> = {};
  
  try {
    const fetchPromises = SHEETS_LIST.map(async (sheetName) => {
      // Prioritize standard gviz export format as CSV, works with any view-accessible public sheet
      const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
      const fallbackUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&sheet=${encodeURIComponent(sheetName)}`;
      
      let response: Response;
      try {
        response = await fetch(url);
        if (!response.ok) throw new Error(`gviz failed with HTTP ${response.status}`);
      } catch (err) {
        console.warn(`gviz fetch for sheet ${sheetName} failed, retrying fallback...`, err);
        response = await fetch(fallbackUrl);
        if (!response.ok) throw new Error(`fallback failed with HTTP ${response.status}`);
      }
      
      const csvText = await response.text();
      if (!csvText || csvText.length < 50) {
        throw new Error(`Empty or invalid response for sheet ${sheetName}`);
      }
      
      const rows = parseCSV(csvText);
      parseSheetRows(rows, sheetName, tempDb);
    });
    
    await Promise.all(fetchPromises);
    
    // Check if we populated at least some levels
    const levelCount = Object.keys(tempDb).length;
    if (levelCount === 0) {
      throw new Error("No Capaian Pembelajaran parsed from any sheet.");
    }
    
    // Succesfully parsed! Let's save to localStorage and update our live reference
    localStorage.setItem('cp_sheet_cache', JSON.stringify(tempDb));
    localStorage.setItem('cp_sheet_last_synced', new Date().toISOString());
    
    // Live update of active DB reference
    Object.keys(SHEET_CP_DATABASE).forEach(key => delete SHEET_CP_DATABASE[key]);
    Object.assign(SHEET_CP_DATABASE, tempDb);
    
    console.log("Successfully synchronized Capaian Pembelajaran from Google Spreadsheet:", SPREADSHEET_ID, tempDb);
    
    // Dispatch a global event to notify components that the database was synchronized and should redraw dropdowns
    window.dispatchEvent(new Event('cp_database_synced'));
    
    return { success: true };
  } catch (error: any) {
    console.error("Failed to sync Capaian Pembelajaran from Google Spreadsheet:", error);
    return { 
      success: false, 
      error: error?.message || "Koneksi jaringan terputus atau spreadsheet tidak dapat diakses." 
    };
  }
}

export interface KontrolRow {
  schoolName: string;
  teacherName: string;
  position: string;
  level: 'SD' | 'SMP' | 'SMA' | 'SMK';
  subject: string;
}

export async function fetchKontrolSheet(): Promise<KontrolRow[]> {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=KONTROL`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch KONTROL sheet: ${response.status}`);
    }
    const text = await response.text();
    if (!text || text.length < 10) return [];
    
    const rows = parseCSV(text);
    if (rows.length <= 1) return [];
    
    const headers = rows[0].map(h => h.trim().toLowerCase());
    const schoolIdx = headers.findIndex(h => h.includes('sekolah'));
    const teacherIdx = headers.findIndex(h => h.includes('guru'));
    const positionIdx = headers.findIndex(h => h.includes('jabatan'));
    const levelIdx = headers.findIndex(h => h.includes('jenjang'));
    const subjectIdx = headers.findIndex(h => h.includes('mata pelajaran') || h.includes('mapel') || h.includes('pelajaran'));
    
    const parsed: KontrolRow[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length < 2) continue;
      
      const schoolName = row[schoolIdx !== -1 ? schoolIdx : 0]?.trim() || "";
      const teacherName = row[teacherIdx !== -1 ? teacherIdx : 1]?.trim() || "";
      const position = row[positionIdx !== -1 ? positionIdx : 2]?.trim() || "";
      const level = (row[levelIdx !== -1 ? levelIdx : 3]?.trim().toUpperCase() || "") as 'SD' | 'SMP' | 'SMA' | 'SMK';
      const subject = row[subjectIdx !== -1 ? subjectIdx : 4]?.trim() || "";
      
      if (schoolName && teacherName) {
        parsed.push({
          schoolName,
          teacherName,
          position,
          level,
          subject
        });
      }
    }
    
    localStorage.setItem('ciptajar_kontrol_rows', JSON.stringify(parsed));
    return parsed;
  } catch (error) {
    console.error("Error fetching KONTROL sheet:", error);
    try {
      const cached = localStorage.getItem('ciptajar_kontrol_rows');
      if (cached) return JSON.parse(cached);
    } catch (_) {}
    return [];
  }
}
