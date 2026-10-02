import { useRef, useState } from 'react';
import { Brush, Check, RefreshCw, Wrench } from 'lucide-react';
import toast from 'react-hot-toast';
import { roomService } from '@/services/roomService';
import { useResource } from '@/hooks/useResource';
import { today, dateLabel, timeLabel } from '@/utils/hotel';
import { PageTitle, Button, ResourceState, Empty, Status, Alert } from '@/components/hotel/UI';
function CleaningJob({ room, blocked, onDone }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const submitting = useRef(false);
  const clean = async () => {
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError(null);
    try {
      await roomService.clean(room.id);
      toast.success('Phòng ' + room.room_no + ' đã sẵn sàng.');
      onDone();
    } catch (err) {
      setError(err);
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  };
  return (
    <article className="panel job-card">
      <div className="between">
        <div>
          <h2>Phòng {room.room_no}</h2>
          <p className="muted text-xs">
            Tầng {room.floor} · {room.room_type.name}
          </p>
        </div>
        <Brush size={23} className="muted" />
      </div>
      <Status state={blocked ? 'MAINTENANCE' : 'DIRTY'} board />
      <p className="muted text-xs">Trả phòng: {timeLabel(room.last_checkout_at)}</p>
      {blocked && (
        <p className="note">Phòng có lịch bảo trì hôm nay. Chờ bàn giao trước khi dọn.</p>
      )}
      <Alert error={error} />
      <Button icon={Check} busy={busy} disabled={blocked} onClick={clean}>
        Hoàn tất dọn phòng
      </Button>
    </article>
  );
}
export default function HousekeepingPage({ maintenanceOnly = false }) {
  const dirty = useResource('dirty-rooms', (signal) => roomService.dirty(signal));
  const maintenance = useResource('housekeeping-maintenance', async (signal) => {
    const [blocks, board] = await Promise.all([
      roomService.maintenance({ active: 1, upcoming: 1, per_page: 100 }, signal),
      roomService.board(today(), signal),
    ]);
    let rows = [...blocks.data],
      page = 2;
    while (page <= blocks.last_page) {
      const next = await roomService.maintenance(
        { active: 1, upcoming: 1, per_page: 100, page },
        signal
      );
      rows.push(...next.data);
      page++;
    }
    return {
      blocks: rows,
      rooms: board.data.filter((room) => room.board_status === 'MAINTENANCE'),
    };
  });
  const refresh = () => {
    dirty.reload();
    maintenance.reload();
  };
  const blocks = maintenance.data?.blocks || [];
  const blockedRooms = new Set(maintenance.data?.rooms.map((room) => room.id) || []);
  return (
    <>
      <PageTitle
        title={maintenanceOnly ? 'Phòng bảo trì' : 'Công việc buồng phòng'}
        description={
          maintenanceOnly
            ? 'Theo dõi phòng sửa chữa và lịch sắp tới để phối hợp bàn giao.'
            : 'Hoàn tất dọn dẹp và bàn giao phòng sẵn sàng cho lễ tân.'
        }
        action={
          <Button variant="secondary" icon={RefreshCw} onClick={refresh}>
            Làm mới
          </Button>
        }
      />
      {!maintenanceOnly && (
        <ResourceState resource={dirty}>
          <div className="panel-header">
            <h2>Phòng cần dọn</h2>
            <span className="muted text-xs">{dirty.data?.data.length || 0} phòng đang DIRTY</span>
          </div>
          <ResourceState resource={maintenance}>
            {dirty.data?.data.length ? (
              <div className="job-grid">
                {dirty.data.data.map((room) => (
                  <CleaningJob
                    room={room}
                    key={room.id}
                    blocked={blockedRooms.has(room.id)}
                    onDone={refresh}
                  />
                ))}
              </div>
            ) : (
              <div className="panel">
                <Empty
                  title="Các phòng đã được bàn giao"
                  description="Chưa có phòng cần dọn. Danh sách sẽ cập nhật sau khi khách trả phòng."
                />
              </div>
            )}
          </ResourceState>
        </ResourceState>
      )}
      <section className={maintenanceOnly ? '' : 'mt-8'}>
        <div className="panel-header">
          <h2>Lịch bảo trì</h2>
          <span className="inline muted text-xs">
            <Wrench size={15} />
            Hiện tại & sắp tới
          </span>
        </div>
        <ResourceState resource={maintenance}>
          {blocks.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Phòng</th>
                    <th>Thời gian</th>
                    <th>Lý do</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {blocks.map((block) => (
                    <tr key={block.id}>
                      <td>
                        <strong>{block.room.room_no}</strong>
                        <small>
                          Tầng {block.room.floor} · {block.room.room_type.name}
                        </small>
                      </td>
                      <td>
                        {dateLabel(block.start_date)} - {dateLabel(block.end_date)}
                        <small>Ngày kết thúc không tính vào lịch</small>
                      </td>
                      <td>{block.reason || 'Chưa ghi lý do'}</td>
                      <td>
                        {block.start_date <= today() ? (
                          <Status state="MAINTENANCE" board />
                        ) : (
                          <span className="status status-reserved">Sắp tới</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="panel">
              <Empty title="Chưa có lịch bảo trì hiện tại hoặc sắp tới" />
            </div>
          )}
          {maintenance.data?.rooms
            .filter((room) => !blocks.some((block) => block.room_id === room.id))
            .map((room) => (
              <div className="note mt-3" key={room.id}>
                Phòng {room.room_no} đang ở trạng thái bảo trì. Liên hệ quản lý để nhận bàn giao.
              </div>
            ))}
        </ResourceState>
      </section>
    </>
  );
}
