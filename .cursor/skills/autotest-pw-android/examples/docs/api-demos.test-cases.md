# KBKTCN — PRACTICE_ApiDemos Android (V1.0)

- **Mã tài liệu**: KBKTCN-AD-01
- **Người lập**: QA
- **Ngày lập**: 2026-10-06
- **Loại chức năng**: APP
- **Tổng TC**: 3
- **Nguồn SRS**: Appium ApiDemos (io.appium.android.apis)
---

# Suite: Chức năng

## Điều hướng và điều khiển

### TC-001 — Mở app hiển thị danh sách nhóm demo
**Category**: Happy Path
**D (Trường hợp)**: TH: Mở app lần đầu
**F (Các bước)**:
1. Mở app ApiDemos
2. Bấm mục "Views"
**G (Kết quả mong muốn)**:
1. Hiển thị danh sách có các mục "Accessibility", "Animation", "App", "Views"
2. Hiển thị danh sách Views có mục "Buttons"
**H/I**: HIGH / CRITICAL

### TC-002 — Nhập text và tick checkbox ở màn hình Controls
**Category**: Happy Path
**D (Trường hợp)**: TH: Đang ở màn hình Views
**E (Data test)**:
```
text=Xin chao Playwright
```
**F (Các bước)**:
1. Vào Views > Controls > "1. Light Theme"
2. Nhập "Xin chao Playwright" vào ô text
3. Tick checkbox "Checkbox 1"
**G (Kết quả mong muốn)**:
1. Hiển thị màn hình có ô nhập text và checkbox
2. Ô text có giá trị "Xin chao Playwright"
3. "Checkbox 1" được tick
**H/I**: MEDIUM / MAJOR

### TC-003 — Cuộn danh sách Views tới mục cuối
**Category**: Happy Path
**D (Trường hợp)**: TH: Đang ở màn hình Views
**F (Các bước)**:
1. Vào Views
2. Cuộn danh sách tới mục "WebView"
**G (Kết quả mong muốn)**:
1. Hiển thị danh sách Views
2. Mục "WebView" hiển thị trên màn hình
**H/I**: MEDIUM / MAJOR
