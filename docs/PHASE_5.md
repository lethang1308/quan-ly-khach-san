# Giai đoạn 5: Tích hợp, kiểm thử và nghiệm thu

## Kết quả tự động ngày 02/10/2026

| Hạng mục | Kết quả |
| --- | --- |
| BE, gồm toàn bộ 71 tests cũ | 82 PASS, 523 assertions |
| FE, gồm toàn bộ 6 tests cũ | 8 PASS |
| ESLint | PASS |
| Build Vite production | PASS, không warning/lỗi |
| API và cạnh tranh trên MySQL riêng | 9/9 PASS |
| edumatch: migrate:status | 13/13 migrations Ran |
| HotelDatabaseSeeder trên edumatch | Thành công, giữ các bản ghi/trạng thái đã có |

FE dùng API thực/Bearer token Sanctum. Các thao tác ghi không tự retry; đặt phòng/thanh toán giữ request_key khi gửi lại cùng payload. 401 của token cũ không xóa phiên mới; 429 giữ phiên và thông báo thời gian chờ.

## Điều chỉnh tích hợp cuối

- Booking DTO thêm business_date theo giờ Việt Nam của server. FE dùng ngày này để xét ngày nhận phòng, tránh đồng hồ trình duyệt lệch. BE vẫn kiểm tra ngày và READY trong transaction.
- Ghi dịch vụ ngoài IN_HOUSE trả 422/STAY_NOT_IN_HOUSE theo TEST-05.
- ROOM_NOT_READY nêu đúng phòng và trạng thái dọn dẹp/bảo trì bằng tiếng Việt.
- Toast thông báo được ẩn khi in, cùng menu và Header, để không xuất hiện trên hóa đơn A4.
- Có fixture MySQL riêng để demo đúng 23–26/12/2026, không đổi ngày máy hoặc cấu hình server chính.

## Ma trận kiểm thử PLAN

HotelPhase5AcceptanceTest dùng Bearer token thực; TEST-03 có hai bộ dữ liệu, nên bộ mới có 11 tests gồm Golden Flow.

| Mã | Quy tắc | Kết quả HTTP/DB xác minh |
| --- | --- | --- |
| Golden Flow | BR01–BR10 | 101, 23–26/12, 600k+900k+900k; dịch vụ 2×80k+3×20k; invoice/payment 2.620.000; COMPLETED → DIRTY → READY |
| TEST-01 | BR02 | 101 không có trong tra cứu 24–27/12; POST cố tình trả 409/ROOM_UNAVAILABLE; không thêm đơn |
| TEST-02 | BR01, BR02, BR03 | Đặt 101 từ 26–28/12 thành công; nhận đúng ngày và sau dọn READY |
| TEST-03 | BR03, BR04 | DIRTY/MAINTENANCE đều 409/ROOM_NOT_READY; đơn giữ CONFIRMED |
| TEST-04 | BR07 | Standard 600k→800k, mùa 900k→1.200k; đơn chưa trả giữ 2.400.000, invoice đã trả giữ 2.620.000 |
| TEST-05 | BR05, BR10 | Ghi dịch vụ sau checkout trả 422/STAY_NOT_IN_HOUSE; không thêm usage |
| TEST-06 | BR09 | Cùng key/amount trả invoice cũ, chỉ một payment; khác amount 409/IDEMPOTENCY_CONFLICT |
| TEST-07 | BR04 | Bảo trì 101 ngày 24–25/12 bị 409/MAINTENANCE_CONFLICT |
| TEST-08 | BR06 | Mùa Standard 25–30/12 bị 409/RATE_OVERLAP; mùa liền kề từ 01/01 thành công |
| TEST-09 | Ma trận quyền | Housekeeping đọc reports/sửa giá đều API 403; FE có trang 403 |

Các tests cũ tiếp tục kiểm tra ngày sai, sức chứa, hủy đơn đang ở, thanh toán sai tiền/rollback, snapshot hóa đơn/dịch vụ, token/quyền và quota. BR08 được kiểm tra qua tiền hóa đơn = tiền phòng + dịch vụ; không bỏ tests cũ để đạt số lượng checklist.

MySQL còn kiểm tra đặt cùng phòng đồng thời, cùng key cùng/khác payload, đặt cạnh tranh bảo trì, cùng CCCD giữa hai loại phòng, giá mùa chồng ngày, checkout lặp và dịch vụ cạnh tranh checkout. Schema cạnh tranh tự dọn sau khi chạy.

## Chạy lại kiểm thử

```powershell
cd C:\laragon\www\admin_Edumatch
$hotelPhp = 'C:\laragon\bin\php\php-8.3.33-Win32-vs16-x64\php.exe'
& $hotelPhp artisan test
& $hotelPhp scripts/verify_hotel_phase2_mysql.php
cd D:\EduMatch\quan-ly-khach-san
npm run lint
npm test
npm run build
```

Runtime: PHP 8.3.33, Node 22, Laravel 10, MySQL, React 19, Vite 8. .env FE chính trỏ http://localhost:8000/api; 8000/5173 tiếp tục dùng ngày thực Việt Nam.

