import React, { useState, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  ChevronRight,
  LogOut,
  X,
  ShieldCheck,
  User,
  ShieldAlert,
} from 'lucide-react';
import { adminSidebarItems, type AdminNavMainItem } from '../../navigation/admin-sidebar-items';
import { useAdminAuthStore } from '../../store/useAdminAuthStore';
import { cn } from '../../utils/cn';
import { toast } from 'react-hot-toast';

interface AdminSidebarProps {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isCollapsed,
  isMobileOpen,
  onCloseMobile,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const admin = useAdminAuthStore((state) => state.admin);
  const hasPermission = useAdminAuthStore((state) => state.hasPermission);
  const logout = useAdminAuthStore((state) => state.logout);

  // Submenu open states
  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>({
    leads: false,
    courses: false,
    'mains-evaluation': true,
    tests: false,
  });

  const toggleSubMenu = (id: string) => {
    setOpenSubMenus((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const isSubActive = (subUrl?: string) => {
    if (!subUrl) return false;
    if (location.pathname === subUrl) return true;
    if (subUrl !== '/' && location.pathname.startsWith(`${subUrl}/`)) return true;
    return false;
  };

  const isMainActive = (item: AdminNavMainItem) => {
    if (item.url === '/' && location.pathname === '/') return true;
    if (item.url && item.url !== '/' && (location.pathname === item.url || location.pathname.startsWith(`${item.url}/`))) {
      return true;
    }
    if (item.subItems) {
      return item.subItems.some((sub) => isSubActive(sub.url));
    }
    return false;
  };

  const handleLogout = async () => {
    await logout();
    toast('Signed out of Chamber Administration', { icon: '👋' });
    navigate('/login');
  };

  // Dynamically filter sidebar items by current admin's permissions
  const visibleGroups = useMemo(() => {
    return adminSidebarItems
      .map((group) => {
        const visibleItems = group.items
          .filter((item) => hasPermission(item.permission))
          .map((item) => {
            if (!item.subItems) return item;
            const visibleSubs = item.subItems.filter((sub) => hasPermission(sub.permission));
            return {
              ...item,
              subItems: visibleSubs,
            };
          });
        return {
          ...group,
          items: visibleItems,
        };
      })
      .filter((group) => group.items.length > 0);
  }, [hasPermission]);

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/80 md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed md:sticky top-0 z-40 h-screen flex flex-col justify-between bg-[#1E1E1E] border-r border-[#3D3D3D] transition-[width] duration-300 ease-in-out select-none overflow-x-hidden text-[#F7F3E6]',
          isCollapsed ? 'md:w-18' : 'md:w-76',
          isMobileOpen ? 'left-0 w-76 z-50' : '-left-76 md:left-0'
        )}
      >
        {/* 1. Header: Academy Crest & Chamber CRM Branding */}
        <div className="shrink-0 border-b border-[#3D3D3D] overflow-hidden">
          <div className="h-16 flex items-center justify-between px-4">
            <Link
              to="/"
              className="flex items-center overflow-hidden min-w-0"
              onClick={onCloseMobile}
            >
              <div className="w-10 h-10 flex items-center justify-center shrink-0">
                <img
                  src="/logo.png"
                  alt="RLA"
                  className="w-full h-full object-contain"
                />
              </div>
              <div
                className={cn(
                  'flex flex-col min-w-0 pl-3 transition-all duration-200 whitespace-nowrap overflow-hidden',
                  isCollapsed ? 'opacity-0 w-0 pointer-events-none' : 'opacity-100 w-auto'
                )}
              >
                <span className="font-serif text-sm font-bold text-[#F7F3E6] tracking-tight truncate leading-none">
                  RAJINDER LAW
                </span>
                <span className="text-[10px] font-semibold text-[#C19B48] tracking-wider uppercase mt-1">
                  Chamber Admin CRM
                </span>
              </div>
            </Link>

            {/* Mobile Close Button */}
            <button
              onClick={onCloseMobile}
              className="md:hidden p-1.5 rounded-lg text-[#A8A294] hover:text-[#F7F3E6] hover:bg-[#2F2F2F] shrink-0 cursor-pointer"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. Middle: Scrollable Dynamic Navigation Groups */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar px-3 py-3 space-y-4">
          {visibleGroups.map((group) => (
            <div key={group.id} className="space-y-1">
              {group.label && (
                <h4
                  className={cn(
                    'px-2.5 text-[10px] font-bold text-[#A8A294] uppercase tracking-wider transition-all duration-200 overflow-hidden whitespace-nowrap',
                    isCollapsed ? 'opacity-0 h-0 my-0 pointer-events-none' : 'opacity-100 mb-1.5'
                  )}
                >
                  {group.label}
                </h4>
              )}

              <div className="space-y-1">
                {group.items.map((item: AdminNavMainItem) => {
                  const Icon = item.icon;
                  const hasSub = Boolean(item.subItems && item.subItems.length > 0);
                  const active = isMainActive(item);

                  if (!hasSub) {
                    return (
                      <Link
                        key={item.id}
                        to={item.url || '/'}
                        onClick={onCloseMobile}
                        title={isCollapsed ? item.title : undefined}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group relative',
                          active
                            ? 'bg-[#2F2F2F] text-[#F7F3E6] border border-[#C19B48]/50 shadow-xs'
                            : 'text-[#A8A294] hover:text-[#F7F3E6] hover:bg-[#2F2F2F]'
                        )}
                      >
                        <Icon
                          className={cn(
                            'w-4 h-4 shrink-0 transition-colors',
                            active ? 'text-[#C19B48]' : 'text-[#A8A294] group-hover:text-[#F7F3E6]'
                          )}
                        />
                        <span
                          className={cn(
                            'truncate transition-all duration-200',
                            isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 flex-1'
                          )}
                        >
                          {item.title}
                        </span>

                        {!isCollapsed && item.badge && (
                          <span
                            className={cn(
                              'text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0',
                              item.badgeColor || 'bg-[#C19B48]/15 text-[#E8CF8D] border border-[#C19B48]/30'
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  }

                  const isParentOpen = openSubMenus[item.id] !== undefined ? openSubMenus[item.id] : active;

                  // Item with Submenu
                  return (
                    <div key={item.id} className="space-y-1">
                      <button
                        type="button"
                        onClick={() => toggleSubMenu(item.id)}
                        title={isCollapsed ? item.title : undefined}
                        className={cn(
                          'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group cursor-pointer',
                          active
                            ? 'bg-[#2F2F2F]/80 text-[#F7F3E6]'
                            : 'text-[#A8A294] hover:text-[#F7F3E6] hover:bg-[#2F2F2F]'
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Icon
                            className={cn(
                              'w-4 h-4 shrink-0 transition-colors',
                              active ? 'text-[#C19B48]' : 'text-[#A8A294] group-hover:text-[#F7F3E6]'
                            )}
                          />
                          <span
                            className={cn(
                              'truncate transition-all duration-200 text-left',
                              isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 flex-1'
                            )}
                          >
                            {item.title}
                          </span>
                        </div>

                        {!isCollapsed && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            {item.badge && (
                              <span
                                className={cn(
                                  'text-[10px] font-semibold px-2 py-0.5 rounded-full',
                                  item.badgeColor || 'bg-[#C19B48]/15 text-[#E8CF8D] border border-[#C19B48]/30'
                                )}
                              >
                                {item.badge}
                              </span>
                            )}
                            {isParentOpen ? (
                              <ChevronDown className="w-3.5 h-3.5 text-[#A8A294]" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-[#A8A294]" />
                            )}
                          </div>
                        )}
                      </button>

                      {/* Submenu Children */}
                      {!isCollapsed && isParentOpen && (
                        <div className="pl-9 pr-2 space-y-1 border-l border-[#3D3D3D] ml-5">
                          {item.subItems?.map((sub) => {
                            const isItemActive = isSubActive(sub.url);
                            return (
                              <Link
                                key={sub.id}
                                to={sub.url}
                                onClick={onCloseMobile}
                                className={cn(
                                  'flex items-center justify-between py-1.5 px-2 rounded-lg text-xs transition-colors',
                                  isItemActive
                                    ? 'text-[#C19B48] font-semibold bg-[#262626] border border-[#C19B48]/30'
                                    : 'text-[#A8A294] hover:text-[#F7F3E6] hover:bg-[#262626]'
                                )}
                              >
                                <span className="truncate">{sub.title}</span>
                                {sub.badge && (
                                  <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded-sm bg-[#3D3D3D] text-[#E8CF8D]">
                                    {sub.badge}
                                  </span>
                                )}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* 3. Footer: Active Admin User & Sign Out */}
        <div className="shrink-0 p-3 border-t border-[#3D3D3D] bg-[#1A1A1A]">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#2F2F2F] border border-[#3D3D3D] flex items-center justify-center shrink-0 text-[#C19B48]">
                <User className="w-4 h-4" />
              </div>
              <div
                className={cn(
                  'min-w-0 transition-all duration-200 overflow-hidden',
                  isCollapsed ? 'opacity-0 w-0' : 'opacity-100 flex-1'
                )}
              >
                <div className="text-xs font-semibold text-[#F7F3E6] truncate">
                  {admin?.name || 'Adv. Rajinder Sir'}
                </div>
                <div className="text-[10px] text-[#A8A294] flex items-center gap-1">
                  {admin?.isSuperAdmin ? (
                    <ShieldAlert className="w-3 h-3 text-[#C19B48]" />
                  ) : (
                    <ShieldCheck className="w-3 h-3 text-[#C19B48]" />
                  )}
                  <span className="truncate font-medium text-[#C19B48]">
                    {admin?.isSuperAdmin
                      ? 'Super Admin'
                      : admin?.permissionTier || admin?.roleName || 'Staff'}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              title="Sign Out"
              className={cn(
                'p-2 rounded-lg bg-[#262626] hover:bg-[#2F2F2F] text-[#A8A294] hover:text-[#EF4444] border border-[#3D3D3D] transition-colors cursor-pointer shrink-0',
                isCollapsed && 'w-full justify-center flex'
              )}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
