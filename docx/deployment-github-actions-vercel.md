# Tài liệu Kỹ thuật: Cấu hình Triển khai GitHub Actions (GitHub Pages) & Vercel

---

## 1. Mục đích
- Triển khai ứng dụng **XIN ĐI BRO — Digital Beggar Simulator** ra môi trường Internet công khai để mọi người có thể truy cập, xem mô hình 3D và tương tác trực tiếp.
- Hỗ trợ song song cả 2 nền tảng triển khai phổ biến:
  1. **GitHub Pages qua GitHub Actions CI/CD:** Tự động build và deploy mỗi khi push code lên nhánh `main`.
  2. **Vercel:** Sẵn sàng cấu hình `vercel.json`, deploy 1-click hoặc tự động đồng bộ từ repository GitHub.

---

## 2. Cấu trúc File & Thành phần liên quan

```text
.github/
└── workflows/
    └── deploy.yml        # CI/CD Workflow tự động build và deploy lên GitHub Pages

vercel.json               # Cấu hình output directory & SPA rewrites cho Vercel
vite.config.ts            # Xử lý Base Path động (BASE_PATH cho GitHub Pages, '/' cho Vercel)

src/
├── character/
│   ├── head.ts           # Load model head.glb & textures theo import.meta.env.BASE_URL
│   └── createBeggar.ts   # Load textures vải áo theo import.meta.env.BASE_URL
├── fonts.css             # Định nghĩa font với đường dẫn tương đối để Vite bundle tự động
└── index.css             # Background texture concrete.jpg nạp qua asset bundle
```

---

## 3. Luồng hoạt động (Deployment Flow)

### 3.1. Kênh GitHub Pages (Tự động qua GitHub Actions)
- **URL dự kiến:** `https://GiaBao3009.github.io/beggar-online/`
- **Quy trình hoạt động:**
  1. Người dùng commit và push code lên nhánh `main` của repo `https://github.com/GiaBao3009/beggar-online.git`.
  2. GitHub Actions trigger workflow `.github/workflows/deploy.yml`.
  3. Action chạy môi trường Ubuntu, cài đặt dependencies (`npm ci`).
  4. Chạy lệnh build với biến môi trường `BASE_PATH=/beggar-online/ npm run build`.
  5. Thư mục `dist/` được đóng gói thành artifact và triển khai lên GitHub Pages.
- **Kích hoạt lần đầu trên GitHub:**
  - Vào repository: **Settings** -> **Pages**.
  - Tại mục **Build and deployment** -> **Source**: Chọn **GitHub Actions**.

### 3.2. Kênh Vercel (1-Click Deploy)
- **URL dự kiến:** `https://beggar-online.vercel.app` (hoặc domain tùy chọn).
- **Quy trình hoạt động:**
  1. Truy cập [vercel.com](https://vercel.com) và đăng nhập bằng tài khoản GitHub.
  2. Bấm **Add New...** -> **Project** -> Chọn repository `beggar-online`.
  3. Vercel tự động nhận diện framework Vite và file `vercel.json`.
  4. Bấm **Deploy**. Sau ~30 giây, website sẽ online với chứng chỉ SSL HTTPS miễn phí và CDN toàn cầu.

---

## 4. Xử lý Kỹ thuật tương thích Đa Nền tảng (Cross-platform Asset Resolution)

- **Vấn đề Git LFS Pointer (Lỗi "Ông đang nghỉ chân... Không tải được nhân vật"):**
  - **Nguyên nhân:** File `.gitattributes` ban đầu áp dụng rule `filter=lfs` lên mọi file `*.jpg`, `*.glb`, `*.ttf`. Khi commit và push lên GitHub, Git chỉ lưu file pointer dạng text ~130 bytes thay vì file binary thật. Do đó khi GitHub Actions build hoặc Vercel pull, các file texture và font bị lỗi `invalid sfntVersion` hoặc không nạp được ảnh vào WebGL Three.js.
  - **Cách khắc phục triệt để:**
    1. Đã loại bỏ các filter LFS đối với các tài nguyên web tĩnh (ảnh texture, font, model 3D) trong `.gitattributes`.
    2. Chạy `git add --renormalize .` để chuyển toàn bộ các file binary từ pointer LFS về dạng git blob chuẩn trực tiếp trong repository.
    3. Thêm cấu hình `lfs: true` vào `actions/checkout@v4` trong `.github/workflows/deploy.yml` để đảm bảo 100% CI/CD luôn có file đầy đủ.

- **Vấn đề Base Path:**
  - Trên Vercel, website nằm tại domain gốc (`/`).
  - Trên GitHub Pages, website nằm tại subpath (`/beggar-online/`).
- **Giải pháp:**
  - `vite.config.ts`: Sử dụng `base: process.env.BASE_PATH || '/'`.
  - Three.js asset loaders (`head.ts`, `createBeggar.ts`): Sử dụng `import.meta.env.BASE_URL.replace(/\/$/, "")` để nối chuỗi đường dẫn.
  - Font & ảnh nền: Đưa vào pipeline bundle của Vite thông qua đường dẫn tương đối trong `src/fonts.css` và `src/index.css` để Vite tự sinh URL chuẩn xác theo từng môi trường build.

---

## 5. Lưu ý cho người bảo trì
- Khi thêm các tài nguyên tĩnh mới (texture 3D, âm thanh, mô hình), luôn dùng `import.meta.env.BASE_URL` hoặc import trực tiếp trong code để không bị lỗi 404 khi đổi môi trường hosting.
- Kiểm thử Playwright tự động trước mỗi lần deploy bằng lệnh: `npx playwright test`.
