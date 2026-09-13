import html2pdf from 'html2pdf.js';

/**
 * Utility to print any DOM element cleanly with styling isolation.
 * Works seamlessly in sandboxed preview iframes and standalone windows.
 */
export async function printElement(elementId: string, title: string = 'Laporan Rekapitulasi DAPODIK'): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.warn(`Element with id ${elementId} not found, invoking window.print().`);
    window.focus();
    window.print();
    return;
  }

  // Add body print class safely for CSS rules
  document.body.classList.add('printing-rekap');

  const cleanup = () => {
    document.body.classList.remove('printing-rekap');
  };

  try {
    // Create an isolated printing iframe to render ONLY the clean A4 element
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    const frameDoc = iframe.contentWindow?.document;
    if (frameDoc) {
      const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
        .map(style => style.outerHTML)
        .join('\n');

      frameDoc.open();
      frameDoc.write(`
        <!DOCTYPE html>
        <html lang="id">
          <head>
            <meta charset="utf-8">
            <title>${title}</title>
            ${styles}
            <style>
              @page {
                size: A4 portrait;
                margin: 8mm 10mm 10mm 10mm;
              }
              body {
                background: #ffffff !important;
                color: #000000 !important;
                margin: 0 !important;
                padding: 5px !important;
                font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .no-print {
                display: none !important;
              }
              table {
                width: 100% !important;
                border-collapse: collapse !important;
              }
              table, th, td {
                border-color: #000000 !important;
              }
              .page-break-before {
                page-break-before: always !important;
                break-before: page !important;
              }
            </style>
          </head>
          <body>
            ${element.outerHTML}
          </body>
        </html>
      `);
      frameDoc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          console.warn('Iframe print warning, using window.print fallback:', e);
          window.focus();
          window.print();
        } finally {
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
            cleanup();
          }, 1000);
        }
      }, 400);
      return;
    }
  } catch (err) {
    console.warn('Print element error, fallback to window.print:', err);
  }

  // Direct fallback
  window.focus();
  window.print();
  setTimeout(cleanup, 500);
}

/**
 * Utility to export a DOM element directly as a downloaded PDF file using html2pdf.js.
 */
export async function exportElementToPdf(elementId: string, filename: string = 'Rapor_Kurikulum_Merdeka'): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.warn(`Element with id ${elementId} not found for PDF export.`);
    return false;
  }

  try {
    const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    const opt = {
      margin: [8, 8, 12, 8] as [number, number, number, number], // top, left, bottom, right in mm
      filename: cleanFilename,
      image: { type: 'jpeg' as const, quality: 0.95 },
      html2canvas: {
        scale: 1.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1024
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
      pagebreak: { mode: ['css', 'legacy'], before: '.page-break-before' }
    };

    // Execute html2pdf conversion without freezing or fallback looping
    await html2pdf().set(opt).from(element).save();
    return true;
  } catch (err) {
    console.error('Error exporting element to PDF via html2pdf:', err);
    return false;
  }
}


