import { dateLabel, money } from '@/utils/hotel';
export default function BillDetails({ booking }) {
  return (
    <div className="stack">
      {booking.rooms.map((stay) => (
        <section key={stay.id}>
          <div className="between mb-3">
            <h3>
              Phòng {stay.room.room_no}{' '}
              <span className="muted text-xs">{stay.room.room_type.name}</span>
            </h3>
            <small className="muted">
              {dateLabel(stay.start_date)} - {dateLabel(stay.end_date)}
            </small>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nội dung</th>
                  <th>Số lượng</th>
                  <th>Đơn giá</th>
                  <th className="text-right">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {stay.nightly_prices.map((night) => (
                  <tr key={'night-' + night.night}>
                    <td>Tiền phòng đêm {dateLabel(night.night)}</td>
                    <td>1 đêm</td>
                    <td className="money">{money(night.amount)}</td>
                    <td className="text-right money">{money(night.amount)}</td>
                  </tr>
                ))}
                {stay.service_usages.map((usage) => (
                  <tr key={'service-' + usage.id}>
                    <td>
                      {usage.service_name}
                      <small>Dịch vụ</small>
                    </td>
                    <td>
                      {usage.quantity} {usage.unit}
                    </td>
                    <td className="money">{money(usage.unit_price)}</td>
                    <td className="text-right money">{money(usage.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
      <div className="quote-detail">
        <div className="price-line">
          <span>Tổng tiền phòng</span>
          <span className="money">{money(booking.room_total)}</span>
        </div>
        <div className="price-line">
          <span>Tổng tiền dịch vụ</span>
          <span className="money">{money(booking.service_total)}</span>
        </div>
        <div className="total-line">
          <strong>Tổng thanh toán</strong>
          <span className="money">{money(booking.total)}</span>
        </div>
      </div>
    </div>
  );
}
