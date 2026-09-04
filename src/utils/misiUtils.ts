export function getNormalizedMisi(misi: any): string[] {
  if (Array.isArray(misi) && misi.length > 0) {
    return misi.map(item => String(item).trim()).filter(Boolean);
  }
  if (typeof misi === 'string' && misi.trim().length > 0) {
    try {
      const parsed = JSON.parse(misi);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(item => String(item).trim()).filter(Boolean);
      }
    } catch (e) {
      if (misi.includes('\n')) {
        return misi.split('\n').map(s => s.replace(/^\d+[\.\)]\s*/, '').trim()).filter(Boolean);
      }
      if (misi.includes(';')) {
        return misi.split(';').map(s => s.trim()).filter(Boolean);
      }
      return [misi.trim()];
    }
  }
  return [
    'Menyelenggarakan pembelajaran berkualitas berbasis Kurikulum Merdeka yang berpihak pada murid.',
    'Menumbuhkembangkan budi pekerti, keimanan, ketaqwaan, dan toleransi dalam kehidupan sekolah.',
    'Mengoptimalkan pemanfaatan teknologi digital dan literasi komputasi dalam kegiatan belajar mengajar.',
    'Membina bakat, minat, dan potensi peserta didik melalui kegiatan kokurikuler dan ekstrakurikuler berprestasi.',
    'Menciptakan lingkungan satuan pendidikan yang aman, nyaman, inklusif, ramah anak, dan bebas perundungan.'
  ];
}
