import React, { useState, useEffect, useRef } from 'react';

interface FormattedTextWithTableProps {
  text: string;
  isEditable?: boolean;
  onSave?: (newText: string) => void;
  className?: string;
  size?: 'sm' | 'base';
}

export interface ParsedTable {
  headers: string[];
  rows: string[][];
}

export const parseMarkdownTable = (rawText: string): ParsedTable | null => {
  if (!rawText) return null;
  
  // Normalize double pipes or multiple pipes that indicate new rows
  let normalized = rawText.replace(/\|\s*\|/g, '|\n|');
  
  // Now split into lines
  const lines = normalized.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  // A valid table needs at least 2 lines (header + separator, or header + rows)
  // Let's filter out lines that do not start and end with |
  const tableLines = lines.filter(line => line.startsWith('|') && line.endsWith('|'));
  
  if (tableLines.length < 2) return null;
  
  // Parse rows and cells
  const rows = tableLines.map(line => {
    // Split by | but ignore leading and trailing empty cells
    const cells = line.split('|').map(c => c.trim());
    if (cells[0] === '') cells.shift();
    if (cells[cells.length - 1] === '') cells.pop();
    return cells;
  });
  
  // Check if there is a separator line (contains only dashes, colons, or spaces)
  let hasSeparator = false;
  let separatorIndex = -1;
  for (let i = 0; i < rows.length; i++) {
    const isSep = rows[i].every(cell => /^[:-]+$/.test(cell));
    if (isSep && rows[i].length > 0) {
      hasSeparator = true;
      separatorIndex = i;
      break;
    }
  }
  
  let headerRow: string[] = [];
  let dataRows: string[][] = [];
  
  if (hasSeparator) {
    if (separatorIndex > 0) {
      headerRow = rows[separatorIndex - 1];
      dataRows = [
        ...rows.slice(0, separatorIndex - 1),
        ...rows.slice(separatorIndex + 1)
      ];
    } else {
      dataRows = rows.slice(1);
    }
  } else {
    headerRow = rows[0];
    dataRows = rows.slice(1);
  }
  
  return {
    headers: headerRow,
    rows: dataRows
  };
};

export default function FormattedTextWithTable({
  text,
  isEditable = false,
  onSave,
  className = '',
  size = 'base'
}: FormattedTextWithTableProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempText, setTempText] = useState(text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Keep tempText in sync if prop changes
  useEffect(() => {
    setTempText(text);
  }, [text]);

  // Focus textarea when editing starts
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      // Auto-grow textarea
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [isEditing]);

  const handleSave = () => {
    setIsEditing(false);
    if (onSave && tempText !== text) {
      onSave(tempText);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Save on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSave();
    }
  };

  // If in editing mode
  if (isEditing && isEditable) {
    return (
      <div className="w-full space-y-1.5 no-print" onClick={(e) => e.stopPropagation()}>
        <textarea
          ref={textareaRef}
          value={tempText}
          onChange={(e) => {
            setTempText(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className="w-full p-2.5 text-xs sm:text-sm text-slate-800 border-2 border-teal-500 rounded-xl outline-none focus:ring-1 focus:ring-teal-500 bg-white leading-relaxed font-medium shadow-xs"
          placeholder="Tulis pertanyaan di sini... Anda bisa menggunakan format tabel markdown (misal: | Kolom 1 | Kolom 2 |)"
        />
        <div className="flex justify-end gap-1.5">
          <button
            type="button"
            onClick={() => {
              setTempText(text);
              setIsEditing(false);
            }}
            className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-3 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            Simpan
          </button>
        </div>
      </div>
    );
  }

  // Parsing logic for rendering
  const firstPipe = text.indexOf('|');
  const lastPipe = text.lastIndexOf('|');

  const textClass = size === 'sm' ? 'text-xs text-slate-700' : 'text-sm text-slate-900 font-medium';

  if (firstPipe !== -1 && lastPipe !== -1 && lastPipe > firstPipe) {
    const tablePart = text.substring(firstPipe, lastPipe + 1);
    
    // Validate that it looks like a table
    if (tablePart.includes('---') || (tablePart.match(/\|/g) || []).length >= 4) {
      const parsed = parseMarkdownTable(tablePart);
      if (parsed) {
        const textBefore = text.substring(0, firstPipe).trim();
        const textAfter = text.substring(lastPipe + 1).trim();

        return (
          <div 
            className={`space-y-2.5 w-full transition-all ${isEditable ? 'cursor-text hover:bg-teal-50/30 rounded p-1' : ''} ${className}`}
            onClick={() => isEditable && setIsEditing(true)}
            title={isEditable ? "Klik untuk mengedit soal/tabel" : undefined}
          >
            {textBefore && (
              <p className={`whitespace-pre-wrap leading-relaxed text-justify ${textClass}`}>
                {textBefore}
              </p>
            )}
            
            <div className="my-2.5 overflow-x-auto border border-slate-200 rounded-xl max-w-full print:border-slate-300">
              <table className="min-w-full divide-y divide-slate-200 border-collapse bg-white print:divide-slate-300">
                <thead className="bg-slate-50 print:bg-slate-100">
                  <tr>
                    {parsed.headers.map((header, hIdx) => (
                      <th 
                        key={hIdx} 
                        className="px-3 py-2 text-left text-[11px] sm:text-xs font-extrabold text-slate-700 tracking-wider border-b border-slate-200 bg-slate-100/60 print:border-slate-300"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 print:divide-slate-250">
                  {parsed.rows.map((row, rIdx) => (
                    <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}>
                      {row.map((cell, cIdx) => (
                        <td 
                          key={cIdx} 
                          className="px-3 py-1.5 text-[11px] sm:text-xs text-slate-700 border-t border-slate-100 font-medium print:border-slate-200"
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {textAfter && (
              <p className={`whitespace-pre-wrap leading-relaxed text-justify ${textClass}`}>
                {textAfter}
              </p>
            )}
          </div>
        );
      }
    }
  }

  // Fallback to simple paragraph
  return (
    <div 
      className={`whitespace-pre-wrap leading-relaxed text-justify ${textClass} ${isEditable ? 'cursor-text hover:bg-teal-50/30 rounded p-1 transition-all' : ''} ${className}`}
      onClick={() => isEditable && setIsEditing(true)}
      title={isEditable ? "Klik untuk mengedit soal" : undefined}
    >
      {text}
    </div>
  );
}
