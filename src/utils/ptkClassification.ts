import { TeacherStaff } from '../types';

/**
 * Checks whether a PTK is classified as Tenaga Kependidikan.
 * Identifies Kepala Sekolah (sesuai ketentuan), Administrative Staff, TU, Operator, Laboran, Pustakawan,
 * Penjaga, Kebersihan, Keamanan, Driver, and other non-teaching staff.
 */
export function isTenagaKependidikan(t: TeacherStaff | null | undefined): boolean {
  if (!t) return false;

  // Hanya ambil dari nama kolom jenis PTK (tanpa melihat gelar/nama orang)
  const jenis = String(t.jenisPtk || '').toLowerCase().trim();

  // 1. Jika Jenis PTK adalah Guru (misal: Guru, Guru Mapel, Guru BK, Guru Kelas, Guru Agama, Pendidik, dll.)
  // -> Dihitung sebagai GURU (bukan Tendik)
  if (
    jenis.includes('guru') ||
    jenis === 'pendidik' ||
    jenis === 'guru mapel' ||
    jenis === 'guru bk' ||
    jenis === 'guru kelas' ||
    jenis.startsWith('guru')
  ) {
    return false;
  }

  // 2. Jika Jenis PTK adalah Kepala Sekolah, Tendik / Tenaga Kependidikan, Tenaga Administrasi, Laboran, Pustakawan, TU, dll.
  // -> Dihitung sebagai TENDIK / TENAGA KEPENDIDIKAN
  return true;
}

/**
 * Checks whether a PTK is classified as Pendidik (Guru / Kepala Sekolah).
 */
export function isPendidik(t: TeacherStaff | null | undefined): boolean {
  if (!t) return false;
  return !isTenagaKependidikan(t);
}

/**
 * Computes unified PTK breakdowns for consistent display across all modules
 */
export function getPtkBreakdown(teachers: TeacherStaff[] = []) {
  const all = Array.isArray(teachers) ? teachers : [];

  const pendidikList: TeacherStaff[] = [];
  const tendikList: TeacherStaff[] = [];

  let pnsCount = 0;
  let pppkPenuhCount = 0;
  let pppkParuhCount = 0;
  let honorerCount = 0;
  let lainnyaCount = 0;

  let sertifikasiSudahCount = 0;
  let sertifikasiBelumCount = 0;

  all.forEach(t => {
    if (!t) return;

    // Pendidik vs Tendik
    if (isTenagaKependidikan(t)) {
      tendikList.push(t);
    } else {
      pendidikList.push(t);
    }

    // Status Kepegawaian
    const st = String(t.statusKepegawaian || '').toLowerCase().trim();
    if (st.includes('paruh') || st.includes('part time')) {
      pppkParuhCount++;
    } else if (st.includes('pppk') || st.includes('p3k')) {
      pppkPenuhCount++;
    } else if (st.includes('pns') || st.includes('cpns') || st === 'asn') {
      pnsCount++;
    } else if (
      st.includes('honor') ||
      st.includes('gtt') ||
      st.includes('gty') ||
      st.includes('ptt') ||
      st.includes('non asn')
    ) {
      honorerCount++;
    } else {
      lainnyaCount++;
    }

    // Sertifikasi
    const s = String(t.statusSertifikasi || (t as any).sertifikasi || '').toLowerCase().trim();
    if (s.includes('sudah') || s.includes('ya') || s.includes('bersertifikat') || s.includes('lulus')) {
      sertifikasiSudahCount++;
    } else {
      sertifikasiBelumCount++;
    }
  });

  const pppkTotalCount = pppkPenuhCount + pppkParuhCount;
  const certifiedPercent = pendidikList.length > 0 
    ? Math.round((sertifikasiSudahCount / pendidikList.length) * 100)
    : (all.length > 0 ? Math.round((sertifikasiSudahCount / all.length) * 100) : 0);

  return {
    total: all.length,
    pendidikList,
    tendikList,
    pendidikCount: pendidikList.length,
    tendikCount: tendikList.length,
    pnsCount,
    pppkPenuhCount,
    pppkParuhCount,
    pppkTotalCount,
    honorerCount,
    lainnyaCount,
    sertifikasiSudahCount,
    sertifikasiBelumCount,
    certifiedPercent
  };
}
