/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * File Text Extractor for Chavruta Smart
 * חילוץ טקסט מקובצי TXT ו-PDF ללא תלות ברשת חיצונית (Local Vite Worker)
 */

import * as pdfjsLib from 'pdfjs-dist';
// Import the PDF.js worker as a local Vite asset URL so it never fails due to CDN 404s
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
}

export interface ExtractedFileResult {
  text: string;
  fileName: string;
  suggestedTitle: string;
}

export async function extractTextFromFile(file: File): Promise<ExtractedFileResult> {
  const fileName = file.name;
  const lowerName = fileName.toLowerCase();
  const isTxt = lowerName.endsWith('.txt') || file.type === 'text/plain';
  const isPdf = lowerName.endsWith('.pdf') || file.type === 'application/pdf';

  if (!isTxt && !isPdf) {
    throw new Error('פורמט קובץ לא נתמך. אנא העלה קובץ טקסט (.txt) או מסמך PDF (.pdf) בלבד.');
  }

  // Derive suggested title from file name without extension
  const suggestedTitle = fileName.replace(/\.[^/.]+$/, '').trim();

  // Handle plain text file
  if (isTxt) {
    const text = await file.text();
    const cleanText = text.trim();
    if (!cleanText) {
      throw new Error('קובץ הטקסט שהועלה ריק.');
    }
    return {
      text: cleanText,
      fileName,
      suggestedTitle,
    };
  }

  // Handle PDF file
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // Ensure workerSrc is set
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
    }

    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useWorkerFetch: false,
      useSystemFonts: true,
    });
    
    const pdfDoc = await loadingTask.promise;
    let fullExtractedText = '';

    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageStrings = textContent.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .filter(Boolean);
      
      fullExtractedText += pageStrings.join(' ') + '\n\n';
    }

    const trimmed = fullExtractedText.trim();
    if (!trimmed) {
      throw new Error('לא נמצא טקסט קריא בתוך ה-PDF. ייתכן שהקובץ סרוק כתמונה בלבד.');
    }

    return {
      text: trimmed,
      fileName,
      suggestedTitle,
    };
  } catch (err: any) {
    console.error('PDF extraction failed:', err);
    throw new Error(err.message || 'שגיאה בפענוח קובץ ה-PDF. אנא ודא שהקובץ תקין או הדבק את הטקסט ידנית.');
  }
}
