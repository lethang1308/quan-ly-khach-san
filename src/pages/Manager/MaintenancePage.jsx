import { useRef, useState } from 'react';
import { Plus, X, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { roomService } from '@/services/roomService';
import { catalogService } from '@/services/catalogService';
import { useResource } from '@/hooks/useResource';
import { today, addDays, dateLabel } from '@/utils/hotel';
import {
  PageTitle,
  Field,
  Button,
  Alert,
  ResourceState,
  Empty,
  Pagination,
  Modal,
  Status,
} from '@/components/hotel/UI';
function CancelMaintenance({ block, onClose, onDone }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const submitting = useRef(false);
  return (
    <Modal title={'Hủy lịch bảo trì phòng ' + block.room.room_no} onClose={onClose} busy={busy}>
      <div className="stack">
        <p>
          {dateLabel(block.start_date)} - {dateLabel(block.end_date)}
        </p>
        <p className="muted text-xs">Hủy lịch sẽ giải phóng khoảng ngày bảo trì của phòng.</p>
        <Alert error={error} />
        <div className="modal-footer">
          <Button variant="secondary" disabled={busy} onClick={onClose}>
            Quay lại
          </Button>
          <Button
            variant="danger"
            busy={busy}
            onClick={async () => {
              if (submitting.current) return;
              submitting.current = true;
              setBusy(true);
              setError(null);
              try {
                await roomService.cancelMaintenance(block.id);
                toast.success('Đã hủy lịch bảo trì.');
                onDone();
                onClose();
              } catch (err) {
                setError(err);
              } finally {
                setBusy(false);
                submitting.current = false;
              }
            }}
          >
            Xác nhận hủy lịch
          </Button>
        </div>
      </div>
    </Modal>
  );
}
export default function MaintenancePage() {
  const [form, setForm] = useState({
    room_id: '',
    start_date: today(),
    end_date: addDays(today(), 1),
    reason: '',
  });
  const [page, setPage] = useState(1);
  const [history, setHistory] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [cancel, setCancel] = useState(null);
  const submitting = useRef(false);
  const rooms = useResource('maintenance-rooms', (signal) => catalogService.all('rooms', signal));
  const list = useResource(['maintenance', page, history], (signal) =>
    roomService.maintenance(
      { page, per_page: 10, ...(history ? {} : { active: 1, upcoming: 1 }) },
      signal
    )
  );
  const submit = async (event) => {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError(null);
    try {
      await roomService.createMaintenance({ ...form, room_id: Number(form.room_id) });
      toast.success('Đã tạo lịch bảo trì.');
      setForm({ ...form, room_id: '', reason: '' });
      setPage(1);
      list.reload();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
      submitting.current = false;
    }
  };
  return (
    <>
      <PageTitle
        title="Lịch bảo trì"
        description="Bố trí sửa chữa và kiểm tra xung đột với lịch lưu trú."
        action={
          <Button variant="secondary" icon={RefreshCw} onClick={list.reload}>
            Làm mới
          </Button>
        }
      />
      <div className="maintenance-layout">
        <section className="panel">
          <h2 className="mb-5">Tạo lịch bảo trì</h2>
          <ResourceState resource={rooms}>
            <form className="stack" onSubmit={submit}>
              <fieldset className="stack border-0 m-0 p-0" disabled={busy}>
                <Field
                  label="Phòng"
                  as="select"
                  required
                  value={form.room_id}
                  onChange={(event) => setForm({ ...form, room_id: event.target.value })}
                >
                  <option value="">Chọn phòng</option>
                  {rooms.data?.map((room) => (
                    <option key={room.id} value={room.id}>
                      Phòng {room.room_no} · Tầng {room.floor}
                    </option>
                  ))}
                </Field>
                <Field
                  label="Ngày bắt đầu"
                  type="date"
                  required
                  value={form.start_date}
                  onChange={(event) => setForm({ ...form, start_date: event.target.value })}
                />
                <Field
                  label="Ngày kết thúc"
                  type="date"
                  required
                  min={addDays(form.start_date || today(), 1)}
                  hint="Phòng có thể bán trở lại từ ngày này."
                  value={form.end_date}
                  onChange={(event) => setForm({ ...form, end_date: event.target.value })}
                />
                <Field
                  label="Lý do bảo trì"
                  as="textarea"
                  maxLength={2000}
                  value={form.reason}
                  onChange={(event) => setForm({ ...form, reason: event.target.value })}
                />
              </fieldset>
              <Alert error={error} />
              <Button type="submit" busy={busy} icon={Plus}>
                Tạo lịch bảo trì
              </Button>
            </form>
          </ResourceState>
        </section>
        <section>
          <div className="panel-header">
            <h2>{history ? 'Tất cả lịch bảo trì' : 'Hiện tại & sắp tới'}</h2>
            <label className="check-label">
              <input
                type="checkbox"
                checked={history}
                onChange={(event) => {
                  setHistory(event.target.checked);
                  setPage(1);
                }}
              />
              Xem lịch sử
            </label>
          </div>
          <ResourceState resource={list}>
            {list.data?.data.length ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Phòng / Lý do</th>
                      <th>Thời gian</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.data.data.map((block) => (
                      <tr key={block.id}>
                        <td>
                          <strong>Phòng {block.room.room_no}</strong>
                          <small>{block.reason || 'Chưa ghi lý do'}</small>
                        </td>
                        <td className="whitespace-nowrap">
                          {dateLabel(block.start_date)}
                          <small>Đến {dateLabel(block.end_date)}</small>
                        </td>
                        <td>
                          {!block.active ? (
                            <span className="status booking-cancelled">Đã hủy</span>
                          ) : block.end_date <= today() ? (
                            <span className="status booking-completed">Đã kết thúc</span>
                          ) : block.start_date > today() ? (
                            <span className="status status-reserved">Sắp tới</span>
                          ) : (
                            <Status state="MAINTENANCE" board />
                          )}
                        </td>
                        <td>
                          {block.active && (
                            <Button variant="ghost" icon={X} onClick={() => setCancel(block)}>
                              Hủy lịch
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="panel">
                <Empty
                  title="Chưa có lịch bảo trì"
                  description="Tạo lịch mới bằng biểu mẫu bên cạnh."
                />
              </div>
            )}
            <Pagination data={list.data} page={page} onChange={setPage} />
          </ResourceState>
        </section>
      </div>
      {cancel && (
        <CancelMaintenance block={cancel} onClose={() => setCancel(null)} onDone={list.reload} />
      )}
    </>
  );
}
