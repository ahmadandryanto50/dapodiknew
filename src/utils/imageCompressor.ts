/**
 * Utility to compress image files or base64 data URLs on the client-side.
 * This guarantees that base64 strings sent to Google Sheets fit easily within
 * the 50,000 character limit per cell and sync reliably.
 */
export const compressImage = (
  fileOrBase64: File | string,
  maxDimension = 240,
  quality = 0.75
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Maintain aspect ratio while limiting maximum dimension
      if (width > height) {
        if (width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        }
      } else {
        if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        if (typeof fileOrBase64 === 'string') {
          resolve(fileOrBase64);
        } else {
          resolve('');
        }
        return;
      }

      // Draw the image onto the canvas with scaling
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to JPEG format for high-efficiency compression
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl);
    };

    img.onerror = () => {
      // If error, fallback to original if string, or reject
      if (typeof fileOrBase64 === 'string') {
        resolve(fileOrBase64);
      } else {
        reject(new Error('Gagal memuat gambar untuk kompresi'));
      }
    };

    if (typeof fileOrBase64 === 'string') {
      img.src = fileOrBase64;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          img.src = e.target.result as string;
        } else {
          reject(new Error('Gagal membaca file'));
        }
      };
      reader.onerror = () => reject(new Error('Gagal membaca file'));
      reader.readAsDataURL(fileOrBase64);
    }
  });
};
