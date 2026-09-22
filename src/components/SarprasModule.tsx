import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  ChevronDown,
  Package,
  DoorOpen,
  Building,
  FileSpreadsheet
} from 'lucide-react';
import { SarprasItem, KibBItem, BangunanItem, RuangItem } from '../types';
import { exportToCSV } from '../services/googleSheetsService';
import { 
  exportSarprasItemsToExcel,
  exportKibBItemsToExcel,
  exportBangunanItemsToExcel,
  exportRuangItemsToExcel,
  exportAllSarprasToExcel
} from '../utils/sarprasExportHelper';
import { KibBModule } from './KibBModule';
import { BangunanModule } from './BangunanModule';
import { RuangModule } from './RuangModule';

interface SarprasModuleProps {
  sarpras: SarprasItem[];
  onAddSarpras: (item: SarprasItem) => void;
  onUpdateSarpras: (item: SarprasItem) => void;
  onDeleteSarpras: (id: string) => void;
  onBackToHome: () => void;
  kibB?: KibBItem[];
  onAddKibB?: (item: KibBItem) => void;
  onBulkAddKibB?: (items: KibBItem[], replaceAll?: boolean) => void;
  onUpdateKibB?: (item: KibBItem) => void;
  onDeleteKibB?: (id: string) => void;
  bangunan?: BangunanItem[];
  onAddBangunan?: (item: BangunanItem) => void;
  onUpdateBangunan?: (item: BangunanItem) => void;
  onDeleteBangunan?: (id: string) => void;
  ruang?: RuangItem[];
  onAddRuang?: (item: RuangItem) => void;
  onUpdateRuang?: (item: RuangItem) => void;
  onDeleteRuang?: (id: string) => void;
  onSync?: () => Promise<void> | void;
  onSyncBangunan?: () => Promise<void> | void;
  onSyncRuang?: () => Promise<void> | void;
  isSyncing?: boolean;
}

