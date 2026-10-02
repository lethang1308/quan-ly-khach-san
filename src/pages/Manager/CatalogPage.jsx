import { useState } from 'react';
import { Plus, Pencil, RefreshCw } from 'lucide-react';
import { catalogService } from '@/services/catalogService';
import { useResource } from '@/hooks/useResource';
import { ROLES } from '@/constants/hotel';
import { money } from '@/utils/hotel';
import { PageTitle, Button, Empty, ResourceState, Pagination } from '@/components/hotel/UI';
import CatalogEditor from '@/components/hotel/CatalogEditor';
const tabs = {
  'room-types': 'Loại phòng',
  rooms: 'Phòng',
  services: 'Dịch vụ',
  staff: 'Nhân viên',
};
export default function CatalogPage() {
  const [tab, setTab] = useState('room-types');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const types = useResource('catalog-types', (signal) => catalogService.all('room-types', signal));
  const list = useResource(['catalog', tab, page], (signal) =>
    catalogService.list(tab, { page, per_page: 10 }, signal)
  );
  const typeName = (id) => types.data?.find((type) => type.id === id)?.name || 'Loại #' + id;
  return (
    <>
      <PageTitle
        title="Danh mục & nhân viên"
        description="Thiết lập phòng, dịch vụ và tài khoản cho đội ngũ khách sạn."
        action={
          <>
            <Button
              icon={Plus}
              disabled={types.loading || Boolean(types.error)}
              onClick={() => setEditing({})}
            >
              Thêm {tabs[tab].toLocaleLowerCase('vi')}
            </Button>
            <Button variant="secondary" icon={RefreshCw} onClick={list.reload}>
              Làm mới
            </Button>
          </>
        }
      />
      <div className="filter-tabs catalog-tabs">
        {Object.entries(tabs).map(([value, label]) => (
          <button
            key={value}
            className="filter-button"
            aria-pressed={tab === value}
            onClick={() => {
              setTab(value);
              setPage(1);
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <ResourceState resource={types}>
        <ResourceState resource={list}>
          {list.data?.data.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{tab === 'rooms' ? 'Số phòng' : 'Tên'}</th>
                    <th>
                      {tab === 'room-types'
                        ? 'Sức chứa'
                        : tab === 'rooms'
                          ? 'Tầng / Loại phòng'
                          : tab === 'staff'
                            ? 'Vai trò / Số điện thoại'
                            : 'Đơn vị tính'}
                    </th>
                    {['room-types', 'services'].includes(tab) && <th>Đơn giá</th>}
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {list.data.data.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{tab === 'rooms' ? item.room_no : item.name}</strong>
                      </td>
                      <td>
                        {tab === 'room-types' ? (
                          item.capacity + ' khách'
                        ) : tab === 'rooms' ? (
                          'Tầng ' + item.floor + ' · ' + typeName(item.type_id)
                        ) : tab === 'staff' ? (
                          <>
                            {ROLES[item.role]?.label}
                            <small>{item.phone}</small>
                          </>
                        ) : (
                          item.unit
                        )}
                      </td>
                      {['room-types', 'services'].includes(tab) && (
                        <td className="money">{money(item.base_rate ?? item.price)}</td>
                      )}
                      <td>
                        <span
                          className={
                            'status ' +
                            ((item.active ?? item.is_active)
                              ? 'booking-completed'
                              : 'booking-cancelled')
                          }
                        >
                          {(item.active ?? item.is_active)
                            ? tab === 'staff'
                              ? 'Hoạt động'
                              : 'Đang kinh doanh'
                            : 'Tạm ngưng'}
                        </span>
                        {tab === 'rooms' && <small>Vận hành: {item.state}</small>}
                      </td>
                      <td>
                        <Button
                          variant="secondary"
                          icon={Pencil}
                          disabled={item.protected}
                          title={
                            item.protected ? 'Tài khoản demo và quản lý được bảo vệ' : undefined
                          }
                          onClick={() => setEditing(item)}
                        >
                          Chỉnh sửa
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="panel">
              <Empty title="Chưa có dữ liệu" />
            </div>
          )}
          <Pagination data={list.data} page={page} onChange={setPage} />
        </ResourceState>
      </ResourceState>
      {editing && (
        <CatalogEditor
          resource={tab}
          item={editing.id ? editing : null}
          roomTypes={types.data || []}
          onClose={() => setEditing(null)}
          onDone={() => {
            list.reload();
            types.reload();
          }}
        />
      )}
    </>
  );
}
