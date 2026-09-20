import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  Building2, 
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
  ChevronDown,
  Info,
  Ruler,
  Calendar,
  CloudUpload,
  RefreshCw
} from 'lucide-react';
import { BangunanItem } from '../types';
import { exportToCSV, exportToExcel } from '../services/googleSheetsService';

interface BangunanModuleProps {
  bangunan: BangunanItem[];
  onAddBangunan: (item: BangunanItem) => void;
  onUpdateBangunan: (item: BangunanItem) => void;
  onDeleteBangunan: (id: string) => void;
  onSync?: () => Promise<void> | void;
  isSyncing?: boolean;
}

export const BangunanModule: React.FC<BangunanModuleProps> = ({
  bangunan,
  onAddBangunan,
  onUpdateBangunan,
  onDeleteBangunan,
  onSync,
  isSyncing = false
}) => {
  const [search, setSearch] = useState('');
  const [filterKondisi, setFilterKondisi] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BangunanItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<BangunanItem | null>(null);

  const [formData, setFormData] = useState<Omit<BangunanItem, 'id'>>({
    no: 1,
    namaBangunan: '',
    kodeBangunan: '',
    tahunPembangunan: new Date().getFullYear().toString(),
    luasTapak: '0.0',
    jumlahLantai: '1',
    jumlahRuang: '1',
    kondisi: 'Tidak ada kerusakan',
    bobotKerusakan: '0.0',
    keterangan: ''
  });

  const filteredBangunan = bangunan.filter(item => {
    const matchSearch = (item.namaBangunan || '').toLowerCase().includes(search.toLowerCase()) ||
                        (item.kodeBangunan || '').toLowerCase().includes(search.toLowerCase()) ||
                        (item.keterangan || '').toLowerCase().includes(search.toLowerCase());
    const matchKondisi = filterKondisi === 'ALL' || item.kondisi === filterKondisi;
    return matchSearch && matchKondisi;
  });

  const totalLuasTapak = bangunan.reduce((acc, curr) => {
    const val = parseFloat(String(curr.luasTapak || '0').replace(',', '.'));
    return acc + (isNaN(val) ? 0 : val);
  }, 0);

  const totalRuang = bangunan.reduce((acc, curr) => {
    const val = parseInt(String(curr.jumlahRuang || '0'), 10);
    return acc + (isNaN(val) ? 0 : val);
  }, 0);

  const totalBaik = bangunan.filter(b => !b.kondisi || b.kondisi.toLowerCase().includes('tidak ada') || b.kondisi.toLowerCase().includes('baik')).length;

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      no: bangunan.length + 1,
      namaBangunan: '',
      kodeBangunan: 'BGN-' + Math.floor(100 + Math.random() * 900),
      tahunPembangunan: '2020',
      luasTapak: '24.0',
      jumlahLantai: '1',
      jumlahRuang: '1',
      kondisi: 'Tidak ada kerusakan',
      bobotKerusakan: '0.0',
      keterangan: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: BangunanItem) => {
    setEditingItem(item);
    setFormData({
      no: item.no || 1,
      namaBangunan: item.namaBangunan || '',
      kodeBangunan: item.kodeBangunan || '',
      tahunPembangunan: item.tahunPembangunan ? String(item.tahunPembangunan) : '2020',
      luasTapak: item.luasTapak ? String(item.luasTapak) : '0.0',
      jumlahLantai: item.jumlahLantai ? String(item.jumlahLantai) : '1',
      jumlahRuang: item.jumlahRuang ? String(item.jumlahRuang) : '1',
      kondisi: item.kondisi || 'Tidak ada kerusakan',
      bobotKerusakan: item.bobotKerusakan ? String(item.bobotKerusakan) : '0.0',
      keterangan: item.keterangan || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namaBangunan) {
      alert('Nama Bangunan wajib diisi');
      return;
    }

    if (editingItem) {
      onUpdateBangunan({
        ...formData,
        id: editingItem.id
      });
    } else {
      onAddBangunan({
        ...formData,
        id: `bgn-${Date.now().toString().slice(-6)}`
      });
    }
    setIsModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (deletingItem) {
      onDeleteBangunan(deletingItem.id);
      setDeletingItem(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Cards Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Total Bangunan</p>
            <p className="text-xl font-bold text-slate-900">{bangunan.length} <span className="text-xs font-normal text-slate-500">Unit</span></p>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Total Luas Tapak</p>
            <p className="text-xl font-bold text-slate-900">{totalLuasTapak.toFixed(1)} <span className="text-xs font-normal text-slate-500">m²</span></p>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <Ruler className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Total Ruangan</p>
            <p className="text-xl font-bold text-slate-900">{totalRuang} <span className="text-xs font-normal text-slate-500">Ruang</span></p>
          </div>
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Kondisi Baik</p>
            <p className="text-xl font-bold text-emerald-700">{totalBaik} <span className="text-xs font-normal text-slate-500">/ {bangunan.length}</span></p>
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
              placeholder="Cari nama, kode, atau ket bangunan..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-white text-slate-900 font-medium border border-slate-300 rounded-xl placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="w-full sm:w-52">
            <select
              value={filterKondisi}
              onChange={(e) => setFilterKondisi(e.target.value)}
              className="w-full text-xs py-2 px-3 bg-white text-slate-900 font-medium border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="ALL" className="bg-white text-slate-900">Semua Kondisi</option>
              <option value="Tidak ada kerusakan" className="bg-white text-slate-900">Tidak Ada Kerusakan</option>
              <option value="Rusak Ringan" className="bg-white text-slate-900">Rusak Ringan</option>
              <option value="Rusak Sedang" className="bg-white text-slate-900">Rusak Sedang</option>
              <option value="Rusak Berat" className="bg-white text-slate-900">Rusak Berat</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onSync && (
            <button
              onClick={() => onSync()}
              disabled={isSyncing}
              className="px-3 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-semibold border border-teal-200 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Simpan & Sync seluruh data Bangunan ke Google Spreadsheet"
            >
              <CloudUpload className={`w-3.5 h-3.5 text-teal-600 ${isSyncing ? 'animate-bounce' : ''}`} />
              <span>{isSyncing ? 'Menyimpan...' : 'Simpan ke Spreadsheet'}</span>
            </button>
          )}

          <button
            onClick={() => exportToExcel(bangunan, 'Data_Bangunan_Sekolah')}
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
            <span>Tambah Bangunan</span>
          </button>
        </div>
      </div>

      {/* Bangunan Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4">Nama Bangunan</th>
                <th className="py-3.5 px-4">Kode Bangunan</th>
                <th className="py-3.5 px-4 text-center">Tahun</th>
                <th className="py-3.5 px-4 text-right">Luas Tapak (m²)</th>
                <th className="py-3.5 px-4 text-center">Jml Lantai</th>
                <th className="py-3.5 px-4 text-center">Jml Ruang</th>
                <th className="py-3.5 px-4">Kondisi & Kerusakan</th>
                <th className="py-3.5 px-4">Keterangan</th>
                <th className="py-3.5 px-4 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBangunan.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <Building2 className="w-10 h-10 mx-auto mb-2 opacity-30 text-slate-500" />
                    <p className="font-semibold text-slate-600">Belum ada data bangunan</p>
                    <p className="text-xs text-slate-400">Klik "Tambah Bangunan" untuk memasukkan data baru.</p>
                  </td>
                </tr>
              ) : (
                filteredBangunan.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-center font-mono text-slate-500">{idx + 1}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{item.namaBangunan}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{item.kodeBangunan || '-'}</td>
                    <td className="py-3 px-4 text-center text-slate-600">{item.tahunPembangunan || '-'}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-800">{item.luasTapak || '0.0'}</td>
                    <td className="py-3 px-4 text-center text-slate-700">{item.jumlahLantai || '1'}</td>
                    <td className="py-3 px-4 text-center text-slate-700">{item.jumlahRuang || '1'}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                        !item.kondisi || item.kondisi.toLowerCase().includes('tidak ada') || item.kondisi.toLowerCase().includes('baik')
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {item.kondisi || 'Tidak ada kerusakan'}
                        {item.bobotKerusakan && item.bobotKerusakan !== '0.0' && item.bobotKerusakan !== '0' && (
                          <span className="text-[10px] opacity-75">({item.bobotKerusakan}%)</span>
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{item.keterangan || '-'}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 transition-colors cursor-pointer"
                          title="Edit Bangunan"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingItem(item)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 transition-colors cursor-pointer"
                          title="Hapus Bangunan"
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
                <Building2 className="w-5 h-5 text-emerald-600" />
                <h2 className="font-bold text-slate-900 text-base">
                  {editingItem ? 'Edit Data Bangunan' : 'Tambah Data Bangunan'}
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
              <div>
                <label className="block font-bold text-slate-800 mb-1">Nama Bangunan *</label>
                <input
                  type="text"
                  required
                  value={formData.namaBangunan}
                  onChange={(e) => setFormData({ ...formData, namaBangunan: e.target.value })}
                  placeholder="Contoh: Gedung A / Ruang Kelas Baru"
                  className="w-full p-2.5 bg-white text-slate-900 font-semibold border border-slate-300 rounded-xl placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Kode Bangunan</label>
                  <input
                    type="text"
                    value={formData.kodeBangunan || ''}
                    onChange={(e) => setFormData({ ...formData, kodeBangunan: e.target.value })}
                    placeholder="Contoh: BGN-001"
                    className="w-full p-2.5 bg-white text-slate-900 font-semibold border border-slate-300 rounded-xl placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 font-mono transition-all"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Tahun Pembangunan</label>
                  <input
                    type="text"
                    value={formData.tahunPembangunan || ''}
                    onChange={(e) => setFormData({ ...formData, tahunPembangunan: e.target.value })}
                    placeholder="2020"
                    className="w-full p-2.5 bg-white text-slate-900 font-semibold border border-slate-300 rounded-xl placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Luas Tapak (m²)</label>
                  <input
                    type="text"
                    value={formData.luasTapak || ''}
                    onChange={(e) => setFormData({ ...formData, luasTapak: e.target.value })}
                    placeholder="24.0"
                    className="w-full p-2.5 bg-white text-slate-900 font-semibold border border-slate-300 rounded-xl placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Jumlah Lantai</label>
                  <input
                    type="text"
                    value={formData.jumlahLantai || '1'}
                    onChange={(e) => setFormData({ ...formData, jumlahLantai: e.target.value })}
                    placeholder="1"
                    className="w-full p-2.5 bg-white text-slate-900 font-semibold border border-slate-300 rounded-xl placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Jumlah Ruang</label>
                  <input
                    type="text"
                    value={formData.jumlahRuang || '1'}
                    onChange={(e) => setFormData({ ...formData, jumlahRuang: e.target.value })}
                    placeholder="5"
                    className="w-full p-2.5 bg-white text-slate-900 font-semibold border border-slate-300 rounded-xl placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Kondisi Bangunan</label>
                  <select
                    value={formData.kondisi || 'Tidak ada kerusakan'}
                    onChange={(e) => setFormData({ ...formData, kondisi: e.target.value })}
                    className="w-full p-2.5 bg-white text-slate-900 font-semibold border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  >
                    <option value="Tidak ada kerusakan" className="bg-white text-slate-900">Tidak ada kerusakan</option>
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
                <label className="block font-bold text-slate-800 mb-1">Keterangan / Fungsi</label>
                <textarea
                  rows={2}
                  value={formData.keterangan || ''}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  placeholder="Gedung Kelas & Administrasi..."
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
                  {editingItem ? 'Simpan Perubahan' : 'Tambah Bangunan'}
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
            <h3 className="font-bold text-slate-900 text-base mb-1">Hapus Bangunan?</h3>
            <p className="text-xs text-slate-500 mb-5">
              Apakah Anda yakin ingin menghapus data <strong className="text-slate-800">{deletingItem.namaBangunan}</strong>? Tindakan ini tidak dapat dibatalkan.
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
