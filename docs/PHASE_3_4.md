# Giai đoạn 3 & 4: Frontend khách sạn

## Phạm vi triển khai

Ứng dụng React/Vite kết nối trực tiếp BE Laravel. Không có đăng nhập giả hoặc dữ liệu nghiệp vụ giả trong luồng đang sử dụng.

| Trang | Quản lý | Lễ tân | Buồng phòng |
| --- | --- | --- | --- |
| /reception/room-board | Xem | Xem và đặt phòng | Xem trạng thái phòng |
| /reception/bookings, /reception/bookings/new | 403 | Quản lý đặt phòng | 403 |
| /reception/invoices/:id, /reception/customers | 403 | Xem và in | 403 |
| /housekeeping, /housekeeping/maintenance | Xem và dọn phòng | 403 | Xem và dọn phòng |
| /manager/reports, /manager/maintenance | Toàn quyền | 403 | 403 |
| /manager/seasonal-rates, /manager/catalog | Toàn quyền | 403 | 403 |

Đây là ma trận điều hướng FE theo kế hoạch giai đoạn 3. Các quyền API giai đoạn 2 vẫn được BE kiểm tra riêng, một số API nghiệp vụ của BE cho phép cả manager và receptionist.

## Xác thực và chuyển vai trò

- Đăng nhập dùng số điện thoại/mật khẩu, hoặc tài khoản demo từ BE.
- Khôi phục phiên bằng /auth/me. 401 xóa phiên; lỗi mạng hiển thị nút kết nối lại.
- 429 giữ token và hiển thị số giây phải chờ từ Retry-After hoặc retry_after; không tự gửi lại liên tục. BE tách quota phiên khỏi quota nghiệp vụ.
- Role Switcher gọi /auth/quick-switch để nhận token của tài khoản demo đích. Khóa thao tác trong khi chuyển phiên và nạp lại dữ liệu theo token.
- Không dùng thay đổi role trong localStorage làm cơ chế phân quyền. Phản hồi 401 của token cũ không xóa token mới.
- Role Switcher chỉ hiện khi BE trả demo_switch_allowed=true trong xác thực hoặc /auth/me; BE giới hạn local/testing và token hotel-demo. Cập nhật tài khoản và điều hướng cùng React transition để tránh trang 403 trung gian khi chuyển từ một phân hệ riêng.

## Các màn hình

- Sơ đồ phòng theo tầng, năm trạng thái, bộ lọc ngày/loại/trạng thái và chi tiết phòng.
- Tra cứu nhiều phòng, báo giá từng đêm, số khách mỗi phòng, thông tin khách, xác nhận đặt phòng.
- Danh sách đơn phân trang, tìm mã/tên/điện thoại/CCCD, lọc bốn trạng thái, nhận phòng, hủy có lý do, dịch vụ.
- Quyết toán từng đêm và dịch vụ, CASH/TRANSFER, chuyển đến hóa đơn. Mã yêu cầu giữ nguyên khi gửi lại cùng payload; payload đổi sẽ dùng mã mới.
- Hóa đơn có bố cục A4, bảng chi tiết, phương thức thanh toán, thông tin khách và hai khu vực ký. In hoặc lưu PDF qua hộp thoại in của trình duyệt.
- Buồng phòng có thời điểm trả phòng, dọn xong chuyển READY; chặn nút dọn khi có bảo trì hôm nay.
- Báo cáo dùng doanh thu phòng/dịch vụ thực thu, số đơn có lịch lưu trú trong kỳ (không gồm đơn hủy), đêm phục vụ và công suất loại trừ bảo trì. Biểu đồ ngày có thu tiền và vòng công suất. API phân biệt bookings_count với completed_bookings đã thanh toán.
- Bảo trì hiện tại/tương lai/lịch sử, tạo và hủy; lỗi trùng lịch từ BE hiển thị ngay tại form.
- Giá mùa thêm/sửa/xóa, ngày kết thúc không gồm trong lịch giá; xung đột do BE kiểm tra.
- Danh mục thêm/sửa loại phòng, phòng, dịch vụ và tài khoản lễ tân/buồng phòng. Không chỉnh trạng thái vận hành trực tiếp.

## Thiết kế

Audit ban đầu: FE là template React Base, màu xanh dương, font hệ thống, các chỉ số demo và đăng nhập fallback giả; chưa có IA nghiệp vụ hay tài sản thương hiệu khách sạn cần giữ.

Áp dụng design-taste-frontend theo phạm vi phù hợp cho sản phẩm nội bộ: bố cục/chuyển động/mật độ 4/2/6, bảng dữ liệu thực dụng; nền xám xanh, một màu nhấn xanh rừng, Be Vietnam Pro tự host, icon Lucide sẵn có. Radix Dialog quản lý focus, Escape và thông báo tên hộp thoại. Các màu phòng mang ý nghĩa trạng thái. Controls 8px, panels 12px, badges 6px.

