import { useState } from 'react';
import { Banknote, CalendarCheck, BedDouble, ChartNoAxesCombined } from 'lucide-react';
import { reportService } from '@/services/reportService';
import { useResource } from '@/hooks/useResource';
import { today, nights, dailyRevenue, money, dateLabel } from '@/utils/hotel';
import { PageTitle, Field, Button, Alert, ResourceState, Empty } from '@/components/hotel/UI';
function Kpi({ label, value, detail, icon: Icon }) {
  return (
    <article className="panel kpi">
      <div className="kpi-label">
        <span>{label}</span>
        <Icon size={18} />
      </div>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}
export default function ReportsPage() {
  const date = today();
  const initial = { from: date.slice(0, 8) + '01', to: date };
  const [range, setRange] = useState(initial);
  const [applied, setApplied] = useState(initial);
  const [error, setError] = useState(null);
  const report = useResource(['reports', applied], async (signal) => {
    const [revenue, occupancy, dashboard] = await Promise.all([
      reportService.revenue(applied, signal),
      reportService.occupancy(applied, signal),
      reportService.dashboard(signal),
    ]);
    return { revenue: revenue.data, occupancy: occupancy.data, dashboard: dashboard.data };
  });
  const { revenue, occupancy, dashboard } = report.data || {};
  const series = dailyRevenue(revenue?.payments || []);
  const maximum = Math.max(1, ...series.map((row) => row.amount));
  const submit = (event) => {
    event.preventDefault();
    if (!(nights(range.from, range.to) >= 0 && nights(range.from, range.to) < 366)) {
      setError(new Error('Chọn khoảng thời gian hợp lệ, tối đa 366 ngày.'));
      return;
    }
    setError(null);
    setApplied({ ...range });
  };
  return (
    <>
      <PageTitle
        title="Báo cáo & thống kê"
        description="Doanh thu đã thu và công suất phòng theo khoảng thời gian."
      />
      <form className="search-toolbar" onSubmit={submit}>
        <Field
          label="Từ ngày"
          type="date"
          required
          value={range.from}
          onChange={(event) => setRange({ ...range, from: event.target.value })}
        />
        <Field
          label="Đến ngày"
          type="date"
          required
          min={range.from}
          value={range.to}
          onChange={(event) => setRange({ ...range, to: event.target.value })}
        />
        <Button type="submit">Xem báo cáo</Button>
        <Button
          variant="secondary"
          onClick={() => {
            setRange({ from: '2026-12-23', to: '2026-12-26' });
            setApplied({ from: '2026-12-23', to: '2026-12-26' });
            setError(null);
          }}
        >
          Xem dữ liệu mẫu tháng 12/2026
        </Button>
      </form>
      <Alert error={error} />
      <ResourceState resource={report} rows={5}>
        {revenue && occupancy && (
          <>
            <div className="kpi-grid">
              <Kpi
                label="Doanh thu thực tế"
                value={money(revenue.total_revenue)}
                detail="Hóa đơn đã thanh toán"
                icon={Banknote}
              />
              <Kpi
                label="Đơn đặt phòng trong kỳ"
                value={revenue.bookings_count}
                detail="Có lịch lưu trú, không gồm đơn hủy"
                icon={CalendarCheck}
              />
              <Kpi
                label="Đêm phòng đã phục vụ"
                value={occupancy.occupied_nights}
                detail="Đêm đang ở và đã hoàn tất"
                icon={BedDouble}
              />
              <Kpi
                label="Công suất phòng"
                value={occupancy.occupancy_percent + '%'}
                detail="Loại trừ đêm phòng bảo trì"
                icon={ChartNoAxesCombined}
              />
            </div>
            <div className="report-grid">
              <section className="panel">
                <div className="panel-header">
                  <div>
                    <h2>Doanh thu theo ngày</h2>
                    <p className="muted text-xs mt-1">
                      {dateLabel(applied.from)} - {dateLabel(applied.to)}
                    </p>
                  </div>
                  <span className="status status-vacant">Đã thu tiền</span>
                </div>
                {series.length ? (
                  <div
                    className="revenue-chart"
                    role="img"
                    aria-label={
                      'Doanh thu từng ngày: ' +
                      series.map((row) => dateLabel(row.date) + ': ' + money(row.amount)).join('; ')
                    }
                  >
                    {series.map((row) => (
                      <div
                        className="chart-column"
                        key={row.date}
                        title={dateLabel(row.date) + ': ' + money(row.amount)}
                      >
                        <strong>{money(row.amount)}</strong>
                        <div
                          className="chart-bar"
                          style={{ height: Math.max(3, (row.amount / maximum) * 165) }}
                        />
                        <span>
                          {row.date.slice(8, 10)}/{row.date.slice(5, 7)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Empty
                    title="Chưa ghi nhận doanh thu"
                    description="Khoảng ngày này chưa có hóa đơn được thanh toán."
                  />
                )}
                <p className="muted text-xs mt-3">
                  Biểu đồ hiển thị các ngày có khoản thu thực tế.
                </p>
                <hr className="divider" />
                <div className="form-grid">
                  <div>
                    <small className="muted">Tiền phòng</small>
                    <h3 className="money mt-1">{money(revenue.room_revenue)}</h3>
                  </div>
                  <div>
                    <small className="muted">Tiền dịch vụ</small>
                    <h3 className="money mt-1">{money(revenue.service_revenue)}</h3>
                  </div>
                </div>
              </section>
              <section className="panel">
                <h2>Công suất khai thác</h2>
                <div
                  className="occupancy-ring"
                  style={{
                    background:
                      'conic-gradient(var(--accent) ' +
                      Math.min(100, occupancy.occupancy_percent) +
                      '%, var(--soft) 0)',
                  }}
                >
                  <div>
                    <strong>{occupancy.occupancy_percent}%</strong>
                    <small>Công suất phòng</small>
                  </div>
                </div>
                <div className="stack text-xs">
                  <div className="between">
                    <span className="muted">Đêm phòng sử dụng</span>
                    <strong>{occupancy.occupied_nights}</strong>
                  </div>
                  <div className="between">
                    <span className="muted">Đêm phòng có thể bán</span>
                    <strong>{occupancy.available_nights}</strong>
                  </div>
                  <div className="between">
                    <span className="muted">Đêm phòng bảo trì</span>
                    <strong>{occupancy.maintenance_nights}</strong>
                  </div>
                  <div className="between">
                    <span className="muted">Phòng đang kinh doanh</span>
                    <strong>{occupancy.room_count}</strong>
                  </div>
                </div>
                <p className="note mt-5">
                  Công suất = đêm phòng sử dụng / đêm phòng có thể bán × 100%.
                </p>
              </section>
            </div>
            {dashboard && (
              <section className="panel mt-5">
                <div className="panel-header">
                  <h2>Vận hành hôm nay</h2>
                  <span className="muted text-xs">{dateLabel(dashboard.date)}</span>
                </div>
                <div className="filter-tabs">
                  <span className="status status-vacant">{dashboard.vacant_rooms} phòng trống</span>
                  <span className="status status-occupied">{dashboard.occupied_rooms} đang ở</span>
                  <span className="status status-reserved">{dashboard.reserved_rooms} đã đặt</span>
                  <span className="status status-dirty">{dashboard.dirty_rooms} cần dọn</span>
                  <span className="status status-maintenance">
                    {dashboard.maintenance_rooms} bảo trì
                  </span>
                </div>
              </section>
            )}
          </>
        )}
      </ResourceState>
    </>
  );
}
