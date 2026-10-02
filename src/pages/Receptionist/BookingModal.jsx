import { useRef, useState } from 'react';
import { Search, Check, BedDouble } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { bookingService } from '@/services/bookingService';
import { catalogService } from '@/services/catalogService';
import { useResource } from '@/hooks/useResource';
import { today, addDays, nights, dateLabel, money, requestIdentity } from '@/utils/hotel';
import { Modal, Field, Button, Alert, Empty } from '@/components/hotel/UI';

export default function BookingModal({ initialRoom, initialDate, onClose, onCreated }) {
  const navigate = useNavigate();
  const start = initialDate && initialDate >= today() ? initialDate : today();
  const [search, setSearch] = useState({
    start_date: start,
    end_date: addDays(start, 1),
    type_id: '',
    guest_count: 1,
  });
  const [quote, setQuote] = useState(null);
  const [selected, setSelected] = useState([]);
  const [customer, setCustomer] = useState({ name: '', document_no: '', phone: '', email: '' });
  const [error, setError] = useState(null);
  const [finding, setFinding] = useState(false);
  const [saving, setSaving] = useState(false);
  const searching = useRef(false);
  const submitting = useRef(false);
  const identity = useRef(null);
  const types = useResource('booking-room-types', (signal) =>
    catalogService.all('room-types', signal)
  );
  const update = (field, value) => {
    setSearch((current) => ({ ...current, [field]: value }));
    setQuote(null);
    setSelected([]);
    setError(null);
  };
  const lookup = async () => {
    if (searching.current) return;
    const count = nights(search.start_date, search.end_date);
    if (!(count > 0 && count <= 366)) {
      setError(new Error('Ngày đi phải sau ngày đến, tối đa 366 đêm.'));
      return;
    }
    searching.current = true;
    setFinding(true);
    setError(null);
    try {
      const response = await bookingService.search({
        ...search,
        type_id: search.type_id || undefined,
      });
      setQuote(response.data);
      setSelected(
        initialRoom && response.data.some((room) => room.id === initialRoom.id)
          ? [initialRoom.id]
          : []
      );
    } catch (err) {
      setError(err);
    } finally {
      searching.current = false;
      setFinding(false);
    }
  };
  const chosen = (quote || []).filter((room) => selected.includes(room.id));
  const total = chosen.reduce((sum, room) => sum + room.room_total, 0);
  const submit = async (event) => {
    event.preventDefault();
    if (submitting.current || !chosen.length) return;
    const payload = {
      customer_info: customer,
      rooms: chosen.map((room) => ({ room_id: room.id, guest_count: Number(search.guest_count) })),
      start_date: search.start_date,
      end_date: search.end_date,
    };
    identity.current = requestIdentity(identity.current, payload);
    submitting.current = true;
    setSaving(true);
    setError(null);
    try {
      const response = await bookingService.create({
        ...payload,
        request_key: identity.current.key,
      });
      toast.success('Đã tạo đơn ' + response.data.booking_code);
      onCreated?.(response.data);
      onClose();
      navigate('/reception/bookings');
    } catch (err) {
      setError(err);
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  };
  return (
    <Modal
      title="Tra cứu & đặt phòng"
      description="Giá từng đêm được tính theo lịch lưu trú và biểu giá hiện hành."
      onClose={onClose}
      busy={saving || finding}
      wide
    >
      <div className="booking-layout">
        <div className="stack">
          <fieldset disabled={finding || saving} className="form-grid border-0 p-0 m-0">
            <Field
              label="Ngày đến"
              type="date"
              required
              min={today()}
              value={search.start_date}
              onChange={(event) => update('start_date', event.target.value)}
            />
            <Field
              label="Ngày đi"
              type="date"
              required
              min={addDays(search.start_date || today(), 1)}
              value={search.end_date}
              onChange={(event) => update('end_date', event.target.value)}
            />
            <Field
              label="Loại phòng"
              as="select"
              value={search.type_id}
              onChange={(event) => update('type_id', event.target.value)}
            >
              <option value="">Tất cả loại phòng</option>
              {types.data
                ?.filter((type) => type.active)
                .map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
            </Field>
            <Field
              label="Số khách mỗi phòng"
              type="number"
              min="1"
              max="1000"
              required
              value={search.guest_count}
              onChange={(event) => update('guest_count', event.target.value)}
            />
          </fieldset>
          {types.error && <Alert error={types.error} />}
          <Button
            variant="secondary"
            icon={Search}
            busy={finding}
            disabled={
              saving || !search.start_date || !search.end_date || Number(search.guest_count) < 1
            }
            onClick={lookup}
          >
            Tìm phòng trống
          </Button>
          {quote && (
            <div>
              <div className="panel-header">
                <h3>Phòng có thể đặt</h3>
                <small className="muted">{quote.length} phòng phù hợp</small>
              </div>
              {quote.length ? (
                <div className="quote-list">
                  {quote.map((room) => (
                    <label className="quote-room" key={room.id}>
                      <div className="inline">
                        <input
                          type="checkbox"
                          disabled={saving}
                          checked={selected.includes(room.id)}
                          onChange={(event) =>
                            setSelected((current) =>
                              event.target.checked
                                ? [...current, room.id]
                                : current.filter((id) => id !== room.id)
                            )
                          }
                        />
                        <div>
                          <h3>Phòng {room.room_no}</h3>
                          <small>
                            {room.room_type.name} · {room.room_type.capacity} khách
                          </small>
                        </div>
                      </div>
                      <div className="money">
                        {money(room.room_total)}
                        <small>{room.night_count} đêm</small>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <Empty
                  title="Không có phòng trống"
                  description="Thử đổi ngày hoặc giảm số khách mỗi phòng."
                />
              )}
            </div>
          )}
          {!quote && (
            <div className="note inline">
              <BedDouble size={18} />
              Chọn lịch lưu trú rồi tìm phòng để xem giá chính xác.
            </div>
          )}
        </div>
        <form onSubmit={submit} className="stack">
          <h3>Thông tin khách hàng</h3>
          <fieldset disabled={saving} className="form-grid border-0 p-0 m-0">
            <Field
              className="span-full"
              label="Họ và tên"
              autoComplete="name"
              required
              maxLength={255}
              value={customer.name}
              onChange={(event) => setCustomer({ ...customer, name: event.target.value })}
            />
            <Field
              label="CCCD / Hộ chiếu"
              required
              maxLength={50}
              value={customer.document_no}
              onChange={(event) => setCustomer({ ...customer, document_no: event.target.value })}
            />
            <Field
              label="Số điện thoại"
              type="tel"
              maxLength={20}
              value={customer.phone}
              onChange={(event) => setCustomer({ ...customer, phone: event.target.value })}
            />
            <Field
              className="span-full"
              label="Email (không bắt buộc)"
              type="email"
              maxLength={255}
              value={customer.email}
              onChange={(event) => setCustomer({ ...customer, email: event.target.value })}
            />
          </fieldset>
          <div className="quote-detail">
            <h3>Chi tiết tiền phòng</h3>
            {chosen.length ? (
              chosen.map((room) => (
                <div key={room.id} className="mt-4">
                  <strong className="text-xs">Phòng {room.room_no}</strong>
                  {room.nightly_prices.map((price) => (
                    <div key={price.night} className="price-line">
                      <span>Đêm {dateLabel(price.night)}</span>
                      <span className="money">{money(price.amount)}</span>
                    </div>
                  ))}
                </div>
              ))
            ) : (
              <p className="muted text-xs mt-2">Chưa chọn phòng.</p>
            )}
            <div className="total-line">
              <div className="text-xs">
                Tổng tiền phòng
                <small className="block muted">
                  {chosen.length} phòng ·{' '}
                  {Math.max(0, nights(search.start_date, search.end_date) || 0)} đêm
                </small>
              </div>
              <strong className="money">{money(total)}</strong>
            </div>
          </div>
          <Alert error={error} />
          <Button type="submit" icon={Check} busy={saving} disabled={!chosen.length || finding}>
            Xác nhận đặt phòng
          </Button>
        </form>
      </div>
    </Modal>
  );
}