## Chuẩn bị demo đúng lịch BTL

Ngày nghiệm thu thực là 02/10/2026, nên check-in 23/12 trên server chính sẽ vi phạm BR03. Script tạo schema edumatch_phase5_demo_ + 12 ký tự hex ngẫu nhiên, migrate/seed 30 phòng và bỏ đơn A đã hoàn tất chỉ trong fixture để tự tạo A từ đầu. Các phòng nền 201 đang ở, 102 bảo trì, 202 DIRTY vẫn có.

Manifest BE storage/app/hotel_phase5_demo/state.json không chứa mật khẩu/token. Router nằm ngoài public, chỉ chạy PHP built-in server; không thêm API đổi ngày. Không dùng migrate:fresh trên edumatch.

Terminal BE riêng:

```powershell
cd C:\laragon\www\admin_Edumatch
$hotelPhp = 'C:\laragon\bin\php\php-8.3.33-Win32-vs16-x64\php.exe'
& $hotelPhp scripts/hotel_phase5_demo.php prepare
& $hotelPhp -S 127.0.0.1:8001 scripts/hotel_phase5_router.php
```

Terminal FE riêng:

```powershell
cd D:\EduMatch\quan-ly-khach-san
$env:VITE_API_URL = 'http://127.0.0.1:8001'
npm run dev -- --host 127.0.0.1 --port 5174 --strictPort
```

Mở http://127.0.0.1:5174, dùng các nút tài khoản demo. Password demo: password. Đây là môi trường nghiệm thu riêng.

## Walkthrough trước hội đồng

1. Chuyển ba vai trò, giới thiệu menu phân quyền và 30 phòng.
2. Lễ tân chọn ngày xem 23/12, Đặt phòng 101 đến 26/12/2026, hai khách, dùng CCCD giả PHASE5-DEMO-A. Giới thiệu ba dòng 600k/900k/900k = 2.400.000.
3. Nhận phòng. Có thể trình diễn DIRTY/MAINTENANCE trước bằng lệnh fixture bên dưới; sau khi Buồng phòng dọn, quay về Lễ tân, Làm mới và nhận phòng thành công.
4. Thêm Giặt ủi 2 và Nước suối 3 cho 101. Kiểm tra dịch vụ 220.000, tổng 2.620.000.
5. Tại terminal BE khác, chuyển ngày demo sang ngày đi:

```powershell
cd C:\laragon\www\admin_Edumatch
& 'C:\laragon\bin\php\php-8.3.33-Win32-vs16-x64\php.exe' scripts/hotel_phase5_demo.php date 2026-12-26
```

6. Trả phòng, chọn CASH/TRANSFER, xác nhận đã thu 2.620.000; xem hóa đơn và bấm In hóa đơn. Trong hộp thoại trình duyệt chọn A4, lưu PDF hoặc máy in.
7. Buồng phòng thấy 101 DIRTY và thời điểm trả, bấm Đã dọn xong. Sơ đồ ngày 26/12 hiển thị 101 xanh/READY.
8. Quản lý xem báo cáo 23–26/12: thu 2.620.000, đêm phòng, công suất loại trừ bảo trì. Thử bảo trì 101 ngày 24–25/12 và mùa Standard 25–30/12 để thấy lỗi.
9. Housekeeping mở /manager/reports để thấy 403; dùng nút trở về phân hệ hợp lệ.

Fixture TEST-03 chỉ đổi phòng 101 của database demo và từ chối khi khách đang IN_HOUSE:

```powershell
& $hotelPhp scripts/hotel_phase5_demo.php room-state DIRTY
& $hotelPhp scripts/hotel_phase5_demo.php room-state MAINTENANCE
& $hotelPhp scripts/hotel_phase5_demo.php room-state DIRTY
```

Sau đó dọn qua UI. Để demo mới: dừng hai server kiểm thử bằng Ctrl+C, rồi:

```powershell
& $hotelPhp scripts/hotel_phase5_demo.php cleanup
& $hotelPhp scripts/hotel_phase5_demo.php prepare
```

Cleanup chỉ xóa schema đúng mẫu demo. Xóa override trong terminal FE riêng sau khi dùng bằng Remove-Item Env:VITE_API_URL; .env chính được giữ nguyên.

## Nghiệm thu trên trình duyệt thực tế

Đã chạy FE 5174 ↔ API 8001 ↔ MySQL riêng. Không dùng dữ liệu mock cho luồng dưới đây. Bản nghiệm thu giữ lại để xem kết quả; muốn trình diễn từ đầu thì cleanup/prepare theo hướng dẫn trên.

