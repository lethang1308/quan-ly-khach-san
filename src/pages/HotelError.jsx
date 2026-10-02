import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ROLES, roleHome } from '@/constants/hotel';
import { Button } from '@/components/hotel/UI';
import { errorMessage } from '@/utils/hotel';
import toast from 'react-hot-toast';
export default function HotelError({ notFound = false }) {
  const { role, quickSwitch, busy, canQuickSwitch } = useAuth();
  const location = useLocation();
  const next = location.state?.allowedRoles?.[0];
  return (
    <div className="error-page">
      <div className="error-page-inner">
        <div className="error-code">{notFound ? '404' : '403'}</div>
        <h1>{notFound ? 'Không tìm thấy trang' : 'Bạn chưa có quyền mở trang này'}</h1>
        <p className="muted">
          {notFound
            ? 'Đường dẫn này không còn tồn tại. Hãy quay về không gian làm việc.'
            : 'Vai trò ' +
              (ROLES[role]?.label || 'hiện tại') +
              ' không được truy cập chức năng này.'}
        </p>
        <div className="inline">
          <Link className="btn btn-primary" to={roleHome(role)}>
            Về không gian của tôi
          </Link>
          {!notFound && next && canQuickSwitch && (
            <Button
              variant="secondary"
              busy={busy}
              onClick={async () => {
                try {
                  await quickSwitch(next, location.state.from || roleHome(next));
                } catch (error) {
                  toast.error(errorMessage(error));
                }
              }}
            >
              Chuyển demo sang {ROLES[next].label}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
