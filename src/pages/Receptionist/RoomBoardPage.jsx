import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ChevronLeft, ChevronRight, BedDouble, Users, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useResource } from '@/hooks/useResource';
import { roomService } from '@/services/roomService';
import { bookingService } from '@/services/bookingService';
import { BOARD_STATES } from '@/constants/hotel';
import { today, addDays, dateLabel, money } from '@/utils/hotel';
import {
  PageTitle,
  Button,
  Field,
  Status,
  Modal,
  ResourceState,
  Empty,
} from '@/components/hotel/UI';
import BookingModal from './BookingModal';
function RoomDetail({ room, role, onClose, onBook }) {
  const booking = useResource(
    ['room-booking', room.id, room.booking_room?.booking_id, role],
    (signal) =>
      role === 'receptionist' && room.booking_room
        ? bookingService.get(room.booking_room.booking_id, signal)
        : Promise.resolve({ data: null })
  );
  return (
    <Modal title={'Phòng ' + room.room_no} onClose={onClose}>
      <div className="stack">
        <div className="between">
          <span>
            {room.room_type.name} · Tầng {room.floor}
          </span>
          <Status state={room.board_status} board />
        </div>
        <div className="inline muted">
          <Users size={17} />
          Tối đa {room.room_type.capacity} khách
          <BedDouble size={17} />
          {money(room.room_type.base_rate)} / đêm cơ bản
        </div>
        <p className="note">
          Trạng thái vận hành:{' '}
          {{
            READY: 'Sẵn sàng',
            DIRTY: 'Cần dọn dẹp',
            MAINTENANCE: 'Bảo trì',
            OCCUPIED: 'Đang có khách',
          }[room.state] || room.state}
          .
        </p>
        {room.booking_room && (
          <div className="quote-detail">
            <h3>Lịch lưu trú</h3>
            <p className="text-xs mt-2">
              {dateLabel(room.booking_room.start_date)} - {dateLabel(room.booking_room.end_date)}
            </p>
          </div>
        )}
        {room.maintenance_blocks?.map((block) => (
          <div className="note" key={block.id}>
            <strong>
              Bảo trì {dateLabel(block.start_date.slice(0, 10))} -{' '}
              {dateLabel(block.end_date.slice(0, 10))}
            </strong>
            <p>{block.reason || 'Chưa ghi lý do'}</p>
          </div>
        ))}
        {role === 'receptionist' && room.booking_room && (
          <ResourceState resource={booking}>
            {booking.data?.data && (
              <div className="quote-detail">
                <h3>{booking.data.data.customer.name}</h3>
                <p className="muted text-xs">
                  {booking.data.data.booking_code} ·{' '}
                  {booking.data.data.customer.phone || 'Chưa có số điện thoại'}
                </p>
              </div>
            )}
            <Link
              className="btn btn-secondary"
              to={
                '/reception/bookings?search=' +
                encodeURIComponent(booking.data?.data?.booking_code || '')
              }
            >
              Mở đơn đặt phòng
            </Link>
          </ResourceState>
        )}
        {!room.operational && (
          <p className="note">Phòng hoặc loại phòng đang tạm ngưng kinh doanh.</p>
        )}
        {role === 'receptionist' && room.board_status === 'VACANT' && (
          <Button icon={Plus} disabled={!room.operational} onClick={onBook}>
            Đặt phòng này
          </Button>
        )}
        {role === 'housekeeping' && room.state === 'DIRTY' && (
          <Link className="btn btn-primary" to="/housekeeping">
            Đến công việc dọn phòng
          </Link>
        )}
      </div>
    </Modal>
  );
}
export default function RoomBoardPage() {
  const { role } = useAuth();
  const [date, setDate] = useState(today);
  const [filter, setFilter] = useState('ALL');
  const [type, setType] = useState('');
  const [detail, setDetail] = useState(null);
  const [booking, setBooking] = useState(null);
  const board = useResource(['board', date], (signal) => roomService.board(date, signal));
  const rooms = board.data?.data || [];
  const types = [...new Map(rooms.map((room) => [room.type_id, room.room_type.name])).entries()];
  const visible = rooms.filter(
    (room) =>
      (filter === 'ALL' || room.board_status === filter) && (!type || String(room.type_id) === type)
  );
  const floors = [...new Set(visible.map((room) => room.floor))].sort((a, b) => a - b);
  return (
    <>
      <PageTitle
        title="Sơ đồ phòng"
        description={'Theo dõi tình trạng phòng và lịch lưu trú ngày ' + dateLabel(date) + '.'}
        action={
          <>
            {role === 'receptionist' && (
              <Button icon={Plus} onClick={() => setBooking({})}>
                Đặt phòng
              </Button>
            )}
            <Button variant="secondary" icon={RefreshCw} onClick={board.reload}>
              Làm mới
            </Button>
          </>
        }
      />
      <ResourceState resource={board} rows={4}>
        <div className="summary-strip">
          {Object.entries(BOARD_STATES).map(([state, info]) => (
            <div className="summary-item" key={state}>
              <span className={'status ' + info.className}>{info.label}</span>
              <strong>{rooms.filter((room) => room.board_status === state).length}</strong>
            </div>
          ))}
        </div>
      </ResourceState>
      <div className="board-toolbar">
        <Field
          label="Ngày xem phòng"
          type="date"
          value={date}
          required
          onChange={(event) => {
            if (event.target.value) setDate(event.target.value);
          }}
        />
        <div className="date-controls">
          <button
            className="icon-button"
            aria-label="Ngày trước"
            onClick={() => setDate(addDays(date, -1))}
          >
            <ChevronLeft size={17} />
          </button>
          <Button variant="secondary" onClick={() => setDate(today())}>
            Hôm nay
          </Button>
          <button
            className="icon-button"
            aria-label="Ngày tiếp"
            onClick={() => setDate(addDays(date, 1))}
          >
            <ChevronRight size={17} />
          </button>
        </div>
        <Field
          label="Loại phòng"
          as="select"
          value={type}
          onChange={(event) => setType(event.target.value)}
        >
          <option value="">Tất cả</option>
          {types.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </Field>
      </div>
      <div className="filter-tabs mb-6">
        <button
          className="filter-button"
          aria-pressed={filter === 'ALL'}
          onClick={() => setFilter('ALL')}
        >
          Tất cả phòng
        </button>
        {Object.entries(BOARD_STATES).map(([value, info]) => (
          <button
            key={value}
            className="filter-button"
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
          >
            {info.label}
          </button>
        ))}
      </div>
      <ResourceState resource={board} rows={6}>
        {floors.map((floor) => (
          <section className="floor-section" key={floor}>
            <div className="floor-heading">
              <h2>Tầng {floor}</h2>
              <small>{visible.filter((room) => room.floor === floor).length} phòng</small>
            </div>
            <div className="room-grid">
              {visible
                .filter((room) => room.floor === floor)
                .map((room) => (
                  <button
                    className="room-card"
                    data-state={room.board_status}
                    key={room.id}
                    aria-label={
                      'Phòng ' + room.room_no + ', ' + BOARD_STATES[room.board_status].label
                    }
                    onClick={() => setDetail(room)}
                  >
                    <div className="between">
                      <span className="room-number">{room.room_no}</span>
                      <BedDouble size={20} className="room-glyph" />
                    </div>
                    <div className="room-type">{room.room_type.name}</div>
                    <Status state={room.board_status} board />
                    <div className="room-foot">
                      <span className="inline">
                        <Users size={13} />
                        {room.room_type.capacity} khách
                      </span>
                      <span className="money">{money(room.room_type.base_rate)}</span>
                    </div>
                  </button>
                ))}
            </div>
          </section>
        ))}
        {!visible.length && (
          <Empty
            title="Không có phòng phù hợp"
            description="Chọn lại loại phòng hoặc trạng thái."
          />
        )}
        <p className="muted text-xs">
          Giá trên thẻ là giá cơ bản mỗi đêm. Giá mùa được tính khi tra cứu lịch lưu trú.
        </p>
      </ResourceState>
      {detail && (
        <RoomDetail
          room={detail}
          role={role}
          onClose={() => setDetail(null)}
          onBook={() => {
            setBooking({ room: detail });
            setDetail(null);
          }}
        />
      )}
      {booking && (
        <BookingModal
          initialRoom={booking.room}
          initialDate={date}
          onClose={() => setBooking(null)}
          onCreated={board.reload}
        />
      )}
    </>
  );
}
