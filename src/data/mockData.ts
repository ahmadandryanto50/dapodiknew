import { Student, TeacherStaff, SarprasItem, KibBItem, StudentReport, NotificationItem, AdminUser, SchoolAccount } from '../types';

export const initialStudents: Student[] = [];

export const initialTeachers: TeacherStaff[] = [];

export const initialSarpras: SarprasItem[] = [];

export const initialKibB: KibBItem[] = [
  {
    id: 'kib-001',
    no: 1,
    namaBarang: 'Timbangan Meja Kapasitas 5 kg',
    kodeBarang: '1.3.2.03.03.010.003',
    kondisi: 'Baik',
    merkType: '',
    ukuranCc: '',
    bahan: '',
    tahun: '2017',
    noPabrik: '',
    noRangka: '',
    noMesin: '',
    noPolisi: '',
    noBpkb: '',
    asalUsul: 'DAK / P2HP',
    harga: '1.467.800',
    keterangan: 'Ruang Wakasek'
  },
  {
    id: 'kib-002',
    no: 2,
    namaBarang: 'Lemari Besi',
    kodeBarang: '1.3.2.05.01.04.001',
    kondisi: 'Baik',
    merkType: 'Lion',
    ukuranCc: '',
    bahan: 'Besi Plat',
    tahun: '2018',
    noPabrik: '',
    noRangka: '',
    noMesin: '',
    noPolisi: '',
    noBpkb: '',
    asalUsul: 'BOS',
    harga: '2.500.000',
    keterangan: 'Ruang Tata Usaha'
  },
  {
    id: 'kib-003',
    no: 3,
    namaBarang: 'LCD Projector',
    kodeBarang: '1.3.2.05.01.05.0043',
    kondisi: 'Baik',
    merkType: 'Optoma Projector',
    ukuranCc: '',
    bahan: 'Campuran',
    tahun: '2020',
    noPabrik: '',
    noRangka: '',
    noMesin: '',
    noPolisi: '',
    noBpkb: '',
    asalUsul: 'BOS',
    harga: '6.000.000',
    keterangan: 'Ruang Lab Komputer'
  },
  {
    id: 'kib-004',
    no: 4,
    namaBarang: 'LCD Projector',
    kodeBarang: '1.3.2.05.01.05.0043',
    kondisi: 'Baik',
    merkType: 'Optoma Projector',
    ukuranCc: '',
    bahan: 'Campuran',
    tahun: '2021',
    noPabrik: '',
    noRangka: '',
    noMesin: '',
    noPolisi: '',
    noBpkb: '',
    asalUsul: 'BOS',
    harga: '6.500.000',
    keterangan: 'Ruang Kelas / Guru'
  }
];

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
