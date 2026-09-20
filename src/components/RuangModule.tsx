import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  DoorOpen, 
  Plus, 
  Search, 
  Download, 
  Edit3, 
  Trash2, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  XSquare, 
  X, 
  Layers, 
  Ruler,
  Building2,
  CloudUpload,
  RefreshCw
} from 'lucide-react';
import { RuangItem } from '../types';
import { exportToExcel } from '../services/googleSheetsService';

interface RuangModuleProps {
  ruang: RuangItem[];
  onAddRuang: (item: RuangItem) => void;
  onUpdateRuang: (item: RuangItem) => void;
  onDeleteRuang: (id: string) => void;
  onSync?: () => Promise<void> | void;
  isSyncing?: boolean;
}

export const RuangModule: React.FC<RuangModuleProps> = ({
  ruang,
  onAddRuang,
  onUpdateRuang,
  onDeleteRuang,
  onSync,
  isSyncing = false
}) => {
  const [search, setSearch] = useState('');
  const [filterJenis, setFilterJenis] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RuangItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<RuangItem | null>(null);

  const [formData, setFormData] = useState<Omit<RuangItem, 'id'>>({
    no: 1,
    jenisPrasarana: 'Ruang Teori/Kelas',
    namaBangunan: 'Gedung A',
    namaRuang: '',
    kodeRuang: '',
    lantai: '1',
    panjang: '4.0',
    lebar: '8.0',
    luas: '32.0',
    bobotKerusakan: '0.0',
    klasifikasiKerusakan: 'Tidak Ada',
    kondisi: 'Baik',
    keterangan: ''
  });

  const uniqueJenis = Array.from(new Set(ruang.map(r => r.jenisPrasarana).filter(Boolean)));
  const defaultJenis = ['Bilik Perempuan', 'Bilik Laki-laki', 'Ruang Teori/Kelas', 'Ruang Guru', 'Ruang Kepala Sekolah', 'Laboratorium IPA', 'Perpustakaan', 'Toilet/WC'];
  const allJenisList = Array.from(new Set([...defaultJenis, ...uniqueJenis]));

  const filteredRuang = ruang.filter(item => {
    const matchSearch = (item.namaRuang || '').toLowerCase().includes(search.toLowerCase()) ||
                        (item.jenisPrasarana || '').toLowerCase().includes(search.toLowerCase()) ||
                        (item.namaBangunan || '').toLowerCase().includes(search.toLowerCase()) ||
                        (item.kodeRuang || '').toLowerCase().includes(search.toLowerCase()) ||
                        (item.keterangan || '').toLowerCase().includes(search.toLowerCase());
    const matchJenis = filterJenis === 'ALL' || item.jenisPrasarana === filterJenis;
    return matchSearch && matchJenis;
  });

  const totalLuasRuang = ruang.reduce((acc, curr) => {
    const val = parseFloat(String(curr.luas || '0').replace(',', '.'));
    return acc + (isNaN(val) ? 0 : val);
  }, 0);

  const totalBaik = ruang.filter(r => !r.kondisi || r.kondisi.toLowerCase().includes('baik') || r.kondisi.toLowerCase().includes('tidak ada')).length;

  const handleDimensionChange = (pVal: string, lVal: string) => {
    const p = parseFloat(pVal.replace(',', '.'));
    const l = parseFloat(lVal.replace(',', '.'));
    let calculatedLuas = formData.luas;
    if (!isNaN(p) && !isNaN(l) && p > 0 && l > 0) {
      calculatedLuas = (p * l).toFixed(1);
    }
    setFormData({
      ...formData,
      panjang: pVal,
      lebar: lVal,
      luas: calculatedLuas
    });
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      no: ruang.length + 1,
      jenisPrasarana: 'Bilik Perempuan',
      namaBangunan: 'Gedung A',
      namaRuang: '',
      kodeRuang: 'RNG-' + Math.floor(100 + Math.random() * 900),
      lantai: '1',
      panjang: '4.0',
      lebar: '8.0',
      luas: '32.0',
      bobotKerusakan: '0.0',
      klasifikasiKerusakan: 'Tidak Ada',
      kondisi: 'Baik',
      keterangan: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: RuangItem) => {
    setEditingItem(item);
    setFormData({
      no: item.no || 1,
      jenisPrasarana: item.jenisPrasarana || 'Ruang Teori/Kelas',
      namaBangunan: item.namaBangunan || 'Gedung A',
      namaRuang: item.namaRuang || '',
      kodeRuang: item.kodeRuang || '',
      lantai: item.lantai ? String(item.lantai) : '1',
      panjang: item.panjang ? String(item.panjang) : '4.0',
      lebar: item.lebar ? String(item.lebar) : '8.0',
      luas: item.luas ? String(item.luas) : '32.0',
      bobotKerusakan: item.bobotKerusakan ? String(item.bobotKerusakan) : '0.0',
      klasifikasiKerusakan: item.klasifikasiKerusakan || 'Tidak Ada',
      kondisi: item.kondisi || 'Baik',
      keterangan: item.keterangan || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namaRuang || !formData.jenisPrasarana) {
      alert('Nama Ruang dan Jenis Prasarana wajib diisi');
      return;
    }

    if (editingItem) {
      onUpdateRuang({
        ...formData,
        id: editingItem.id
      });
    } else {
      onAddRuang({
        ...formData,
        id: `rng-${Date.now().toString().slice(-6)}`
      });
    }
    setIsModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (deletingItem) {
      onDeleteRuang(deletingItem.id);
      setDeletingItem(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Cards Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Total Ruangan</p>
            <p className="text-xl font-bold text-slate-900">{ruang.length} <span className="text-xs font-normal text-slate-500">Ruang</span></p>
          </div>
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <DoorOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Total Luas Ruang</p>
            <p className="text-xl font-bold text-slate-900">{totalLuasRuang.toFixed(1)} <span className="text-xs font-normal text-slate-500">m²</span></p>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <Ruler className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Jenis Prasarana</p>
            <p className="text-xl font-bold text-slate-900">{uniqueJenis.length || allJenisList.length} <span className="text-xs font-normal text-slate-500">Kategori</span></p>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Kondisi Baik</p>
            <p className="text-xl font-bold text-emerald-700">{totalBaik} <span className="text-xs font-normal text-slate-500">/ {ruang.length}</span></p>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Control Bar: Search, Filter, Export & Add */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex-1 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari ruang, jenis prasarana, bangunan..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-white text-slate-900 font-medium border border-slate-300 rounded-xl placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="w-full sm:w-56">
            <select
              value={filterJenis}
              onChange={(e) => setFilterJenis(e.target.value)}
              className="w-full text-xs py-2 px-3 bg-white text-slate-900 font-medium border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="ALL" className="bg-white text-slate-900">Semua Jenis Prasarana</option>
              {allJenisList.map(j => (
                <option key={j} value={j} className="bg-white text-slate-900">{j}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onSync && (
            <button
              onClick={() => onSync()}
              disabled={isSyncing}
              className="px-3 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-semibold border border-teal-200 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Simpan & Sync seluruh data Ruang ke Google Spreadsheet"
            >
              <CloudUpload className={`w-3.5 h-3.5 text-teal-600 ${isSyncing ? 'animate-bounce' : ''}`} />
              <span>{isSyncing ? 'Menyimpan...' : 'Simpan ke Spreadsheet'}</span>
            </button>
          )}

          <button
            onClick={() => exportToExcel(ruang, 'Data_Ruang_Sekolah')}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200/80 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Ekspor Excel</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Ruang</span>
          </button>
        </div>
      </div>

      {/* Ruang Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4">Jenis Prasarana</th>
                <th className="py-3.5 px-4">Nama Bangunan</th>
                <th className="py-3.5 px-4">Nama Ruang</th>
                <th className="py-3.5 px-4 text-center">Kode Ruang</th>
                <th className="py-3.5 px-4 text-center">Lantai</th>
                <th className="py-3.5 px-4 text-center">Dimensi (P x L)</th>
                <th className="py-3.5 px-4 text-right">Luas (m²)</th>
                <th className="py-3.5 px-4">Kondisi</th>
                <th className="py-3.5 px-4">Keterangan</th>
                <th className="py-3.5 px-4 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRuang.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <DoorOpen className="w-10 h-10 mx-auto mb-2 opacity-30 text-slate-500" />
                    <p className="font-semibold text-slate-600">Belum ada data ruang</p>
                    <p className="text-xs text-slate-400">Klik "Tambah Ruang" untuk memasukkan data baru.</p>
                  </td>
                </tr>
              ) : (
                filteredRuang.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-center font-mono text-slate-500">{idx + 1}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{item.jenisPrasarana}</td>
                    <td className="py-3 px-4 text-slate-700">{item.namaBangunan}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{item.namaRuang}</td>
                    <td className="py-3 px-4 text-center font-mono text-slate-600">{item.kodeRuang || '-'}</td>
                    <td className="py-3 px-4 text-center text-slate-700">{item.lantai || '1'}</td>
                    <td className="py-3 px-4 text-center font-mono text-slate-700">
                      {item.panjang || '0'}m × {item.lebar || '0'}m
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-800">{item.luas || '0.0'}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                        !item.kondisi || item.kondisi.toLowerCase().includes('baik') || item.kondisi.toLowerCase().includes('tidak ada')
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {item.kondisi || 'Baik'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{item.keterangan || '-'}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 transition-colors cursor-pointer"
                          title="Edit Ruang"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingItem(item)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 transition-colors cursor-pointer"
                          title="Hapus Ruang"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <DoorOpen className="w-5 h-5 text-emerald-600" />
                <h2 className="font-bold text-slate-900 text-base">
                  {editingItem ? 'Edit Data Ruang' : 'Tambah Data Ruang'}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-200/60 text-slate-500 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Jenis Prasarana * <span className="text-[10px] font-normal text-emerald-700">(Bisa diketik manual)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      list="jenis-prasarana-options"
                      value={formData.jenisPrasarana}
                      onChange={(e) => setFormData({ ...formData, jenisPrasarana: e.target.value })}
                      placeholder="Pilih atau ketik manual..."
                      className="w-full p-2.5 bg-white text-slate-900 font-semibold border border-slate-300 rounded-xl placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                    <datalist id="jenis-prasarana-options">
                      {allJenisList.map((j) => (
                        <option key={j} value={j} />
                      ))}
                    </datalist>
                  </div>
                  {/* Quick preset chips */}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {['Bilik Perempuan', 'Bilik Laki-laki', 'Ruang Teori/Kelas', 'Ruang Guru', 'Perpustakaan', 'Toilet/WC'].map((chip) => (
                      <button
                        type="button"
                        key={chip}
                        onClick={() => setFormData({ ...formData, jenisPrasarana: chip })}
                        className={`text-[10px] px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                          formData.jenisPrasarana === chip
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Nama Bangunan *</label>
                  <input
                    type="text"
                    required
                    value={formData.namaBangunan}
                    onChange={(e) => setFormData({ ...formData, namaBangunan: e.target.value })}
                    placeholder="Contoh: Gedung P / Gedung A"
                    className="w-full p-2.5 bg-white text-slate-900 font-semibold border border-slate-300 rounded-xl placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Nama Ruang *</label>
                  <input
                    type="text"
                    required
                    value={formData.namaRuang}
                    onChange={(e) => setFormData({ ...formData, namaRuang: e.target.value })}
                    placeholder="Contoh: WC Perempuan / Ruang Kelas 7A"
                    className="w-full p-2.5 bg-white text-slate-900 font-semibold border border-slate-300 rounded-xl placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Kode Ruang</label>
                  <input
                    type="text"
                    value={formData.kodeRuang || ''}
                    onChange={(e) => setFormData({ ...formData, kodeRuang: e.target.value })}
                    placeholder="Contoh: RNG-001"
                    className="w-full p-2.5 bg-white text-slate-900 font-semibold border border-slate-300 rounded-xl placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 font-mono transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Lantai</label>
                  <input
                    type="text"
                    value={formData.lantai || '1'}
                    onChange={(e) => setFormData({ ...formData, lantai: e.target.value })}
                    placeholder="1"
                    className="w-full p-2.5 bg-white text-slate-900 font-semibold border border-slate-300 rounded-xl placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Panjang (m)</label>
                  <input
                    type="text"
                    value={formData.panjang || '4.0'}
                    onChange={(e) => handleDimensionChange(e.target.value, String(formData.lebar || '8.0'))}
                    placeholder="4.0"
                    className="w-full p-2.5 bg-white text-slate-900 font-semibold border border-slate-300 rounded-xl placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Lebar (m)</label>
                  <input
                    type="text"
                    value={formData.lebar || '8.0'}
                    onChange={(e) => handleDimensionChange(String(formData.panjang || '4.0'), e.target.value)}
                    placeholder="8.0"
                    className="w-full p-2.5 bg-white text-slate-900 font-semibold border border-slate-300 rounded-xl placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Luas (m²)</label>
                  <input
                    type="text"
                    value={formData.luas || '32.0'}
                    onChange={(e) => setFormData({ ...formData, luas: e.target.value })}
                    placeholder="32.0"
                    className="w-full p-2.5 bg-slate-100 text-emerald-800 font-bold border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600 font-mono transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Kondisi</label>
                  <select
                    value={formData.kondisi || 'Baik'}
                    onChange={(e) => setFormData({ ...formData, kondisi: e.target.value })}
                    className="w-full p-2.5 bg-white text-slate-900 font-semibold border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  >
                    <option value="Baik" className="bg-white text-slate-900">Baik</option>
                    <option value="Rusak Ringan" className="bg-white text-slate-900">Rusak Ringan</option>
                    <option value="Rusak Sedang" className="bg-white text-slate-900">Rusak Sedang</option>
                    <option value="Rusak Berat" className="bg-white text-slate-900">Rusak Berat</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Bobot Kerusakan (%)</label>
                  <input
                    type="text"
                    value={formData.bobotKerusakan || '0.0'}
                    onChange={(e) => setFormData({ ...formData, bobotKerusakan: e.target.value })}
                    placeholder="0.0"
                    className="w-full p-2.5 bg-white text-slate-900 font-semibold border border-slate-300 rounded-xl placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Keterangan / Fasilitas</label>
                <textarea
                  rows={2}
                  value={formData.keterangan || ''}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  placeholder="Fasilitas Sanitasi Siswa / Ruang Belajar..."
                  className="w-full p-2.5 bg-white text-slate-900 font-semibold border border-slate-300 rounded-xl placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors cursor-pointer"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Tambah Ruang'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      {deletingItem && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">Hapus Ruang?</h3>
            <p className="text-xs text-slate-500 mb-5">
              Apakah Anda yakin ingin menghapus data <strong className="text-slate-800">{deletingItem.namaRuang}</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setDeletingItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
