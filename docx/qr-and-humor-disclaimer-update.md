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

### 3.1. Mã QR Chuyển khoản
- **Trước đây:** Sử dụng component `QRDemo` vẽ các ô vuông SVG ngẫu nhiên.
- **Hiện tại:** Sử dụng thẻ `<img>` nạp trực tiếp `src/assets/qr-donate.png` với lớp `w-full block bg-white p-1 rounded-sm shadow-inner`.
- **Dưới khung QR:** Cập nhật nhãn ghi chú: `QR VietQR chính chủ · Đời IT lương 4 triệu cứu đói khẩn cấp!`.

### 3.2. Thông điệp "Đời IT Lương 4 Triệu"
- **Tại khung Quyên góp:** 
  > *"Đời IT lương 4 triệu, tối về ôm laptop ra vỉa hè xin bát cơm chan nước mắt.*  
  > *Quét mã cứu đói hoặc bấm nút nhận hóa đơn tấm lòng!"*
- **Tại chân trang (Footer):**
  > *"© 2025 XIN ĐI BRO · MADE WITH ĐÓI & MỘT CHÚT HTML.*  
  > *Đời IT lương 4 triệu, tối về ôm laptop ra vỉa hè xin bát cơm chan nước mắt.*  
  > *VỈA HÈ KHÔNG NGỦ. CODE KHÔNG BUG (NÓI PHÉT)."*

---

## 4. Kiểm thử Tự động (Playwright)
- File `tests/beggar.spec.ts` có thêm bài test `4. VietQR code and IT salary disclaimer display`:
  - Xác thực phần tử `.qr-frame img` hiển thị rõ ràng và có thuộc tính `src` chứa `qr-donate`.
  - Xác thực chuỗi text `"Đời IT lương 4 triệu"` xuất hiện đầy đủ tại cả `.payment-disclaimer` và `.footer-bottom`.
