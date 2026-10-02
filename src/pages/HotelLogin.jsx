import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  Crown,
  BellRing,
  Brush,
  ArrowRight,
  LayoutGrid,
  CalendarCheck,
  ChartNoAxesCombined,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/services/authService';
import { useResource } from '@/hooks/useResource';
import { ROLES, roleHome } from '@/constants/hotel';
import { Brand, Button, Field, Alert } from '@/components/hotel/UI';
import { ThemeToggle } from '@/layouts/HotelLayout';
const icons = { manager: Crown, receptionist: BellRing, housekeeping: Brush };
export default function HotelLogin() {
  const { login, busy, isAuthenticated, role } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const demos = useResource('login-demo-accounts', () => authService.demoAccounts());
  if (isAuthenticated) return <Navigate to={roleHome(role)} replace />;
  const signIn = async (credentials) => {
    setError(null);
    try {
      const response = await login(credentials);
      navigate(roleHome(response.roles.find((value) => ROLES[value])), { replace: true });
    } catch (err) {
      setError(err);
    }
  };
  return (
    <div className="auth-page">
      <section className="auth-story">
        <Brand />
        <h1>
          Mỗi ca làm việc.
          <br />
          Một không gian rõ ràng.
        </h1>
        <p>Đặt phòng, bàn giao buồng phòng và theo dõi kinh doanh trong cùng một hệ thống.</p>
        <div className="auth-capabilities">
          <div>
            <LayoutGrid size={21} />
            Nắm trạng thái từng phòng
          </div>
          <div>
            <CalendarCheck size={21} />
            Tiếp đón khách, từ đặt đến trả phòng
          </div>
          <div>
            <ChartNoAxesCombined size={21} />
            Theo dõi doanh thu đã thanh toán
          </div>
        </div>
        <div className="auth-story-footer">EduMatch · Quản lý khách sạn</div>
      </section>
      <section className="auth-form-area">
        <div className="absolute top-5 right-5">
          <ThemeToggle />
        </div>
        <div className="auth-form">
          <div className="mb-8 lg:hidden">
            <Brand />
          </div>
          <h2>Đăng nhập</h2>
          <p className="muted">Chào bạn, bắt đầu ca làm việc tại đây.</p>
          <form
            className="stack"
            onSubmit={(event) => {
              event.preventDefault();
              signIn({ phone, password });
            }}
          >
            <Field
              label="Số điện thoại"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              autoComplete="username"
              inputMode="tel"
              required
              placeholder="Nhập số điện thoại nhân viên"
            />
            <Field
              label="Mật khẩu"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              placeholder="Nhập mật khẩu"
            />
            <Alert error={error} />
            <Button type="submit" busy={busy} icon={ArrowRight}>
              Đăng nhập
            </Button>
          </form>
          {demos.data?.data?.length > 0 && (
            <>
              <hr className="divider" />
              <h3>Khám phá bằng tài khoản demo</h3>
              <p className="muted text-xs mt-1">Chọn vai trò để mở đúng không gian làm việc.</p>
              <div className="demo-accounts">
                {demos.data.data.map((account) => {
                  const Icon = icons[account.role];
                  return (
                    <button
                      key={account.id}
                      type="button"
                      className="demo-account"
                      disabled={busy}
                      onClick={() => signIn({ username: account.username, password: 'password' })}
                    >
                      <Icon size={21} />
                      <div>
                        <strong>{ROLES[account.role].label}</strong>
                        <small>{ROLES[account.role].description}</small>
                      </div>
                      <ArrowRight size={16} />
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
