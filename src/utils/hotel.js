export function today(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}
export function addDays(date, amount) {
  const value = new Date(date + 'T12:00:00Z');
  value.setUTCDate(value.getUTCDate() + amount);
  return value.toISOString().slice(0, 10);
}
export function nights(start, end) {
  return Math.round((Date.parse(end + 'T00:00:00Z') - Date.parse(start + 'T00:00:00Z')) / 86400000);
}
export function dateLabel(date) {
  if (!date) return 'Chưa ghi nhận';
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date.length === 10 ? date + 'T12:00:00Z' : date));
}
export function timeLabel(value) {
  return value
    ? new Intl.DateTimeFormat('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(new Date(value))
    : 'Chưa ghi nhận thời điểm trả phòng';
}
export const money = (value) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
export function errorMessage(error) {
  const data = error?.response?.data;
  if (data?.code === 'ROOM_NOT_READY' && data.details?.room_no) {
    const reason =
      {
        DIRTY: 'đang dọn dẹp',
        MAINTENANCE: 'đang bảo trì',
        OCCUPIED: 'đang có khách',
        READY: 'cần kiểm tra lịch bảo trì hoặc trạng thái kinh doanh',
      }[data.details.state] || 'chưa sẵn sàng';
    return `Phòng ${data.details.room_no} chưa sẵn sàng (${reason}). Vui lòng đợi buồng phòng xử lý.`;
  }
  if (error?.response?.status === 429) {
    const seconds = Number(error.response.headers?.['retry-after'] ?? data?.retry_after);
    return Number.isFinite(seconds) && seconds > 0
      ? `Bạn đã gửi quá nhiều yêu cầu. Vui lòng chờ ${Math.ceil(seconds)} giây rồi thử lại.`
      : 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng chờ một phút rồi thử lại.';
  }
  const fields = Object.values(data?.errors || {})
    .flat()
    .join(' ');
  const details = data?.details || {};
  const room = details.room_no
    ? ' Phòng ' + details.room_no + (details.state ? ' đang ' + details.state + '.' : '.')
    : '';
  return (
    fields ||
    (data?.message
      ? data.message + room
      : error?.response
        ? 'Không thể hoàn tất thao tác. Vui lòng thử lại.'
        : error?.message && !error.isAxiosError
          ? error.message
          : 'Không kết nối được máy chủ. Kiểm tra BE và thử lại.')
  );
}
// Preserve the key after a failed submit; new payloads deliberately receive a new key.
export function requestIdentity(previous, payload, makeKey = () => crypto.randomUUID()) {
  const fingerprint = JSON.stringify(payload);
  return previous?.fingerprint === fingerprint ? previous : { fingerprint, key: makeKey() };
}
export function canCheckIn(booking, date = booking.business_date || today()) {
  return (
    booking.state === 'CONFIRMED' &&
    booking.rooms.length > 0 &&
    booking.rooms.every((stay) => stay.start_date === date)
  );
}
export function dailyRevenue(payments) {
  const days = {};
  for (const payment of payments) {
    const day = today(new Date(payment.paid_at));
    days[day] = (days[day] || 0) + Number(payment.amount);
  }
  return Object.entries(days)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, amount]) => ({ date, amount }));
}
