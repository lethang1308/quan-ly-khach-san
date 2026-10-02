import { Crown, BellRing, Brush } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { ROLES } from '@/constants/hotel';
import { errorMessage } from '@/utils/hotel';
const icons = { manager: Crown, receptionist: BellRing, housekeeping: Brush };
export default function RoleSwitcher() {
  const { role, quickSwitch, busy, canQuickSwitch } = useAuth();
  if (!canQuickSwitch)
    return <span className="status status-vacant">{ROLES[role]?.label || 'Nhân viên'}</span>;
  const change = async (next) => {
    try {
      await quickSwitch(next);
      toast.success('Đã chuyển sang ' + ROLES[next].label);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };
  return (
    <div className="role-switcher" aria-label="Chuyển tài khoản demo">
      {Object.entries(ROLES).map(([value, info]) => {
        const Icon = icons[value];
        return (
          <button
            key={value}
            type="button"
            className="role-button"
            aria-pressed={role === value}
            disabled={busy || role === value}
            onClick={() => change(value)}
          >
            <Icon size={15} />
            {info.label}
          </button>
        );
      })}
    </div>
  );
}
