import { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutGrid,
  CalendarDays,
  Users,
  Brush,
  Wrench,
  ChartNoAxesCombined,
  Tags,
  Library,
  LogOut,
  Menu,
  Sun,
  Moon,
  LoaderCircle,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ROLES } from '@/constants/hotel';
import { Brand, Button } from '@/components/hotel/UI';
import RoleSwitcher from '@/components/navigation/RoleSwitcher';
import toast from 'react-hot-toast';
const menus = {
  receptionist: [
    ['/reception/room-board', 'Sơ đồ phòng', LayoutGrid],
    ['/reception/bookings/new', 'Đặt phòng mới', CalendarDays],
    ['/reception/bookings', 'Danh sách đặt phòng', Library],
    ['/reception/customers', 'Khách hàng', Users],
  ],
  housekeeping: [
    ['/housekeeping', 'Phòng cần dọn', Brush],
    ['/housekeeping/maintenance', 'Phòng bảo trì', Wrench],
    ['/reception/room-board', 'Sơ đồ phòng', LayoutGrid],
  ],
  manager: [
    ['/manager/reports', 'Báo cáo & thống kê', ChartNoAxesCombined],
    ['/reception/room-board', 'Sơ đồ phòng', LayoutGrid],
    ['/housekeeping', 'Công việc buồng phòng', Brush],
    ['/manager/maintenance', 'Lịch bảo trì', Wrench],
    ['/manager/seasonal-rates', 'Biểu giá theo mùa', Tags],
    ['/manager/catalog', 'Danh mục & nhân viên', Library],
  ],
};
export function ThemeToggle() {
  const [theme, setTheme] = useState(
    () =>
      localStorage.getItem('hotel-theme') ||
      (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  );
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('hotel-theme', theme);
  }, [theme]);
  return (
    <button
      className="icon-button"
      aria-label={theme === 'light' ? 'Dùng giao diện tối' : 'Dùng giao diện sáng'}
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
    >
      {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
    </button>
  );
}
export default function HotelLayout() {
  const { user, role, token, busy, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const items = menus[role] || [];
  const title = items.find(([path]) => path === location.pathname)?.[1] || 'Không gian làm việc';
  const initials = (user?.name || user?.full_name || 'NV')
    .split(' ')
    .slice(-2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Đến nội dung chính
      </a>
      {open && (
        <button className="mobile-scrim" aria-label="Đóng menu" onClick={() => setOpen(false)} />
      )}
      <aside
        id="hotel-sidebar"
        className={'sidebar ' + (open ? 'is-open' : '')}
        aria-label="Menu chính"
      >
        <Brand />
        <p className="nav-label">KHÔNG GIAN LÀM VIỆC</p>
        <nav className="nav-list">
          {items.map(([path, label, Icon]) => (
            <NavLink
              key={path}
              to={path}
              end
              onClick={() => setOpen(false)}
              className={({ isActive }) => 'nav-item ' + (isActive ? 'active' : '')}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="user-info">
            <span className="user-initials">{initials}</span>
            <div>
              <strong>{user?.name || user?.full_name}</strong>
              <small>{ROLES[role]?.label}</small>
            </div>
          </div>
          <Button
            variant="ghost"
            icon={LogOut}
            className="mt-3 w-full"
            onClick={() => logout().catch(() => toast('Đã xóa phiên đăng nhập trên thiết bị.'))}
            disabled={busy}
          >
            Đăng xuất
          </Button>
        </div>
      </aside>
      <div className="work-area">
        <header className="app-header">
          <button
            className="icon-button mobile-menu"
            aria-label="Mở menu"
            aria-expanded={open}
            aria-controls="hotel-sidebar"
            onClick={() => setOpen(!open)}
          >
            <Menu size={19} />
          </button>
          <div className="header-context">
            <span className="header-caption">Khách sạn EduMatch</span>
            <span className="header-title">{title}</span>
          </div>
          <RoleSwitcher />
          <ThemeToggle />
        </header>
        <main className="app-main" id="main-content">
          <div key={token}>
            <Outlet />
          </div>
        </main>
      </div>
      {busy && (
        <div className="session-overlay" role="status">
          <div>
            <LoaderCircle size={20} className="animate-spin" />
            Đang cập nhật phiên làm việc…
          </div>
        </div>
      )}
    </div>
  );
}
