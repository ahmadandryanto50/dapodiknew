/**
 * Utility to print any DOM element cleanly with styling isolation.
 * Works seamlessly in sandboxed preview iframes and standalone windows.
 */
export async function printElement(elementId: string, title: string = 'Laporan Rekapitulasi DAPODIK'): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.warn(`Element with id ${elementId} not found for printing, invoking standard window.print().`);
    window.focus();
    window.print();
    return;
  }

  try {
    const printIframe = document.createElement('iframe');
    printIframe.setAttribute('id', 'temp-print-frame');
    printIframe.style.position = 'fixed';
    printIframe.style.right = '0';
    printIframe.style.bottom = '0';
    printIframe.style.width = '0';
    printIframe.style.height = '0';
    printIframe.style.border = '0';
    printIframe.style.visibility = 'hidden';
    document.body.appendChild(printIframe);

    const pri = printIframe.contentWindow;
    if (pri) {
      const allStyles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
        .map(style => style.outerHTML)
        .join('\n');

      pri.document.open();
      pri.document.write(`
        <!DOCTYPE html>
        <html lang="id">
          <head>
            <meta charset="utf-8">
            <title>${title}</title>
            ${allStyles}
            <style>
              @page {
                size: A4 portrait;
                margin: 10mm 12mm 15mm 12mm;
              }
              body {
                background: #ffffff !important;
                color: #000000 !important;
                margin: 0 !important;
                padding: 10px !important;
                font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .no-print {
                display: none !important;
              }
              table {
                width: 100% !important;
                border-collapse: collapse !important;
                page-break-inside: auto !important;
              }
              tr {
                page-break-inside: avoid !important;
                page-break-after: auto !important;
              }
              .page-break-avoid {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
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
      pri.document.close();

      setTimeout(() => {
        try {
          pri.focus();
          pri.print();
        } catch (e) {
          console.warn('Iframe print error, falling back to window.print', e);
          document.body.classList.add('printing-rekap');
          window.focus();
          window.print();
          setTimeout(() => document.body.classList.remove('printing-rekap'), 1000);
        } finally {
          setTimeout(() => {
            if (document.body.contains(printIframe)) {
              document.body.removeChild(printIframe);
            }
          }, 3000);
        }
      }, 500);
      return;
    }
  } catch (err) {
    console.warn('Iframe print error, falling back:', err);
  }

  // Fallback to window.print with body class
  document.body.classList.add('printing-rekap');
  window.focus();
  window.print();
  setTimeout(() => {
    document.body.classList.remove('printing-rekap');
  }, 1000);
}
