# Tài liệu Kỹ thuật: Khắc phục Triệt để Lỗi Responsive trên Mobile & Tinh chỉnh Tóc Bạc 3D

---

## 1. Mục đích
- **Khắc phục lỗi Responsive trên Mobile / Tablet:**
  - Nút bấm cảm xúc (`0Đ - BỎ ĐI`, `5K - CỨU ĐÓI`, `20K - BỮA NO`,...) trước đây bị bẻ dòng (wrap) thành 2-3 tầng, đè bẹp trực tiếp lên bong bóng thoại lời nói của ông lão.
  - Tỉ lệ khung hình dọc của điện thoại làm góc nhìn camera (FOV) bị thu hẹp ngang, khiến nhân vật 3D bị zoom quá sát và che mất chiếc ca, bát ăn xin.
  - Các tấm bìa carton hai bên (`sign-left`, `sign-right`) quá to, che mất mặt chiếu ngồi vỉa hè.
- **Khắc phục phần tóc 3D của ông:**
  - Trước đây mảng tóc đỉnh đầu (`hairCap`) bị đặt sai tọa độ (chìm sâu bên trong mặt), khiến ông lão nhìn từ phía trước trông như bị trọc đầu.
  - Đã nắn lại toàn bộ vòm sọ, bổ sung đầy đủ chỏm tóc đỉnh đầu, tóc mai hai bên thái dương, tóc gáy phủ cổ và gán buffer màu đỉnh (`color attribute`) để tóc bạc nổi bật tự nhiên.

---

## 2. Cấu trúc File & Thành phần liên quan

```text
src/
├── Beggar.tsx             # Tự động điều chỉnh Camera FOV (40deg) & vị trí Z khi màn hình hẹp (<600px)
├── character/
│   └── createBeggar.ts    # Tọa độ chuẩn cho vòm tóc bạc đỉnh đầu (y=0.38-0.58) & gán vertex color buffer
└── index.css              # Tái cấu trúc Media Query @media (max-width: 860px) & @media (max-width: 380px)

tests/
└── beggar.spec.ts         # Test case 5 xác thực tự động không có va chạm (overlap) giữa toolbar và speech bubble
```

---

## 3. Chi tiết Giải pháp Kỹ thuật

### 3.1. Thanh công cụ Biểu cảm (Hero Emotion Toolbar)
- **Trước đây:** Dùng `position: absolute; top: 14px; right: 16px; flex-wrap: wrap;`. Trên màn hình 375px, các nút dài bị dồn thành 2-3 dòng có tọa độ `y = 618px - 680px`, trùng khít với bong bóng thoại `y = 631px - 731px`.
- **Giải pháp:**
  - Chuyển thành **thanh trượt ngang 1 hàng duy nhất (Single-line Horizontal Scroll)**: `display: flex; flex-wrap: nowrap; overflow-x: auto; -webkit-overflow-scrolling: touch;`.
  - Nút bấm giữ nguyên kích thước bấm ngón tay thuận tiện, không gãy dòng.
  - Đặt bong bóng thoại `.speech-bubble` tại `top: 48px`, cách đáy thanh công cụ một khoảng an toàn, đảm bảo đáy toolbar (`y ≈ 573px`) luôn nằm phía trên đỉnh bong bóng thoại (`y ≈ 577px`).

### 3.2. Căn chỉnh Camera 3D cho Điện thoại
- Trong hàm `resize()` của `Beggar.tsx`, khi chiều rộng container `< 600px`:
  - `camera.fov = 40` (thay vì 35).
  - `camera.position.set(0, 3.2, 10.6)` (lùi xa và hơi hạ thấp góc nhìn).
  - Giúp toàn bộ thân hình ngồi xếp bằng, chiếc ca thiếc, bát quyên góp và tấm chiếu hiển thị trọn vẹn ở chính giữa màn hình mà không bị xén mép.

### 3.3. Dáng tóc bạc tự nhiên (Elderly Silver Hair)
- Đặt `hairCap` chính xác tại vòm sọ `(x: 0, y: 0.38, z: -0.04)` với bán kính `0.228`.
- Gán `Float32BufferAttribute` màu sắc với sắc độ bạc sáng `0.82 - 0.96` cho `hairCapGeom` để vật liệu `MeshPhysicalMaterial` hiển thị ổn định trên mọi GPU di động.
- Sinh các chùm tóc uốn tự nhiên phủ từ đỉnh đầu (`y = 0.49 - 0.58`), rủ xuống thái dương hai bên và sau gáy.

---

## 4. Kết quả Kiểm thử Tự động (Playwright)
- Đạt **5/5 tests passed** trong 30 giây:
  - Test 1: Nút bấm cảm xúc theo mệnh giá tiền.
  - Test 2: Thẻ cảm xúc mục 02.
  - Test 3: Chạm trực tiếp vào nhân vật 3D (Raycasting).
  - Test 4: Hiển thị VietQR và banner Slogan Đời IT lương 4 triệu.
  - **Test 5: Kiểm tra Responsive Mobile (375x667): Bounding box toolbar bottom <= speech bubble top (Zero collision).**
