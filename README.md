# EduMatch - Frontend quản lý khách sạn

Giai đoạn 5: [kết quả nghiệm thu, ma trận ràng buộc và kịch bản demo](docs/PHASE_5.md).

React 19 + Vite 8 + Tailwind 4, kết nối API Laravel. Giai đoạn 3-4 đã có không gian Lễ tân, Buồng phòng và Quản lý.

## Khởi chạy

Yêu cầu Node 20.19+ hoặc 22.12+. BE chạy tại http://localhost:8000.

```powershell
npm install
# Nếu chưa có .env:
Copy-Item .env.example .env
npm run dev
```

Cấu hình `VITE_API_URL=http://localhost:8000` trong .env. FE tự thêm `/api` và dùng chung cấu hình cho toàn bộ Axios services.

Trên Vercel, đặt `VITE_API_URL=https://admin-edumatch.onrender.com` cho môi trường deploy cần dùng, rồi Redeploy để build nhận giá trị mới. API base URL sẽ là `https://admin-edumatch.onrender.com/api`.

`VITE_API_URL` được ưu tiên hơn biến cũ `VITE_API_BASE_URL` (URL đầy đủ có `/api`). File .env local cũ vẫn được hỗ trợ; nếu không có biến nào, dev dùng localhost:8000/api, production dùng đường dẫn cùng origin `/api`.

Chọn vai trò demo ở trang đăng nhập; hoặc đăng nhập bằng số điện thoại của nhân viên. Header cho phép chuyển nhanh giữa ba tài khoản demo khi BE bật demo local/testing.

## Kiểm tra và build

```powershell
npm run lint
npm test
npm run build
npm run preview
```

## Tài liệu

[Chi tiết giai đoạn 3-4, ma trận vai trò, API và kịch bản demo](docs/PHASE_3_4.md).

Sơ đồ phòng theo ngày thực tế. Dữ liệu mẫu giá mùa và hóa đơn nằm trong khoảng 23-26/12/2026. Nhận phòng yêu cầu ngày đến hôm nay và phòng READY; tạo đơn mới để thử đầy đủ luồng ngay hôm nay.

Các trang dùng API thật; không có fallback đăng nhập giả. Dialog dùng Radix và font Be Vietnam Pro tự host; có giao diện sáng/tối, menu trên điện thoại và hóa đơn A4.
