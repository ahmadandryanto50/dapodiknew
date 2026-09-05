/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  ActiveTab, 
  Student, 
  TeacherStaff, 
  SarprasItem, 
  StudentReport, 
  SyncConfig, 
  NotificationItem,
  AppDisplayConfig,
  SchoolProfile,
  AdminUser
} from './types';
import { 
  initialStudents, 
  initialTeachers, 
  initialSarpras, 
  initialReports, 
  initialNotifications,
  initialAdministrators
} from './data/mockData';
import { syncToGoogleSheets, loadFromGoogleSheets } from './services/googleSheetsService';
import { LoginScreen } from './components/LoginScreen';
import { WelcomeHero } from './components/WelcomeHero';
import { StudentModule } from './components/StudentModule';
import { SchoolModule } from './components/SchoolModule';
import { PtkModule } from './components/PtkModule';
import { SarprasModule } from './components/SarprasModule';
import { RaporModule } from './components/RaporModule';
import { LaporanModule } from './components/LaporanModule';
import { SettingsModule } from './components/SettingsModule';
import { AplikasiModule } from './components/AplikasiModule';
import { GoogleSheetModal } from './components/GoogleSheetModal';
import { QuickSearchModal } from './components/QuickSearchModal';
import { NotificationDrawer } from './components/NotificationDrawer';
import { SafeImage } from './components/SafeImage';
import { formatDateIndonesian, cleanLeadingZerosCode } from './utils/dateUtils';
import { 
  Home, 
  School,
  Users, 
  GraduationCap, 
  Building2, 
  FileText, 
  BarChart3, 
  Settings, 
  Database, 
  RefreshCw,
  Bell,
  Search,
  LogOut,
  Shield,
  Laptop,
  Menu,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';

const sanitizeTeacherDates = (teachersList: TeacherStaff[]): TeacherStaff[] => {
  if (!Array.isArray(teachersList)) return [];
  return teachersList.map(t => ({
    ...t,
    nuptk: cleanLeadingZerosCode(t.nuptk, 'nuptk'),
    nip: cleanLeadingZerosCode(t.nip, 'nip'),
    nik: cleanLeadingZerosCode(t.nik, 'nik'),
    noHp: cleanLeadingZerosCode(t.noHp, 'noHp'),
    noKk: cleanLeadingZerosCode(t.noKk, 'noKk'),
    rt: cleanLeadingZerosCode(t.rt, 'rt'),
    rw: cleanLeadingZerosCode(t.rw, 'rw'),
    kodePos: cleanLeadingZerosCode(t.kodePos, 'kodePos'),
    tanggalLahir: t.tanggalLahir ? formatDateIndonesian(t.tanggalLahir) : '',
    tanggalCpns: t.tanggalCpns ? formatDateIndonesian(t.tanggalCpns) : '',
    tmtPengangkatan: t.tmtPengangkatan ? formatDateIndonesian(t.tmtPengangkatan) : '',
    tmtPns: t.tmtPns ? formatDateIndonesian(t.tmtPns) : ''
  }));
};

const sanitizeStudentDates = (studentsList: Student[]): Student[] => {
  if (!Array.isArray(studentsList)) return [];
  return studentsList.map(s => ({
    ...s,
    nisn: cleanLeadingZerosCode(s.nisn, 'nisn'),
    nis: cleanLeadingZerosCode(s.nis, 'nis'),
    nik: cleanLeadingZerosCode(s.nik, 'nik'),
    hp: cleanLeadingZerosCode(s.hp, 'hp'),
    telepon: cleanLeadingZerosCode(s.telepon, 'telepon'),
    rt: cleanLeadingZerosCode(s.rt, 'rt'),
    rw: cleanLeadingZerosCode(s.rw, 'rw'),
    kodePos: cleanLeadingZerosCode(s.kodePos, 'kodePos'),
    noKk: cleanLeadingZerosCode(s.noKk, 'noKk'),
    tanggalLahir: s.tanggalLahir ? formatDateIndonesian(s.tanggalLahir) : ''
  }));
};

const sanitizeSchoolProfileDates = (sp: SchoolProfile): SchoolProfile => {
  if (!sp) return sp;
  return {
    ...sp,
    tmtMenjabat: sp.tmtMenjabat ? formatDateIndonesian(sp.tmtMenjabat) : '',
    tanggalSkPendirian: sp.tanggalSkPendirian ? formatDateIndonesian(sp.tanggalSkPendirian) : '',
    tanggalSkIzinOperasional: sp.tanggalSkIzinOperasional ? formatDateIndonesian(sp.tanggalSkIzinOperasional) : ''
  };
};

const sanitizeReports = (raporList: any[]): StudentReport[] => {
  if (!Array.isArray(raporList)) return [];
  return raporList.map((r: any) => {
    let parsedScores = r.scores;
    if (typeof parsedScores === 'string') {
      try {
        parsedScores = JSON.parse(parsedScores);
      } catch (e) {
        parsedScores = [];
      }
    }
    let parsedKehadiran = r.kehadiran;
    if (typeof parsedKehadiran === 'string') {
      try {
        parsedKehadiran = JSON.parse(parsedKehadiran);
      } catch (e) {
        parsedKehadiran = { sakit: 0, izin: 0, alpa: 0 };
      }
    }
    return {
      ...r,
      scores: Array.isArray(parsedScores) ? parsedScores : [],
      kehadiran: parsedKehadiran && typeof parsedKehadiran === 'object' ? parsedKehadiran : { sakit: 0, izin: 0, alpa: 0 }
    };
  });
};

function getCleanAdministrators(admins: AdminUser[]): AdminUser[] {
  if (!Array.isArray(admins)) return [];
  let deletedUsernames: string[] = [];
  try {
    const delStr = localStorage.getItem('dapodik_deleted_admins');
    if (delStr) deletedUsernames = JSON.parse(delStr);
  } catch (e) {
    console.error(e);
  }
  return admins.filter(
    (a) => a && a.username && !deletedUsernames.includes(a.username.trim().toLowerCase())
  );
}

export default function App() {
  // Authentication State
  const [administrators, setAdministrators] = useState<AdminUser[]>(() => {
    const saved = localStorage.getItem('dapodik_administrators');
    const list = saved ? JSON.parse(saved) : initialAdministrators;
    return getCleanAdministrators(list);
  });

  const [currentUser, setCurrentUser] = useState<AdminUser | null>(() => {
    const saved = localStorage.getItem('dapodik_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('dapodik_authenticated') === 'true';
  });

  // Ref to prevent background polling from overwriting local state right after user operations
  const lastLocalMutationRef = useRef<number>(0);

  // State Initialization from LocalStorage
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('dapodik_students');
    const data = saved ? JSON.parse(saved) : initialStudents;
    return sanitizeStudentDates(data);
  });

  const [teachers, setTeachers] = useState<TeacherStaff[]>(() => {
    const saved = localStorage.getItem('dapodik_teachers');
    const data = saved ? JSON.parse(saved) : initialTeachers;
    return sanitizeTeacherDates(data);
  });

  const [sarpras, setSarpras] = useState<SarprasItem[]>(() => {
    const saved = localStorage.getItem('dapodik_sarpras');
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse dapodik_sarpras', e);
      }
    }
    return initialSarpras;
  });

  const [reports, setReports] = useState<StudentReport[]>(() => {
    const saved = localStorage.getItem('dapodik_reports');
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return sanitizeReports(parsed);
        }
      } catch (e) {
        console.error('Failed to parse dapodik_reports', e);
      }
    }
    return sanitizeReports(initialReports);
  });

  const [displayConfig, setDisplayConfig] = useState<AppDisplayConfig>(() => {
    const saved = localStorage.getItem('dapodik_display_config');
    const parsed = saved ? JSON.parse(saved) : {
      appName: 'DAPODIK',
      appVersion: '2026.b',
      appSubtitle: '',
      logoCustomUrl: '/logo_smpn11palu.jpg',
      welcomeGreeting: 'SELAMAT DATANG',
      welcomeTitle: 'DI DAPODIK',
      welcomeSubtitle: 'DATA POKOK PENDIDIKAN',
      curriculumBadge: 'Kurikulum Merdeka Ready',
      footerVersionText: 'Dapodik Cloud 2026.a (Next.js & Vercel Ready)'
    };
    if (parsed.appSubtitle === 'KEMENDIKBUDRISTEK' || !parsed.appSubtitle) {
      parsed.appSubtitle = '';
    }
    if (!parsed.logoCustomUrl || parsed.logoCustomUrl.includes('facebook.com')) {
      parsed.logoCustomUrl = '/logo_smpn11palu.jpg';
    }
    if (parsed.appVersion === '2026.A' || parsed.appVersion === '2026.B') {
      parsed.appVersion = '2026.b';
    }
    return parsed;
  });

  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile>(() => {
    const saved = localStorage.getItem('dapodik_school_profile');
    const data = saved ? JSON.parse(saved) : {
      npsn: '40203578',
      namaSekolah: 'SMP NEGERI 11 PALU',
      logoSekolah: '/logo_smpn11palu.jpg',
      bentukPendidikan: 'Sekolah Menengah Pertama (SMP)',
      statusSekolah: 'Negeri',
      alamat: 'Jl. Keramik, Kelurahan Duyu, Kecamatan Tatanga',
      desaKelurahan: 'Duyu',
      kecamatan: 'Tatanga',
      kabupatenKota: 'Kota Palu',
      provinsi: 'Sulawesi Tengah',
      kepalaSekolah: 'Drs. Bambang Sudarsono, M.Pd.',
      nipKepalaSekolah: '197805122005011002',
      pangkatGolongan: 'Pembina Tk. I / IV-b',
      tmtMenjabat: '01 Juli 2021',
      fotoKepalaSekolah: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&auto=format&fit=crop&q=80',
      akreditasi: 'A (Unggul)',
      kurikulum: 'Kurikulum Merdeka',
      luasTanah: '12.500 m²',
      luasBangunan: '4.850 m²',
      dayaTampung: '384 Siswa (12 Rombel)',
      jumlahRombel: '12 Rombel',
      keterangan: 'Sekolah Ramah Anak, Adiwiyata Mandiri, dan Sekolah Penggerak Angkatan I'
    };
    if (data.namaSekolah === 'SMP Negeri Unggulan 1' || !data.namaSekolah) {
      data.namaSekolah = 'SMP NEGERI 11 PALU';
    }
    if (data.npsn === '20109988' || !data.npsn) {
      data.npsn = '40203578';
    }
    if (data.alamat?.includes('Jl. Pendidikan No. 12') || !data.alamat) {
      data.alamat = 'Jl. Keramik, Kelurahan Duyu, Kecamatan Tatanga';
      data.desaKelurahan = 'Duyu';
      data.kecamatan = 'Tatanga';
      data.kabupatenKota = 'Kota Palu';
      data.provinsi = 'Sulawesi Tengah';
    }
    if (!data.logoSekolah || data.logoSekolah.includes('facebook.com')) {
      data.logoSekolah = '/logo_smpn11palu.jpg';
    }
    return sanitizeSchoolProfileDates(data);
  });

  const [syncConfig, setSyncConfig] = useState<SyncConfig>(() => {
    const saved = localStorage.getItem('dapodik_sync_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.webAppUrl) {
          return parsed;
        }
      } catch (e) {
        // Fallback to hardcoded default
      }
    }
    return {
      spreadsheetUrl: '1XmLmshCOhSktRfzW8uG_8RqxlxVCQt5eUVekEFLwj_M',
      webAppUrl: 'https://script.google.com/macros/s/AKfycbwHOEkfJ7iJVAlTKUVboM7ZHd13dX9Z6adJBH6N2UwA-LbDmTrJvxPHuBB8T4kePUmJAQ/exec',
      sheetId: '',
      autoSync: true,
      lastSynced: null,
      status: 'connected',
      mode: 'appscript'
    };
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem('dapodik_notifications');
    return saved ? JSON.parse(saved) : initialNotifications;
  });

  const [aplikasiLinks, setAplikasiLinks] = useState<any[]>(() => {
    const saved = localStorage.getItem('dapodik_aplikasi_links');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback to default in module
      }
    }
    return [];
  });

  // UI Modals
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [settingsInitialFilter, setSettingsInitialFilter] = useState<'all' | '1' | '2' | '3' | '4' | '5'>('all');

  const handleOpenEditDisplay = (filter: 'all' | '1' | '2' | '3' | '4' | '5' = 'all') => {
    setSettingsInitialFilter(filter);
    setActiveTab('pengaturan');
  };

  // Save application data cache to server so that it is shared across all browsers/devices
  const saveCacheToServer = async (
    customStudents = students,
    customTeachers = teachers,
    customSarpras = sarpras,
    customReports = reports,
    customDisplayConfig = displayConfig,
    customSchoolProfile = schoolProfile,
    customAdministrators = administrators,
    customNotifications = notifications,
    customAplikasiLinks = aplikasiLinks
  ) => {
    if (!isInitialized) return;
    try {
      await fetch('/api/app-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          students: customStudents,
          teachers: customTeachers,
          sarpras: customSarpras,
          reports: customReports,
          displayConfig: customDisplayConfig,
          schoolProfile: customSchoolProfile,
          administrators: customAdministrators,
          notifications: customNotifications,
          aplikasiLinks: customAplikasiLinks
        })
      });
    } catch (err) {
      console.error('Failed to save data cache to server:', err);
    }
  };

  // Save sync config to server so that it is shared across all browsers/devices
  const saveSyncConfigToServer = async (newConfig: SyncConfig) => {
    if (!isInitialized) return;
    try {
      await fetch('/api/sync-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      });
    } catch (err) {
      console.error('Failed to save sync config to server:', err);
    }
  };

  // Save to LocalStorage & Server Cache
  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem('dapodik_students', JSON.stringify(students));
    saveCacheToServer(students, teachers, sarpras, reports, displayConfig, schoolProfile, administrators, notifications);
  }, [students, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem('dapodik_teachers', JSON.stringify(teachers));
    saveCacheToServer(students, teachers, sarpras, reports, displayConfig, schoolProfile, administrators, notifications);
  }, [teachers, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem('dapodik_sarpras', JSON.stringify(sarpras));
    saveCacheToServer(students, teachers, sarpras, reports, displayConfig, schoolProfile, administrators, notifications);
  }, [sarpras, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem('dapodik_reports', JSON.stringify(reports));
    saveCacheToServer(students, teachers, sarpras, reports, displayConfig, schoolProfile, administrators, notifications);
  }, [reports, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem('dapodik_display_config', JSON.stringify(displayConfig));
    saveCacheToServer(students, teachers, sarpras, reports, displayConfig, schoolProfile, administrators, notifications);
  }, [displayConfig, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem('dapodik_administrators', JSON.stringify(administrators));
    saveCacheToServer(students, teachers, sarpras, reports, displayConfig, schoolProfile, administrators, notifications);
  }, [administrators, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem('dapodik_school_profile', JSON.stringify(schoolProfile));
    saveCacheToServer(students, teachers, sarpras, reports, displayConfig, schoolProfile, administrators, notifications);
  }, [schoolProfile, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem('dapodik_sync_config', JSON.stringify(syncConfig));
    saveSyncConfigToServer(syncConfig);
  }, [syncConfig, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem('dapodik_notifications', JSON.stringify(notifications));
    saveCacheToServer(students, teachers, sarpras, reports, displayConfig, schoolProfile, administrators, notifications);
  }, [notifications, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem('dapodik_aplikasi_links', JSON.stringify(aplikasiLinks));
    saveCacheToServer(students, teachers, sarpras, reports, displayConfig, schoolProfile, administrators, notifications, aplikasiLinks);
  }, [aplikasiLinks, isInitialized]);

  // Auth Handlers
  const handleLogin = (user: AdminUser) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    localStorage.setItem('dapodik_current_user', JSON.stringify(user));
    localStorage.setItem('dapodik_authenticated', 'true');
    showToast(`Selamat datang kembali, ${user.nama}!`);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem('dapodik_authenticated');
    localStorage.removeItem('dapodik_current_user');
    showToast('Anda telah keluar dari sistem.');
  };

  const handleSaveAdministrators = (newAdmins: AdminUser[]) => {
    const cleanAdmins = getCleanAdministrators(newAdmins);
    setAdministrators(cleanAdmins);
    localStorage.setItem('dapodik_administrators', JSON.stringify(cleanAdmins));
    saveCacheToServer(students, teachers, sarpras, reports, displayConfig, schoolProfile, cleanAdmins, notifications, aplikasiLinks);
    showToast('Data akun pengguna berhasil diperbarui & disinkronkan.');
    triggerAutoSync(students, teachers, sarpras, reports, displayConfig, schoolProfile, cleanAdmins, true);
  };

  const handlePullFromSheets = async (silent = false) => {
    if (!syncConfig.webAppUrl) {
      if (!silent) showToast('Isi URL Google Apps Script terlebih dahulu.');
      return false;
    }
    setIsSyncing(true);
    const res = await loadFromGoogleSheets(syncConfig);
    setIsSyncing(false);
    
    if (res.success && res.data) {
      const { siswa, ptk, sarpras: pulledSarpras, rapor, pengaturan, administrator, profilSekolah } = res.data;
      
      if (Array.isArray(siswa)) setStudents(sanitizeStudentDates(siswa));
      if (Array.isArray(ptk)) setTeachers(sanitizeTeacherDates(ptk));
      if (Array.isArray(pulledSarpras)) setSarpras(pulledSarpras);
      if (Array.isArray(rapor)) setReports(sanitizeReports(rapor));
      if (Array.isArray(administrator) && administrator.length > 0) {
        const cleanPulled = getCleanAdministrators(administrator);
        setAdministrators(cleanPulled);
        localStorage.setItem('dapodik_administrators', JSON.stringify(cleanPulled));
        saveCacheToServer(students, teachers, sarpras, reports, displayConfig, schoolProfile, cleanPulled, notifications, aplikasiLinks);
      }
      
      if (profilSekolah && profilSekolah.length > 0) {
        const profileMap: any = {};
        profilSekolah.forEach((item: any) => {
          if (item.key) {
            let val = item.value;
            if (item.key === 'misi' && typeof val === 'string') {
              try {
                if (val.trim().startsWith('[')) {
                  val = JSON.parse(val);
                } else if (val.includes(',')) {
                  val = val.split(',').map((v: string) => v.trim());
                } else {
                  val = [val];
                }
              } catch (e) {
                val = [val];
              }
            }
            profileMap[item.key] = val;
          }
        });
        if (Object.keys(profileMap).length > 0) {
          setSchoolProfile(prev => sanitizeSchoolProfileDates({ ...prev, ...profileMap }));
        }
      }
      
      if (pengaturan && pengaturan.length > 0) {
        const configMap: any = {};
        const profileMap: any = {};
        pengaturan.forEach((item: any) => {
          if (item.key) {
            configMap[item.key] = item.value;
            profileMap[item.key] = item.value;
          }
        });
        if (Object.keys(configMap).length > 0) {
          setDisplayConfig(prev => {
            const merged = { ...prev };
            Object.keys(configMap).forEach(key => {
              if ((key === 'logoCustomUrl' || key === 'welcomeCustomIconUrl' || key === 'operatorAvatarUrl') && !configMap[key]) {
                return;
              }
              if (key in merged || ['appName', 'appVersion', 'appSubtitle', 'logoCustomUrl', 'welcomeGreeting', 'welcomeTitle', 'welcomeSubtitle', 'welcomeIconType', 'welcomeCustomIconUrl', 'curriculumBadge', 'curriculumBadgeIcon', 'footerVersionText', 'operatorTitle', 'operatorName', 'operatorAvatarUrl'].includes(key)) {
                (merged as any)[key] = configMap[key];
              }
            });
            return merged;
          });

          setSchoolProfile(prev => {
            const merged = { ...prev };
            if (configMap.logoCustomUrl || configMap.logoSekolah) {
              merged.logoSekolah = configMap.logoCustomUrl || configMap.logoSekolah;
            }
            if (configMap.operatorName || configMap.operatorSekolah) {
              merged.operatorSekolah = configMap.operatorName || configMap.operatorSekolah;
            }
            Object.keys(profileMap).forEach(key => {
              if (key in merged) {
                (merged as any)[key] = profileMap[key];
              }
            });
            return sanitizeSchoolProfileDates(merged);
          });
        }
      }

      setSyncConfig(prev => ({
        ...prev,
        lastSynced: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        status: 'connected'
      }));

      // Update current user if they are logged in and their data in the sheet changed
      const savedUserStr = localStorage.getItem('dapodik_current_user');
      if (savedUserStr && administrator && administrator.length > 0) {
        const currentSaved = JSON.parse(savedUserStr);
        const matched = administrator.find((a: AdminUser) => a.username.toLowerCase() === currentSaved.username.toLowerCase());
        if (matched) {
          setCurrentUser(matched);
          localStorage.setItem('dapodik_current_user', JSON.stringify(matched));
        }
      }

      if (!silent) {
        showToast('Data berhasil disinkronkan dari Database!');
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      }
      return true;
    } else {
      if (!silent) {
        showToast(res.message);
      }
      return false;
    }
  };

  // Auto-pull on mount if configured & fetch shared configurations from the server
  useEffect(() => {
    const fetchSharedServerData = async () => {
      try {
        let serverConfig = null;
        let serverData = null;

        // 1. Fetch sync configuration from server (if server backend exists, e.g., in developer preview container)
        try {
          const configRes = await fetch('/api/sync-config');
          if (configRes.ok && configRes.headers.get('content-type')?.includes('application/json')) {
            serverConfig = await configRes.json();
          }
        } catch (e) {
          console.log('Using pre-baked sync config defaults (Vercel/GitHub static hosting environment detected)');
        }
        
        // 2. Fetch data cache from server (if server backend exists)
        try {
          const dataRes = await fetch('/api/app-data');
          if (dataRes.ok && dataRes.headers.get('content-type')?.includes('application/json')) {
            serverData = await dataRes.json();
          }
        } catch (e) {
          console.log('Using cached data from Google Sheets API directly (Vercel/GitHub static hosting environment detected)');
        }
        
        // Apply sync configuration from server if valid
        let activeConfig = syncConfig;
        if (serverConfig && serverConfig.webAppUrl) {
          setSyncConfig(serverConfig);
          activeConfig = serverConfig;
        }
        
        // Apply cached data from server if valid
        if (serverData && Object.keys(serverData).length > 0) {
          if (serverData.students) setStudents(sanitizeStudentDates(serverData.students));
          if (serverData.teachers) setTeachers(sanitizeTeacherDates(serverData.teachers));
          if (serverData.sarpras) setSarpras(serverData.sarpras);
          if (serverData.reports) setReports(sanitizeReports(serverData.reports));
          if (serverData.displayConfig) setDisplayConfig(serverData.displayConfig);
          if (serverData.schoolProfile) setSchoolProfile(sanitizeSchoolProfileDates(serverData.schoolProfile));
          if (serverData.administrators) {
            const cleanServerAdmins = getCleanAdministrators(serverData.administrators);
            setAdministrators(cleanServerAdmins);
            localStorage.setItem('dapodik_administrators', JSON.stringify(cleanServerAdmins));
          }
          if (serverData.notifications) setNotifications(serverData.notifications);
          if (serverData.aplikasiLinks && Array.isArray(serverData.aplikasiLinks) && serverData.aplikasiLinks.length > 0) {
            setAplikasiLinks(serverData.aplikasiLinks);
            localStorage.setItem('dapodik_aplikasi_links', JSON.stringify(serverData.aplikasiLinks));
          }
        }
        
        // 3. If spreadsheet is configured, automatically perform a pull to make sure everything is absolutely in sync
        if (activeConfig.webAppUrl) {
          setIsSyncing(true);
          const res = await loadFromGoogleSheets(activeConfig);
          setIsSyncing(false);
          
          if (res.success && res.data) {
            const { siswa, ptk, sarpras: pulledSarpras, rapor, pengaturan, administrator, profilSekolah, aplikasi } = res.data;
            
            if (Array.isArray(aplikasi) && aplikasi.length > 0) {
              setAplikasiLinks(aplikasi);
              localStorage.setItem('dapodik_aplikasi_links', JSON.stringify(aplikasi));
            }
            
            if (Array.isArray(siswa)) setStudents(sanitizeStudentDates(siswa));
            if (Array.isArray(ptk)) setTeachers(sanitizeTeacherDates(ptk));
            if (Array.isArray(pulledSarpras)) setSarpras(pulledSarpras);
            if (Array.isArray(rapor)) setReports(sanitizeReports(rapor));
            if (Array.isArray(administrator) && administrator.length > 0) {
              const cleanPulled = getCleanAdministrators(administrator);
              setAdministrators(cleanPulled);
              localStorage.setItem('dapodik_administrators', JSON.stringify(cleanPulled));
            }
            
            if (profilSekolah && profilSekolah.length > 0) {
              const profileMap: any = {};
              profilSekolah.forEach((item: any) => {
                if (item.key) {
                  let val = item.value;
                  if (item.key === 'misi' && typeof val === 'string') {
                    try {
                      if (val.trim().startsWith('[')) {
                        val = JSON.parse(val);
                      } else if (val.includes(',')) {
                        val = val.split(',').map((v: string) => v.trim());
                      } else {
                        val = [val];
                      }
                    } catch (e) {
                      val = [val];
                    }
                  }
                  profileMap[item.key] = val;
                }
              });
              if (Object.keys(profileMap).length > 0) {
                setSchoolProfile(prev => {
                  const merged = { ...prev };
                  Object.keys(profileMap).forEach(key => {
                    if ((key === 'logoSekolah' || key === 'fotoKepalaSekolah') && !profileMap[key]) {
                      return;
                    }
                    merged[key] = profileMap[key];
                  });
                  return sanitizeSchoolProfileDates(merged);
                });
              }
            }
            
            if (pengaturan && pengaturan.length > 0) {
              const configMap: any = {};
              const profileMap: any = {};
              pengaturan.forEach((item: any) => {
                if (item.key) {
                  configMap[item.key] = item.value;
                  profileMap[item.key] = item.value;
                }
              });
              if (Object.keys(configMap).length > 0) {
                setDisplayConfig(prev => {
                  const merged = { ...prev };
                  Object.keys(configMap).forEach(key => {
                    if ((key === 'logoCustomUrl' || key === 'welcomeCustomIconUrl' || key === 'operatorAvatarUrl') && !configMap[key]) {
                      return;
                    }
                    (merged as any)[key] = configMap[key];
                  });
                  return merged;
                });

                setSchoolProfile(prev => {
                  const merged = { ...prev };
                  if (configMap.logoCustomUrl || configMap.logoSekolah) {
                    merged.logoSekolah = configMap.logoCustomUrl || configMap.logoSekolah;
                  }
                  if (configMap.operatorName || configMap.operatorSekolah) {
                    merged.operatorSekolah = configMap.operatorName || configMap.operatorSekolah;
                  }
                  Object.keys(profileMap).forEach(key => {
                    if (key in merged) {
                      (merged as any)[key] = profileMap[key];
                    }
                  });
                  return sanitizeSchoolProfileDates(merged);
                });
              }
            }
            
            setSyncConfig(prev => ({
              ...prev,
              ...activeConfig,
              lastSynced: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              status: 'connected'
            }));
            
            showToast('Sinkronisasi otomatis dari Database berhasil!');
          }
        }
        setIsInitialized(true);
      } catch (err) {
        console.error('Error fetching shared server data:', err);
        setIsInitialized(true);
      }
    };
    
    fetchSharedServerData();
  }, []);

  // Synchronize data in real-time across preview, browser, and mobile tabs
  useEffect(() => {
    if (!isInitialized) return;

    let isPolling = false;

    const revalidateData = async () => {
      if (isPolling) return;
      isPolling = true;
      try {
        let serverConfig = null;
        try {
          const configRes = await fetch('/api/sync-config');
          if (configRes.ok && configRes.headers.get('content-type')?.includes('application/json')) {
            serverConfig = await configRes.json();
          }
        } catch (e) {
          // Backend offline or non-existent (Vercel/GitHub Pages)
        }

        if (serverConfig && serverConfig.webAppUrl) {
          setSyncConfig(prev => {
            if (JSON.stringify(prev) !== JSON.stringify(serverConfig)) {
              return serverConfig;
            }
            return prev;
          });
        }

        let serverData = null;
        try {
          const dataRes = await fetch('/api/app-data');
          if (dataRes.ok && dataRes.headers.get('content-type')?.includes('application/json')) {
            serverData = await dataRes.json();
          }
        } catch (e) {
          // Backend offline or non-existent
        }

        if (serverData && Object.keys(serverData).length > 0) {
          // If a local mutation occurred in the last 4 seconds, skip overwriting local state with server data
          if (Date.now() - lastLocalMutationRef.current < 4000) {
            return;
          }
          // Compare and update only if different to prevent redundant writes or feedback loops
          if (serverData.students) {
            setStudents(prev => {
              const incoming = sanitizeStudentDates(serverData.students);
              if (JSON.stringify(prev) !== JSON.stringify(incoming)) {
                return incoming;
              }
              return prev;
            });
          }
          if (serverData.teachers) {
            setTeachers(prev => {
              const incoming = sanitizeTeacherDates(serverData.teachers);
              if (JSON.stringify(prev) !== JSON.stringify(incoming)) {
                return incoming;
              }
              return prev;
            });
          }
          if (serverData.sarpras) {
            setSarpras(prev => {
              if (JSON.stringify(prev) !== JSON.stringify(serverData.sarpras)) {
                return serverData.sarpras;
              }
              return prev;
            });
          }
          if (serverData.reports) {
            setReports(prev => {
              const incoming = sanitizeReports(serverData.reports);
              if (JSON.stringify(prev) !== JSON.stringify(incoming)) {
                return incoming;
              }
              return prev;
            });
          }
          if (serverData.displayConfig) {
            setDisplayConfig(prev => {
              if (JSON.stringify(prev) !== JSON.stringify(serverData.displayConfig)) {
                return serverData.displayConfig;
              }
              return prev;
            });
          }
          if (serverData.schoolProfile) {
            setSchoolProfile(prev => {
              const incoming = sanitizeSchoolProfileDates(serverData.schoolProfile);
              if (JSON.stringify(prev) !== JSON.stringify(incoming)) {
                return incoming;
              }
              return prev;
            });
          }
          if (serverData.administrators) {
            setAdministrators(prev => {
              if (JSON.stringify(prev) !== JSON.stringify(serverData.administrators)) {
                return serverData.administrators;
              }
              return prev;
            });
          }
          if (serverData.notifications) {
            setNotifications(prev => {
              if (JSON.stringify(prev) !== JSON.stringify(serverData.notifications)) {
                return serverData.notifications;
              }
              return prev;
            });
          }
          if (serverData.aplikasiLinks && Array.isArray(serverData.aplikasiLinks)) {
            setAplikasiLinks(prev => {
              if (JSON.stringify(prev) !== JSON.stringify(serverData.aplikasiLinks)) {
                localStorage.setItem('dapodik_aplikasi_links', JSON.stringify(serverData.aplikasiLinks));
                return serverData.aplikasiLinks;
              }
              return prev;
            });
          }
        }
      } catch (err) {
        // Silently handle polling errors
      } finally {
        isPolling = false;
      }
    };

    // Poll every 5 seconds for fast cross-tab and device synchronization
    const pollInterval = setInterval(revalidateData, 5000);

    // Refresh immediately on window focus
    const handleFocus = () => {
      revalidateData();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isInitialized]);

  // Keyboard shortcut ⌘K for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Build settings payload for Google Sheets Data_Pengaturan
  const buildPengaturanPayload = (dConfig = displayConfig, sProfile = schoolProfile) => {
    return [
      { key: 'appName', value: dConfig.appName },
      { key: 'appVersion', value: dConfig.appVersion },
      { key: 'appSubtitle', value: dConfig.appSubtitle },
      { key: 'logoCustomUrl', value: dConfig.logoCustomUrl || sProfile.logoSekolah || '' },
      { key: 'logoSekolah', value: sProfile.logoSekolah || dConfig.logoCustomUrl || '' },
      { key: 'welcomeGreeting', value: dConfig.welcomeGreeting },
      { key: 'welcomeTitle', value: dConfig.welcomeTitle },
      { key: 'welcomeSubtitle', value: dConfig.welcomeSubtitle },
      { key: 'welcomeIconType', value: dConfig.welcomeIconType || 'school' },
      { key: 'welcomeCustomIconUrl', value: dConfig.welcomeCustomIconUrl || '' },
      { key: 'curriculumBadge', value: dConfig.curriculumBadge },
      { key: 'curriculumBadgeIcon', value: dConfig.curriculumBadgeIcon || 'check' },
      { key: 'footerVersionText', value: dConfig.footerVersionText },
      { key: 'operatorTitle', value: dConfig.operatorTitle || 'Operator Sekolah' },
      { key: 'operatorName', value: dConfig.operatorName || sProfile.operatorSekolah || sProfile.namaSekolah || '' },
      { key: 'operatorAvatarUrl', value: dConfig.operatorAvatarUrl || '' },
      // 1. Identitas & Legalitas
      { key: 'npsn', value: sProfile.npsn || '' },
      { key: 'namaSekolah', value: sProfile.namaSekolah || '' },
      { key: 'bentukPendidikan', value: sProfile.bentukPendidikan || '' },
      { key: 'statusSekolah', value: sProfile.statusSekolah || '' },
      { key: 'akreditasi', value: sProfile.akreditasi || '' },
      { key: 'kurikulum', value: sProfile.kurikulum || '' },
      { key: 'skPendirian', value: sProfile.skPendirian || '' },
      { key: 'tanggalSkPendirian', value: sProfile.tanggalSkPendirian || '' },
      { key: 'skIzinOperasional', value: sProfile.skIzinOperasional || '' },
      { key: 'tanggalSkIzinOperasional', value: sProfile.tanggalSkIzinOperasional || '' },
      { key: 'statusKepemilikan', value: sProfile.statusKepemilikan || '' },
      { key: 'namaYayasan', value: sProfile.namaYayasan || '' },
      // 2. Lokasi & Kontak
      { key: 'alamat', value: sProfile.alamat || '' },
      { key: 'rtRwDusun', value: sProfile.rtRwDusun || '' },
      { key: 'desaKelurahan', value: sProfile.desaKelurahan || '' },
      { key: 'kecamatan', value: sProfile.kecamatan || '' },
      { key: 'kabupatenKota', value: sProfile.kabupatenKota || '' },
      { key: 'provinsi', value: sProfile.provinsi || '' },
      { key: 'kodePos', value: sProfile.kodePos || '' },
      { key: 'telepon', value: sProfile.telepon || '' },
      { key: 'email', value: sProfile.email || '' },
      { key: 'website', value: sProfile.website || '' },
      { key: 'dayaListrik', value: sProfile.dayaListrik || '' },
      { key: 'aksesInternet', value: sProfile.aksesInternet || '' },
      // 3. Pimpinan & Manajemen
      { key: 'kepalaSekolah', value: sProfile.kepalaSekolah || '' },
      { key: 'nipKepalaSekolah', value: sProfile.nipKepalaSekolah || '' },
      { key: 'pangkatGolongan', value: sProfile.pangkatGolongan || 'Pembina Tk. I / IV-b' },
      { key: 'tmtMenjabat', value: sProfile.tmtMenjabat || '01 Juli 2021' },
      { key: 'fotoKepalaSekolah', value: sProfile.fotoKepalaSekolah || '' },
      { key: 'operatorSekolah', value: sProfile.operatorSekolah || '' },
      { key: 'bendaharaBos', value: sProfile.bendaharaBos || '' },
      { key: 'komiteSekolah', value: sProfile.komiteSekolah || '' },
      // 4. Visi & Misi
      { key: 'visi', value: sProfile.visi || '' },
      { key: 'misi', value: Array.isArray(sProfile.misi) ? JSON.stringify(sProfile.misi) : (sProfile.misi || '') },
      // 5. Rekapitulasi & Sarana
      { key: 'luasTanah', value: sProfile.luasTanah || '' },
      { key: 'luasBangunan', value: sProfile.luasBangunan || '' },
      { key: 'dayaTampung', value: sProfile.dayaTampung || '' },
      { key: 'jumlahRombel', value: sProfile.jumlahRombel || '' },
      { key: 'keterangan', value: sProfile.keterangan || '' }
    ];
  };

  const buildProfilSekolahPayload = (sProfile = schoolProfile) => {
    return [
      { key: 'npsn', value: sProfile.npsn || '' },
      { key: 'namaSekolah', value: sProfile.namaSekolah || '' },
      { key: 'bentukPendidikan', value: sProfile.bentukPendidikan || '' },
      { key: 'statusSekolah', value: sProfile.statusSekolah || '' },
      { key: 'logoSekolah', value: sProfile.logoSekolah || '' },
      { key: 'alamat', value: sProfile.alamat || '' },
      { key: 'rtRwDusun', value: sProfile.rtRwDusun || '' },
      { key: 'desaKelurahan', value: sProfile.desaKelurahan || '' },
      { key: 'kecamatan', value: sProfile.kecamatan || '' },
      { key: 'kabupatenKota', value: sProfile.kabupatenKota || '' },
      { key: 'provinsi', value: sProfile.provinsi || '' },
      { key: 'kepalaSekolah', value: sProfile.kepalaSekolah || '' },
      { key: 'nipKepalaSekolah', value: sProfile.nipKepalaSekolah || '' },
      { key: 'pangkatGolongan', value: sProfile.pangkatGolongan || '' },
      { key: 'tmtMenjabat', value: sProfile.tmtMenjabat || '' },
      { key: 'fotoKepalaSekolah', value: sProfile.fotoKepalaSekolah || '' },
      { key: 'akreditasi', value: sProfile.akreditasi || '' },
      { key: 'kurikulum', value: sProfile.kurikulum || '' },
      { key: 'kodePos', value: sProfile.kodePos || '' },
      { key: 'telepon', value: sProfile.telepon || '' },
      { key: 'email', value: sProfile.email || '' },
      { key: 'website', value: sProfile.website || '' },
      { key: 'skPendirian', value: sProfile.skPendirian || '' },
      { key: 'tanggalSkPendirian', value: sProfile.tanggalSkPendirian || '' },
      { key: 'skIzinOperasional', value: sProfile.skIzinOperasional || '' },
      { key: 'tanggalSkIzinOperasional', value: sProfile.tanggalSkIzinOperasional || '' },
      { key: 'statusKepemilikan', value: sProfile.statusKepemilikan || '' },
      { key: 'namaYayasan', value: sProfile.namaYayasan || '' },
      { key: 'operatorSekolah', value: sProfile.operatorSekolah || '' },
      { key: 'bendaharaBos', value: sProfile.bendaharaBos || '' },
      { key: 'komiteSekolah', value: sProfile.komiteSekolah || '' },
      { key: 'luasTanah', value: sProfile.luasTanah || '' },
      { key: 'luasBangunan', value: sProfile.luasBangunan || '' },
      { key: 'dayaListrik', value: sProfile.dayaListrik || '' },
      { key: 'aksesInternet', value: sProfile.aksesInternet || '' },
      { key: 'dayaTampung', value: sProfile.dayaTampung || '' },
      { key: 'jumlahRombel', value: sProfile.jumlahRombel || '' },
      { key: 'keterangan', value: sProfile.keterangan || '' },
      { key: 'visi', value: sProfile.visi || '' },
      { key: 'misi', value: Array.isArray(sProfile.misi) ? JSON.stringify(sProfile.misi) : (sProfile.misi || '') }
    ];
  };

  const buildAplikasiPayload = () => {
    if (aplikasiLinks && aplikasiLinks.length > 0) {
      return aplikasiLinks;
    }
    const saved = localStorage.getItem('dapodik_aplikasi_links');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        // Fallback default
      }
    }
    return [
      { id: '1', label: 'Login Dapodik', url: 'https://sp.datadik.kemdikbud.go.id/', icon: 'Laptop', color: 'from-indigo-500 to-indigo-600' },
      { id: '2', label: 'PTK Datadik', url: 'https://ptk.datadik.kemdikbud.go.id/', icon: 'Database', color: 'from-pink-500 to-pink-600' },
      { id: '3', label: 'Area Member', url: 'https://daftarpemberi.kemdikbud.go.id/', icon: 'Globe', color: 'from-indigo-600 to-purple-600' },
      { id: '4', label: 'SP Datadik', url: 'https://sp.datadik.kemdikbud.go.id/', icon: 'School', color: 'from-blue-500 to-blue-600' },
      { id: '5', label: 'Info GTK', url: 'https://info.gtk.kemdikbud.go.id/', icon: 'Info', color: 'from-cyan-400 to-cyan-500' },
      { id: '6', label: 'Prefill 1', url: 'https://dapo.kemdikbud.go.id/unduh', icon: 'Archive', color: 'from-blue-600 to-blue-700' },
      { id: '7', label: 'Verval PD', url: 'https://vervalpd.data.kemdikbud.go.id/', icon: 'Users', color: 'from-pink-600 to-rose-600' },
      { id: '8', label: 'NISN', url: 'https://nisn.data.kemdikbud.go.id/', icon: 'FileText', color: 'from-orange-500 to-orange-600' },
      { id: '9', label: 'Prefill 2', url: 'https://dapo.kemdikbud.go.id/unduh', icon: 'Archive', color: 'from-blue-500 to-sky-600' },
      { id: '10', label: 'Verval PTK', url: 'https://vervalptk.data.kemdikbud.go.id/', icon: 'UserCheck', color: 'from-amber-500 to-amber-600' },
      { id: '11', label: 'BOSP Salur', url: 'https://bos.kemdikbud.go.id/', icon: 'Wallet', color: 'from-teal-500 to-emerald-600' },
      { id: '12', label: 'Login SDM', url: 'https://sdm.data.kemdikbud.go.id/', icon: 'ShieldCheck', color: 'from-cyan-500 to-blue-500' },
      { id: '13', label: 'Verval SP', url: 'https://vervalsp.data.kemdikbud.go.id/', icon: 'ShieldCheck', color: 'from-indigo-500 to-blue-600' },
      { id: '14', label: 'RSDM', url: 'https://sdm.data.kemdikbud.go.id/', icon: 'Box', color: 'from-orange-600 to-amber-700' },
      { id: '15', label: 'Web Dapodik', url: 'https://dapo.kemdikbud.go.id/', icon: 'Laptop', color: 'from-red-500 to-red-600' }
    ];
  };

  // Real-time Cloud Sync Trigger
  const triggerAutoSync = async (
    customStudents = students,
    customTeachers = teachers,
    customSarpras = sarpras,
    customReports = reports,
    customDisplayConfig = displayConfig,
    customSchoolProfile = schoolProfile,
    customAdministrators = administrators,
    force = false
  ) => {
    if (!syncConfig.webAppUrl) return;
    if (!syncConfig.autoSync && !force) return;
    setIsSyncing(true);
    const res = await syncToGoogleSheets(syncConfig, {
      siswa: customStudents,
      ptk: customTeachers,
      sarpras: customSarpras,
      rapor: customReports,
      pengaturan: buildPengaturanPayload(customDisplayConfig, customSchoolProfile),
      administrator: customAdministrators,
      profilSekolah: buildProfilSekolahPayload(customSchoolProfile),
      aplikasi: buildAplikasiPayload()
    });
    setIsSyncing(false);
    if (res.success) {
      setSyncConfig(prev => ({
        ...prev,
        lastSynced: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        status: 'connected'
      }));
      if (force) {
        showToast('Data berhasil disimpan & disinkronkan ke Database!');
      }
    } else {
      if (force) {
        showToast('Tersimpan lokal. Gagal sinkron ke Database: ' + res.message);
      }
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    if (!syncConfig.webAppUrl) {
      setIsSheetsModalOpen(true);
      setIsSyncing(false);
      return;
    }
    const res = await syncToGoogleSheets(syncConfig, {
      siswa: students,
      ptk: teachers,
      sarpras: sarpras,
      rapor: reports,
      pengaturan: buildPengaturanPayload(displayConfig, schoolProfile),
      administrator: administrators,
      profilSekolah: buildProfilSekolahPayload(schoolProfile),
      aplikasi: buildAplikasiPayload()
    });
    setIsSyncing(false);
    if (res.success) {
      setSyncConfig(prev => ({
        ...prev,
        lastSynced: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        status: 'connected'
      }));
      showToast('Data berhasil disinkronkan ke Database!');
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    } else {
      showToast(res.message);
    }
  };

  const handleSaveDisplayConfig = (newConfig: AppDisplayConfig) => {
    let finalLogo = displayConfig.logoCustomUrl || schoolProfile.logoSekolah || '';
    if (newConfig.logoCustomUrl !== displayConfig.logoCustomUrl) {
      finalLogo = newConfig.logoCustomUrl || '';
    }
    const updatedProfile = { ...schoolProfile, logoSekolah: finalLogo };
    const updatedDisplay = { ...newConfig, logoCustomUrl: finalLogo };

    setDisplayConfig(updatedDisplay);
    setSchoolProfile(updatedProfile);
    showToast('Teks & tampilan disimpan...');
    triggerAutoSync(students, teachers, sarpras, reports, updatedDisplay, updatedProfile, administrators, true);
  };

  const handleSaveSchoolProfile = (newProfile: SchoolProfile) => {
    let finalLogo = displayConfig.logoCustomUrl || schoolProfile.logoSekolah || '';
    if (newProfile.logoSekolah !== schoolProfile.logoSekolah) {
      finalLogo = newProfile.logoSekolah || '';
    }
    const updatedProfile = { ...newProfile, logoSekolah: finalLogo };
    const updatedDisplay = { ...displayConfig, logoCustomUrl: finalLogo };

    setSchoolProfile(updatedProfile);
    setDisplayConfig(updatedDisplay);
    showToast('Profil sekolah disimpan...');
    triggerAutoSync(students, teachers, sarpras, reports, updatedDisplay, updatedProfile, administrators, true);
  };

  const handleSaveAllSettings = (newConfig: AppDisplayConfig, newProfile: SchoolProfile) => {
    let finalLogo = displayConfig.logoCustomUrl || schoolProfile.logoSekolah || '';
    
    if (newProfile.logoSekolah !== schoolProfile.logoSekolah) {
      finalLogo = newProfile.logoSekolah || '';
    } else if (newConfig.logoCustomUrl !== displayConfig.logoCustomUrl) {
      finalLogo = newConfig.logoCustomUrl || '';
    } else if (newProfile.logoSekolah !== newConfig.logoCustomUrl) {
      finalLogo = newProfile.logoSekolah || newConfig.logoCustomUrl || '';
    }

    const updatedProfile = sanitizeSchoolProfileDates({ ...newProfile, logoSekolah: finalLogo });
    const updatedDisplay = { ...newConfig, logoCustomUrl: finalLogo };

    setDisplayConfig(updatedDisplay);
    setSchoolProfile(updatedProfile);
    
    showToast('Semua pengaturan dan profil sekolah berhasil disimpan...');
    triggerAutoSync(students, teachers, sarpras, reports, updatedDisplay, updatedProfile, administrators, true);
  };

  // Student Handlers
  const handleAddStudent = (std: Student) => {
    const updated = sanitizeStudentDates([std, ...students]);
    setStudents(updated);
    showToast(`Siswa "${std.nama}" ditambahkan...`);
    triggerAutoSync(updated, teachers, sarpras, reports, displayConfig, schoolProfile, administrators, true);
  };

  const handleUpdateStudent = (std: Student) => {
    const updated = sanitizeStudentDates(students.map(s => s.id === std.id ? std : s));
    setStudents(updated);
    showToast(`Data siswa "${std.nama}" diperbarui...`);
    triggerAutoSync(updated, teachers, sarpras, reports, displayConfig, schoolProfile, administrators, true);
  };

  const handleDeleteStudent = (id: string) => {
    lastLocalMutationRef.current = Date.now();
    const updated = sanitizeStudentDates(students.filter(s => s.id !== id));
    setStudents(updated);
    localStorage.setItem('dapodik_students', JSON.stringify(updated));
    saveCacheToServer(updated, teachers, sarpras, reports, displayConfig, schoolProfile, administrators, notifications);
    showToast('Data siswa dihapus...');
    triggerAutoSync(updated, teachers, sarpras, reports, displayConfig, schoolProfile, administrators, true);
  };

  const handleMoveToStudentKeluar = (studentId: string, reason: 'Mutasi' | 'Putus sekolah' | 'Wafat/Meninggal' | 'Dikeluarkan' | 'Mengundurkan diri') => {
    const updated = sanitizeStudentDates(students.map(s => {
      if (s.id === studentId) {
        return {
          ...s,
          status: reason as any,
          alasanKeluar: reason
        };
      }
      return s;
    }));
    setStudents(updated);
    showToast(`Berhasil memindahkan siswa ke Data Siswa Keluar (${reason})`);
    triggerAutoSync(updated, teachers, sarpras, reports, displayConfig, schoolProfile, administrators, true);
  };

  const handleDeleteStudentKeluar = (id: string) => {
    handleDeleteStudent(id);
  };

  const handleRestoreStudent = (studentId: string) => {
    const updated = sanitizeStudentDates(students.map(s => {
      if (s.id === studentId) {
        return {
          ...s,
          status: 'Aktif' as any,
          alasanKeluar: '',
          tahunLulus: undefined
        };
      }
      return s;
    }));
    setStudents(updated);
    showToast('Berhasil menarik siswa kembali ke Data Siswa Aktif');
    triggerAutoSync(updated, teachers, sarpras, reports, displayConfig, schoolProfile, administrators, true);
  };

  const handleGraduateStudent = (studentId: string, tahunLulus: string, noSeriIjazah?: string) => {
    const targetStudent = students.find(s => s.id === studentId);
    const updated = sanitizeStudentDates(students.map(s => {
      if (s.id === studentId) {
        return {
          ...s,
          status: 'Lulus' as any,
          alasanKeluar: 'Lulus',
          tahunLulus: tahunLulus,
          ...(noSeriIjazah ? { noSeriIjazah } : {})
        };
      }
      return s;
    }));
    setStudents(updated);
    showToast(`🎓 Siswa "${targetStudent?.nama || 'Siswa'}" berhasil dipindahkan ke Menu Alumni (Tahun Lulus: ${tahunLulus})`);
    triggerAutoSync(updated, teachers, sarpras, reports, displayConfig, schoolProfile, administrators, true);
  };

  const handleImportStudents = (imported: Student[], append: boolean) => {
    let updated: Student[];
    if (append) {
      const existingIds = new Set(students.map(s => s.id));
      const filtered = imported.filter(s => !existingIds.has(s.id));
      updated = sanitizeStudentDates([...filtered, ...students]);
    } else {
      updated = sanitizeStudentDates([...imported]);
    }
    setStudents(updated);
    showToast(`🎉 Sukses mengimpor ${imported.length} data siswa!`);
    triggerAutoSync(updated, teachers, sarpras, reports, displayConfig, schoolProfile, administrators, true);
  };

  // Teacher Handlers
  const handleAddTeacher = (t: TeacherStaff) => {
    const updated = sanitizeTeacherDates([t, ...teachers]);
    setTeachers(updated);
    showToast(`PTK "${t.nama}" ditambahkan...`);
    triggerAutoSync(students, updated, sarpras, reports, displayConfig, schoolProfile, administrators, true);
  };

  const handleUpdateTeacher = (t: TeacherStaff) => {
    const updated = sanitizeTeacherDates(teachers.map(tc => tc.id === t.id ? t : tc));
    setTeachers(updated);
    showToast(`Data PTK "${t.nama}" diperbarui...`);
    triggerAutoSync(students, updated, sarpras, reports, displayConfig, schoolProfile, administrators, true);
  };

  const handleDeleteTeacher = (id: string) => {
    lastLocalMutationRef.current = Date.now();
    const updated = sanitizeTeacherDates(teachers.filter(t => t.id !== id));
    setTeachers(updated);
    localStorage.setItem('dapodik_teachers', JSON.stringify(updated));
    saveCacheToServer(students, updated, sarpras, reports, displayConfig, schoolProfile, administrators, notifications);
    showToast('Data PTK dihapus...');
    triggerAutoSync(students, updated, sarpras, reports, displayConfig, schoolProfile, administrators, true);
  };

  const handleImportTeachers = (imported: TeacherStaff[], append: boolean) => {
    let updated: TeacherStaff[];
    if (append) {
      const existingIds = new Set(teachers.map(t => t.id));
      const filtered = imported.filter(t => !existingIds.has(t.id));
      updated = sanitizeTeacherDates([...filtered, ...teachers]);
    } else {
      updated = sanitizeTeacherDates([...imported]);
    }
    setTeachers(updated);
    showToast(`🎉 Sukses mengimpor ${imported.length} data PTK!`);
    triggerAutoSync(students, updated, sarpras, reports, displayConfig, schoolProfile, administrators, true);
  };

  // Sarpras Handlers
  const handleAddSarpras = (s: SarprasItem) => {
    lastLocalMutationRef.current = Date.now();
    const updated = [s, ...sarpras];
    setSarpras(updated);
    localStorage.setItem('dapodik_sarpras', JSON.stringify(updated));
    saveCacheToServer(students, teachers, updated, reports, displayConfig, schoolProfile, administrators, notifications);
    showToast(`Sarpras "${s.namaBarang}" ditambahkan...`);
    triggerAutoSync(students, teachers, updated, reports, displayConfig, schoolProfile, administrators, true);
  };

  const handleUpdateSarpras = (s: SarprasItem) => {
    lastLocalMutationRef.current = Date.now();
    const updated = sarpras.map(sp => sp.id === s.id ? s : sp);
    setSarpras(updated);
    localStorage.setItem('dapodik_sarpras', JSON.stringify(updated));
    saveCacheToServer(students, teachers, updated, reports, displayConfig, schoolProfile, administrators, notifications);
    showToast(`Data sarpras "${s.namaBarang}" diperbarui...`);
    triggerAutoSync(students, teachers, updated, reports, displayConfig, schoolProfile, administrators, true);
  };

  const handleDeleteSarpras = (id: string) => {
    lastLocalMutationRef.current = Date.now();
    const updated = sarpras.filter(s => s.id !== id);
    setSarpras(updated);
    localStorage.setItem('dapodik_sarpras', JSON.stringify(updated));
    saveCacheToServer(students, teachers, updated, reports, displayConfig, schoolProfile, administrators, notifications);
    showToast('Data sarpras dihapus...');
    triggerAutoSync(students, teachers, updated, reports, displayConfig, schoolProfile, administrators, true);
  };

  // Reports Handlers
  const handleAddReport = (r: StudentReport) => {
    lastLocalMutationRef.current = Date.now();
    const updated = [r, ...reports];
    setReports(updated);
    localStorage.setItem('dapodik_reports', JSON.stringify(updated));
    saveCacheToServer(students, teachers, sarpras, updated, displayConfig, schoolProfile, administrators, notifications);
    showToast(`Lembar Rapor untuk "${r.studentName}" disimpan...`);
    triggerAutoSync(students, teachers, sarpras, updated, displayConfig, schoolProfile, administrators, true);
  };

  const handleUpdateReport = (r: StudentReport) => {
    lastLocalMutationRef.current = Date.now();
    const updated = reports.map(rp => rp.id === r.id ? r : rp);
    setReports(updated);
    localStorage.setItem('dapodik_reports', JSON.stringify(updated));
    saveCacheToServer(students, teachers, sarpras, updated, displayConfig, schoolProfile, administrators, notifications);
    showToast(`Rapor "${r.studentName}" diperbarui...`);
    triggerAutoSync(students, teachers, sarpras, updated, displayConfig, schoolProfile, administrators, true);
  };

  const handleDeleteReport = (id: string) => {
    lastLocalMutationRef.current = Date.now();
    const updated = reports.filter(r => r.id !== id);
    setReports(updated);
    localStorage.setItem('dapodik_reports', JSON.stringify(updated));
    saveCacheToServer(students, teachers, sarpras, updated, displayConfig, schoolProfile, administrators, notifications);
    showToast('Data rapor dihapus...');
    triggerAutoSync(students, teachers, sarpras, updated, displayConfig, schoolProfile, administrators, true);
  };

  const unreadNotifCount = notifications.filter(n => !n.read).length;

  const handleMarkAllNotifRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  // School Profile Handler
  const handleUpdateSchoolProfile = (updated: SchoolProfile) => {
    setSchoolProfile(updated);
    let updatedDisplay = displayConfig;
    if (updated.logoSekolah && updated.logoSekolah !== displayConfig.logoCustomUrl) {
      updatedDisplay = { ...displayConfig, logoCustomUrl: updated.logoSekolah };
      setDisplayConfig(updatedDisplay);
    }
    showToast('Profil Satuan Pendidikan disimpan...');
    triggerAutoSync(students, teachers, sarpras, reports, updatedDisplay, updated, administrators, true);
  };

  // If user is not authenticated, show the LoginScreen
  if (!isAuthenticated) {
    return (
      <LoginScreen
        onLogin={handleLogin}
        displayConfig={displayConfig}
        administrators={administrators}
        syncConfig={syncConfig}
        onPullData={() => handlePullFromSheets(false)}
        schoolProfile={schoolProfile}
        teachers={teachers}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0c4a6e] via-[#0284c7] to-[#0369a1] text-white flex flex-col font-['Plus_Jakarta_Sans',sans-serif] relative selection:bg-sky-200 selection:text-sky-950">
      
      {/* Background Animated Bokeh, Auroras & Constellation matching Beranda for All Pages */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Soft Radial glows */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 -right-20 w-[32rem] h-[32rem] bg-blue-400/25 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 left-1/4 w-[40rem] h-[40rem] bg-sky-300/15 rounded-full blur-3xl" />

        {/* Network constellation dots & lines */}
        <svg className="absolute inset-0 w-full h-full opacity-30">
          <defs>
            <linearGradient id="appLineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          <line x1="20%" y1="20%" x2="50%" y2="40%" stroke="url(#appLineGrad)" strokeWidth="1.5" strokeDasharray="4 4" />
          <line x1="50%" y1="40%" x2="80%" y2="25%" stroke="url(#appLineGrad)" strokeWidth="1.5" />
          <line x1="30%" y1="70%" x2="50%" y2="40%" stroke="url(#appLineGrad)" strokeWidth="1.5" />
          <line x1="70%" y1="65%" x2="85%" y2="80%" stroke="url(#appLineGrad)" strokeWidth="1.5" />
          
          <circle cx="20%" cy="20%" r="4" fill="#38bdf8" className="animate-ping" />
          <circle cx="50%" cy="40%" r="5" fill="#ffffff" />
          <circle cx="80%" cy="25%" r="6" fill="#38bdf8" />
          <circle cx="70%" cy="65%" r="4" fill="#fbbf24" />
          <circle cx="30%" cy="70%" r="5" fill="#38bdf8" />
          <circle cx="85%" cy="80%" r="4" fill="#ffffff" />
        </svg>

        {/* Decorative Grid Patterns */}
        <div className="absolute top-12 left-1/3 opacity-30">
          <div className="grid grid-cols-4 gap-1.5">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/70" />
            ))}
          </div>
        </div>
        <div className="absolute bottom-20 right-1/4 opacity-25">
          <div className="grid grid-cols-3 gap-1.5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/70" />
            ))}
          </div>
        </div>
      </div>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white font-bold px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 text-xs animate-bounce border border-slate-700">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Global Top Navbar when inside Submodules */}
      {activeTab !== 'home' && (
        <header className="sticky top-0 z-40 bg-[#0c4a6e]/85 backdrop-blur-xl border-b border-white/15 px-4 sm:px-6 py-3 flex items-center justify-between shadow-md text-white select-none">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('home')}
              className="flex items-center gap-2.5 text-left group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-white p-1 shadow-lg shadow-sky-950/20 flex items-center justify-center overflow-hidden shrink-0 border border-white/40 group-hover:scale-105 transition-transform">
                <SafeImage
                  src={displayConfig.logoCustomUrl || schoolProfile.logoSekolah}
                  fallbackSrc="/logo_smpn11palu.jpg"
                  alt={displayConfig.appName ?? 'Logo'}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <div className="font-extrabold text-sm text-white group-hover:text-cyan-200 transition-colors tracking-wide">
                  {displayConfig.appName ?? 'DAPODIK'}
                </div>
                <div className="text-[9px] text-sky-200 font-bold tracking-wider uppercase">
                  {schoolProfile.namaSekolah ?? 'SMP NEGERI 11 PALU'}
                </div>
              </div>
            </button>

            {/* Hamburger menu for mobile/tablet */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white/95 transition-all text-xs font-semibold cursor-pointer active:scale-95"
            >
              <Menu className="w-4 h-4 text-sky-300" />
              <span>Menu</span>
            </button>

            {/* Quick module selector */}
            <div className="hidden md:flex items-center gap-1 ml-6 bg-white/15 backdrop-blur-md p-1 rounded-2xl border border-white/20 text-xs">
              <button
                onClick={() => setActiveTab('home')}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'home' 
                    ? 'bg-white text-slate-900 shadow-md shadow-sky-950/20' 
                    : 'text-sky-100 hover:text-white hover:bg-white/15'
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                <span>Beranda</span>
              </button>
              <button
                onClick={() => setActiveTab('sekolah')}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'sekolah' 
                    ? 'bg-white text-slate-900 shadow-md shadow-sky-950/20' 
                    : 'text-sky-100 hover:text-white hover:bg-white/15'
                }`}
              >
                <School className="w-3.5 h-3.5" />
                <span>Sekolah</span>
              </button>
              <button
                onClick={() => setActiveTab('siswa')}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'siswa' 
                    ? 'bg-white text-slate-900 shadow-md shadow-sky-950/20' 
                    : 'text-sky-100 hover:text-white hover:bg-white/15'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Siswa</span>
              </button>
              <button
                onClick={() => setActiveTab('ptk')}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'ptk' 
                    ? 'bg-white text-slate-900 shadow-md shadow-sky-950/20' 
                    : 'text-sky-100 hover:text-white hover:bg-white/15'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>PTK</span>
              </button>
              <button
                onClick={() => setActiveTab('sarpras')}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'sarpras' 
                    ? 'bg-white text-slate-900 shadow-md shadow-sky-950/20' 
                    : 'text-sky-100 hover:text-white hover:bg-white/15'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Sarpras</span>
              </button>
              <button
                onClick={() => setActiveTab('rapor')}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'rapor' 
                    ? 'bg-white text-slate-900 shadow-md shadow-sky-950/20' 
                    : 'text-sky-100 hover:text-white hover:bg-white/15'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Rapor</span>
              </button>
              <button
                onClick={() => setActiveTab('laporan')}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'laporan' 
                    ? 'bg-white text-slate-900 shadow-md shadow-sky-950/20' 
                    : 'text-sky-100 hover:text-white hover:bg-white/15'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Laporan</span>
              </button>
              <button
                onClick={() => setActiveTab('aplikasi')}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'aplikasi' 
                    ? 'bg-white text-slate-900 shadow-md shadow-sky-950/20' 
                    : 'text-sky-100 hover:text-white hover:bg-white/15'
                }`}
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>Aplikasi</span>
              </button>
              {(currentUser?.role === 'Administrator' || currentUser?.role === 'Operator') && (
                <button
                  onClick={() => setActiveTab('pengaturan')}
                  className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'pengaturan' 
                      ? 'bg-white text-slate-900 shadow-md shadow-sky-950/20' 
                      : 'text-sky-100 hover:text-white hover:bg-white/15'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Pengaturan</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                if (currentUser?.role === 'Administrator' || currentUser?.role === 'Operator') {
                  setIsSheetsModalOpen(true);
                }
              }}
              disabled={currentUser?.role !== 'Administrator' && currentUser?.role !== 'Operator'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-xs ${
                currentUser?.role !== 'Administrator' && currentUser?.role !== 'Operator'
                  ? 'opacity-60 cursor-not-allowed'
                  : ''
              } ${
                syncConfig.status === 'connected'
                  ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40 hover:bg-emerald-500/30'
                  : 'bg-white/15 text-white border-white/20 hover:bg-white/25'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Database</span>
              <span className={`w-2 h-2 rounded-full ${syncConfig.status === 'connected' ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
            </button>

            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-md transition-all shadow-xs cursor-pointer"
              title="Sinkronkan Sekarang"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-cyan-300' : ''}`} />
            </button>

            <button
              onClick={() => setIsSearchModalOpen(true)}
              className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-md transition-all shadow-xs cursor-pointer"
              title="Cari Cepat (⌘K)"
            >
              <Search className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsNotifDrawerOpen(true)}
              className="relative p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-md transition-all shadow-xs cursor-pointer"
              title="Notifikasi"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-bold flex items-center justify-center text-white shadow-md">
                  {unreadNotifCount}
                </span>
              )}
            </button>
          </div>
        </header>
      )}

      {/* Main View Router */}
      <main className="flex-1 relative z-10">
        {activeTab === 'home' && (
          <WelcomeHero
            onNavigate={(tab) => {
              setSettingsInitialFilter('all');
              setActiveTab(tab);
            }}
            onOpenEditDisplay={handleOpenEditDisplay}
            syncConfig={syncConfig}
            displayConfig={displayConfig}
            schoolProfile={schoolProfile}
            onOpenSheets={() => setIsSheetsModalOpen(true)}
            onOpenSearch={() => setIsSearchModalOpen(true)}
            onOpenNotifications={() => setIsNotifDrawerOpen(true)}
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
            unreadCount={unreadNotifCount}
            students={students}
            teachers={teachers}
            sarpras={sarpras}
            reports={reports}
            isSyncing={isSyncing}
            onQuickSync={handleManualSync}
            currentUser={currentUser}
            onLogout={handleLogout}
          />
        )}

        {activeTab === 'sekolah' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <SchoolModule
              schoolProfile={schoolProfile}
              onUpdateSchoolProfile={handleUpdateSchoolProfile}
              onBackToHome={() => setActiveTab('home')}
              onSync={handleManualSync}
              isSyncing={isSyncing}
              students={students}
              teachers={teachers}
              sarpras={sarpras}
              reports={reports}
            />
          </div>
        )}

        {activeTab === 'siswa' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <StudentModule
              students={students.filter(s => !s.status || s.status === 'Aktif')}
              studentsKeluar={students.filter(s => s.status && s.status !== 'Aktif' && s.status !== 'Lulus')}
              alumni={students.filter(s => s.status === 'Lulus')}
              onAddStudent={handleAddStudent}
              onUpdateStudent={handleUpdateStudent}
              onDeleteStudent={handleDeleteStudent}
              onImportStudents={handleImportStudents}
              onMoveToStudentKeluar={handleMoveToStudentKeluar}
              onDeleteStudentKeluar={handleDeleteStudentKeluar}
              onGraduateStudent={handleGraduateStudent}
              onRestoreStudent={handleRestoreStudent}
              onBackToHome={() => setActiveTab('home')}
              onSync={handleManualSync}
              schoolProfile={schoolProfile}
              displayConfig={displayConfig}
            />
          </div>
        )}

        {activeTab === 'ptk' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <PtkModule
              teachers={teachers}
              onAddTeacher={handleAddTeacher}
              onUpdateTeacher={handleUpdateTeacher}
              onDeleteTeacher={handleDeleteTeacher}
              onImportTeachers={handleImportTeachers}
              onBackToHome={() => setActiveTab('home')}
            />
          </div>
        )}

        {activeTab === 'sarpras' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <SarprasModule
              sarpras={sarpras}
              onAddSarpras={handleAddSarpras}
              onUpdateSarpras={handleUpdateSarpras}
              onDeleteSarpras={handleDeleteSarpras}
              onBackToHome={() => setActiveTab('home')}
            />
          </div>
        )}

        {activeTab === 'rapor' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <RaporModule
              reports={reports}
              students={students}
              onAddReport={handleAddReport}
              onUpdateReport={handleUpdateReport}
              onDeleteReport={handleDeleteReport}
              onBackToHome={() => setActiveTab('home')}
              schoolProfile={schoolProfile}
            />
          </div>
        )}

        {activeTab === 'laporan' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <LaporanModule
              students={students}
              teachers={teachers}
              sarpras={sarpras}
              reports={reports}
              onBackToHome={() => setActiveTab('home')}
            />
          </div>
        )}

        {activeTab === 'aplikasi' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <AplikasiModule
              onBackToHome={() => setActiveTab('home')}
              onSync={handleManualSync}
              isSyncing={isSyncing}
              aplikasiLinks={aplikasiLinks}
              setAplikasiLinks={setAplikasiLinks}
            />
          </div>
        )}

        {activeTab === 'pengaturan' && (currentUser?.role === 'Administrator' || currentUser?.role === 'Operator') && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <SettingsModule
              syncConfig={syncConfig}
              displayConfig={displayConfig}
              schoolProfile={schoolProfile}
              onSaveDisplayConfig={handleSaveDisplayConfig}
              onSaveSchoolProfile={handleSaveSchoolProfile}
              onSaveSettings={handleSaveAllSettings}
              onOpenSheets={() => setIsSheetsModalOpen(true)}
              onBackToHome={() => setActiveTab('home')}
              initialComponentFilter={settingsInitialFilter}
              administrators={administrators}
              onSaveAdministrators={handleSaveAdministrators}
              currentUser={currentUser}
              onLogout={handleLogout}
              isSyncing={isSyncing}
            />
          </div>
        )}
      </main>

      {/* Global Modals */}
      <GoogleSheetModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
        syncConfig={syncConfig}
        onSaveConfig={(cfg) => {
          setSyncConfig(cfg);
          showToast('Pengaturan Database tersimpan.');
        }}
        students={students}
        teachers={teachers}
        sarpras={sarpras}
        reports={reports}
        pengaturan={buildPengaturanPayload()}
        administrators={administrators}
        profilSekolah={buildProfilSekolahPayload()}
        onPullData={() => handlePullFromSheets(false)}
      />

      <QuickSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        students={students}
        teachers={teachers}
        sarpras={sarpras}
        reports={reports}
        onNavigate={(tab) => setActiveTab(tab)}
      />

      <NotificationDrawer
        isOpen={isNotifDrawerOpen}
        onClose={() => setIsNotifDrawerOpen(false)}
        notifications={notifications}
        onMarkAllRead={handleMarkAllNotifRead}
      />

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex select-none animate-fade-in">
          {/* Backdrop */}
          <div 
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300"
          />
          
          {/* Drawer Content */}
          <div className="relative flex flex-col w-72 max-w-[85vw] bg-white h-full shadow-2xl p-5 border-r border-slate-100 z-10">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-3 text-left">
                {displayConfig.logoCustomUrl || schoolProfile.logoSekolah ? (
                  <img
                    src={displayConfig.logoCustomUrl || schoolProfile.logoSekolah}
                    alt="Logo"
                    className="w-10 h-10 rounded-2xl object-contain bg-slate-50 border border-slate-200 p-1 shrink-0 shadow-xs"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-2xl bg-[#034d74] p-1.5 flex items-center justify-center shrink-0 shadow-md">
                    <div className="w-full h-full rounded-xl border-2 border-white/90 border-t-amber-400 border-r-amber-400 flex items-center justify-center transform -rotate-45 relative">
                      <div className="w-2 h-2 bg-amber-400 rounded-full shadow-xs" />
                    </div>
                  </div>
                )}
                <div className="overflow-hidden">
                  <h3 className="font-extrabold text-sm text-[#0c2340] tracking-wider truncate leading-tight">
                    {displayConfig.appName ?? 'DAPODIK'}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none mt-1">
                    MENU NAVIGASI
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
              {[
                { id: 'home' as ActiveTab, label: 'Beranda / Dashboard', icon: Home, desc: 'Halaman utama & rekap singkat' },
                { id: 'sekolah' as ActiveTab, label: 'Profil Sekolah', icon: School, desc: 'Identitas resmi & izin operasional' },
                { id: 'siswa' as ActiveTab, label: 'Data Siswa', icon: Users, desc: 'Manajemen peserta didik' },
                { id: 'ptk' as ActiveTab, label: 'Data PTK (Guru)', icon: GraduationCap, desc: 'Daftar pendidik & staf' },
                { id: 'sarpras' as ActiveTab, label: 'Sarana & Prasarana', icon: Building2, desc: 'Inventaris ruang & aset' },
                { id: 'rapor' as ActiveTab, label: 'Penilaian Rapor', icon: FileText, desc: 'Capaian kompetensi & nilai' },
                { id: 'laporan' as ActiveTab, label: 'Laporan & Statistik', icon: BarChart3, desc: 'Rekapitulasi grafik & analisis' },
                { id: 'aplikasi' as ActiveTab, label: 'Portal Aplikasi', icon: Laptop, desc: 'Tautan eksternal & pintasan' },
                ...(currentUser?.role === 'Administrator' || currentUser?.role === 'Operator' ? [
                  { id: 'pengaturan' as ActiveTab, label: 'Pengaturan Database', icon: Settings, desc: 'Konfigurasi cloud & akun' }
                ] : [])
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-start gap-3 transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-sky-50 text-sky-900 font-semibold border-l-4 border-sky-600 pl-2.5' 
                        : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`w-4.5 h-4.5 shrink-0 mt-0.5 ${isActive ? 'text-sky-600' : 'text-slate-400'}`} />
                    <div className="overflow-hidden">
                      <div className="text-xs font-bold leading-none">{item.label}</div>
                      <div className="text-[10px] text-slate-400 font-medium truncate mt-1 leading-none">{item.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Bottom Operator Status */}
            {currentUser && (
              <div className="border-t border-slate-100 pt-3 mt-auto shrink-0">
                <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center shrink-0">
                    {currentUser.nama.substring(0, 1).toUpperCase()}
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-xs font-bold text-slate-800 truncate">{currentUser.nama}</div>
                    <div className="text-[10px] text-slate-400 font-bold truncate uppercase leading-none mt-0.5">{currentUser.role}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
