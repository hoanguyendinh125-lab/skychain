# Mã nguồn SkyChain Logistics

Bản xuất từ phiên bản đã xuất bản của SkyChain. Toàn bộ giao diện, mô phỏng, PWA và Worker được giữ nguyên. Bổ sung `run-local.mjs` để chạy trên máy cá nhân. Không chứa API key, lịch sử Git hay dữ liệu đơn trên thiết bị của người dùng.

## Chạy bằng VS Code

1. Cài Node.js 22 trở lên. Giải nén ZIP và mở thư mục `skychain-source` bằng VS Code.
2. Mở Terminal trong thư mục đó.
3. Chạy:

```sh
npm run build
node run-local.mjs
```

4. Mở http://localhost:3000. Nhấn Ctrl+C trong Terminal để dừng.

Dự án không có thư viện npm phụ thuộc nên không cần `npm install`. Mỗi lần sửa mã, chạy lại build và khởi động lại server. Bản đồ cần Internet để tải Leaflet và các ô bản đồ OpenStreetMap.

Đăng nhập demo: tài khoản có sẵn, mật khẩu `skychain2026`. OTP hiển thị trong màn hình nhận hàng khi chuyến đã đến nơi.

## Các file chính

- `public/app.js`: giao diện, điều hướng, các màn hình và thao tác.
- `public/app.css`, `public/map.css`, `public/readability.css`: thiết kế và chữ.
- `public/core.js`: đơn hàng, tính phương án và trạng thái mô phỏng.
- `public/maps.js`: Leaflet, OpenStreetMap, tìm địa điểm và GPS.
- `public/sw.js`, `public/manifest.webmanifest`: PWA và bộ nhớ đệm offline.
- `worker.js`: phục vụ ứng dụng và cấu hình dịch vụ bản đồ.
- `build.mjs`: đóng gói ứng dụng vào `dist/server/index.js`.
- `test-core.mjs`, `test-ui.mjs`: kiểm tra logic và dựng giao diện bằng mô phỏng DOM.

## OpenStreetMap

Ứng dụng tải các tile đang hiển thị qua endpoint cùng tên miền `/api/tiles/...`, nhận dữ liệu từ `tile.openstreetmap.org`, cache bảy ngày và tự chuyển sang `tile.openstreetmap.de` khi nguồn chính lỗi. Ứng dụng dùng Nominatim để tìm kiếm. Không cần API key và attribution OpenStreetMap luôn hiển thị trên bản đồ.

Tìm kiếm chỉ chạy khi người dùng bấm tìm, tối đa bốn kết quả, giới hạn một yêu cầu mỗi giây và tái sử dụng kết quả trong phiên. Ứng dụng không tải hàng loạt hoặc lưu tile cho chế độ offline.

Có thể đổi nhà cung cấp tương thích khi triển khai bằng hai biến môi trường tùy chọn:

```env
OSM_TILE_URL=https://tile.openstreetmap.org/{z}/{x}/{y}.png
OSM_FALLBACK_TILE_URL=https://tile.openstreetmap.de/{z}/{x}/{y}.png
OSM_SEARCH_URL=https://nominatim.openstreetmap.org/search
```

Nếu triển khai cho lượng truy cập đáng kể, hãy dùng nhà cung cấp OSM phù hợp hoặc máy chủ riêng thay vì phụ thuộc vào dịch vụ cộng đồng.

## Kiểm tra và đưa lên hosting khác

```sh
npm run build
npm test
```

Worker đầu ra tương thích giao diện Cloudflare Workers `fetch(request, env)`. File `.openai/hosting.json` giữ mã Site gốc để tái tạo bản build; không dùng mã này để đăng ký một Site mới. ZIP không tự cấp quyền truy cập hay xuất bản vào tài khoản hosting.

Nếu bản cũ còn lưu trong trình duyệt, tải lại trang; khi phát triển có thể xóa service worker/cache của localhost qua Developer Tools. PWA/GPS trên điện thoại thường cần HTTPS; server local trong bản xuất chỉ mở trên chính máy tính của bạn.

Đơn, UAV, điều phối AI, chuỗi lạnh và OTP/POD là mô phỏng lưu cục bộ. Nền bản đồ và GPS dùng dịch vụ/thiết bị thật khi khả dụng. Chưa có backend xác thực, kết nối UAV, SMS hoặc điều phối y tế thật.
