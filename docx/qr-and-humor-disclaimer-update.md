# Tài liệu Kỹ thuật: Cập nhật Mã VietQR & Thông điệp Hài hước "Đời IT Lương 4 Triệu"

---

## 1. Mục đích
- Thay thế mã SVG QR minh họa ban đầu bằng ảnh mã **VietQR (Napas 247)** thực tế của người dùng để tăng tính tương tác và chân thực.
- Cập nhật dòng chữ miễn trừ trách nhiệm khô khan ("Đây là website giải trí mô phỏng. Không nhận quyên góp thật.") thành thông điệp dí dỏm, hài hước về nỗi niềm của dân công nghệ: **"Đời IT lương 4 triệu, tối về ôm laptop ra vỉa hè xin bát cơm chan nước mắt."**

---

## 2. Cấu trúc File & Thành phần liên quan

```text
src/
├── assets/
│   └── qr-donate.png      # File ảnh VietQR Napas 247 tích hợp vào pipeline bundle của Vite
├── App.tsx                # Import qrDonate, render trong .qr-frame và cập nhật các dòng disclaimer
└── index.css              # Thêm quy tắc CSS cho .qr-frame img (bo góc, full-width)

public/
└── qr-donate.png          # Bản sao ảnh tĩnh hỗ trợ tham chiếu trực tiếp

docx/
└── qr-and-humor-disclaimer-update.md # Tài liệu ghi nhận thay đổi này

tests/
└── beggar.spec.ts         # Bổ sung test case 4 xác thực hiển thị ảnh QR và disclaimer "Đời IT lương 4 triệu"
```

---

## 3. Luồng hoạt động & Chi tiết thay đổi (UI & Content)

### 3.1. Thay đổi Logo & Gỡ bỏ toàn bộ "Figma Make"
- **Favicon & Web Logo:** Thiết kế lại toàn bộ `public/favicon.svg` thành biểu tượng ca thiếc vỉa hè kim loại với đồng xu vàng đang rơi và chữ `IT` khắc nổi.
- **Header Brand:** Bổ sung logo ca thiếc vào thanh điều hướng bên cạnh chữ `XIN ĐI BRO ® · ĂN XIN 4.0 · ĐỜI IT LƯƠNG 4 TRIỆU`.
- **Gỡ bỏ tên Figma Make:** 
  - Đổi `package.json` sang `"name": "beggar-online"`.
  - Cập nhật `.figma/make/site.json` và `vite.config.ts` để fallback title là `"XIN ĐI BRO — Online Beggar Simulator"`.
  - Loại bỏ hoàn toàn các thẻ meta và tên cũ của Figma Make App.

### 3.2. Nâng cấp Slogan "Đời IT Lương 4 Triệu" thành Tiêu điểm Nổi bật
- **Khắc phục lỗi mờ/khó đọc:** Thay vì để một đoạn text disclaimer 8px màu nâu chìm nghỉm, ta biến câu nói thành **Card Slogan trung tâm** `.it-slogan-card` mang phong cách bìa các-tông cao cấp:
  - Viền vàng kim nghệ thuật `border: 2px solid #dfb872` trên nền than đêm vỉa hè `#181c15`.
  - Tag huy hiệu `★ SLOGAN ĐỜI IT ★` màu vàng đồng sắc nét.
  - Chữ slogan `“Đời IT lương 4 triệu, tối về ôm laptop ra vỉa hè xin bát cơm chan nước mắt.”` nổi bật với font viết tay `Patrick Hand`, màu kem vàng sáng `#fff2bf` và đổ bóng chữ rõ ràng.
- **Dải chữ chạy (Ticker):** Cập nhật dải chữ chạy liên tục ngang màn hình:
  `SLOGAN ĐỜI IT: “ĐỜI IT LƯƠNG 4 TRIỆU, TỐI VỀ ÔM LAPTOP RA VỈA HÈ XIN BÁT CƠM CHAN NƯỚC MẮT.” ★ QUÉT VIETQR CỨU ĐÓI DEV KHẨN CẤP!`
- **Hero Footnote:** Đưa slogan lên ngay chân trang Hero để người dùng vừa vào web là đọc được ngay.

---

## 4. Kiểm thử Tự động (Playwright)
- File `tests/beggar.spec.ts` có thêm bài test `4. VietQR code and IT salary disclaimer display`:
  - Xác thực phần tử `.qr-frame img` hiển thị rõ ràng và có thuộc tính `src` chứa `qr-donate`.
  - Xác thực chuỗi text `"Đời IT lương 4 triệu"` xuất hiện đầy đủ tại cả `.payment-disclaimer` và `.footer-bottom`.
