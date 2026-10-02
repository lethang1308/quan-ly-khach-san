import { useRef, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { catalogService } from '@/services/catalogService';
import { useResource } from '@/hooks/useResource';
import { money, dateLabel } from '@/utils/hotel';
import {
  PageTitle,
  Button,
  Modal,
  Alert,
  Empty,
  ResourceState,
  Pagination,
} from '@/components/hotel/UI';
import CatalogEditor from '@/components/hotel/CatalogEditor';
function DeleteRate({ item, onClose, onDone }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const submitting = useRef(false);
  return (
    <Modal title="Xóa đợt giá mùa" onClose={onClose} busy={busy}>
      <div className="stack">
        <p>Xóa đợt giá “{item.name}”?</p>
        <p className="note">
          Giá các đơn đã đặt vẫn giữ theo từng đêm đã chốt. Đơn đặt mới sẽ dùng biểu giá còn lại.
        </p>
        <Alert error={error} />
        <div className="modal-footer">
          <Button variant="secondary" onClick={onClose} disabled={busy}>
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
                await catalogService.deleteRate(item.id);
                toast.success('Đã xóa đợt giá mùa.');
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
            Xác nhận xóa
          </Button>
        </div>
      </div>
    </Modal>
  );
}
export default function SeasonalRatesPage() {
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const types = useResource('rate-types', (signal) => catalogService.all('room-types', signal));
  const list = useResource(['rate-periods', page], (signal) =>
    catalogService.list('rate-periods', { page, per_page: 10 }, signal)
  );
  const rows = list.data?.data || [];
  return (
    <>
      <PageTitle
        title="Biểu giá theo mùa"
        description="Thiết lập đơn giá theo lịch, áp dụng riêng cho từng loại phòng."
        action={
          <Button
            icon={Plus}
            disabled={types.loading || Boolean(types.error)}
            onClick={() => setEditing({})}
          >
            Thêm đợt giá
          </Button>
        }
      />
      <p className="note mb-5">
        Đợt giá áp dụng từ ngày bắt đầu đến trước ngày kết thúc. Hai đợt giá cùng loại phòng không
        được chồng lịch.
      </p>
      <ResourceState resource={types}>
        <ResourceState resource={list}>
          {rows.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Tên đợt giá</th>
                    <th>Loại phòng</th>
                    <th>Lịch áp dụng</th>
                    <th>Giá mỗi đêm</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.name}</strong>
                      </td>
                      <td>
                        {types.data?.find((type) => type.id === item.type_id)?.name || item.type_id}
                      </td>
                      <td>
                        {dateLabel(item.start_date.slice(0, 10))} -{' '}
                        {dateLabel(item.end_date.slice(0, 10))}
                        <small>Không gồm đêm ngày kết thúc</small>
                      </td>
                      <td className="money">{money(item.amount)}</td>
                      <td>
                        <div className="table-actions">
                          <Button
                            variant="secondary"
                            icon={Pencil}
                            onClick={() => setEditing(item)}
                          >
                            Chỉnh sửa
                          </Button>
                          <Button variant="ghost" icon={Trash2} onClick={() => setDeleting(item)}>
                            Xóa
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="panel">
              <Empty
                title="Chưa có giá mùa"
                description="Đặt phòng sẽ được tính theo giá cơ bản của loại phòng."
              />
            </div>
          )}
          <Pagination data={list.data} page={page} onChange={setPage} />
        </ResourceState>
      </ResourceState>
      {editing && (
        <CatalogEditor
          resource="rate-periods"
          item={
            editing.id
              ? {
                  ...editing,
                  start_date: editing.start_date.slice(0, 10),
                  end_date: editing.end_date.slice(0, 10),
                }
              : null
          }
          roomTypes={types.data || []}
          onClose={() => setEditing(null)}
          onDone={list.reload}
        />
      )}
      {deleting && (
        <DeleteRate item={deleting} onClose={() => setDeleting(null)} onDone={list.reload} />
      )}
    </>
  );
}
