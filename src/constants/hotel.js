export const ROLES = {
  manager: {
    label: 'Quản lý',
    home: '/manager/reports',
    description: 'Theo dõi kinh doanh & điều hành',
  },
  receptionist: {
    label: 'Lễ tân',
    home: '/reception/room-board',
    description: 'Đặt phòng & chăm sóc khách',
  },
  housekeeping: {
    label: 'Buồng phòng',
    home: '/housekeeping',
    description: 'Dọn phòng & bàn giao',
  },
};
export const ROUTE_ROLES = {
  board: ['manager', 'receptionist', 'housekeeping'],
  bookings: ['receptionist'],
  invoice: ['receptionist'],
  housekeeping: ['manager', 'housekeeping'],
  manager: ['manager'],
};
export const BOARD_STATES = {
  VACANT: { label: 'Trống', className: 'status-vacant' },
  RESERVED: { label: 'Đã đặt', className: 'status-reserved' },
  OCCUPIED: { label: 'Đang ở', className: 'status-occupied' },
  DIRTY: { label: 'Dọn dẹp', className: 'status-dirty' },
  MAINTENANCE: { label: 'Bảo trì', className: 'status-maintenance' },
};
export const BOOKING_STATES = {
  CONFIRMED: 'Đã xác nhận',
  IN_HOUSE: 'Đang lưu trú',
  COMPLETED: 'Hoàn tất',
  CANCELLED: 'Đã hủy',
};
export function roleHome(role) {
  return ROLES[role]?.home || '/403';
}
export function canAccess(role, allowed) {
  return Boolean(role && allowed.includes(role));
}
