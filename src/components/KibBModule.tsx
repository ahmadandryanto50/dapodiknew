import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Download,
  Upload,
  Edit3,
  Trash2,
  Filter,
  CheckCircle,
  CheckCircle2,
  PlusCircle,
  Layers,
  AlertTriangle,
  XSquare,
  X,
  Printer,
  FileSpreadsheet,
  FileText,
  Coins,
  ShieldAlert,
  Info,
  Database,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { KibBItem } from '../types';
import { exportToCSV, exportToExcel, readExcelOrCSVFile, getSavedSyncConfig, loadFromGoogleSheets } from '../services/googleSheetsService';

function parseCSVContent(text: string): Record<string, string>[] {
  const lines: string[] = [];
  let currentLine = '';
  let insideQuote = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuote && nextChar === '"') {
        currentLine += '"';
        i++;
      } else {
        insideQuote = !insideQuote;
      }
    } else if ((char === '\r' || char === '\n') && !insideQuote) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      if (currentLine.trim()) {
        lines.push(currentLine);
      }
      currentLine = '';
    } else {
      currentLine += char;
    }
  }
  if (currentLine.trim()) {
    lines.push(currentLine);
  }

  if (lines.length < 2) return [];

  const parseLine = (line: string): string[] => {
    const values: string[] = [];
    let curVal = '';
    let inQuote = false;

    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      const nc = line[i + 1];
      if (c === '"') {
        if (inQuote && nc === '"') {
          curVal += '"';
          i++;
        } else {
          inQuote = !inQuote;
        }
      } else if (c === ',' || c === ';') {
        if (!inQuote) {
          values.push(curVal.trim());
          curVal = '';
        } else {
          curVal += c;
        }
      } else {
        curVal += c;
      }
    }
    values.push(curVal.trim());
    return values;
  };

  const headers = parseLine(lines[0]).map(h => h.trim().toLowerCase().replace(/^["']|["']$/g, ''));
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    if (values.length === 0 || (values.length === 1 && !values[0])) continue;

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] ? values[idx].replace(/^["']|["']$/g, '').trim() : '';
    });
    rows.push(row);
  }

  return rows;
}

function getCSVValue(row: Record<string, string>, keys: string[]): string {
  const rowKeys = Object.keys(row);
  
  // Phase 1: Search for exact matches (ignoring casing and non-alphanumeric characters)
  for (const key of keys) {
    const target = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    const foundKey = rowKeys.find(rk => {
      const current = rk.toLowerCase().replace(/[^a-z0-9]/g, '');
      return current === target;
    });
    if (foundKey) return row[foundKey];
  }

  // Phase 2: Search for partial matches but avoid false positives like "kodebarang" or "hargabarang" when looking for "barang" or "nama"
  for (const key of keys) {
    const target = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    const foundKey = rowKeys.find(rk => {
      const current = rk.toLowerCase().replace(/[^a-z0-9]/g, '');
      if ((target === 'barang' || target === 'nama') && (current.includes('kode') || current.includes('harga') || current.includes('foto') || current.includes('no') || current.includes('nomor'))) {
        return false;
      }
      return current.includes(target);
    });
    if (foundKey) return row[foundKey];
  }

  return '';
}

