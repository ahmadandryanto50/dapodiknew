import * as XLSX from 'xlsx';
import { SarprasItem, KibBItem, BangunanItem, RuangItem } from '../types';

/**
 * Ekspor Data Sarana & Prasarana (Sarpras) ke format file Excel (.xlsx)
 */
export function exportSarprasItemsToExcel(items: SarprasItem[]) {
  if (!items || items.length === 0) {
    alert('Tidak ada data Sarana & Prasarana untuk diekspor.');
    return;
  }
  const rows = items.map((s, idx) => ({
    'No': idx + 1,
    'Kode Sarpras': s.kodeBarang || '-',
    'Nama Sarpras': s.namaBarang || '-',
    'Kategori': s.kategori || '-',
    'Kondisi Fisik': s.kondisi || '-',
    'Volume / Jumlah': s.jumlah || 1,
    'Satuan': s.satuan || 'Unit',
    'Letak / Ruang': s.letakRuang || '-',
    'Tahun Pengadaan': s.tahunPengadaan || '-',
    'Kelayakan': s.layakPakai ? 'Layak Pakai' : 'Tidak Layak'
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const keys = Object.keys(rows[0] || {});
  ws['!cols'] = keys.map(k => ({ wch: Math.max(k.length + 4, 14) }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data_Sarpras');
  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `Data_Sarpras_Sekolah_${dateStr}.xlsx`);
}

/**
 * Ekspor Data KIB B (Peralatan & Mesin) ke format file Excel (.xlsx)
 */
export function exportKibBItemsToExcel(items: KibBItem[]) {
  if (!items || items.length === 0) {
    alert('Tidak ada data KIB B untuk diekspor.');
    return;
  }
  const rows = items.map((item, idx) => ({
    'No': item.no || idx + 1,
    'Kode Barang': item.kodeBarang || '-',
    'Nama Barang / Jenis': item.namaBarang || '-',
    'Nomor Register': item.register || '-',
    'Merk / Type': item.merkType || '-',
    'Ukuran / CC': item.ukuranCc || '-',
    'Bahan': item.bahan || '-',
    'Tahun Pembelian': item.tahun || '-',
    'No. Pabrik / Rangka / Mesin / Polisi / BPKB': [item.noPabrik, item.noRangka, item.noMesin, item.noPolisi, item.noBpkb].filter(Boolean).join(' / ') || '-',
    'Asal Usul': item.asalUsul || '-',
    'Harga (Rp)': item.harga || 0,
    'Kondisi': item.kondisi || 'Baik',
    'Keterangan': item.keterangan || item.keteranganMutasi || '-'
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const keys = Object.keys(rows[0] || {});
  ws['!cols'] = keys.map(k => ({ wch: Math.max(k.length + 4, 14) }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'KIB_B');
  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `Data_KIB_B_Peralatan_dan_Mesin_${dateStr}.xlsx`);
}

/**
 * Ekspor Data Bangunan Sekolah ke format file Excel (.xlsx)
 */
export function exportBangunanItemsToExcel(items: BangunanItem[]) {
  if (!items || items.length === 0) {
    alert('Tidak ada data Bangunan untuk diekspor.');
    return;
  }
  const rows = items.map((b, idx) => ({
    'No': b.no || idx + 1,
    'Nama Bangunan': b.namaBangunan || '-',
    'Kode Bangunan': b.kodeBangunan || '-',
    'Tahun Pembangunan': b.tahunPembangunan || '-',
    'Luas Tapak (m²)': b.luasTapak || '0',
    'Jumlah Lantai': b.jumlahLantai || '1',
    'Jumlah Ruang': b.jumlahRuang || '0',
    'Kondisi': b.kondisi || 'Tidak ada kerusakan',
    'Bobot Kerusakan (%)': b.bobotKerusakan ? `${b.bobotKerusakan}%` : '0%',
    'Keterangan': b.keterangan || '-'
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const keys = Object.keys(rows[0] || {});
  ws['!cols'] = keys.map(k => ({ wch: Math.max(k.length + 4, 14) }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data_Bangunan');
  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `Data_Bangunan_Sekolah_${dateStr}.xlsx`);
}

/**
 * Ekspor Data Ruang Sekolah ke format file Excel (.xlsx)
 */
export function exportRuangItemsToExcel(items: RuangItem[]) {
  if (!items || items.length === 0) {
    alert('Tidak ada data Ruang untuk diekspor.');
    return;
  }
  const rows = items.map((r, idx) => ({
    'No': r.no || idx + 1,
    'Jenis Prasarana': r.jenisPrasarana || '-',
    'Nama Bangunan': r.namaBangunan || '-',
    'Nama Ruang': r.namaRuang || '-',
    'Kode Ruang': r.kodeRuang || '-',
    'Lantai': r.lantai || '1',
    'Panjang (m)': r.panjang || '0',
    'Lebar (m)': r.lebar || '0',
    'Luas (m²)': r.luas || '0',
    'Bobot Kerusakan (%)': r.bobotKerusakan ? `${r.bobotKerusakan}%` : '0%',
    'Klasifikasi Kerusakan': r.klasifikasiKerusakan || '-',
    'Kondisi': r.kondisi || 'Baik',
    'Keterangan': r.keterangan || '-'
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const keys = Object.keys(rows[0] || {});
  ws['!cols'] = keys.map(k => ({ wch: Math.max(k.length + 4, 14) }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data_Ruang');
  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `Data_Ruang_Sekolah_${dateStr}.xlsx`);
}

/**
 * Ekspor Semua Data Sarpras Sekaligus (Sarpras, KIB B, Bangunan, Ruang)
 * dalam 1 Buku Kerja Excel (.xlsx) dengan 4 Sheet terpisah
 */
export function exportAllSarprasToExcel(
  sarpras: SarprasItem[],
  kibB: KibBItem[],
  bangunan: BangunanItem[],
  ruang: RuangItem[]
) {
  const wb = XLSX.utils.book_new();

  // 1. Sheet Sarpras
  const sarprasRows = (sarpras || []).map((s, idx) => ({
    'No': idx + 1,
    'Kode Sarpras': s.kodeBarang || '-',
    'Nama Sarpras': s.namaBarang || '-',
    'Kategori': s.kategori || '-',
    'Kondisi Fisik': s.kondisi || '-',
    'Volume / Jumlah': s.jumlah || 1,
    'Satuan': s.satuan || 'Unit',
    'Letak / Ruang': s.letakRuang || '-',
    'Tahun Pengadaan': s.tahunPengadaan || '-',
    'Kelayakan': s.layakPakai ? 'Layak Pakai' : 'Tidak Layak'
  }));
  const wsSarpras = XLSX.utils.json_to_sheet(sarprasRows.length > 0 ? sarprasRows : [{ 'Info': 'Tidak ada data sarpras' }]);
  XLSX.utils.book_append_sheet(wb, wsSarpras, 'Sarpras');

  // 2. Sheet KIB B
  const kibBRows = (kibB || []).map((item, idx) => ({
    'No': item.no || idx + 1,
    'Kode Barang': item.kodeBarang || '-',
    'Nama Barang / Jenis': item.namaBarang || '-',
    'Nomor Register': item.register || '-',
    'Merk / Type': item.merkType || '-',
    'Ukuran / CC': item.ukuranCc || '-',
    'Bahan': item.bahan || '-',
    'Tahun Pembelian': item.tahun || '-',
    'No. Pabrik / Rangka / Mesin / Polisi / BPKB': [item.noPabrik, item.noRangka, item.noMesin, item.noPolisi, item.noBpkb].filter(Boolean).join(' / ') || '-',
    'Asal Usul': item.asalUsul || '-',
    'Harga (Rp)': item.harga || 0,
    'Kondisi': item.kondisi || 'Baik',
    'Keterangan': item.keterangan || item.keteranganMutasi || '-'
  }));
  const wsKibB = XLSX.utils.json_to_sheet(kibBRows.length > 0 ? kibBRows : [{ 'Info': 'Tidak ada data KIB B' }]);
  XLSX.utils.book_append_sheet(wb, wsKibB, 'KIB_B');

  // 3. Sheet Bangunan
  const bangunanRows = (bangunan || []).map((b, idx) => ({
    'No': b.no || idx + 1,
    'Nama Bangunan': b.namaBangunan || '-',
    'Kode Bangunan': b.kodeBangunan || '-',
    'Tahun Pembangunan': b.tahunPembangunan || '-',
    'Luas Tapak (m²)': b.luasTapak || '0',
    'Jumlah Lantai': b.jumlahLantai || '1',
    'Jumlah Ruang': b.jumlahRuang || '0',
    'Kondisi': b.kondisi || 'Tidak ada kerusakan',
    'Bobot Kerusakan (%)': b.bobotKerusakan ? `${b.bobotKerusakan}%` : '0%',
    'Keterangan': b.keterangan || '-'
  }));
  const wsBangunan = XLSX.utils.json_to_sheet(bangunanRows.length > 0 ? bangunanRows : [{ 'Info': 'Tidak ada data bangunan' }]);
  XLSX.utils.book_append_sheet(wb, wsBangunan, 'Bangunan');

  // 4. Sheet Ruang
  const ruangRows = (ruang || []).map((r, idx) => ({
    'No': r.no || idx + 1,
    'Jenis Prasarana': r.jenisPrasarana || '-',
    'Nama Bangunan': r.namaBangunan || '-',
    'Nama Ruang': r.namaRuang || '-',
    'Kode Ruang': r.kodeRuang || '-',
    'Lantai': r.lantai || '1',
    'Panjang (m)': r.panjang || '0',
    'Lebar (m)': r.lebar || '0',
    'Luas (m²)': r.luas || '0',
    'Bobot Kerusakan (%)': r.bobotKerusakan ? `${r.bobotKerusakan}%` : '0%',
    'Klasifikasi Kerusakan': r.klasifikasiKerusakan || '-',
    'Kondisi': r.kondisi || 'Baik',
    'Keterangan': r.keterangan || '-'
  }));
  const wsRuang = XLSX.utils.json_to_sheet(ruangRows.length > 0 ? ruangRows : [{ 'Info': 'Tidak ada data ruang' }]);
  XLSX.utils.book_append_sheet(wb, wsRuang, 'Ruang');

  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `Semua_Data_Sarpras_Sekolah_${dateStr}.xlsx`);
}