Có sáng/tối, responsive 2 cột phòng trên điện thoại, menu thu gọn, bảng cuộn ngang, reduced-motion, skeleton/error/empty và focus rõ ràng. Không áp dụng các quy tắc hero/marketing vào bảng nghiệp vụ.

## Chạy và demo

Node 22.12+ hoặc 20.19+ theo yêu cầu Vite 8; môi trường hiện tại Node 22.

```powershell
cd D:\EduMatch\quan-ly-khach-san
npm install
npm run dev
```

VITE_API_URL trong .env: http://localhost:8000 (FE tự thêm /api). Biến cũ VITE_API_BASE_URL=http://localhost:8000/api vẫn được hỗ trợ. BE chạy php artisan serve ở cổng 8000.

Demo: manager / receptionist / housekeeping, mật khẩu password, tương ứng số 0901000001 / 0901000002 / 0901000003. Tài khoản nhân viên mới được cấp mật khẩu từ 8 ký tự và chỉ đăng nhập bằng số điện thoại.

Dữ liệu mẫu cố định 23-26/12/2026. Báo cáo có nút chọn rõ khoảng mẫu. Giá phòng 103 ba đêm là 600.000 + 900.000 + 900.000 = 2.400.000 VNĐ. Hóa đơn mẫu đã thu 2.620.000 VNĐ.

Ngày mặc định và ngày nhận phòng luôn theo ngày thực tế tại Việt Nam. Để thử luồng đầy đủ ngay hôm nay, tạo một đơn mới có ngày đến hôm nay và chọn phòng READY; không đổi ngày máy hoặc giả ngày để nhận đơn mẫu tương lai.

## API bổ sung cho FE

BE thêm GET /rooms/maintenance (manager/housekeeping), GET/POST/PUT /staff (manager), last_checkout_at cho dirty rooms và tìm đơn theo số điện thoại. Staff không trả mật khẩu; đổi mật khẩu/vai trò hoặc khóa nhân viên sẽ thu hồi token. Tài khoản manager và demo được bảo vệ khỏi chỉnh sửa trong form nhân viên.

Giới hạn API: nghiệp vụ 300/phút/người dùng, /auth/me và /user dùng chung quota phiên riêng 60/phút/người dùng; đăng nhập/đăng ký 10/phút/IP, public 60/phút/IP. Có thể chỉnh qua HOTEL_API_REQUESTS_PER_MINUTE, HOTEL_PROFILE_REQUESTS_PER_MINUTE, HOTEL_LOGIN_REQUESTS_PER_MINUTE, HOTEL_PUBLIC_REQUESTS_PER_MINUTE trong BE .env. Khi đổi cấu hình, chạy php artisan config:clear.

Không cần migration mới cho các bổ sung này.

## Kiểm tra

```powershell
npm run lint
npm test
npm run build
```

BE: php artisan test. Bộ kiểm thử bổ sung xác minh quyền quản lý staff, chặn cấp role manager, khóa tài khoản/thu hồi token và danh sách bảo trì theo vai trò.

Kết quả ngày 02/10/2026: FE lint/build thành công, 6 kiểm thử Node; BE 71 kiểm thử, 423 assertions. Kiểm thử rate limit dùng Bearer token thực, kiểm tra tách quota, phân tách người dùng/IP, alias đăng nhập và phục hồi sau 61 giây. /auth/me trên server chính cổng 8000 trả 200 sau sửa.

Browser smoke test đã chạy luồng đặt hai phòng 103/104 hôm nay, nhận phòng, giặt ủi và nước uống, thanh toán chuyển khoản 1.420.000 VNĐ, xem hóa đơn, đổi vai trò và dọn hai phòng về READY. Giá ba đêm mùa cao điểm 2.400.000 VNĐ, truy cập trái vai trò 403 và form bảo trì trùng lịch cũng đã được kiểm tra trên giao diện. In vật lý phụ thuộc hộp thoại máy in của trình duyệt; bố cục hóa đơn A4 đã được kiểm tra.

Form bảo trì đã tạo phòng 105 ngày 03-04/10/2026, hủy thành công và loại khỏi danh sách đang hoạt động. Bố cục di động kiểm tra ở viewport 390×844: hai cột phòng, scrollWidth bằng clientWidth, menu mở và điều hướng được.

Ảnh giao diện: [Sơ đồ phòng](screenshots/room-board.jpg), [Điện thoại](screenshots/room-board-mobile.jpg), [Hóa đơn trong giao diện tối](screenshots/invoice-dark.jpg).

scripts/prepare_hotel_frontend_verification.php của BE tạo SQLite riêng dưới storage/app để kiểm thử thao tác trình duyệt. Chạy server kiểm thử với DB_CONNECTION=sqlite và DB_DATABASE trỏ đúng file đó; không dùng migrate:fresh trên cơ sở dữ liệu đang cấu hình.
