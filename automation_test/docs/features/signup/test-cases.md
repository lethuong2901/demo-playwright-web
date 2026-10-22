# KBKTCN — Demoblaze_Signup (V1.0)

- **Mã tài liệu**: KBKTCN_DEMOBLAZE_Signup_V1.0
- **Người lập**: thuonglh3
- **Ngày lập**: 2026-10-22
- **Loại chức năng**: WEB
- **Tổng TC**: 7
- **Nguồn SRS**: automation_test/docs/features/signup/business-scenario.md

---

# Suite: Giao diện

## Màn hình 1 - Trang chủ

### TC-001 — Kiểm tra hiển thị nút Sign up trên header (anchor)

**Category**: UI State

**D (Trường hợp)**: TH: Người dùng truy cập trang chủ Demoblaze khi chưa đăng nhập

**F (Các bước)**:
1. Mở trình duyệt, truy cập `https://www.demoblaze.com`
2. Quan sát header của trang

**G (Kết quả mong muốn)**:
1. Trang chủ hiển thị thành công
2. Header hiển thị nút "Sign up" (id=signin2)

**H/I**: LOW / MINOR

**Business Rule**: Nút Sign up phải hiển thị cho user chưa đăng nhập
**Source**: business-scenario.md - Luồng chính bước 2

**graph_refs**: `ui_screen:home_page`, `field:btn_signup`

---

## Popup Sign up

### TC-002 — Kiểm tra hiển thị popup Sign up khi click nút Sign up (anchor)

**Category**: UI State

**D (Trường hợp)**: TH: Người dùng click nút Sign up trên header

**F (Các bước)**:
1. Mở trang chủ `https://www.demoblaze.com`
2. Click nút "Sign up" trên header

**G (Kết quả mong muốn)**:
1. Trang chủ hiển thị
2. Popup modal "Sign up" hiển thị với:
   - Tiêu đề "Sign up"
   - Ô input Username
   - Ô input Password
   - Nút "Close"
   - Nút "Sign up"

**H/I**: MEDIUM / MAJOR

**Business Rule**: Popup Sign up phải hiển thị đầy đủ các thành phần để người dùng đăng ký
**Source**: business-scenario.md - Luồng chính bước 3, UI Elements

**graph_refs**: `ui_screen:popup_signup`, `field:input_username`, `field:input_password`, `field:btn_signup_submit`, `field:btn_close`

---

### TC-003 — Đăng ký tài khoản thành công với username và password hợp lệ

**Category**: Happy Path

**D (Trường hợp)**: TH: Người dùng nhập username chưa tồn tại và password hợp lệ

**E (Data test)**:
```
username=testuser_<random>
password=Test@123
```

**F (Các bước)**:
1. Mở trang chủ `https://www.demoblaze.com`
2. Click nút "Sign up" trên header
3. Nhập Username: `testuser_<random>` (thay `<random>` bằng timestamp hoặc số ngẫu nhiên)
4. Nhập Password: `Test@123`
5. Click nút "Sign up" trong popup

**G (Kết quả mong muốn)**:
1. Trang chủ hiển thị
2. Popup Sign up hiển thị
3. Username được nhập thành công
4. Password được nhập thành công
5. Alert hiển thị với message "Sign up successful."
6. Sau khi click OK trên alert, popup đóng lại

**H/I**: HIGH / CRITICAL

**Business Rule**: Người dùng có thể đăng ký tài khoản mới với username chưa tồn tại
**Source**: business-scenario.md - Luồng chính bước 1-9

**graph_refs**: `ui_screen:popup_signup`, `activity_flow:signup_success`

---

### TC-004 — Đăng ký thất bại khi username đã tồn tại

**Category**: Negative

**D (Trường hợp)**: TH: Người dùng nhập username đã được đăng ký trước đó

**E (Data test)**:
```
username=admin
password=admin
```

**F (Các bước)**:
1. Mở trang chủ `https://www.demoblaze.com`
2. Click nút "Sign up" trên header
3. Nhập Username: `admin`
4. Nhập Password: `admin`
5. Click nút "Sign up" trong popup

**G (Kết quả mong muốn)**:
1. Trang chủ hiển thị
2. Popup Sign up hiển thị
3. Username được nhập
4. Password được nhập
5. Alert hiển thị với message "This user already exist."

**H/I**: HIGH / MAJOR

**Business Rule**: Hệ thống từ chối đăng ký khi username đã tồn tại và thông báo lỗi rõ ràng
**Source**: business-scenario.md - Luồng thay thế A1

**graph_refs**: `ui_screen:popup_signup`, `validation_rule:username_unique`, `activity_flow:signup_user_exists`

---

### TC-005 — Đăng ký thất bại khi bỏ trống Username

**Category**: Negative

**D (Trường hợp)**: TH: Người dùng bỏ trống trường Username

**E (Data test)**:
```
username=(trống)
password=Test@123
```

**F (Các bước)**:
1. Mở trang chủ `https://www.demoblaze.com`
2. Click nút "Sign up" trên header
3. Để trống trường Username
4. Nhập Password: `Test@123`
5. Click nút "Sign up" trong popup

**G (Kết quả mong muốn)**:
1. Trang chủ hiển thị
2. Popup Sign up hiển thị
3. Trường Username trống
4. Password được nhập
5. Alert hiển thị với message "Please fill out Username and Password."

**H/I**: MEDIUM / MAJOR

**Business Rule**: Cả Username và Password đều bắt buộc, hệ thống validate và thông báo khi thiếu
**Source**: business-scenario.md - Luồng thay thế A2

**graph_refs**: `ui_screen:popup_signup`, `validation_rule:username_required`

---

### TC-006 — Đăng ký thất bại khi bỏ trống Password

**Category**: Negative

**D (Trường hợp)**: TH: Người dùng bỏ trống trường Password

**E (Data test)**:
```
username=testuser_new
password=(trống)
```

**F (Các bước)**:
1. Mở trang chủ `https://www.demoblaze.com`
2. Click nút "Sign up" trên header
3. Nhập Username: `testuser_new`
4. Để trống trường Password
5. Click nút "Sign up" trong popup

**G (Kết quả mong muốn)**:
1. Trang chủ hiển thị
2. Popup Sign up hiển thị
3. Username được nhập
4. Trường Password trống
5. Alert hiển thị với message "Please fill out Username and Password."

**H/I**: MEDIUM / MAJOR

**Business Rule**: Cả Username và Password đều bắt buộc, hệ thống validate và thông báo khi thiếu
**Source**: business-scenario.md - Luồng thay thế A3

**graph_refs**: `ui_screen:popup_signup`, `validation_rule:password_required`

---

### TC-007 — Đóng popup Sign up khi click nút Close

**Category**: UI State

**D (Trường hợp)**: TH: Người dùng muốn hủy đăng ký và đóng popup

**F (Các bước)**:
1. Mở trang chủ `https://www.demoblaze.com`
2. Click nút "Sign up" trên header
3. Click nút "Close" trong popup

**G (Kết quả mong muốn)**:
1. Trang chủ hiển thị
2. Popup Sign up hiển thị
3. Popup đóng lại, không tạo tài khoản, quay về trang chủ

**H/I**: LOW / MINOR

**Business Rule**: Người dùng có thể hủy đăng ký bất cứ lúc nào bằng cách đóng popup
**Source**: business-scenario.md - Luồng thay thế A5

**graph_refs**: `ui_screen:popup_signup`, `field:btn_close`, `activity_flow:signup_cancel`

---

# Doc Gaps Log

*(Không có gap nào được ghi nhận - tài liệu đầy đủ cho các TC đã viết)*
