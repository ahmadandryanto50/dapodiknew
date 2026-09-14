import { Student, TeacherStaff, SarprasItem, StudentReport, NotificationItem, AdminUser, SchoolAccount } from '../types';

export const initialStudents: Student[] = [];

export const initialTeachers: TeacherStaff[] = [];

export const initialSarpras: SarprasItem[] = [];

export const initialReports: StudentReport[] = [];

export const initialNotifications: NotificationItem[] = [];

export const initialSchoolAccounts: SchoolAccount[] = [
  {
    id: 'school-40203578',
    npsn: '40203578',
    namaSekolah: 'SMP NEGERI 11 PALU',
    password: 'alalal123',
    status: 'Aktif',
    role: 'Administrator',
    bentukPendidikan: 'Sekolah Menengah Pertama (SMP)',
    kepalaSekolah: 'Drs. Bambang Sudarsono, M.Pd.',
    nipKepalaSekolah: '197805122005011002',
    alamat: 'Jl. Keramik, Kelurahan Duyu, Kecamatan Tatanga',
    kabupatenKota: 'Kota Palu',
    provinsi: 'Sulawesi Tengah',
    spreadsheetUrl: '1XmLmshCOhSktRfzW8uG_8RqxlxVCQt5eUVekEFLwj_M',
    kontakAdmin: '081234567890 (Ahmad Andryanto)',
    catatan: 'Sekolah Induk / Utama (Administrator Pembuat Aplikasi)',
    createdAt: '01/08/2026',
    lastLogin: '14/09/2026 10:00'
  }
];

export const initialAdministrators: AdminUser[] = [
  {
    id: 'adm-001',
    username: 'admin',
    password: 'alalal123',
    nama: 'Ahmad Andryanto (Administrator)',
    role: 'Administrator',
    email: 'ahmad.andryanto50@admin.smp.belajar.id',
    noHp: '081234567890',
    status: 'Aktif',
    lastLogin: '31/08/2026 22:30'
  },
  {
    id: 'adm-002',
    username: 'operator',
    password: 'operator123',
    nama: 'Operator Dapodik Sekolah',
    role: 'Operator',
    email: 'operator@smp.belajar.id',
    noHp: '081298765432',
    status: 'Aktif',
    lastLogin: '31/08/2026 21:15'
  },
  {
    id: 'adm-003',
    username: 'kepsek',
    password: 'kepsek123',
    nama: 'Drs. Bambang Sudarsono, M.Pd.',
    role: 'Kepala Sekolah',
    email: 'kepala.sekolah@smp.belajar.id',
    noHp: '081345678901',
    status: 'Aktif',
    lastLogin: '30/08/2026 14:20'
  }
];
