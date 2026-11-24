# Hành trình khoa bảng

Website tĩnh tiếng Việt cho tour khu bia tiến sĩ Văn Miếu – Quốc Tử Giám. Dùng HTML, CSS, JavaScript, Pannellum, Google Model Viewer, GSAP, HTML Audio và QRCode Generator.

## Chạy trên máy

Giải nén ZIP. Mở Terminal hoặc PowerShell tại thư mục chứa `index.html`. Chạy `python -m http.server 8000` (Windows có thể dùng `py -m http.server 8000`). Truy cập http://localhost:8000/. Máy có VS Code Live Server có thể mở `index.html` qua tiện ích đó. Trình phục vụ HTTP cần thiết cho các mô-đun Web3D.

Trong phòng tham quan hoặc phòng hiện vật, nút **Nạp thử** mở ảnh 2:1 hoặc GLB trên máy. Tệp nạp thử dùng trong tab hiện tại và mất khi tải lại trang. Để cả nhóm xem chung, chép tư liệu vào thư mục tương ứng, cấu hình đường dẫn và đăng website.

## Gắn tư liệu của nhóm

| Thư mục | Tư liệu | Điền vào `js/config.js` |
| --- | --- | --- |
| `panoramas/` | Ảnh 360° toàn cầu (equirectangular, tỉ lệ 2:1) | `scenes[].panorama`, ví dụ `"panoramas/gieng-thien-quang.jpg"` |
| `models/` | Tệp GLB 2.0 chính gốc có quyền dùng | `objects[].model`, ví dụ `"models/bia-1442.glb"` |
| `audio/` | Nhạc nền, tiếng môi trường, tiếng tương tác, tiếng chuyển cảnh và thuyết minh | `audio.music`, `audio.ambience`, `audio.interaction`, `audio.transition`, `objects[].audio` |
| `images/` | Ảnh nền và tài nguyên giao diện | Ảnh nền hiện được khai báo trong `css/site.css` |

- Trong `scenes[].points`, điền `pitch` và `yaw` theo độ, rồi điền một trong hai trường `scene` hoặc `object` bằng ID đích. Góc và liên kết trong bản bàn giao là thông số bố trí thử. Hãy đối chiếu từng ảnh và từng bia trước khi công bố để hotspot nằm đúng chỗ.
- Trong `objects[].hotspots`, thêm các điểm sau khi đo hoặc xác định tọa độ trên từng GLB gốc. Ví dụ định dạng: `{ label: "Trán bia", position: "0m 1.2m 0.1m", normal: "0m 0m 1m", text: "Nội dung đã kiểm chứng" }`. Thay tọa độ minh họa bằng tọa độ thật. Có thể chỉ định `environment` là đường dẫn HDR ánh sáng từ trên để điều chỉnh ánh sáng mà vẫn giữ nguyên mô hình và texture.
- Nếu dùng GLB nén Draco hoặc KTX2 cần kiểm tra trình duyệt tải được bộ giải mã tương ứng của Model Viewer. Bản hiện tại dùng ánh sáng môi trường trung tính.
- Cấu hình bản thu để có thuyết minh đồng nhất trên các thiết bị. Khi chưa có bản thu, website dùng giọng tiếng Việt của thiết bị nếu có.
- Điền `team` và `canva`. Dùng link để xem hoặc trình chiếu của nhóm. Khi để trống, nút **Quay lại Canva** mở ô nhập link để thử trong phiên hiện tại.
- Bổ sung nguồn, tác giả và giấy phép ảnh 360°, GLB và âm thanh của nhóm ngay trong README này, đồng thời thay phần ghi công dưới ảnh nếu đổi ảnh nền.

## Đăng lên GitHub Pages và gắn vào slide

1. Tạo kho GitHub chứa các tệp và thư mục đã giải nén. Đặt `index.html` ở thư mục gốc của kho.
2. Vào **Settings → Pages → Build and deployment → Deploy from a branch**. Chọn `main` và `/(root)`, rồi lưu.
3. Khi GitHub Pages cấp URL, mở phòng hoặc cảnh cần chia sẻ, bấm **Chia sẻ / QR** để lấy link và mã QR. Trong slide Canva, gắn link vào ảnh, chữ hoặc nút bấm. Gửi cùng link đó qua Zalo.
4. Kiểm tra link ở chế độ xem Canva trên một thiết bị khác, sau đó thử nút quay lại Canva từ website.

Các đường dẫn có thể gắn ngay sau dấu `/` cuối của URL GitHub Pages:

| Nút trên slide | Đường dẫn |
| --- | --- |
| Mở website | `#trang-chu` |
| Bắt đầu tham quan | `#tham-quan/thien-quang` |
| Nhà bia phía tây | `#tham-quan/nha-bia-tay` |
| Nhà bia phía đông | `#tham-quan/nha-bia-dong` |
| Bia khoa Nhâm Tuất | `#hien-vat/nham-tuat-1442` |
| Bia khoa Giáp Thìn | `#hien-vat/giap-thin-1604` |
| Dòng thời gian | `#lich-su` |
| Trắc nghiệm | `#trac-nghiem` |

## Tình trạng bàn giao

- Các thư mục tư liệu đã có sẵn. Cần bổ sung panorama, GLB, âm thanh, tên nhóm và link Canva thực tế.
- Cần căn chỉnh hướng camera ban đầu, hotspot 360° và hotspot chi tiết trên GLB khi có tệp thật.
- Đã kiểm tra cú pháp JavaScript, đường dẫn tài nguyên nội bộ và tính toàn vẹn của ZIP. Môi trường kiểm thử chặn Chromium khởi động. Chưa xác minh kết xuất WebGL, âm thanh, toàn màn hình và luồng chạm trên thiết bị thực.
- Trang chưa được công bố lên GitHub Pages. Đường dẫn chính thức và QR sẽ dùng địa chỉ của bản đã triển khai.

## Nguồn

- [UNESCO Memory of the World: Stone Stele Records of Royal Examinations](https://www.unesco.org/en/memory-world/stone-stele-records-royal-examinations-le-and-mac-dynasties-1442-1779)
- [Trung tâm Văn Miếu – Quốc Tử Giám: Khu bia tiến sĩ và giếng Thiên Quang](https://www.vanmieu.gov.vn/en/introduction/areas/inner-temple/doctoral-stelae-garden)
- [Trung tâm Văn Miếu – Quốc Tử Giám: Văn bia tiến sĩ](https://vanmieu.gov.vn/en/library/doctoral-stelae)
- [Nhà bia tiến sĩ](https://commons.wikimedia.org/wiki/File:Nhà_bia_tiến_sĩ.jpg) · Ảnh của Bùi Thụy Đào Nguyên, [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). Bản 1280 px từ Commons, hiển thị có lớp phủ tối và cắt theo khung màn hình.
- Thư viện: Pannellum 2.5.6 (MIT), Google Model Viewer 4.0.0 (Apache-2.0), GSAP 3.12.5 (giấy phép GSAP), QRCode Generator 1.4.4 (MIT). Thông tin giấy phép nằm trong `vendor/`.