function generateShortKibBId(): string {
  return `KIB-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
}

interface KibBModuleProps {
  kibB: KibBItem[];
  onAddKibB: (item: KibBItem) => void;
  onBulkAddKibB?: (items: KibBItem[], replaceAll?: boolean) => void;
  onUpdateKibB: (item: KibBItem) => void;
  onDeleteKibB: (id: string) => void;
  onSync?: () => Promise<void> | void;
  isSyncing?: boolean;
}

export const KibBModule: React.FC<KibBModuleProps> = ({
  kibB,
  onAddKibB,
  onBulkAddKibB,
  onUpdateKibB,
  onDeleteKibB,
  onSync,
  isSyncing = false
}) => {
  const [search, setSearch] = useState('');
  const [filterKondisi, setFilterKondisi] = useState('ALL');
  const [filterAsalUsul, setFilterAsalUsul] = useState('ALL');
  const [filterTahun, setFilterTahun] = useState('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [stagedItems, setStagedItems] = useState<KibBItem[]>([]);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isExecutingImport, setIsExecutingImport] = useState(false);
  const [editingItem, setEditingItem] = useState<KibBItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<KibBItem | null>(null);
  const [isPulling, setIsPulling] = useState(false);
  const [localFeedback, setLocalFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showLocalToast = (type: 'success' | 'error', message: string) => {
    setLocalFeedback({ type, message });
    setTimeout(() => setLocalFeedback(null), 4000);
  };

  const handlePullData = async () => {
    setIsPulling(true);
    try {
      if (onSync) {
        await onSync();
        showLocalToast('success', `Sinkronisasi KIB B berhasil! Seluruh data terbaru telah ditarik.`);
      } else {
        const cfg = getSavedSyncConfig();
        const res = await loadFromGoogleSheets(cfg);
        if (res && res.success) {
          if (res.data && Array.isArray(res.data.kibB)) {
            const cleanItems = res.data.kibB.map((k: any, idx: number) => ({
              id: k.id || `kibb-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
              no: Number(k.no) || (idx + 1),
              namaBarang: String(k.namaBarang || '').trim(),
              kodeBarang: String(k.kodeBarang || '').trim(),
              kondisi: (['Baik', 'Rusak Ringan', 'Rusak Berat'].includes(k.kondisi) ? k.kondisi : 'Baik') as any,
              merkType: String(k.merkType || '').trim(),
              ukuranCc: String(k.ukuranCc || '').trim(),
              bahan: String(k.bahan || '').trim(),
              tahun: String(k.tahun || '').trim(),
              noPabrik: String(k.noPabrik || '').trim(),
              noRangka: String(k.noRangka || '').trim(),
              noMesin: String(k.noMesin || '').trim(),
              noPolisi: String(k.noPolisi || '').trim(),
              noBpkb: String(k.noBpkb || '').trim(),
              asalUsul: String(k.asalUsul || '').trim(),
              harga: String(k.harga || '').trim(),
              keterangan: String(k.keterangan || '').trim()
            }));
            localStorage.setItem('dapodik_kib_b', JSON.stringify(cleanItems));
            window.location.reload();
          }
          showLocalToast('success', `Berhasil menarik data KIB B terbaru dari Google Spreadsheet!`);
        } else {
          showLocalToast('error', res?.message || 'Gagal memuat data dari Spreadsheet.');
        }
      }
    } catch (err: any) {
      showLocalToast('error', err?.message || 'Terjadi kesalahan saat menarik data dari Spreadsheet.');
    } finally {
      setIsPulling(false);
    }
  };

  const initialFormState: Omit<KibBItem, 'id'> = {
    no: kibB.length + 1,
    namaBarang: '',
    kodeBarang: '',
    kondisi: 'Baik',
    merkType: '',
    ukuranCc: '',
    bahan: '',
    tahun: new Date().getFullYear().toString(),
    noPabrik: '',
    noRangka: '',
    noMesin: '',
    noPolisi: '',
    noBpkb: '',
    asalUsul: 'DAK / P2HP',
    harga: '',
    keterangan: ''
  };

  const [formData, setFormData] = useState<Omit<KibBItem, 'id'>>(initialFormState);

  // Filters setup
  const uniqueAsalUsul = Array.from(new Set(kibB.map(i => i.asalUsul).filter(Boolean)));
  const uniqueTahun = Array.from(new Set(kibB.map(i => String(i.tahun || '')).filter(Boolean))).sort().reverse();

  const filteredItems = kibB.filter(item => {
    const q = search.toLowerCase();
    const matchSearch =
      (item.namaBarang || '').toLowerCase().includes(q) ||
      (item.kodeBarang || '').toLowerCase().includes(q) ||
      (item.merkType || '').toLowerCase().includes(q) ||
      (item.noPabrik || '').toLowerCase().includes(q) ||
      (item.noRangka || '').toLowerCase().includes(q) ||
      (item.asalUsul || '').toLowerCase().includes(q) ||
      (item.keterangan || '').toLowerCase().includes(q);

    const matchKondisi = filterKondisi === 'ALL' || item.kondisi === filterKondisi;
    const matchAsal = filterAsalUsul === 'ALL' || item.asalUsul === filterAsalUsul;
    const matchTahun = filterTahun === 'ALL' || String(item.tahun || '') === filterTahun;

    return matchSearch && matchKondisi && matchAsal && matchTahun;
  });

  // Calculate statistics
  const totalBarang = kibB.length;
  const totalBaik = kibB.filter(i => (i.kondisi || '').toLowerCase() === 'baik').length;
  const totalRusak = kibB.filter(i => (i.kondisi || '').toLowerCase().includes('rusak')).length;

  const parseHargaToNumber = (val?: string | number): number => {
    if (!val) return 0;
    const cleanStr = String(val).replace(/[^0-9]/g, '');
    const num = Number(cleanStr);
    return isNaN(num) ? 0 : num;
  };

  const totalNilaiEstimasi = kibB.reduce((acc, curr) => acc + parseHargaToNumber(curr.harga), 0);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      ...initialFormState,
      no: kibB.length + 1,
      kodeBarang: `1.3.2.${Math.floor(10 + Math.random() * 89)}.${Math.floor(10 + Math.random() * 89)}.${Math.floor(100 + Math.random() * 899)}`
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: KibBItem) => {
    setEditingItem(item);
    setFormData({
      no: item.no || 1,
      namaBarang: item.namaBarang || '',
      kodeBarang: item.kodeBarang || '',
      kondisi: item.kondisi || 'Baik',
      merkType: item.merkType || '',
      ukuranCc: item.ukuranCc || '',
      bahan: item.bahan || '',
      tahun: item.tahun || '',
      noPabrik: item.noPabrik || '',
      noRangka: item.noRangka || '',
      noMesin: item.noMesin || '',
      noPolisi: item.noPolisi || '',
      noBpkb: item.noBpkb || '',
      asalUsul: item.asalUsul || 'DAK / P2HP',
      harga: item.harga || '',
      keterangan: item.keterangan || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namaBarang.trim()) {
      alert('Nama / Jenis Barang wajib diisi!');
      return;
    }

    if (editingItem) {
      onUpdateKibB({
        ...editingItem,
        ...formData
      });
    } else {
      const newItem: KibBItem = {
        id: generateShortKibBId(),
        ...formData
      };
      onAddKibB(newItem);
    }
    setIsModalOpen(false);
  };

  const confirmDelete = () => {
    if (!deletingItem) return;
    onDeleteKibB(deletingItem.id);
    setDeletingItem(null);
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Jenis Barang / Nama Barang': 'Laptop Asus Core i5 (Contoh)',
        'Nomor Kode Barang': '1.3.2.04.01.01.001',
        'Kondisi': 'Baik',
        'Merk / Type': 'Asus ExpertBook P14',
        'Ukuran / CC': '14 inch',
        'Bahan': 'Aluminium / Plastik',
        'Tahun Pengadaan': '2024',
        'No. Pabrik': 'ASUS-998231',
        'No. Rangka': '-',
        'No. Mesin': '-',
        'No. Polisi': '-',
        'No. BPKB': '-',
        'Asal Usul': 'BOS Reguler',
        'Harga (ribuan Rp)': '9500000',
        'Keterangan': 'Laboratorium Komputer'
      },
      {
        'Jenis Barang / Nama Barang': 'Proyektor Epson (Contoh)',
        'Nomor Kode Barang': '1.3.2.05.02.01.002',
        'Kondisi': 'Baik',
        'Merk / Type': 'Epson EB-E500',
        'Ukuran / CC': '3300 Lumens',
        'Bahan': 'Plastik ABS',
        'Tahun Pengadaan': '2023',
        'No. Pabrik': 'EPS-77120',
        'No. Rangka': '-',
        'No. Mesin': '-',
        'No. Polisi': '-',
        'No. BPKB': '-',
        'Asal Usul': 'DAK / P2HP',
        'Harga (ribuan Rp)': '6250000',
        'Keterangan': 'Ruang Laboratorium IPA'
      }
    ];

    exportToExcel(templateData, 'Template_Import_KIB_B_Peralatan_dan_Mesin.xlsx', 'KIB B Template');
    showLocalToast('success', 'Template Excel (.xlsx) KIB B berhasil diunduh! Silakan isi data dan unggah kembali.');
  };

  const parseFileItems = async (file: File): Promise<KibBItem[]> => {
    const parsedRows = await readExcelOrCSVFile(file);
    if (parsedRows.length === 0) {
      throw new Error('File kosong atau format Excel / CSV tidak dapat dibaca.');
    }

    const newItemsToImport: KibBItem[] = [];
    parsedRows.forEach((row, idx) => {
      const namaBarang = getCSVValue(row, ['jenisbarangnamabarang', 'namabarang', 'jenisbarang', 'nama', 'barang', 'item']);
      if (!namaBarang || !namaBarang.trim()) return;

      const rawNo = getCSVValue(row, ['no', 'nomor', 'no.']);
      const parsedNo = rawNo ? (parseInt(rawNo, 10) || (idx + 1)) : (idx + 1);

      const newItem: KibBItem = {
        id: generateShortKibBId(),
        no: parsedNo,
        namaBarang: namaBarang.trim(),
        kodeBarang: getCSVValue(row, ['nomorkodebarang', 'kodebarang', 'kode', 'nomorkode']) || `1.3.2.${Math.floor(10 + Math.random() * 89)}.${Math.floor(10 + Math.random() * 89)}.${Math.floor(100 + Math.random() * 899)}`,
        kondisi: (['Baik', 'Rusak Ringan', 'Rusak Berat'].includes(getCSVValue(row, ['kondisi'])) ? getCSVValue(row, ['kondisi']) : 'Baik') as any,
        merkType: getCSVValue(row, ['merktype', 'merk', 'tipe', 'type']) || '',
        ukuranCc: getCSVValue(row, ['ukurancc', 'ukuran', 'cc']) || '',
        bahan: getCSVValue(row, ['bahan']) || '',
        tahun: getCSVValue(row, ['tahunpengadaan', 'tahun']) || String(new Date().getFullYear()),
        noPabrik: getCSVValue(row, ['nopabrik', 'pabrik']) || '',
        noRangka: getCSVValue(row, ['norangka', 'rangka']) || '',
        noMesin: getCSVValue(row, ['nomesin', 'mesin']) || '',
        noPolisi: getCSVValue(row, ['nopolisi', 'polisi', 'plat']) || '',
        noBpkb: getCSVValue(row, ['nobpkb', 'bpkb']) || '',
        asalUsul: getCSVValue(row, ['asalusul', 'asal', 'sumber']) || 'DAK / P2HP',
        harga: getCSVValue(row, ['harga', 'nilaiharga', 'biaya']) || '',
        keterangan: getCSVValue(row, ['keterangan', 'ket', 'lokasi', 'ruang']) || ''
      };

      newItemsToImport.push(newItem);
    });

    return newItemsToImport;
  };

  const handleFileSelect = async (file: File) => {
    setIsParsingFile(true);
    try {
      const items = await parseFileItems(file);
      if (items.length === 0) {
        showLocalToast('error', 'Tidak ditemukan baris barang valid dengan kolom nama barang pada berkas ini.');
        setStagedFile(null);
        setStagedItems([]);
        return;
      }
      setStagedFile(file);
      setStagedItems(items);
      showLocalToast('success', `Berkas valid: ${items.length} baris barang KIB B siap diproses.`);
    } catch (err: any) {
      showLocalToast('error', err?.message || 'Gagal membaca isi berkas.');
      setStagedFile(null);
      setStagedItems([]);
    } finally {
      setIsParsingFile(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    e.target.value = '';
  };

  const handleDropFile = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleConfirmImport = () => {
    if (!stagedItems || stagedItems.length === 0) {
      showLocalToast('error', 'Silakan pilih atau unggah berkas Excel / CSV terlebih dahulu.');
      return;
    }

    setIsExecutingImport(true);
    try {
      const isReplace = importMode === 'replace';
      if (onBulkAddKibB) {
        onBulkAddKibB(stagedItems, isReplace);
      } else {
        if (isReplace) {
          kibB.forEach(item => onDeleteKibB(item.id));
        }
        stagedItems.forEach(item => onAddKibB(item));
      }

      showLocalToast('success', isReplace
        ? `Berhasil! Seluruh data lama KIB B diganti dengan ${stagedItems.length} barang baru.`
        : `Berhasil! ${stagedItems.length} barang baru berhasil ditambahkan ke KIB B.`
      );

      handleCloseImportModal();
    } catch (err: any) {
      showLocalToast('error', `Gagal mengimpor data: ${err?.message || 'Terjadi kesalahan'}`);
    } finally {
      setIsExecutingImport(false);
    }
  };

  const handleCloseImportModal = () => {
    setIsImportModalOpen(false);
    setStagedFile(null);
    setStagedItems([]);
    setImportMode('append');
    setIsDragOver(false);
  };

  const handleExportExcel = () => {
    const dataForExport = filteredItems.map((item) => ({
      'Jenis Barang / Nama Barang': item.namaBarang,
      'Nomor Kode Barang': item.kodeBarang,
      'Kondisi': item.kondisi,
      'Merk / Type': item.merkType || '-',
      'Ukuran / CC': item.ukuranCc || '-',
      'Bahan': item.bahan || '-',
      'Tahun Pengadaan': item.tahun || '-',
      'No. Pabrik': item.noPabrik || '-',
      'No. Rangka': item.noRangka || '-',
      'No. Mesin': item.noMesin || '-',
      'No. Polisi': item.noPolisi || '-',
      'No. BPKB': item.noBpkb || '-',
      'Asal Usul': item.asalUsul || '-',
      'Harga (ribuan Rp)': item.harga || '-',
      'Keterangan': item.keterangan || '-'
    }));

    exportToExcel(dataForExport, 'KIB_B_Peralatan_dan_Mesin.xlsx', 'KIB B Data');
    showLocalToast('success', 'Data KIB B berhasil diekspor ke file Excel (.xlsx)!');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Info & Action Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Inventaris Barang Milik Sekolah
            </span>
            <span className="text-xs text-slate-500">Formulir KIB B (Peralatan dan Mesin)</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Sinkron 2-Arah (Google Sheets)
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">Kartu Inventaris Barang (KIB) B</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Pencatatan aset peralatan, mesin, perangkat kantor, proyektor, dan kendaraan. Terhubung dua arah dengan Google Spreadsheet (Sheet: KIB B).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handlePullData}
            disabled={isPulling || isSyncing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 transition-all shadow-2xs cursor-pointer disabled:opacity-60"
            title="Tarik & perbarui data barang KIB B langsung dari Google Spreadsheet"
          >
            <RefreshCw className={`w-4 h-4 text-emerald-700 ${isPulling || isSyncing ? 'animate-spin' : ''}`} />
            <span>{isPulling || isSyncing ? 'Menarik Data...' : 'Tarik Data dari Spreadsheet'}</span>
          </button>

          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors shadow-2xs cursor-pointer"
            title="Unduh file template Excel (.xlsx) format KIB B"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Unduh Template Excel</span>
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors shadow-2xs cursor-pointer"
            title="Upload file Excel (.xlsx / .xls) atau CSV data KIB B"
          >
            <Upload className="w-4 h-4 text-blue-600" />
            <span className="hidden sm:inline">Upload / Impor Excel</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors shadow-2xs cursor-pointer"
            title="Ekspor ke format file Excel (.xlsx)"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Ekspor Excel</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors shadow-2xs cursor-pointer"
            title="Cetak KIB B"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">Cetak</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm cursor-pointer ml-auto sm:ml-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Barang KIB B</span>
          </button>
        </div>
      </div>

      {localFeedback && (
        <div
          className={`px-4 py-3 rounded-xl text-xs flex items-center justify-between shadow-xs transition-all ${
            localFeedback.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {localFeedback.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{localFeedback.message}</span>
          </div>
          <button
            onClick={() => setLocalFeedback(null)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Barang KIB B</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{totalBarang}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Item tercatat</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Nilai / Estimasi</p>
            <p className="text-xl font-bold text-emerald-700 mt-1">
              Rp {totalNilaiEstimasi.toLocaleString('id-ID')}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Akumulasi perolehan</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
            <Coins className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Kondisi Baik</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{totalBaik}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Siap operasional</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Kondisi Rusak</p>
            <p className="text-2xl font-bold text-rose-600 mt-1">{totalRusak}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Ringan / Berat</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama barang, kode barang, no. rangka, asal usul, keterangan..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-2">
            <select
              value={filterKondisi}
              onChange={(e) => setFilterKondisi(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="ALL">Semua Kondisi</option>
              <option value="Baik">Kondisi Baik</option>
              <option value="Rusak Ringan">Rusak Ringan</option>
              <option value="Rusak Berat">Rusak Berat</option>
            </select>

            {uniqueAsalUsul.length > 0 && (
              <select
                value={filterAsalUsul}
                onChange={(e) => setFilterAsalUsul(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="ALL">Semua Asal Usul</option>
                {uniqueAsalUsul.map((asal) => (
                  <option key={asal} value={asal}>
                    {asal}
                  </option>
                ))}
              </select>
            )}

            {uniqueTahun.length > 0 && (
              <select
                value={filterTahun}
                onChange={(e) => setFilterTahun(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="ALL">Semua Tahun</option>
                {uniqueTahun.map((th) => (
                  <option key={th} value={th}>
                    Tahun {th}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Status count indicator */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <span>Menampilkan <strong>{filteredItems.length}</strong> dari <strong>{kibB.length}</strong> data barang KIB B</span>
          {(search || filterKondisi !== 'ALL' || filterAsalUsul !== 'ALL' || filterTahun !== 'ALL') && (
            <button
              onClick={() => {
                setSearch('');
                setFilterKondisi('ALL');
                setFilterAsalUsul('ALL');
                setFilterTahun('ALL');
              }}
              className="text-emerald-700 hover:text-emerald-800 font-medium underline cursor-pointer"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Main Table KIB B */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 text-slate-700 border-b border-slate-200 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3 w-12 text-center">No.</th>
                <th className="py-3 px-3 min-w-[220px]">Jenis Barang / Nama Barang</th>
                <th className="py-3 px-3 min-w-[140px]">Kode Barang / No Register</th>
                <th className="py-3 px-3 min-w-[100px] text-center">Kondisi</th>
                <th className="py-3 px-3 min-w-[130px]">Merk / Type</th>
                <th className="py-3 px-3 min-w-[90px]">Ukuran / CC</th>
                <th className="py-3 px-3 min-w-[90px]">Bahan</th>
                <th className="py-3 px-3 min-w-[70px] text-center">Tahun</th>
                <th className="py-3 px-3 min-w-[140px]">No. Pabrik</th>
                <th className="py-3 px-3 min-w-[160px]">No. Rangka</th>
                <th className="py-3 px-3 min-w-[100px]">No. Mesin / Polisi</th>
                <th className="py-3 px-3 min-w-[110px]">Asal Usul</th>
                <th className="py-3 px-3 min-w-[120px] text-right">Harga (Rp)</th>
                <th className="py-3 px-3 min-w-[150px]">Keterangan</th>
                <th className="py-3 px-3 w-20 text-center sticky right-0 bg-slate-50 border-l border-slate-200">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={15} className="py-12 text-center text-slate-400">
                    <Package className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                    <p className="font-semibold text-slate-600">Belum ada data barang KIB B</p>
                    <p className="text-xs text-slate-400 mt-1">Tarik data dari Google Spreadsheet atau klik tombol "Tambah Barang KIB B" di atas.</p>
                    <button
                      onClick={handlePullData}
                      disabled={isPulling || isSyncing}
                      className="inline-flex items-center gap-2 px-4 py-2 mt-3.5 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 transition-colors shadow-2xs cursor-pointer disabled:opacity-60"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-emerald-700 ${isPulling || isSyncing ? 'animate-spin' : ''}`} />
                      <span>{isPulling || isSyncing ? 'Menarik Data...' : 'Tarik Data dari Spreadsheet'}</span>
                    </button>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, index) => {
                  const isBaik = (item.kondisi || '').toLowerCase() === 'baik';
                  const isRusakBerat = (item.kondisi || '').toLowerCase().includes('berat');

                  return (
                    <tr key={item.id || index} className="hover:bg-slate-50/75 transition-colors">
                      <td className="py-2.5 px-3 text-center text-slate-500 font-mono">
                        {item.no !== undefined && item.no !== '' ? item.no : index + 1}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-slate-900 block">{item.namaBarang}</span>
                        {item.keterangan && (
                          <span className="text-[11px] text-slate-500 block truncate max-w-[200px]">
                            {item.keterangan}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700">
                        {item.kodeBarang || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            isBaik
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : isRusakBerat
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {item.kondisi || 'Baik'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        {item.merkType || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {item.ukuranCc || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {item.bahan || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-600 font-mono">
                        {item.tahun || '-'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 truncate max-w-[140px]" title={item.noPabrik}>
                        {item.noPabrik || '-'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 truncate max-w-[160px]" title={item.noRangka}>
                        {item.noRangka || '-'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                        {item.noMesin || item.noPolisi ? `${item.noMesin || ''} ${item.noPolisi || ''}`.trim() : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 text-[11px]">
                          {item.asalUsul || '-'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-900">
                        {item.harga ? item.harga : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 truncate max-w-[150px]" title={item.keterangan}>
                        {item.keterangan || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-center sticky right-0 bg-white group-hover:bg-slate-50 border-l border-slate-200">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                            title="Edit Barang"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingItem(item)}
                            className="p-1 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Hapus Barang"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah / Edit KIB B */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl my-auto max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingItem ? 'Edit Data Barang KIB B' : 'Tambah Barang KIB B Baru'}
                </h3>
                <p className="text-xs text-slate-500">
                  Peralatan dan Mesin (Kartu Inventaris Barang Form B)
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Seksi 1: Identitas Pokok Barang */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg mb-3 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-emerald-600" />
                  1. Identitas & Kondisi Barang
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-slate-700 font-semibold mb-1">
                      Jenis Barang / Nama Barang <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.namaBarang}
                      onChange={(e) => setFormData({ ...formData, namaBarang: e.target.value })}
                      placeholder="Contoh: LCD Projector, Lemari Besi, Timbangan Meja..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      No. Urut / Register
                    </label>
                    <input
                      type="number"
                      value={formData.no !== undefined ? formData.no : ''}
                      onChange={(e) => setFormData({ ...formData, no: e.target.value ? Number(e.target.value) : '' })}
                      placeholder="1"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Nomor Kode Barang
                    </label>
                    <input
                      type="text"
                      value={formData.kodeBarang}
                      onChange={(e) => setFormData({ ...formData, kodeBarang: e.target.value })}
                      placeholder="1.3.2.05.01.05.0043"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Kondisi Barang
                    </label>
                    <select
                      value={formData.kondisi}
                      onChange={(e) => setFormData({ ...formData, kondisi: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none cursor-pointer"
                    >
                      <option value="Baik">Baik (Bisa Digunakan)</option>
                      <option value="Rusak Ringan">Rusak Ringan</option>
                      <option value="Rusak Berat">Rusak Berat</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Tahun Pengadaan / Pembuatan
                    </label>
                    <input
                      type="text"
                      value={formData.tahun}
                      onChange={(e) => setFormData({ ...formData, tahun: e.target.value })}
                      placeholder="2017"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Merk / Type
                    </label>
                    <input
                      type="text"
                      value={formData.merkType}
                      onChange={(e) => setFormData({ ...formData, merkType: e.target.value })}
                      placeholder="Contoh: Optoma, Epson, Lion..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Ukuran / CC
                    </label>
                    <input
                      type="text"
                      value={formData.ukuranCc}
                      onChange={(e) => setFormData({ ...formData, ukuranCc: e.target.value })}
                      placeholder="Contoh: 5 kg, 125 cc, 42 inch..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Bahan
                    </label>
                    <input
                      type="text"
                      value={formData.bahan}
                      onChange={(e) => setFormData({ ...formData, bahan: e.target.value })}
                      placeholder="Contoh: Besi, Campuran, Kayu, Plastik..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Seksi 2: Nomor Seri, Pabrik, Rangka, & Kendaraan */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 bg-slate-100 px-3 py-1.5 rounded-lg mb-3 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600" />
                  2. Nomor Pabrik, Rangka & Dokumen Mesin / Kendaraan
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">No. Pabrik</label>
                    <input
                      type="text"
                      value={formData.noPabrik}
                      onChange={(e) => setFormData({ ...formData, noPabrik: e.target.value })}
                      placeholder="Q737727AAAAACO453"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">No. Rangka</label>
                    <input
                      type="text"
                      value={formData.noRangka}
                      onChange={(e) => setFormData({ ...formData, noRangka: e.target.value })}
                      placeholder="MRJSA1100K038002578400"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">No. Mesin</label>
                    <input
                      type="text"
                      value={formData.noMesin}
                      onChange={(e) => setFormData({ ...formData, noMesin: e.target.value })}
                      placeholder="Jika ada"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">No. Polisi</label>
                    <input
                      type="text"
                      value={formData.noPolisi}
                      onChange={(e) => setFormData({ ...formData, noPolisi: e.target.value })}
                      placeholder="Contoh: DN 1234 XY"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none uppercase font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">No. BPKB</label>
                    <input
                      type="text"
                      value={formData.noBpkb}
                      onChange={(e) => setFormData({ ...formData, noBpkb: e.target.value })}
                      placeholder="Jika ada"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Seksi 3: Perolehan, Nilai & Lokasi */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg mb-3 flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-emerald-600" />
                  3. Asal Usul, Nilai Perolehan & Lokasi
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Asal Usul Perolehan</label>
                    <input
                      type="text"
                      value={formData.asalUsul}
                      onChange={(e) => setFormData({ ...formData, asalUsul: e.target.value })}
                      placeholder="DAK / P2HP, BOS, Hibah, APBD..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Harga (ribuan Rp)</label>
                    <input
                      type="text"
                      value={formData.harga}
                      onChange={(e) => setFormData({ ...formData, harga: e.target.value })}
                      placeholder="Contoh: 1.467.800"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Keterangan / Lokasi Ruang</label>
                    <input
                      type="text"
                      value={formData.keterangan}
                      onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                      placeholder="Contoh: Ruang Wakasek, Lab Komputer..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm transition-colors cursor-pointer"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Tambah ke KIB B'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus */}
      {deletingItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 text-center space-y-4 my-auto">
            <div className="w-14 h-14 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Hapus Barang KIB B?</h3>
              <p className="text-sm text-slate-700 mt-2 leading-relaxed">
                Apakah Anda yakin ingin menghapus <strong className="text-rose-700">"{deletingItem.namaBarang}"</strong> (Kode: {deletingItem.kodeBarang || '-'}) dari KIB B?
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Data akan otomatis disinkronkan dan dihapus dari sheet Google Spreadsheet.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Ya, Hapus Barang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Upload / Impor Data KIB B */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl p-5 sm:p-6 space-y-5 my-auto max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Upload & Impor Data KIB B</h3>
                  <p className="text-xs text-slate-500">Pilih model impor dan unggah berkas Excel (.xlsx / .xls) atau CSV</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseImportModal}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                title="Tutup Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="space-y-4 overflow-y-auto pr-1 text-xs text-slate-600 flex-1">
              {/* Langkah 1: Pilihan Model Impor */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[11px] font-bold">1</span>
                    Pilih Model Impor Data
                  </label>
                  <span className="text-[11px] text-slate-400">Pilih salah satu metode</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Model 1: Tambahkan (Append) */}
                  <div
                    onClick={() => setImportMode('append')}
                    className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      importMode === 'append'
                        ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                        : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                            importMode === 'append' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                          }`}>
                            <Layers className="w-4 h-4" />
                          </div>
                          <span className="font-bold text-slate-900 text-xs">Tambahkan Data</span>
                        </div>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          importMode === 'append' ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'
                        }`}>
                          {importMode === 'append' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 mb-1.5 border border-emerald-200">
                        Aman • Data Lama Tetap Ada
                      </span>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Menambahkan data baru dari file tanpa menghapus data lama. Sebanyak <strong>{kibB.length} barang</strong> lama Anda tetap utuh.
                      </p>
                    </div>
                  </div>

                  {/* Model 2: Hapus Semua & Timpa (Replace All) */}
                  <div
                    onClick={() => setImportMode('replace')}
                    className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      importMode === 'replace'
                        ? 'border-rose-600 bg-rose-50/60 shadow-xs'
                        : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                            importMode === 'replace' ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-600'
                          }`}>
                            <Trash2 className="w-4 h-4" />
                          </div>
                          <span className="font-bold text-slate-900 text-xs">Hapus Semua & Timpa</span>
                        </div>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          importMode === 'replace' ? 'border-rose-600 bg-rose-600' : 'border-slate-300'
                        }`}>
                          {importMode === 'replace' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 mb-1.5 border border-rose-200">
                        Timpa Total • Data Lama Terhapus
                      </span>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Menghapus seluruh <strong>{kibB.length} data lama</strong> di KIB B secara permanen, dan hanya menyimpan data baru dari file ini.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Unduh Template Banner */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="font-semibold text-slate-800 text-[11px]">Format Kolom Sesuai Database</p>
                  <p className="text-[10px] text-slate-500">Unduh template Excel KIB B jika Anda belum menyiapkan berkas.</p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors shrink-0 flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Download Template</span>
                </button>
              </div>

              {/* Langkah 2: Upload File Area */}
              <div className="space-y-2">
                <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[11px] font-bold">2</span>
                  Pilih Berkas Excel / CSV KIB B
                </label>

                {!stagedFile ? (
                  <label
                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDropFile}
                    className={`border-2 border-dashed transition-all rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer group ${
                      isDragOver
                        ? 'border-emerald-500 bg-emerald-50/70 scale-[0.99]'
                        : 'border-slate-300 hover:border-emerald-500 bg-slate-50/70 hover:bg-emerald-50/30'
                    }`}
                  >
                    {isParsingFile ? (
                      <div className="flex flex-col items-center py-2">
                        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mb-2" />
                        <span className="font-bold text-slate-800 text-xs">Membaca isi berkas...</span>
                        <span className="text-[11px] text-slate-500 mt-0.5">Memvalidasi baris data KIB B</span>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                          <Upload className="w-6 h-6" />
                        </div>
                        <span className="font-bold text-slate-800 group-hover:text-emerald-800 text-xs">
                          Klik untuk memilih berkas atau tarik (drag & drop) ke sini
                        </span>
                        <span className="text-[11px] text-slate-400 mt-1">
                          Mendukung format .xlsx, .xls, .csv, dan .txt
                        </span>
                        <input
                          type="file"
                          accept=".xlsx,.xls,.csv,.txt"
                          className="hidden"
                          onChange={handleFileInputChange}
                        />
                      </>
                    )}
                  </label>
                ) : (
                  <div className="space-y-3">
                    {/* File Info Bar */}
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200">
                          <FileSpreadsheet className="w-5 h-5" />
                        </div>
                        <div className="truncate">
                          <p className="font-bold text-slate-900 text-xs truncate">{stagedFile.name}</p>
                          <p className="text-[10px] text-slate-500">
                            {(stagedFile.size / 1024).toFixed(1)} KB • <span className="text-emerald-700 font-semibold">{stagedItems.length} baris barang valid</span>
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setStagedFile(null); setStagedItems([]); }}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 transition-colors shrink-0 cursor-pointer"
                      >
                        Ganti File
                      </button>
                    </div>

                    {/* Impact Simulation Alert */}
                    {importMode === 'append' ? (
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div className="space-y-0.5 text-[11px]">
                          <p className="font-bold text-emerald-950">Model Tambahkan Data (Append) Aktif</p>
                          <p className="text-emerald-800 leading-relaxed">
                            Sebanyak <strong>{stagedItems.length} barang baru</strong> akan ditambahkan ke <strong>{kibB.length} data lama</strong> yang sudah ada. Total barang setelah proses ini adalah <strong>{kibB.length + stagedItems.length} barang</strong>. Data lama tetap aman.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div className="space-y-0.5 text-[11px]">
                          <p className="font-bold text-rose-950">Perhatian: Model Hapus Semua Data Lama Aktif</p>
                          <p className="text-rose-800 leading-relaxed">
                            Sebanyak <strong>{kibB.length} data lama</strong> di KIB B akan <strong>DIHAPUS KESELURUHAN</strong> dan digantikan secara utuh oleh <strong>{stagedItems.length} data baru</strong> dari berkas ini. Perubahan akan disinkronkan ke Google Spreadsheet.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Preview Table */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-slate-700 text-[11px]">Pratinjau Data yang Akan Diimpor:</span>
                        <span className="text-[10px] text-slate-400">Menampilkan {Math.min(3, stagedItems.length)} dari {stagedItems.length} data</span>
                      </div>
                      <div className="border border-slate-200 rounded-xl overflow-x-auto bg-white shadow-2xs">
                        <table className="w-full text-[10px] text-left">
                          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                            <tr>
                              <th className="px-2.5 py-1.5">No</th>
                              <th className="px-2.5 py-1.5">Nama Barang</th>
                              <th className="px-2.5 py-1.5">Kode Barang</th>
                              <th className="px-2.5 py-1.5">Kondisi</th>
                              <th className="px-2.5 py-1.5">Merk / Type</th>
                              <th className="px-2.5 py-1.5">Harga</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {stagedItems.slice(0, 3).map((item, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/60">
                                <td className="px-2.5 py-1.5 font-medium text-slate-500">{importMode === 'append' ? (kibB.length + idx + 1) : (idx + 1)}</td>
                                <td className="px-2.5 py-1.5 font-semibold text-slate-900">{item.namaBarang}</td>
                                <td className="px-2.5 py-1.5 text-slate-600 font-mono">{item.kodeBarang}</td>
                                <td className="px-2.5 py-1.5">
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                                    item.kondisi === 'Baik' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    {item.kondisi}
                                  </span>
                                </td>
                                <td className="px-2.5 py-1.5 text-slate-600">{item.merkType || '-'}</td>
                                <td className="px-2.5 py-1.5 text-slate-600">{item.harga ? `Rp ${item.harga}` : '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {stagedItems.length > 3 && (
                        <p className="text-[10px] text-slate-400 mt-1 italic text-right">
                          ...dan {stagedItems.length - 3} barang lainnya siap diproses.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={handleCloseImportModal}
                disabled={isExecutingImport}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={!stagedFile || stagedItems.length === 0 || isExecutingImport}
                className={`px-5 py-2 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                  importMode === 'replace'
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {isExecutingImport ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan ke Database...</span>
                  </>
                ) : importMode === 'replace' ? (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Semua & Impor {stagedItems.length > 0 ? `(${stagedItems.length})` : ''}</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Tambahkan Data {stagedItems.length > 0 ? `(${stagedItems.length})` : ''}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
