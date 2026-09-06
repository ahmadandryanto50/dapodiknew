import React, { useEffect, useRef } from 'react';
import {
  Home,
  School,
  Users,
  GraduationCap,
  Building2,
  FileText,
  BarChart3,
  Laptop,
  Settings
} from 'lucide-react';
import { ActiveTab, AdminUser } from '../types';

interface MobileBottomNavProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenMenu?: () => void;
  currentUser: AdminUser | null;
}

interface NavItem {
  id: ActiveTab;
  label: string;
  icon: React.ElementType;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenMenu,
  currentUser
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLButtonElement>(null);

  const navItems: NavItem[] = [
    { id: 'home', label: 'Beranda', icon: Home },
    { id: 'sekolah', label: 'Profil', icon: School },
    { id: 'siswa', label: 'Siswa', icon: Users },
    { id: 'ptk', label: 'PTK', icon: GraduationCap },
    { id: 'sarpras', label: 'Sarpras', icon: Building2 },
    { id: 'rapor', label: 'Rapor', icon: FileText },
    { id: 'laporan', label: 'Laporan', icon: BarChart3 },
    { id: 'aplikasi', label: 'Aplikasi', icon: Laptop },
    ...(currentUser?.role === 'Administrator' || currentUser?.role === 'Operator'
      ? [{ id: 'pengaturan' as ActiveTab, label: 'Pengaturan', icon: Settings }]
      : [])
  ];

  // Auto-scroll active item into view smoothly on tab change
  useEffect(() => {
    if (activeItemRef.current && scrollContainerRef.current) {
      activeItemRef.current.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest'
      });
    }
  }, [activeTab]);

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 shadow-[0_-6px_25px_rgba(15,23,42,0.09)] select-none pb-[max(env(safe-area-inset-bottom),0.375rem)]"
      aria-label="Navigasi Bawah Mobile"
    >
      <div className="relative max-w-lg mx-auto">
        {/* Horizontal scroll container with hidden scrollbars */}
        <div
          ref={scrollContainerRef}
          className="flex items-center overflow-x-auto no-scrollbar py-1 px-1.5 gap-1 scroll-smooth"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                ref={isActive ? activeItemRef : null}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`group flex flex-col items-center justify-center shrink-0 min-w-[62px] px-1.5 py-1 rounded-2xl transition-all duration-200 cursor-pointer active:scale-90 ${
                  isActive ? 'text-sky-700' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {/* Active Pill around icon */}
                <div
                  className={`relative px-3.5 py-1 rounded-full transition-all duration-200 flex items-center justify-center ${
                    isActive
                      ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                      : 'bg-transparent text-slate-500 group-hover:bg-slate-100 group-hover:text-slate-700'
                  }`}
                >
                  <Icon className="w-4.5 h-4.5" />
                </div>

                {/* Label text */}
                <span
                  className={`text-[10px] mt-0.5 tracking-tight transition-all duration-200 whitespace-nowrap ${
                    isActive ? 'font-bold text-sky-700' : 'font-medium text-slate-500'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
