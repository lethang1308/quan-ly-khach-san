import { useParams, Link } from 'react-router-dom';
import { Printer } from 'lucide-react';
import { useResource } from '@/hooks/useResource';
import { stayService } from '@/services/stayService';
import { dateLabel, timeLabel, money } from '@/utils/hotel';
import { PageTitle, Button, Brand, ResourceState } from '@/components/hotel/UI';
import BillDetails from '@/components/hotel/BillDetails';
export default function InvoicePrint() {
  const { id } = useParams();
  const resource = useResource(['invoice', id], (signal) => stayService.invoice(id, signal));
  const data = resource.data?.data;
  return (
    <>
      <div className="no-print">
        <PageTitle
          title="Hóa đơn thanh toán"
          description="Bản in chi tiết tiền phòng và dịch vụ đã ghi nhận."
          action={
            <>
              <Link className="btn btn-secondary" to="/reception/bookings">
                Về danh sách
              </Link>
              <Button icon={Printer} disabled={!data} onClick={() => window.print()}>
                In hóa đơn
              </Button>
            </>
          }
        />
      </div>
      <ResourceState resource={resource}>
        {data && (
          <article className="invoice-sheet">
            <div className="invoice-heading">
              <div>
                <Brand />
                <h3 className="mt-3">{data.hotel.name}</h3>
                {data.hotel.address && <p className="muted text-xs">{data.hotel.address}</p>}
                {data.hotel.phone && (
                  <p className="muted text-xs">Điện thoại: {data.hotel.phone}</p>
                )}
              </div>
              <div>
                <h1>HÓA ĐƠN THANH TOÁN</h1>
                <p className="muted text-xs mt-2">Số: {data.invoice.invoice_code}</p>
                <p className="muted text-xs">Ngày lập: {dateLabel(data.invoice.issued_at)}</p>
              </div>
            </div>
            <div className="invoice-meta">
              <div>
                <p>
                  <strong>Khách hàng:</strong> {data.booking.customer.name}
                </p>
                <p>CCCD / Hộ chiếu: {data.booking.customer.document_no}</p>
                <p>Điện thoại: {data.booking.customer.phone || 'Chưa cung cấp'}</p>
              </div>
              <div>
                <p>
                  <strong>Mã đặt phòng:</strong> {data.booking.booking_code}
                </p>
                <p>
                  Thanh toán:{' '}
                  {data.invoice.payment?.method === 'TRANSFER' ? 'Chuyển khoản' : 'Tiền mặt'}
                </p>
                <p>Thời điểm thu tiền: {timeLabel(data.invoice.payment?.paid_at)}</p>
              </div>
            </div>
            <BillDetails booking={data.booking} />
            <div className="invoice-total">
              <p className="muted text-xs">Số tiền đã thanh toán</p>
              <strong>{money(data.invoice.payment?.amount)}</strong>
            </div>
            <div className="signatures">
              <div>
                <strong>Người lập hóa đơn</strong>
                <small>(Ký và ghi rõ họ tên)</small>
              </div>
              <div>
                <strong>Khách hàng</strong>
                <small>(Ký và ghi rõ họ tên)</small>
                <p className="mt-14">{data.booking.customer.name}</p>
              </div>
            </div>
            <p className="invoice-end">Cảm ơn quý khách. Hẹn gặp lại!</p>
          </article>
        )}
      </ResourceState>
    </>
  );
}
