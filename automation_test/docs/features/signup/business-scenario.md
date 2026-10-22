# Business Scenario — Signup (Đăng ký tài khoản)

## Tổng quan
Tính năng cho phép người dùng mới tạo tài khoản để sử dụng các chức năng của website như đặt hàng, quản lý giỏ hàng.

## Luồng nghiệp vụ

### Luồng chính (Happy Path)
1. Người dùng truy cập trang chủ `https://www.demoblaze.com`
2. Người dùng click nút **Sign up** trên header
3. Hệ thống hiển thị popup modal "Sign up"
4. Người dùng nhập **Username** (chưa tồn tại)
5. Người dùng nhập **Password**
6. Người dùng click nút **Sign up** trong popup
7. Hệ thống hiển thị alert "Sign up successful."
8. Người dùng click OK để đóng alert
9. Popup tự đóng, người dùng có thể đăng nhập với tài khoản vừa tạo

### Luồng thay thế

#### A1: Username đã tồn tại
- Bước 6: Hệ thống hiển thị alert "This user already exist."
- Người dùng cần chọn username khác

#### A2: Bỏ trống Username
- Bước 6: Hệ thống hiển thị alert "Please fill out Username and Password."

#### A3: Bỏ trống Password
- Bước 6: Hệ thống hiển thị alert "Please fill out Username and Password."

#### A4: Bỏ trống cả hai
- Bước 6: Hệ thống hiển thị alert "Please fill out Username and Password."

#### A5: Hủy đăng ký
- Bước 3-5: Người dùng click nút **Close** hoặc click ngoài popup
- Popup đóng, không tạo tài khoản

## UI Elements

| Element | Locator gợi ý | Mô tả |
|---------|---------------|-------|
| Sign up button (header) | `#signin2` | Nút mở popup đăng ký |
| Sign up modal | `#signInModal` | Popup modal đăng ký |
| Username input | `#sign-username` | Ô nhập username |
| Password input | `#sign-password` | Ô nhập password |
| Sign up button (modal) | `button[onclick="register()"]` | Nút xác nhận đăng ký |
| Close button | `.btn-secondary` trong modal | Nút đóng popup |

## Dữ liệu test

| Scenario | Username | Password | Expected |
|----------|----------|----------|----------|
| Happy path | `testuser_<random>` | `Test@123` | Alert "Sign up successful." |
| User exists | `admin` | `admin` | Alert "This user already exist." |
| Empty username | (trống) | `Test@123` | Alert "Please fill out Username and Password." |
| Empty password | `testuser` | (trống) | Alert "Please fill out Username and Password." |
| Empty both | (trống) | (trống) | Alert "Please fill out Username and Password." |

## Lưu ý kỹ thuật
- Popup sử dụng Bootstrap modal
- Alert sử dụng `window.alert()` của browser (cần handle trong Playwright)
- Không có validation phía client về format username/password
- API backend có thể không ổn định (trang demo)