export const SarprasModule: React.FC<SarprasModuleProps> = ({
  sarpras,
  onAddSarpras,
  onUpdateSarpras,
  onDeleteSarpras,
  onBackToHome,
  kibB = [],
  onAddKibB = () => {},
  onBulkAddKibB,
  onUpdateKibB = () => {},
  onDeleteKibB = () => {},
  bangunan = [],
  onAddBangunan = () => {},
  onUpdateBangunan = () => {},
  onDeleteBangunan = () => {},
  ruang = [],
  onAddRuang = () => {},
  onUpdateRuang = () => {},
  onDeleteRuang = () => {},
  onSync,
  onSyncBangunan,
  onSyncRuang,
  isSyncing = false
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'sarpras' | 'kib_b' | 'bangunan' | 'ruang'>('sarpras');
  const [search, setSearch] = useState('');
  const [filterKategori, setFilterKategori] = useState('ALL');
  const [filterKondisi, setFilterKondisi] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SarprasItem | null>(null);
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  const [actionMenuPos, setActionMenuPos] = useState<{ top: number; right?: number; left?: number } | null>(null);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);

  useEffect(() => {
    if (!openActionId) return;
    const handleClose = () => {
      setOpenActionId(null);
      setActionMenuPos(null);
    };
    window.addEventListener('scroll', handleClose, { capture: true, passive: true });
    window.addEventListener('resize', handleClose, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleClose, { capture: true });
      window.removeEventListener('resize', handleClose);
    };
  }, [openActionId]);

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

  // Generate dynamic unique categories list from current database items
  const uniqueCategories = Array.from(new Set(sarpras.map(item => item.kategori).filter(Boolean)));
  const defaultCategories = ['Ruang Teori/Kelas', 'Ruang Laboratorium', 'Ruang Pimpinan', 'Perpustakaan', 'Peralatan Elektronik', 'Perabot'];
  const allFilterCategories = Array.from(new Set([...defaultCategories, ...uniqueCategories]));

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
      <div className="sticky top-0 sm:top-[57px] z-30 flex flex-col gap-3.5 bg-white/95 backdrop-blur-xl border border-slate-200/80 p-3 sm:p-5 rounded-2xl shadow-md transition-all">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <button
              onClick={onBackToHome}
              className="p-2 sm:p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200/60 cursor-pointer shrink-0"
              title="Kembali ke Beranda"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-xl font-bold text-slate-900 truncate">
                  {activeSubTab === 'sarpras' && 'Sarana & Prasarana'}
                  {activeSubTab === 'kib_b' && 'KIB B (Peralatan & Mesin)'}
                  {activeSubTab === 'bangunan' && 'Bangunan Sekolah'}
                  {activeSubTab === 'ruang' && 'Ruang Sekolah'}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                  {activeSubTab === 'sarpras' && `${sarpras.length} Aset`}
                  {activeSubTab === 'kib_b' && `${kibB.length} Barang`}
                  {activeSubTab === 'bangunan' && `${bangunan.length} Gedung`}
                  {activeSubTab === 'ruang' && `${ruang.length} Ruang`}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate hidden sm:block">
                {activeSubTab === 'sarpras' && 'Monitoring kondisi fisik ruangan, laboratorium, buku perpustakaan, dan inventaris sekolah'}
                {activeSubTab === 'kib_b' && 'Pengelolaan Kartu Inventaris Barang (KIB B) peralatan dan mesin sekolah'}
                {activeSubTab === 'bangunan' && 'Pengelolaan data fisik bangunan sekolah, luas tapak, dan keandalan bangunan'}
                {activeSubTab === 'ruang' && 'Pengelolaan data prasarana ruangan, dimensi, luas, dan tingkat kerusakan'}
              </p>
            </div>
          </div>

          {/* Quick Excel Export on mobile/header */}
          <div className="relative shrink-0">
            <button
              onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
              className="px-2.5 sm:px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="Pilih data yang ingin diunduh format Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="hidden xs:inline">Unduh Excel</span>
              <ChevronDown className={`w-3 h-3 text-emerald-700 transition-transform ${isExportDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isExportDropdownOpen && (
              <div 
                className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 backdrop-blur-xl space-y-1 animate-in fade-in zoom-in-95 duration-150"
                onMouseLeave={() => setIsExportDropdownOpen(false)}
              >
                <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 border-b border-slate-100 flex items-center justify-between">
                  <span>Unduh Format Excel (.xlsx):</span>
                  <span className="text-[9px] text-slate-400 font-mono">DAPODIK</span>
                </div>

                {/* 1. Unduh Sarpras */}
                <button
                  onClick={() => {
                    exportSarprasItemsToExcel(sarpras);
                    setIsExportDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-emerald-50 text-slate-800 text-xs font-medium flex items-center justify-between gap-2 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <div className="font-bold text-slate-900 text-[11px] group-hover:text-emerald-800">Data Sarpras</div>
                      <div className="text-[10px] text-slate-500">Aset inventaris, ruangan & lab</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold shrink-0">
                    {sarpras.length}
                  </span>
                </button>

                {/* 2. Unduh KIB B */}
                <button
                  onClick={() => {
                    exportKibBItemsToExcel(kibB);
                    setIsExportDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-emerald-50 text-slate-800 text-xs font-medium flex items-center justify-between gap-2 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <div className="font-bold text-slate-900 text-[11px] group-hover:text-emerald-800">Data KIB B</div>
                      <div className="text-[10px] text-slate-500">Peralatan, mesin & kendaraan</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold shrink-0">
                    {kibB.length}
                  </span>
                </button>

                {/* 3. Unduh Bangunan */}
                <button
                  onClick={() => {
                    exportBangunanItemsToExcel(bangunan);
                    setIsExportDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-emerald-50 text-slate-800 text-xs font-medium flex items-center justify-between gap-2 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <div className="font-bold text-slate-900 text-[11px] group-hover:text-emerald-800">Data Bangunan</div>
                      <div className="text-[10px] text-slate-500">Fisik gedung, luas tapak & lantai</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold shrink-0">
                    {bangunan.length}
                  </span>
                </button>

                {/* 4. Unduh Ruang */}
                <button
                  onClick={() => {
                    exportRuangItemsToExcel(ruang);
                    setIsExportDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-emerald-50 text-slate-800 text-xs font-medium flex items-center justify-between gap-2 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <DoorOpen className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <div className="font-bold text-slate-900 text-[11px] group-hover:text-emerald-800">Data Ruang</div>
                      <div className="text-[10px] text-slate-500">Prasarana ruangan & dimensi</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold shrink-0">
                    {ruang.length}
                  </span>
                </button>

                {/* 5. Unduh Semua Sekaligus */}
                <div className="pt-1 border-t border-slate-100">
                  <button
                    onClick={() => {
                      exportAllSarprasToExcel(sarpras, kibB, bangunan, ruang);
                      setIsExportDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-sky-50 text-slate-800 text-xs font-medium flex items-center justify-between gap-2 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-sky-600 shrink-0" />
                      <div>
                        <div className="font-bold text-slate-900 text-[11px] group-hover:text-sky-800">Semua Data Sarpras</div>
                        <div className="text-[10px] text-slate-500">1 File Excel (4 Sheet Lengkap)</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-sky-100 text-sky-800 font-bold shrink-0">
                      4 Sheet
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Subtabs & Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200 gap-1 overflow-x-auto max-w-full scrollbar-none py-1 shrink-0">
            <button
              onClick={() => setActiveSubTab('sarpras')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                activeSubTab === 'sarpras'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Sarpras</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeSubTab === 'sarpras' ? 'bg-white/25 text-white' : 'bg-slate-200/70 text-slate-700'
              }`}>
                {sarpras.length}
              </span>
            </button>

            <button
              onClick={() => setActiveSubTab('kib_b')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                activeSubTab === 'kib_b'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>KIB B</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeSubTab === 'kib_b' ? 'bg-white/25 text-white' : 'bg-slate-200/70 text-slate-700'
              }`}>
                {kibB.length}
              </span>
            </button>

            <button
              onClick={() => setActiveSubTab('bangunan')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                activeSubTab === 'bangunan'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>Bangunan</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeSubTab === 'bangunan' ? 'bg-white/25 text-white' : 'bg-slate-200/70 text-slate-700'
              }`}>
                {bangunan.length}
              </span>
            </button>

            <button
              onClick={() => setActiveSubTab('ruang')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                activeSubTab === 'ruang'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <DoorOpen className="w-3.5 h-3.5" />
              <span>Ruang</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeSubTab === 'ruang' ? 'bg-white/25 text-white' : 'bg-slate-200/70 text-slate-700'
              }`}>
                {ruang.length}
              </span>
            </button>
          </div>

          {activeSubTab === 'sarpras' && (
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => exportSarprasItemsToExcel(sarpras)}
                className="px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                title="Ekspor data Sarpras ke file Excel (.xlsx)"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Ekspor Excel Sarpras</span>
              </button>

              <button
                onClick={handleOpenAdd}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Sarpras</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {activeSubTab === 'kib_b' && (
        <KibBModule
          kibB={kibB}
          onAddKibB={onAddKibB}
          onBulkAddKibB={onBulkAddKibB}
          onUpdateKibB={onUpdateKibB}
          onDeleteKibB={onDeleteKibB}
          onSync={onSync}
          isSyncing={isSyncing}
        />
      )}

      {activeSubTab === 'bangunan' && (
        <BangunanModule
          bangunan={bangunan}
          onAddBangunan={onAddBangunan}
          onUpdateBangunan={onUpdateBangunan}
          onDeleteBangunan={onDeleteBangunan}
          onSync={onSyncBangunan || onSync}
          isSyncing={isSyncing}
        />
      )}

      {activeSubTab === 'ruang' && (
        <RuangModule
          ruang={ruang}
          onAddRuang={onAddRuang}
          onUpdateRuang={onUpdateRuang}
          onDeleteRuang={onDeleteRuang}
          onSync={onSyncRuang || onSync}
          isSyncing={isSyncing}
        />
      )}

      {activeSubTab === 'sarpras' && (
        <>
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
            {allFilterCategories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
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
        {/* Mobile Card View (visible on < md screens) */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredSarpras.length === 0 ? (
            <div className="py-12 text-center text-slate-400 p-4">
              <Building2 className="w-10 h-10 mx-auto mb-2 opacity-30 text-slate-500" />
              <p className="font-semibold text-slate-600">Tidak ada data sarpras ditemukan</p>
              <p className="text-xs text-slate-400 mt-1">Coba sesuaikan pencarian atau filter kategori Anda.</p>
            </div>
          ) : (
            filteredSarpras.map((item, idx) => (
              <div key={item.id} className="p-3.5 space-y-2.5 hover:bg-slate-50/60 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 text-xs truncate">{item.namaBarang}</h3>
                      <span className="text-[10px] text-emerald-700 font-mono">{item.kodeBarang}</span>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 flex items-center gap-1 ${
                    item.kondisi === 'Baik' 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                      : item.kondisi === 'Rusak Ringan'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    {item.kondisi === 'Baik' ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                    {item.kondisi}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Kategori</span>
                    <span className="font-medium text-slate-700 truncate block">{item.kategori}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Volume / Jumlah</span>
                    <span className="font-bold text-slate-900">{item.jumlah} {item.satuan}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Letak / Lokasi</span>
                    <span className="text-slate-700 truncate block">{item.letakRuang}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Tahun Pengadaan</span>
                    <span className="font-mono text-slate-600">{item.tahunPengadaan}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(item.id, item.namaBarang)}
                    className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table View (hidden on mobile, visible on >= md) */}
        <div className="hidden md:block overflow-x-auto max-h-[650px] overflow-y-auto scrollbar-thin">
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
                          if (openActionId === item.id) {
                            setOpenActionId(null);
                            setActionMenuPos(null);
                          } else {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const menuWidth = 200;
                            let left: number | undefined = undefined;
                            let right: number | undefined = undefined;

                            if (rect.left < menuWidth + 24) {
                              left = Math.max(12, rect.right - menuWidth);
                            } else {
                              right = window.innerWidth - rect.left + 8;
                            }

                            const estimatedHeight = 110;
                            let top = rect.top + rect.height / 2 - (estimatedHeight / 2);
                            const minTop = 64;
                            const maxTop = window.innerHeight - estimatedHeight - 16;
                            if (top < minTop) top = minTop;
                            if (top > maxTop) top = Math.max(minTop, maxTop);

                            setActionMenuPos({ top, right, left });
                            setOpenActionId(item.id);
                          }
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

                      {openActionId === item.id && actionMenuPos && createPortal(
                        <div className="fixed inset-0 z-50 pointer-events-none">
                          {/* Invisible backdrop to close menu when clicking outside */}
                          <div 
                            className="fixed inset-0 z-40 cursor-default pointer-events-auto" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenActionId(null);
                              setActionMenuPos(null);
                            }} 
                          />
                          <div 
                            style={{
                              top: `${actionMenuPos.top}px`,
                              right: actionMenuPos.right !== undefined ? `${actionMenuPos.right}px` : undefined,
                              left: actionMenuPos.left !== undefined ? `${actionMenuPos.left}px` : undefined,
                            }}
                            className="fixed z-50 w-48 bg-white/98 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/90 py-1.5 text-xs text-slate-700 divide-y divide-slate-100 ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-150 overflow-y-auto max-h-[calc(100vh-80px)] pointer-events-auto"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="py-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenActionId(null);
                                  setActionMenuPos(null);
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
                                  setActionMenuPos(null);
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
                        </div>,
                        document.body
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 pt-16 sm:pt-6 bg-slate-900/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl p-4 sm:p-5 my-auto max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{editingItem ? 'Edit Sarana Prasarana' : 'Tambah Sarpras Baru'}</span>
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-3 space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Kode Sarpras / Aset *</label>
                <input
                  type="text"
                  required
                  value={formData.kodeBarang}
                  onChange={(e) => setFormData({ ...formData, kodeBarang: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none font-mono"
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
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none"
                  placeholder="Contoh: Ruang Kelas 7B, Proyektor EPSON, Set Meja Kursi"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Kategori</label>
                  <input
                    type="text"
                    required
                    value={formData.kategori}
                    onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none"
                    placeholder="Ketik kategori baru atau pilih..."
                    list="kategori-presets"
                  />
                  <datalist id="kategori-presets">
                    <option value="Ruang Teori/Kelas" />
                    <option value="Ruang Laboratorium" />
                    <option value="Ruang Pimpinan" />
                    <option value="Perpustakaan" />
                    <option value="Peralatan Elektronik" />
                    <option value="Perabot" />
                  </datalist>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Kondisi Fisik</label>
                  <select
                    value={formData.kondisi}
                    onChange={(e) => setFormData({ ...formData, kondisi: e.target.value as any })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none"
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
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Satuan</label>
                  <input
                    type="text"
                    value={formData.satuan}
                    onChange={(e) => setFormData({ ...formData, satuan: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none"
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
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none"
                    placeholder="Gedung A Lantai 1"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Tahun Pengadaan</label>
                  <input
                    type="text"
                    value={formData.tahunPengadaan}
                    onChange={(e) => setFormData({ ...formData, tahunPengadaan: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none font-mono"
                    placeholder="2023"
                  />
                </div>
              </div>

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
                  {editingItem ? 'Simpan Perubahan' : 'Tambah Sarpras'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Sarpras */}
      {deletingSarpras && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pt-16 sm:pt-6 bg-slate-900/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 text-center space-y-4 my-auto max-h-[85vh] overflow-y-auto">
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
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDeleteSarpras}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Ya, Hapus Sarpras
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};
