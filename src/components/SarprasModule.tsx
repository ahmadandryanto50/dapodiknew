import React, { useState } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  Download, 
  Edit3, 
  Trash2, 
  ArrowLeft,
  Filter,
  CheckCircle,
  AlertTriangle,
  XSquare,
  X,
  Layers,
  ChevronDown
} from 'lucide-react';
import { SarprasItem } from '../types';
import { exportToCSV } from '../services/googleSheetsService';

interface SarprasModuleProps {
  sarpras: SarprasItem[];
  onAddSarpras: (item: SarprasItem) => void;
  onUpdateSarpras: (item: SarprasItem) => void;
  onDeleteSarpras: (id: string) => void;
  onBackToHome: () => void;
}

export const SarprasModule: React.FC<SarprasModuleProps> = ({
  sarpras,
  onAddSarpras,
  onUpdateSarpras,
  onDeleteSarpras,
  onBackToHome
}) => {
  const [search, setSearch] = useState('');
  const [filterKategori, setFilterKategori] = useState('ALL');
  const [filterKondisi, setFilterKondisi] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SarprasItem | null>(null);
  const [openActionId, setOpenActionId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Omit<SarprasItem, 'id'>>({
    kodeBarang: '',
    namaBarang: '',
    kategori: 'Ruang Teori/Kelas',
    kondisi: 'Baik',
    jumlah: 1,
    satuan: 'Unit',
    letakRuang: 'Gedung A',
    tahunPengadaan: '2023',
    layakPakai: true
  });

  const [deletingSarpras, setDeletingSarpras] = useState<{ id: string; name: string } | null>(null);

  const filteredSarpras = sarpras.filter(item => {
    const matchSearch = item.namaBarang.toLowerCase().includes(search.toLowerCase()) ||
                        item.kodeBarang.toLowerCase().includes(search.toLowerCase()) ||
                        item.letakRuang.toLowerCase().includes(search.toLowerCase());
    const matchKategori = filterKategori === 'ALL' || item.kategori === filterKategori;
    const matchKondisi = filterKondisi === 'ALL' || item.kondisi === filterKondisi;
    return matchSearch && matchKategori && matchKondisi;
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      kodeBarang: 'SRP-' + Math.floor(1000 + Math.random() * 9000),
      namaBarang: '',
      kategori: 'Ruang Teori/Kelas',
      kondisi: 'Baik',
      jumlah: 1,
      satuan: 'Unit',
      letakRuang: 'Gedung A',
      tahunPengadaan: '2024',
      layakPakai: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: SarprasItem) => {
    setEditingItem(item);
    setFormData({
      kodeBarang: item.kodeBarang,
      namaBarang: item.namaBarang,
      kategori: item.kategori,
      kondisi: item.kondisi,
      jumlah: item.jumlah,
      satuan: item.satuan,
      letakRuang: item.letakRuang,
      tahunPengadaan: item.tahunPengadaan,
      layakPakai: item.layakPakai
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namaBarang || !formData.kodeBarang) {
      alert('Nama dan Kode Barang wajib diisi');
      return;
    }

    if (editingItem) {
      onUpdateSarpras({
        ...formData,
        id: editingItem.id
      });
    } else {
      onAddSarpras({
        ...formData,
        id: `srp-${Date.now().toString().slice(-4)}`
      });
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    setDeletingSarpras({ id, name });
  };

  const confirmDeleteSarpras = () => {
    if (deletingSarpras) {
      onDeleteSarpras(deletingSarpras.id);
      setDeletingSarpras(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="sticky top-[57px] z-30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/95 backdrop-blur-xl border border-slate-200/80 p-5 rounded-2xl shadow-md transition-all">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToHome}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200/60"
            title="Kembali ke Beranda"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">Sarana & Prasarana (Sarpras)</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {sarpras.length} Aset & Ruangan
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Monitoring kondisi fisik ruangan, laboratorium, buku perpustakaan, dan inventaris sekolah
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => exportToCSV(sarpras, 'DAPODIK_DATA_SARPRAS')}
            className="px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Ekspor Database</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Sarpras Baru</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-xs">
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari Kode Sarpras, Nama Ruangan, atau Letak..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={filterKategori}
            onChange={(e) => setFilterKategori(e.target.value)}
            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
          >
            <option value="ALL">Semua Kategori</option>
            <option value="Ruang Teori/Kelas">Ruang Teori/Kelas</option>
            <option value="Ruang Laboratorium">Ruang Laboratorium</option>
            <option value="Ruang Pimpinan">Ruang Pimpinan</option>
            <option value="Perpustakaan">Perpustakaan</option>
            <option value="Peralatan Elektronik">Peralatan Elektronik</option>
            <option value="Perabot">Perabot</option>
          </select>
        </div>

        <div className="sm:col-span-3">
          <select
            value={filterKondisi}
            onChange={(e) => setFilterKondisi(e.target.value)}
            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
          >
            <option value="ALL">Semua Kondisi</option>
            <option value="Baik">Baik (100% Layak)</option>
            <option value="Rusak Ringan">Rusak Ringan (&lt;30%)</option>
            <option value="Rusak Sedang">Rusak Sedang (30-45%)</option>
            <option value="Rusak Berat">Rusak Berat (&gt;45%)</option>
          </select>
        </div>
      </div>

      {/* Sarpras Grid/Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto max-h-[650px] overflow-y-auto scrollbar-thin">
          <table className="w-full text-left text-xs text-slate-700 relative border-collapse">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="py-3.5 px-4">No</th>
                <th className="py-3.5 px-4">Kode & Nama Sarpras</th>
                <th className="py-3.5 px-4">Kategori</th>
                <th className="py-3.5 px-4">Kondisi Fisik</th>
                <th className="py-3.5 px-4">Volume / Jumlah</th>
                <th className="py-3.5 px-4">Letak / Lokasi</th>
                <th className="py-3.5 px-4">Tahun Pengadaan</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSarpras.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-400">{idx + 1}</td>
                  <td className="py-3 px-4 font-medium text-slate-900">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold text-xs">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{item.namaBarang}</div>
                        <div className="text-[10px] text-emerald-700 font-mono">{item.kodeBarang}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium">
                      {item.kategori}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 w-fit ${
                      item.kondisi === 'Baik' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : item.kondisi === 'Rusak Ringan'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {item.kondisi === 'Baik' ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                      {item.kondisi}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {item.jumlah} <span className="text-slate-500 font-normal">{item.satuan}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-700">
                    {item.letakRuang}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500">
                    {item.tahunPengadaan}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="relative inline-block text-left">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenActionId(openActionId === item.id ? null : item.id);
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-xs cursor-pointer ${
                          openActionId === item.id
                            ? 'bg-sky-600 text-white border-sky-600 shadow-md'
                            : 'bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-700 border-slate-300 hover:border-sky-300'
                        }`}
                        title="Pilih Aksi"
                      >
                        <span>Aksi</span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${openActionId === item.id ? 'rotate-180 text-white' : 'text-slate-400'}`} />
                      </button>

                      {openActionId === item.id && (
                        <>
                          {/* Invisible backdrop to close menu when clicking outside */}
                          <div 
                            className="fixed inset-0 z-40 cursor-default" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenActionId(null);
                            }} 
                          />
                          <div 
                            className="absolute right-full top-1/2 -translate-y-1/2 mr-2 z-50 w-48 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/90 py-1.5 text-xs text-slate-700 divide-y divide-slate-100 ring-1 ring-black/5 animate-in fade-in slide-in-from-right-2 duration-150 max-h-80 overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="py-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenActionId(null);
                                  handleOpenEdit(item);
                                }}
                                className="w-full text-left px-3.5 py-2 hover:bg-amber-50 text-slate-700 hover:text-amber-700 flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
                              >
                                <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
                                  <Edit3 className="w-3.5 h-3.5" />
                                </div>
                                <span>Edit Sarpras</span>
                              </button>
                            </div>

                            <div className="py-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenActionId(null);
                                  handleDelete(item.id, item.namaBarang);
                                }}
                                className="w-full text-left px-3.5 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
                              >
                                <div className="w-6 h-6 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </div>
                                <span>Hapus Sarpras</span>
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                <span>{editingItem ? 'Edit Sarana Prasarana' : 'Tambah Sarpras Baru'}</span>
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Kode Sarpras / Aset *</label>
                <input
                  type="text"
                  required
                  value={formData.kodeBarang}
                  onChange={(e) => setFormData({ ...formData, kodeBarang: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none font-mono"
                  placeholder="Contoh: RK-01, LAB-IPA, PROJ-01"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Nama Sarpras / Barang *</label>
                <input
                  type="text"
                  required
                  value={formData.namaBarang}
                  onChange={(e) => setFormData({ ...formData, namaBarang: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none"
                  placeholder="Contoh: Ruang Kelas 7B, Proyektor EPSON, Set Meja Kursi"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Kategori</label>
                  <select
                    value={formData.kategori}
                    onChange={(e) => setFormData({ ...formData, kategori: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none"
                  >
                    <option value="Ruang Teori/Kelas">Ruang Teori/Kelas</option>
                    <option value="Ruang Laboratorium">Ruang Laboratorium</option>
                    <option value="Ruang Pimpinan">Ruang Pimpinan</option>
                    <option value="Perpustakaan">Perpustakaan</option>
                    <option value="Peralatan Elektronik">Peralatan Elektronik</option>
                    <option value="Perabot">Perabot</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Kondisi Fisik</label>
                  <select
                    value={formData.kondisi}
                    onChange={(e) => setFormData({ ...formData, kondisi: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none"
                  >
                    <option value="Baik">Baik (Layak 100%)</option>
                    <option value="Rusak Ringan">Rusak Ringan (&lt;30%)</option>
                    <option value="Rusak Sedang">Rusak Sedang (30-45%)</option>
                    <option value="Rusak Berat">Rusak Berat (&gt;45%)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Jumlah</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.jumlah}
                    onChange={(e) => setFormData({ ...formData, jumlah: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Satuan</label>
                  <input
                    type="text"
                    value={formData.satuan}
                    onChange={(e) => setFormData({ ...formData, satuan: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none"
                    placeholder="Unit / Set / Ruang"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Letak / Lokasi Ruang</label>
                  <input
                    type="text"
                    value={formData.letakRuang}
                    onChange={(e) => setFormData({ ...formData, letakRuang: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none"
                    placeholder="Gedung A Lantai 1"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Tahun Pengadaan</label>
                  <input
                    type="text"
                    value={formData.tahunPengadaan}
                    onChange={(e) => setFormData({ ...formData, tahunPengadaan: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none font-mono"
                    placeholder="2023"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm transition-colors"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Tambah Sarpras'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Sarpras */}
      {deletingSarpras && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Konfirmasi Hapus Sarpras</h3>
              <p className="text-sm text-slate-700 mt-2 leading-relaxed">
                Apakah Anda yakin ingin menghapus data sarpras <strong className="text-rose-700">"{deletingSarpras.name}"</strong>?
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Data di aplikasi dan database akan langsung diperbarui.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setDeletingSarpras(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDeleteSarpras}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-sm flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Ya, Hapus Sarpras
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
