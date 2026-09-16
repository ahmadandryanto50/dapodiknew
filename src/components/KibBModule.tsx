import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Download,
  Edit3,
  Trash2,
  Filter,
  CheckCircle,
  AlertTriangle,
  XSquare,
  X,
  Printer,
  FileSpreadsheet,
  Coins,
  ShieldAlert,
  Info,
  Database
} from 'lucide-react';
import { KibBItem } from '../types';
import { exportToCSV } from '../services/googleSheetsService';

interface KibBModuleProps {
  kibB: KibBItem[];
  onAddKibB: (item: KibBItem) => void;
  onUpdateKibB: (item: KibBItem) => void;
  onDeleteKibB: (id: string) => void;
}

export const KibBModule: React.FC<KibBModuleProps> = ({
  kibB,
  onAddKibB,
  onUpdateKibB,
  onDeleteKibB
}) => {
  const [search, setSearch] = useState('');
  const [filterKondisi, setFilterKondisi] = useState('ALL');
  const [filterAsalUsul, setFilterAsalUsul] = useState('ALL');
  const [filterTahun, setFilterTahun] = useState('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KibBItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<KibBItem | null>(null);

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
        id: `kib-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
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

  const handleExportCSV = () => {
    const dataForExport = filteredItems.map((item, idx) => ({
      'No.': item.no || idx + 1,
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

    exportToCSV(dataForExport, 'KIB_B_Peralatan_dan_Mesin');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Info & Action Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Inventaris Barang Milik Sekolah
            </span>
            <span className="text-xs text-slate-500">Formulir KIB B (Peralatan dan Mesin)</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">Kartu Inventaris Barang (KIB) B</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Pencatatan aset peralatan, mesin, perangkat kantor, proyektor, dan kendaraan tersinkronisasi otomatis ke Google Spreadsheet.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors shadow-2xs cursor-pointer"
            title="Ekspor ke format Excel / CSV"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">Ekspor CSV</span>
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
                    <p className="text-xs text-slate-400 mt-1">Klik tombol "Tambah Barang KIB B" di atas untuk menambahkan data baru.</p>
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
    </div>
  );
};
