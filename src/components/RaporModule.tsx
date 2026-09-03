import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Download, 
  Printer, 
  Edit3, 
  Trash2, 
  ArrowLeft, 
  Award,
  CheckCircle2,
  ChevronRight,
  X
} from 'lucide-react';
import { StudentReport, Student, SubjectScore } from '../types';
import { exportToCSV } from '../services/googleSheetsService';

interface RaporModuleProps {
  reports: StudentReport[];
  students: Student[];
  onAddReport: (report: StudentReport) => void;
  onUpdateReport: (report: StudentReport) => void;
  onDeleteReport: (id: string) => void;
  onBackToHome: () => void;
  schoolProfile?: any;
}

export const RaporModule: React.FC<RaporModuleProps> = ({
  reports,
  students,
  onAddReport,
  onUpdateReport,
  onDeleteReport,
  onBackToHome,
  schoolProfile
}) => {
  const [search, setSearch] = useState('');
  const [filterRombel, setFilterRombel] = useState('ALL');
  const [selectedReportForPrint, setSelectedReportForPrint] = useState<StudentReport | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<StudentReport | null>(null);

  const defaultSubjects: SubjectScore[] = [
    { mapel: 'Pendidikan Agama & Budi Pekerti', nilaiPengetahuan: 85, nilaiKeterampilan: 88, predikat: 'A', catatan: 'Sangat baik dalam pemahaman akidah dan ibadah.' },
    { mapel: 'Pendidikan Pancasila (PPKn)', nilaiPengetahuan: 85, nilaiKeterampilan: 86, predikat: 'B', catatan: 'Mampu berpartisipasi aktif dalam norma hukum.' },
    { mapel: 'Bahasa Indonesia', nilaiPengetahuan: 90, nilaiKeterampilan: 90, predikat: 'A', catatan: 'Sangat terampil dalam menyusun teks ulasan.' },
    { mapel: 'Matematika', nilaiPengetahuan: 88, nilaiKeterampilan: 88, predikat: 'A', catatan: 'Menguasai konsep aljabar dan geometri.' },
    { mapel: 'Ilmu Pengetahuan Alam (IPA)', nilaiPengetahuan: 87, nilaiKeterampilan: 89, predikat: 'A', catatan: 'Aktif dalam percobaan sains dan ekosistem.' },
    { mapel: 'Ilmu Pengetahuan Sosial (IPS)', nilaiPengetahuan: 85, nilaiKeterampilan: 87, predikat: 'B', catatan: 'Memahami interaksi sosial dan kegiatan ekonomi.' },
    { mapel: 'Bahasa Inggris', nilaiPengetahuan: 88, nilaiKeterampilan: 90, predikat: 'A', catatan: 'Sangat percaya diri dalam komunikasi bahasa Inggris.' },
    { mapel: 'Informatika', nilaiPengetahuan: 92, nilaiKeterampilan: 94, predikat: 'A', catatan: 'Unggul dalam pengolahan data dan algoritma.' }
  ];

  const [formData, setFormData] = useState<Omit<StudentReport, 'id'>>({
    studentId: '',
    nisn: '',
    studentName: '',
    rombel: 'Kelas 8A',
    semester: 'Genap',
    tahunAjaran: '2025/2026',
    scores: defaultSubjects,
    kehadiran: { sakit: 0, izin: 0, alpa: 0 },
    catatanWaliKelas: 'Tingkatkan terus semangat belajar dan berprestasi.',
    statusKenaikan: 'Naik Kelas'
  });

  const filteredReports = reports.filter(r => {
    const matchSearch = r.studentName.toLowerCase().includes(search.toLowerCase()) || r.nisn.includes(search);
    const matchRombel = filterRombel === 'ALL' || r.rombel === filterRombel;
    return matchSearch && matchRombel;
  });

  const handleOpenAdd = () => {
    setEditingReport(null);
    const firstStudent = students[0];
    setFormData({
      studentId: firstStudent ? firstStudent.id : 'std-001',
      nisn: firstStudent ? firstStudent.nisn : '0089123456',
      studentName: firstStudent ? firstStudent.nama : 'Ahmad Fauzi',
      rombel: firstStudent ? firstStudent.rombel : 'Kelas 8A',
      semester: 'Genap',
      tahunAjaran: '2025/2026',
      scores: defaultSubjects,
      kehadiran: { sakit: 1, izin: 1, alpa: 0 },
      catatanWaliKelas: 'Sangat aktif dan berprestasi baik di kelas.',
      statusKenaikan: 'Naik Kelas'
    });
    setIsModalOpen(true);
  };

  const handleSelectStudentChange = (stdId: string) => {
    const std = students.find(s => s.id === stdId);
    if (std) {
      setFormData({
        ...formData,
        studentId: std.id,
        nisn: std.nisn,
        studentName: std.nama,
        rombel: std.rombel
      });
    }
  };

  const handleScoreChange = (index: number, field: 'nilaiPengetahuan' | 'nilaiKeterampilan', val: number) => {
    const newScores = [...formData.scores];
    newScores[index][field] = val;
    const avg = (newScores[index].nilaiPengetahuan + newScores[index].nilaiKeterampilan) / 2;
    newScores[index].predikat = avg >= 90 ? 'A' : avg >= 80 ? 'B' : avg >= 70 ? 'C' : 'D';
    setFormData({ ...formData, scores: newScores });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingReport) {
      onUpdateReport({
        ...formData,
        id: editingReport.id
      });
    } else {
      onAddReport({
        ...formData,
        id: `rep-${Date.now().toString().slice(-4)}`
      });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 backdrop-blur-xl border border-slate-200/80 p-5 rounded-2xl shadow-sm">
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
              <h1 className="text-xl font-bold text-slate-900">Rapor & Penilaian Belajar</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                {reports.length} Buku Rapor Siswa
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Evaluasi capaian kompetensi, predikat nilai, absensi, dan pencetakan lembar rapor resmi
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => exportToCSV(reports, 'DAPODIK_DATA_RAPOR')}
            className="px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Ekspor Database</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Entri Rapor Baru</span>
          </button>
        </div>
      </div>

      {/* Reports Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredReports.map((report) => {
          const scoresList = Array.isArray(report.scores) ? report.scores : [];
          const avgScore = Math.round(
            scoresList.reduce((acc, curr) => acc + ((curr.nilaiPengetahuan || 0) + (curr.nilaiKeterampilan || 0)) / 2, 0) / (scoresList.length || 1)
          );

          return (
            <div
              key={report.id}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-rose-300 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded-full border border-rose-200">
                      {report.rombel}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1.5 leading-tight">{report.studentName}</h3>
                    <p className="text-xs text-slate-500 font-mono">NISN: {report.nisn}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-extrabold text-rose-600">{avgScore}</div>
                    <div className="text-[10px] text-slate-400">Rata-rata</div>
                  </div>
                </div>

                <div className="py-3 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Semester / T.A.:</span>
                    <span className="font-semibold text-slate-900">{report.semester} {report.tahunAjaran}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Kehadiran (S/I/A):</span>
                    <span className="font-semibold text-slate-900">{report.kehadiran.sakit} Sakit, {report.kehadiran.izin} Izin, {report.kehadiran.alpa} Alpa</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Status Kenaikan:</span>
                    <span className="font-bold text-emerald-600">{report.statusKenaikan}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-700 italic line-clamp-2">
                    "{report.catatanWaliKelas}"
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedReportForPrint(report)}
                  className="flex-1 py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs border border-rose-200 transition-all flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Lembar Rapor</span>
                </button>
                <button
                  onClick={() => onDeleteReport(report.id)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                  title="Hapus Rapor"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add / Edit Report */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-rose-600" />
                <span>Entri Nilai & Lembar Rapor Siswa</span>
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Pilih Siswa *</label>
                  <select
                    value={formData.studentId}
                    onChange={(e) => handleSelectStudentChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-rose-500 focus:bg-white focus:outline-none"
                  >
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.nama} ({s.rombel})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Semester</label>
                  <select
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-rose-500 focus:bg-white focus:outline-none"
                  >
                    <option value="Ganjil">Ganjil</option>
                    <option value="Genap">Genap</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Tahun Ajaran</label>
                  <input
                    type="text"
                    value={formData.tahunAjaran}
                    onChange={(e) => setFormData({ ...formData, tahunAjaran: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-rose-500 focus:bg-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Subject Table Inputs */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2">Nilai Capaian Mata Pelajaran (0 - 100)</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Mata Pelajaran</th>
                        <th className="py-2.5 px-3 w-28 text-center">Pengetahuan</th>
                        <th className="py-2.5 px-3 w-28 text-center">Keterampilan</th>
                        <th className="py-2.5 px-3 w-16 text-center">Predikat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(Array.isArray(formData.scores) ? formData.scores : []).map((score, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-medium text-slate-800">{score.mapel}</td>
                          <td className="py-2 px-3 text-center">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={score.nilaiPengetahuan}
                              onChange={(e) => handleScoreChange(idx, 'nilaiPengetahuan', parseInt(e.target.value) || 0)}
                              className="w-20 px-2 py-1 bg-white border border-slate-200 rounded text-center text-slate-900 focus:border-rose-500"
                            />
                          </td>
                          <td className="py-2 px-3 text-center">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={score.nilaiKeterampilan}
                              onChange={(e) => handleScoreChange(idx, 'nilaiKeterampilan', parseInt(e.target.value) || 0)}
                              className="w-20 px-2 py-1 bg-white border border-slate-200 rounded text-center text-slate-900 focus:border-rose-500"
                            />
                          </td>
                          <td className="py-2 px-3 text-center font-bold text-rose-600">
                            {score.predikat}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Attendance & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Sakit (Hari)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.kehadiran.sakit}
                    onChange={(e) => setFormData({ ...formData, kehadiran: { ...formData.kehadiran, sakit: parseInt(e.target.value) || 0 } })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Izin (Hari)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.kehadiran.izin}
                    onChange={(e) => setFormData({ ...formData, kehadiran: { ...formData.kehadiran, izin: parseInt(e.target.value) || 0 } })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Alpa (Hari)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.kehadiran.alpa}
                    onChange={(e) => setFormData({ ...formData, kehadiran: { ...formData.kehadiran, alpa: parseInt(e.target.value) || 0 } })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Catatan Wali Kelas</label>
                <textarea
                  rows={2}
                  value={formData.catatanWaliKelas}
                  onChange={(e) => setFormData({ ...formData, catatanWaliKelas: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-rose-500"
                />
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
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-sm transition-colors"
                >
                  Simpan Lembar Rapor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Printed Report Modal */}
      {selectedReportForPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white text-slate-900 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl p-8 space-y-6">
            <div className="flex items-center justify-between border-b pb-4 border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-extrabold text-xl">
                  D
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight text-blue-900 uppercase">
                    LAPORAN HASIL BELAJAR PESERTA DIDIK
                  </h2>
                  <p className="text-xs text-slate-600 font-medium">
                    KEMENTERIAN PENDIDIKAN, KEBUDAYAAN, RISET, DAN TEKNOLOGI
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedReportForPrint(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Student Info */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <div><strong>Nama Siswa:</strong> {selectedReportForPrint.studentName}</div>
                <div><strong>NISN:</strong> {selectedReportForPrint.nisn}</div>
                <div><strong>Sekolah:</strong> {schoolProfile?.namaSekolah || 'SMP NEGERI 11 PALU'}</div>
              </div>
              <div>
                <div><strong>Kelas / Rombel:</strong> {selectedReportForPrint.rombel}</div>
                <div><strong>Semester / T.A.:</strong> {selectedReportForPrint.semester} - {selectedReportForPrint.tahunAjaran}</div>
                <div><strong>NPSN:</strong> {schoolProfile?.npsn || '40203578'}</div>
              </div>
            </div>

            {/* Grade Table */}
            <table className="w-full text-left text-xs border border-slate-300">
              <thead className="bg-slate-100 font-bold border-b border-slate-300">
                <tr>
                  <th className="p-2.5 border-r border-slate-300">No</th>
                  <th className="p-2.5 border-r border-slate-300">Mata Pelajaran</th>
                  <th className="p-2.5 border-r border-slate-300 text-center">Pengetahuan</th>
                  <th className="p-2.5 border-r border-slate-300 text-center">Keterampilan</th>
                  <th className="p-2.5 border-r border-slate-300 text-center">Predikat</th>
                  <th className="p-2.5">Capaian Kompetensi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {(Array.isArray(selectedReportForPrint.scores) ? selectedReportForPrint.scores : []).map((sc, idx) => (
                  <tr key={idx}>
                    <td className="p-2 border-r border-slate-200 font-mono text-center">{idx + 1}</td>
                    <td className="p-2 border-r border-slate-200 font-semibold">{sc.mapel}</td>
                    <td className="p-2 border-r border-slate-200 text-center font-mono font-bold">{sc.nilaiPengetahuan}</td>
                    <td className="p-2 border-r border-slate-200 text-center font-mono font-bold">{sc.nilaiKeterampilan}</td>
                    <td className="p-2 border-r border-slate-200 text-center font-bold text-blue-700">{sc.predikat}</td>
                    <td className="p-2 text-[11px] text-slate-700">{sc.catatan}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Attendance & Signatures */}
            <div className="grid grid-cols-2 gap-6 text-xs pt-4 border-t border-slate-200">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="font-bold mb-1">Ketidakhadiran:</h4>
                <div>Sakit: {selectedReportForPrint.kehadiran.sakit} hari</div>
                <div>Izin: {selectedReportForPrint.kehadiran.izin} hari</div>
                <div>Tanpa Keterangan: {selectedReportForPrint.kehadiran.alpa} hari</div>
                <div className="mt-2 font-bold text-emerald-700">Keputusan: {selectedReportForPrint.statusKenaikan}</div>
              </div>

              <div className="text-center space-y-12">
                <div>Wali Kelas,</div>
                <div className="font-bold underline">Siti Rahmawati, S.Pd.</div>
                <div className="text-[10px] text-slate-500">NIP. 198503152010012015</div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak / Simpan PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