- Tạo đơn **BK-20261223-003**, phòng 101, khách giả Nguyễn Văn A nghiệm thu, ngày 23–26/12/2026. Tra cứu và đơn chốt đúng ba đêm 600.000/900.000/900.000 = 2.400.000.
- Tra cứu 24–27/12 không hiện 101; tra cứu 26–28/12 có 101. Việc tạo đơn nối tiếp và nhận phòng đúng ngày được kiểm tra thêm bằng TEST-02 tự động.
- Check-in DIRTY và MAINTENANCE bị từ chối, form hiện đúng trạng thái bằng tiếng Việt. Buồng phòng dọn READY, Lễ tân nhận phòng thành công.
- Ghi Giặt ủi 2 lượt và Nước suối 3 chai qua giao diện, dịch vụ 220.000. Trả phòng ngày 26/12, thanh toán CASH, lập **INV-20261226-002** tổng **2.620.000**.
- Thử nhấp đôi thanh toán: giao diện khóa khi đang gửi; MySQL có đúng **1 invoice, 1 payment**. TEST-06 xác minh thêm gửi lại cùng request_key và xung đột khác amount ở API.
- Đơn COMPLETED chỉ còn Chi tiết/Hóa đơn, không có nút Dịch vụ. TEST-05 gửi cố tình qua API nhận 422 và không thêm usage.
- Sau trả phòng, Buồng phòng thấy 101 DIRTY lúc 12:00 ngày 26/12; dọn xong, sơ đồ ngày 26/12 hiển thị Trống/READY.
- Reports 23–26/12: thực thu 2.620.000; 2 đơn trong kỳ; 5 đêm sử dụng; 116 đêm có thể bán, đã trừ 4 đêm bảo trì; công suất 4,31%.
- Form bảo trì 101 từ 24–25/12 và form mùa Standard 25–30/12 đều hiện lỗi xung đột. Không thêm lịch mới.
- Đổi giá cơ bản Standard thành 800.000 và mùa hiện có thành 1.200.000 qua form Quản lý. Mở lại hóa đơn: từng đêm vẫn 600.000/900.000/900.000, tổng phòng 2.400.000, tổng thu 2.620.000.
- Buồng phòng mở trực tiếp /manager/reports: hiện trang 403, có nút về phân hệ hợp lệ và chuyển demo sang Quản lý. API đổi giá bị 403 trong TEST-09.
- Console không có lỗi/warning React. Kiểm tra desktop và mobile **375px**: hóa đơn và sơ đồ không tràn ngang; menu di động mở và điều hướng được.

Đã kiểm tra nội dung hóa đơn tiếng Việt, đủ từng đêm/dịch vụ, tiền thu, thời điểm, chữ ký; CSS in dùng khổ A4, lề 15mm, ẩn menu/Header/toast và giữ hàng bảng khi ngắt trang. Chưa xác minh bản giấy hoặc PDF xuất từ hộp thoại in hệ điều hành; bước đó thực hiện bằng **In hóa đơn → A4 → Lưu PDF/máy in** trong walkthrough.

**Trạng thái demo giữ lại:** ngày 26/12/2026, phòng 101 READY, A COMPLETED, một payment 2.620.000. Giá Standard/mùa đã đổi theo TEST-04. Cleanup/prepare đưa lại giá 600.000/900.000 để chạy Golden Flow mới. Mã đơn/hóa đơn tự tăng nên không cố định hậu tố 001.

## Bằng chứng

Ảnh nằm trong [docs/phase5](phase5/), dùng dữ liệu khách giả:

| Bằng chứng | File |
| --- | --- |
| Bảng giá ba đêm | [01-nightly-quote.jpg](phase5/01-nightly-quote.jpg) |
| Chặn DIRTY | [02-dirty-guard.jpg](phase5/02-dirty-guard.jpg) |
| Bảng kê checkout | [03-checkout-preview.jpg](phase5/03-checkout-preview.jpg) |
| Hóa đơn đã thu 2.620.000 | [04-invoice-2620000.jpg](phase5/04-invoice-2620000.jpg) |
| Phòng DIRTY sau checkout | [05-room-dirty-after-checkout.jpg](phase5/05-room-dirty-after-checkout.jpg) |
| Phòng đã dọn READY | [06-room-ready.jpg](phase5/06-room-ready.jpg) |
| Buồng phòng bị 403 | [07-housekeeping-403.jpg](phase5/07-housekeeping-403.jpg) |
| Báo cáo doanh thu/công suất | [08-reports-2620000.jpg](phase5/08-reports-2620000.jpg) |
| Xung đột bảo trì | [09-maintenance-conflict.jpg](phase5/09-maintenance-conflict.jpg) |
| Xung đột giá mùa | [10-season-overlap.jpg](phase5/10-season-overlap.jpg) |
| Standard đổi giá 800.000 | [11-base-price-changed.jpg](phase5/11-base-price-changed.jpg) |
| Snapshot hóa đơn sau đổi giá | [12-invoice-snapshot-preserved.jpg](phase5/12-invoice-snapshot-preserved.jpg) |
| Hóa đơn mobile 375px | [13-mobile-invoice.jpg](phase5/13-mobile-invoice.jpg) |
| Sơ đồ mobile 375px | [14-mobile-room-board.jpg](phase5/14-mobile-room-board.jpg) |
| Đơn COMPLETED không có thao tác ghi dịch vụ | [15-completed-no-service-action.jpg](phase5/15-completed-no-service-action.jpg) |
| Đối soát trực tiếp MySQL, chỉ đọc | [mysql-status.json](phase5/mysql-status.json) |
