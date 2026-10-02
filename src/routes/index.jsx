import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ROUTE_ROLES, roleHome } from '@/constants/hotel';
import { Alert, Button, Skeleton } from '@/components/hotel/UI';
import RoleProtectedRoute from './RoleProtectedRoute';
import HotelLayout from '@/layouts/HotelLayout';
import HotelLogin from '@/pages/HotelLogin';
import HotelError from '@/pages/HotelError';
const RoomBoard = lazy(() => import('@/pages/Receptionist/RoomBoardPage'));
const Bookings = lazy(() => import('@/pages/Receptionist/BookingsPage'));
const Invoice = lazy(() => import('@/pages/Receptionist/InvoicePrint'));
const Customers = lazy(() => import('@/pages/Receptionist/CustomersPage'));
const Housekeeping = lazy(() => import('@/pages/Housekeeping/HousekeepingPage'));
const Reports = lazy(() => import('@/pages/Manager/ReportsPage'));
const Maintenance = lazy(() => import('@/pages/Manager/MaintenancePage'));
const Rates = lazy(() => import('@/pages/Manager/SeasonalRatesPage'));
const Catalog = lazy(() => import('@/pages/Manager/CatalogPage'));
export default function AppRoutes() {
  const { loading, bootError, isAuthenticated, role } = useAuth();
  if (loading)
    return (
      <div className="max-w-2xl mx-auto p-8">
        <Skeleton />
      </div>
    );
  if (bootError)
    return (
      <div className="max-w-xl mx-auto p-8 stack">
        <Alert>{bootError}</Alert>
        <Button onClick={() => window.location.reload()}>Kết nối lại</Button>
      </div>
    );
  return (
    <Suspense
      fallback={
        <div className="p-5">
          <Skeleton rows={4} />
        </div>
      }
    >
      <Routes>
        <Route path="/login" element={<HotelLogin />} />
        <Route
          path="/"
          element={<Navigate to={isAuthenticated ? roleHome(role) : '/login'} replace />}
        />
        <Route
          path="/dashboard"
          element={<Navigate to={isAuthenticated ? roleHome(role) : '/login'} replace />}
        />
        <Route
          path="/403"
          element={isAuthenticated ? <HotelLayout /> : <Navigate to="/login" replace />}
        >
          <Route index element={<HotelError />} />
        </Route>
        <Route element={<RoleProtectedRoute allowedRoles={ROUTE_ROLES.board} />}>
          <Route element={<HotelLayout />}>
            <Route path="/reception/room-board" element={<RoomBoard />} />
            <Route element={<RoleProtectedRoute allowedRoles={ROUTE_ROLES.bookings} />}>
              <Route path="/reception/bookings" element={<Bookings />} />
              <Route path="/reception/bookings/new" element={<Bookings key="new" newBooking />} />
              <Route path="/reception/customers" element={<Customers />} />
            </Route>
            <Route element={<RoleProtectedRoute allowedRoles={ROUTE_ROLES.invoice} />}>
              <Route path="/reception/invoices/:id" element={<Invoice />} />
            </Route>
            <Route element={<RoleProtectedRoute allowedRoles={ROUTE_ROLES.housekeeping} />}>
              <Route path="/housekeeping" element={<Housekeeping key="dirty" />} />
              <Route
                path="/housekeeping/maintenance"
                element={<Housekeeping key="maintenance" maintenanceOnly />}
              />
            </Route>
            <Route element={<RoleProtectedRoute allowedRoles={ROUTE_ROLES.manager} />}>
              <Route path="/manager/reports" element={<Reports />} />
              <Route path="/manager/maintenance" element={<Maintenance />} />
              <Route path="/manager/seasonal-rates" element={<Rates />} />
              <Route path="/manager/catalog" element={<Catalog />} />
            </Route>
            <Route path="*" element={<HotelError notFound />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
