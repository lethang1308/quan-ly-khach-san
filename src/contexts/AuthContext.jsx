import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  startTransition,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { roleHome } from '@/constants/hotel';
import { STORAGE_KEYS } from '@/constants/storageKeys';
import { storage } from '@/utils/storage';
import { authService } from '@/services/authService';
import { errorMessage } from '@/utils/hotel';

export const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(storage.get(STORAGE_KEYS.ACCESS_TOKEN)));
  const [bootError, setBootError] = useState('');
  const [busy, setBusy] = useState(false);
  const operation = useRef(false);
  const clear = useCallback(() => {
    storage.remove(STORAGE_KEYS.ACCESS_TOKEN);
    storage.remove(STORAGE_KEYS.USER_INFO);
    setSession(null);
  }, []);
  const accept = useCallback((response, token) => {
    const accessToken = response.access_token || token;
    if (!accessToken || !response.user || !Array.isArray(response.roles)) {
      throw new Error('Phản hồi xác thực không hợp lệ.');
    }
    storage.set(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    storage.set(STORAGE_KEYS.USER_INFO, response.user);
    setSession({ ...response, token: accessToken });
    setBootError('');
    return response;
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    const token = storage.get(STORAGE_KEYS.ACCESS_TOKEN);
    const expire = () => {
      clear();
      setLoading(false);
    };
    window.addEventListener('hotel:unauthorized', expire);
    if (token) {
      authService
        .getProfile(controller.signal)
        .then((response) => {
          if (!controller.signal.aborted) accept(response, token);
        })
        .catch((error) => {
          if (controller.signal.aborted) return;
          if (error.response?.status === 401) clear();
          else setBootError(errorMessage(error));
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }
    return () => {
      controller.abort();
      window.removeEventListener('hotel:unauthorized', expire);
    };
  }, [accept, clear]);
  const authenticate = async (action, destination) => {
    if (operation.current) throw new Error('Vui lòng chờ thao tác xác thực hiện tại.');
    operation.current = true;
    setBusy(true);
    try {
      const response = await action();
      if (destination) {
        // Commit identity and route together; an intermediate role on the old page would trigger 403.
        startTransition(() => {
          accept(response);
          navigate(destination, { replace: true });
          setBusy(false);
        });
      } else {
        accept(response);
        setBusy(false);
      }
      return response;
    } catch (error) {
      setBusy(false);
      throw error;
    } finally {
      operation.current = false;
    }
  };
  const login = (credentials) => authenticate(() => authService.login(credentials));
  const quickSwitch = (role, destination = roleHome(role)) =>
    authenticate(() => authService.quickSwitch(role), destination);
  const logout = async () => {
    if (operation.current) return;
    operation.current = true;
    setBusy(true);
    try {
      await authService.logout();
    } finally {
      clear();
      operation.current = false;
      setBusy(false);
    }
  };
  const roles = session?.roles || [];
  const role =
    ['manager', 'receptionist', 'housekeeping'].find((value) => roles.includes(value)) || null;
  return (
    <AuthContext.Provider
      value={{
        user: session?.user,
        token: session?.token,
        roles,
        role,
        permissions: session?.permissions || [],
        canQuickSwitch: session?.demo_switch_allowed === true,
        isAuthenticated: Boolean(session),
        loading,
        bootError,
        busy,
        login,
        logout,
        quickSwitch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth cần AuthProvider.');
  return context;
}
export default AuthContext;
