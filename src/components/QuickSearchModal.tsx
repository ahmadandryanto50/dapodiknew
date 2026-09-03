import React, { useState } from 'react';
import { Search, X, Users, GraduationCap, Building2, FileText, ArrowRight } from 'lucide-react';
import { Student, TeacherStaff, SarprasItem, StudentReport, ActiveTab } from '../types';

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  teachers: TeacherStaff[];
  sarpras: SarprasItem[];
  reports: StudentReport[];
  onNavigate: (tab: ActiveTab) => void;
}

export const QuickSearchModal: React.FC<QuickSearchModalProps> = ({
  isOpen,
  onClose,
  students,
  teachers,
  sarpras,
  reports,
  onNavigate
}) => {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const matchedStudents = query.trim() ? students.filter(s => {
    const namaStr = String(s.nama || '');
    const nisnStr = String(s.nisn || '');
    const rombelStr = String(s.rombel || '');
    const queryLower = query.toLowerCase();
    return namaStr.toLowerCase().includes(queryLower) || 
           nisnStr.includes(query) || 
           rombelStr.toLowerCase().includes(queryLower);
  }) : [];

  const matchedTeachers = query.trim() ? teachers.filter(t => {
    const namaStr = String(t.nama || '');
    const nuptkStr = String(t.nuptk || '');
    const mapelStr = String(t.mapel || '');
    const queryLower = query.toLowerCase();
    return namaStr.toLowerCase().includes(queryLower) || 
           nuptkStr.includes(query) || 
           mapelStr.toLowerCase().includes(queryLower);
  }) : [];

  const matchedSarpras = query.trim() ? sarpras.filter(s => {
    const namaBarangStr = String(s.namaBarang || '');
    const kodeBarangStr = String(s.kodeBarang || '');
    const queryLower = query.toLowerCase();
    return namaBarangStr.toLowerCase().includes(queryLower) || 
           kodeBarangStr.toLowerCase().includes(queryLower);
  }) : [];

  const matchedReports = query.trim() ? reports.filter(r => {
    const studentNameStr = String(r.studentName || '');
    const nisnStr = String(r.nisn || '');
    const queryLower = query.toLowerCase();
    return studentNameStr.toLowerCase().includes(queryLower) || 
           nisnStr.includes(query);
  }) : [];

  const handleSelect = (tab: ActiveTab) => {
    onNavigate(tab);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-slate-200/90 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden text-xs">
        
        {/* Search Input Bar */}
        <div className="relative flex items-center border-b border-slate-100 p-4">
          <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 mr-3 shrink-0">
            <Search className="w-4 h-4" />
          </div>
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari Siswa, NISN, Guru (PTK), Sarpras, atau Rapor..."
            className="w-full bg-transparent text-slate-900 text-sm font-medium focus:outline-none placeholder-slate-400"
          />
          <button 
            onClick={onClose} 
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-96 overflow-y-auto p-4 space-y-4">
          {!query.trim() && (
            <div className="text-center py-10 text-slate-400">
              <Search className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="font-medium">Ketik nama siswa, NISN, nama guru, mata pelajaran, atau ruangan untuk mencari instan.</p>
            </div>
          )}

          {/* Students Result */}
          {matchedStudents.length > 0 && (
            <div>
              <div className="text-[11px] font-extrabold text-sky-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>Peserta Didik ({matchedStudents.length})</span>
              </div>
              <div className="space-y-1.5">
                {matchedStudents.slice(0, 4).map(s => (
                  <div
                    key={s.id}
                    onClick={() => handleSelect('siswa')}
                    className="p-3 rounded-2xl bg-white hover:bg-sky-50/60 border border-slate-200/80 hover:border-sky-300 cursor-pointer flex items-center justify-between transition-all shadow-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{s.nama}</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">NISN: {s.nisn} • {s.rombel} • Status: {s.status}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-sky-600" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PTK Result */}
          {matchedTeachers.length > 0 && (
            <div>
              <div className="text-[11px] font-extrabold text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Pendidik & Tendik ({matchedTeachers.length})</span>
              </div>
              <div className="space-y-1.5">
                {matchedTeachers.slice(0, 4).map(t => (
                  <div
                    key={t.id}
                    onClick={() => handleSelect('ptk')}
                    className="p-3 rounded-2xl bg-white hover:bg-amber-50/60 border border-slate-200/80 hover:border-amber-300 cursor-pointer flex items-center justify-between transition-all shadow-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{t.nama}</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">NUPTK: {t.nuptk} • {t.mapel} ({t.statusKepegawaian})</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-amber-600" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sarpras Result */}
          {matchedSarpras.length > 0 && (
            <div>
              <div className="text-[11px] font-extrabold text-emerald-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                <span>Sarpras & Aset ({matchedSarpras.length})</span>
              </div>
              <div className="space-y-1.5">
                {matchedSarpras.slice(0, 4).map(sr => (
                  <div
                    key={sr.id}
                    onClick={() => handleSelect('sarpras')}
                    className="p-3 rounded-2xl bg-white hover:bg-emerald-50/60 border border-slate-200/80 hover:border-emerald-300 cursor-pointer flex items-center justify-between transition-all shadow-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{sr.namaBarang}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{sr.kodeBarang} • Kondisi: {sr.kondisi} ({sr.jumlah} {sr.satuan})</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-emerald-600" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reports Result */}
          {matchedReports.length > 0 && (
            <div>
              <div className="text-[11px] font-extrabold text-rose-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>Rapor Siswa ({matchedReports.length})</span>
              </div>
              <div className="space-y-1.5">
                {matchedReports.slice(0, 4).map(rp => (
                  <div
                    key={rp.id}
                    onClick={() => handleSelect('rapor')}
                    className="p-3 rounded-2xl bg-white hover:bg-rose-50/60 border border-slate-200/80 hover:border-rose-300 cursor-pointer flex items-center justify-between transition-all shadow-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{rp.studentName}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Rombel: {rp.rombel} • Semester: {rp.semester} {rp.tahunAjaran}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-rose-600" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {query.trim() && matchedStudents.length === 0 && matchedTeachers.length === 0 && matchedSarpras.length === 0 && matchedReports.length === 0 && (
            <div className="text-center py-8 text-slate-400 font-medium">
              Tidak ditemukan data yang cocok dengan "{query}".
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
