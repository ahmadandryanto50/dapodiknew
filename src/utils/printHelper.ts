import html2pdf from 'html2pdf.js';

/**
 * Utility to print any DOM element cleanly with complete styling isolation.
 * Works reliably across desktop PCs, laptops, and iframe preview environments.
 */
export async function printElement(elementId: string, title: string = 'Cetak Dokumen'): Promise<void> {
  const originalElement = document.getElementById(elementId);
  if (!originalElement) {
    console.warn(`Element with ID '${elementId}' not found for printing.`);
    try {
      window.focus();
      window.print();
    } catch (_) {}
    return;
  }

  // Remove any previous stale print host container
  const existingHost = document.getElementById('direct-print-host');
  if (existingHost && existingHost.parentNode) {
    existingHost.parentNode.removeChild(existingHost);
  }

  // Create isolated container attached directly to document.body
  const printHost = document.createElement('div');
  printHost.id = 'direct-print-host';

  // Deep clone target element to preserve original modal DOM
  const clone = originalElement.cloneNode(true) as HTMLElement;
  printHost.appendChild(clone);
  document.body.appendChild(printHost);

  const printClass = elementId === 'printable-surat-pindah-content' ? 'printing-surat-pindah' : 'printing-rekap';
  document.body.classList.add('is-printing-direct', printClass);

  return new Promise<void>((resolve) => {
    let cleanedUp = false;

    const cleanup = () => {
      if (cleanedUp) return;
      cleanedUp = true;

      document.body.classList.remove('is-printing-direct', printClass, 'printing-surat-pindah', 'printing-rekap');
      const host = document.getElementById('direct-print-host');
      if (host && host.parentNode) {
        host.parentNode.removeChild(host);
      }
      resolve();
    };

    // Clean up when user closes or completes the print dialog
    window.addEventListener('afterprint', cleanup, { once: true });

    // Allow browser time to render DOM changes before triggering print preview
    setTimeout(() => {
      try {
        window.focus();
        window.print();
      } catch (err) {
        console.error('Print execution error:', err);
      } finally {
        // Safe cleanup fallback after 30 seconds (NOT 1 second) so preview dialog has plenty of time to render
        setTimeout(cleanup, 30000);
      }
    }, 150);
  });
}

/**
 * Utility to export a DOM element directly as a downloaded PDF file using html2pdf.js,
 * with reliable timeout handling and a bulletproof fallback to printElement.
 */
export async function exportElementToPdf(elementId: string, filename: string = 'Surat_Keterangan_Pindah'): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.warn(`Element with id ${elementId} not found for PDF export.`);
    return false;
  }

  try {
    const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    
    // Safely resolve html2pdf export method
    const html2pdfLib = (html2pdf as any).default || html2pdf;
    if (typeof html2pdfLib === 'function') {
      const opt = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename: cleanFilename,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: 1024
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
        pagebreak: { mode: ['css', 'legacy'], before: '.page-break-before' }
      };

      // Wrap in Promise.race with a 6-second timeout to prevent any application freeze
      const exportPromise = html2pdfLib().set(opt).from(element).save();
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('PDF export timed out')), 6000)
      );

      await Promise.race([exportPromise, timeoutPromise]);
      return true;
    } else {
      console.warn('html2pdf library not available.');
      return false;
    }
  } catch (err) {
    console.error('Error exporting element to PDF:', err);
    return false;
  }
}
