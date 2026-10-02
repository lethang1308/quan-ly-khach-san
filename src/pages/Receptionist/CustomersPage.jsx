import { useState } from 'react';
import { catalogService } from '@/services/catalogService';
import { useResource } from '@/hooks/useResource';
import { PageTitle, Field, Empty, ResourceState, Pagination } from '@/components/hotel/UI';
export default function CustomersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const resource = useResource('customers', (signal) => catalogService.all('customers', signal));
  const customers = (resource.data || []).filter((item) =>
    [item.name, item.phone, item.document_no].some((value) =>
      value?.toLocaleLowerCase('vi').includes(search.toLocaleLowerCase('vi'))
    )
  );
  const data = { total: customers.length, last_page: Math.ceil(customers.length / 15) };
  return (
    <>
      <PageTitle
        title="Khách hàng"
        description="Thông tin khách được cập nhật khi tiếp nhận đặt phòng."
      />
      <div className="search-toolbar">
        <Field
          label="Tìm khách hàng"
          placeholder="Họ tên, điện thoại hoặc CCCD"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
      </div>
      <ResourceState resource={resource}>
        {customers.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Khách hàng</th>
                  <th>CCCD / Hộ chiếu</th>
                  <th>Điện thoại</th>
                  <th>Email</th>
                </tr>
              </thead>
              <tbody>
                {customers.slice((page - 1) * 15, page * 15).map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <strong>{customer.name}</strong>
                    </td>
                    <td>{customer.document_no}</td>
                    <td>{customer.phone || 'Chưa cung cấp'}</td>
                    <td>{customer.email || 'Chưa cung cấp'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title="Không tìm thấy khách hàng" />
        )}
        <Pagination data={data} page={page} onChange={setPage} />
      </ResourceState>
    </>
  );
}
