import { useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, LogIn, ConciergeBell, ReceiptText, X, Eye, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useResource } from '@/hooks/useResource';
import { bookingService } from '@/services/bookingService';
import { stayService } from '@/services/stayService';
import { BOOKING_STATES } from '@/constants/hotel';
import { canCheckIn, dateLabel, money } from '@/utils/hotel';
import {
  PageTitle,
  Button,
  Field,
  Status,
  Modal,
  Alert,
  Empty,
  ResourceState,
  Pagination,
} from '@/components/hotel/UI';
import BookingModal from './BookingModal';
import CheckoutModal from './CheckoutModal';
import ServiceModal from './ServiceModal';
import BillDetails from '@/components/hotel/BillDetails';
function BookingAction({ booking, type, onClose, onDone }) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const submitting = useRef(false);
  const submit = async (event) => {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError(null);
    try {
      if (type === 'cancel') await bookingService.cancel(booking.id, reason);
      else await stayService.checkIn(booking.id);
      toast.success(type === 'cancel' ? 'Đã hủy đặt phòng.' : 'Đã nhận phòng.');
      onDone();
      onClose();
    } catch (err) {
      setError(err);
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  };
  return (
    <Modal
      title={type === 'cancel' ? 'Hủy đặt phòng' : 'Xác nhận nhận phòng'}
      description={booking.booking_code + ' · ' + booking.customer.name}
      busy={busy}
      onClose={onClose}
    >
      <form onSubmit={submit} className="stack">
        <p className="text-sm">
          Phòng {booking.rooms.map((stay) => stay.room.room_no).join(', ')} ·{' '}
          {dateLabel(booking.rooms[0]?.start_date)} - {dateLabel(booking.rooms[0]?.end_date)}
        </p>
        {type === 'cancel' ? (
          <Field
            label="Lý do hủy"
            as="textarea"
            required
            maxLength={2000}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            disabled={busy}
          />
        ) : (
          <div className="note">
            Tất cả phòng phải sẵn sàng (READY). Hệ thống sẽ kiểm tra trạng thái và ngày đến trước
            khi nhận phòng.
            {booking.rooms.some((stay) => stay.room.state !== 'READY') && (
              <p className="mt-2">
                Cần kiểm tra phòng{' '}
                {booking.rooms
                  .filter((stay) => stay.room.state !== 'READY')
                  .map((stay) => stay.room.room_no)
                  .join(', ')}
                .
              </p>
            )}
          </div>
        )}
        <Alert error={error} />
        <div className="modal-footer">
          <Button variant="secondary" disabled={busy} onClick={onClose}>
            Quay lại
          </Button>
          <Button type="submit" busy={busy} variant={type === 'cancel' ? 'danger' : 'primary'}>
            {type === 'cancel' ? 'Xác nhận hủy' : 'Nhận phòng'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
export default function BookingsPage({ newBooking = false }) {
  const [params] = useSearchParams();
  const [search, setSearch] = useState(params.get('search') || '');
  const [state, setState] = useState('');
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(newBooking);
  const [action, setAction] = useState(null);
  const [submittedSearch, setSubmittedSearch] = useState(params.get('search') || '');
  const list = useResource(['bookings', page, state, submittedSearch], (signal) =>
    bookingService.list(
      { page, state: state || undefined, search: submittedSearch || undefined, per_page: 10 },
      signal
    )
  );
  const bookings = list.data?.data || [];
  return (
    <>
      <PageTitle
        title="Danh sách đặt phòng"
        description="Theo dõi đơn, nhận khách và hoàn tất thanh toán."
        action={
          <>
            <Button icon={Plus} onClick={() => setCreating(true)}>
              Đặt phòng mới
            </Button>
            <Button variant="secondary" icon={RefreshCw} onClick={list.reload}>
              Làm mới
            </Button>
          </>
        }
      />
      <form
        className="search-toolbar"
        onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
          setSubmittedSearch(search.trim());
        }}
      >
        <Field
          label="Tìm đơn hoặc khách hàng"
          value={search}
          placeholder="Mã đơn, tên khách hoặc số điện thoại"
          onChange={(event) => setSearch(event.target.value)}
        />
        <Button type="submit" variant="secondary">
          Tìm kiếm
        </Button>
      </form>
      <div className="filter-tabs mb-5">
        <button
          className="filter-button"
          aria-pressed={!state}
          onClick={() => {
            setState('');
            setPage(1);
          }}
        >
          Tất cả đơn
        </button>
        {Object.entries(BOOKING_STATES).map(([value, label]) => (
          <button
            key={value}
            className="filter-button"
            aria-pressed={state === value}
            onClick={() => {
              setState(value);
              setPage(1);
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <ResourceState resource={list} rows={5}>
        {bookings.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Mã đặt phòng / Khách hàng</th>
                  <th>Phòng</th>
                  <th>Lịch lưu trú</th>
                  <th>Trạng thái</th>
                  <th>Tổng tiền</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td>
                      <strong>{booking.booking_code}</strong>
                      <div>{booking.customer.name}</div>
                      <small>{booking.customer.phone || booking.customer.document_no}</small>
                    </td>
                    <td>
                      {booking.rooms.map((stay) => stay.room.room_no).join(', ')}
                      <small>{booking.rooms.length} phòng</small>
                    </td>
                    <td className="whitespace-nowrap">
                      {dateLabel(booking.rooms[0]?.start_date)}
                      <small>Đến {dateLabel(booking.rooms[0]?.end_date)}</small>
                    </td>
                    <td>
                      <Status state={booking.state} />
                    </td>
                    <td className="money">{money(booking.total)}</td>
                    <td>
                      <div className="table-actions">
                        <Button
                          variant="secondary"
                          icon={Eye}
                          onClick={() => setAction({ type: 'detail', booking })}
                        >
                          Chi tiết
                        </Button>
                        {booking.state === 'CONFIRMED' && (
                          <>
                            <Button
                              icon={LogIn}
                              disabled={!canCheckIn(booking)}
                              title={
                                !canCheckIn(booking)
                                  ? 'Chỉ nhận phòng đúng ngày đến của tất cả phòng'
                                  : 'Nhận phòng'
                              }
                              onClick={() => setAction({ type: 'checkin', booking })}
                            >
                              Nhận phòng
                            </Button>
                            <Button
                              variant="ghost"
                              icon={X}
                              onClick={() => setAction({ type: 'cancel', booking })}
                            >
                              Hủy đơn
                            </Button>
                          </>
                        )}
                        {booking.state === 'IN_HOUSE' && (
                          <>
                            <Button
                              variant="secondary"
                              icon={ConciergeBell}
                              onClick={() => setAction({ type: 'service', booking })}
                            >
                              Dịch vụ
                            </Button>
                            <Button
                              icon={ReceiptText}
                              onClick={() => setAction({ type: 'checkout', booking })}
                            >
                              Trả phòng
                            </Button>
                          </>
                        )}
                        {booking.state === 'COMPLETED' && booking.invoice && (
                          <Link
                            className="btn btn-secondary"
                            to={'/reception/invoices/' + booking.invoice.id}
                          >
                            Hóa đơn
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="Chưa có đơn phù hợp"
            description="Đổi bộ lọc hoặc tạo một đặt phòng mới."
            action={
              <Button icon={Plus} onClick={() => setCreating(true)}>
                Đặt phòng mới
              </Button>
            }
          />
        )}
        <Pagination data={list.data} page={page} onChange={setPage} />
      </ResourceState>
      {creating && <BookingModal onClose={() => setCreating(false)} onCreated={list.reload} />}
      {action?.type === 'checkout' && (
        <CheckoutModal
          booking={action.booking}
          onClose={() => setAction(null)}
          onDone={list.reload}
        />
      )}
      {action?.type === 'service' && (
        <ServiceModal
          booking={action.booking}
          onClose={() => setAction(null)}
          onDone={list.reload}
        />
      )}
      {['cancel', 'checkin'].includes(action?.type) && (
        <BookingAction {...action} onClose={() => setAction(null)} onDone={list.reload} />
      )}
      {action?.type === 'detail' && (
        <Modal
          title={action.booking.booking_code}
          description={action.booking.customer.name}
          onClose={() => setAction(null)}
          wide
        >
          <div className="stack">
            <Status state={action.booking.state} />
            <p className="muted text-xs">
              CCCD: {action.booking.customer.document_no} · Điện thoại:{' '}
              {action.booking.customer.phone || 'Chưa cung cấp'}
            </p>
            {action.booking.cancel_reason && (
              <p className="note">Lý do hủy: {action.booking.cancel_reason}</p>
            )}
            <BillDetails booking={action.booking} />
          </div>
        </Modal>
      )}
    </>
  );
}
