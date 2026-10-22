# KBKTCN — VC PAYDAY / Ký và hủy hợp đồng VC Payday (V1.0)

- **Mã tài liệu**: KBKTCN_VCPAYDAY_KyVaHuyHopDong_V1.16
- **Người lập**: huongttt42
- **Ngày lập**: 2026-05-20
- **Loại chức năng**: APP (Android + iOS)
- **Tổng TC**: 158
- **Nguồn SRS**: http://10.254.136.35:8090/pages/viewpage.action?pageId=186077230

---


# Suite 1: Giao diện


## Màn hình 1 - Xem hợp đồng trước ký

### TC #1 — Kiểm tra hiển thị màn hình chung MH01 "Hợp đồng của bạn"

**D (Trường hợp)**: TH: KH vào MH01 với điều kiện mặc định (khoản vay status=pending_esigning, đã qua precheck/credit/ekyc, thông tin HĐ đã được fill đầy đủ)

**F (Các bước)**:
1. Đăng nhập App ViettelPay với KH có khoản vay status=pending_esigning
2. Mở MH QLKV, chọn icon vay FE Credit Cashloan
3. Nhấn button "Xem hợp đồng trước ký" hoặc "Ký hợp đồng"
4. Quan sát toàn bộ thành phần hiển thị trên MH01

**G (Kết quả mong muốn)**:
1. Đăng nhập thành công, vào MH chính của App
2. Hiển thị danh sách khoản vay với khoản vay Chờ ký kèm button Ký hợp đồng
3. App chuyển sang MH01 "Hợp đồng của bạn" (màn hình)
4. MH01 hiển thị đầy đủ: Icon back ← (góc trên trái), icon "?" hỗ trợ (góc trên phải), title "Hợp đồng của bạn" (giữa); 3 tab: "HĐ Tín dụng" (selected default, hiển thị HĐTD đã fill thông tin KH), "Điều khoản CTS", "Yêu cầu BH"; Tab "Điều khoản CTS" (tab thứ 3); Checkbox "Tôi đã đọc, đồng ý với nội dung Hợp đồng tín dụng với TIN VAY và Điều khoản Chứng thư số FPT-CA" mặc định = CHECKED (theo AMB-01 đã resolve); Button "Ký hợp đồng" enable (do checkbox đang checked); Button "Hủy hợp đồng" luôn enable

**H/I**: HIGH / CRITICAL

**Z (Notes)**: AMB-01 resolved: checkbox default = CHECKED, button Ký HĐ enable mặc định. AMB-07 Control 2 mô tả có thể nhầm (hiển thị HĐ bảo hiểm) — cần BA confirm nội dung tab.

**graph_refs**: `ui_screen:mh01_xem_hop_dong_truoc_ky, field:checkbox_dong_y_3_hop_dong, validation_rule:terms_checkbox_required_for_sign, flow_step:13_show_view_contract`

### TC #2 — Kiểm tra trạng thái mặc định của Checkbox đồng ý 3 HĐ

**D (Trường hợp)**: TH: KH vừa mở MH01 lần đầu, chưa thao tác với checkbox

**F (Các bước)**:
1. Mở MH01 "Hợp đồng của bạn" từ MH QLKV
2. Quan sát trạng thái checkbox "Tôi đã đọc, đồng ý..."
3. Quan sát trạng thái button Ký hợp đồng và button Hủy hợp đồng

**G (Kết quả mong muốn)**:
1. MH01 hiển thị, các tab và nội dung HĐ được load đầy đủ
2. Checkbox ở trạng thái CHECKED (đã tick sẵn) theo decision AMB-01
3. Button Ký hợp đồng ở trạng thái Enable (active); Button Hủy hợp đồng ở trạng thái Enable

**H/I**: HIGH / CRITICAL

**Z (Notes)**: AMB-01 resolved: default = CHECKED theo phần Mô tả MH01 Control 5. Cột "Mặc định" trong SRS ghi "uncheck" — mâu thuẫn nội tại đã được user chốt CHECKED.

**graph_refs**: `ui_screen:mh01_xem_hop_dong_truoc_ky, field:checkbox_dong_y_3_hop_dong, validation_rule:terms_checkbox_required_for_sign`

### TC #3 — Kiểm tra checkbox cho phép bỏ tick (uncheck) sau khi mặc định checked

**D (Trường hợp)**: TH: KH bỏ tick checkbox đồng ý

**F (Các bước)**:
1. Mở MH01 với checkbox mặc định = checked
2. Tap vào checkbox để bỏ tick
3. Quan sát trạng thái button Ký hợp đồng và button Hủy hợp đồng

**G (Kết quả mong muốn)**:
1. MH01 hiển thị, checkbox CHECKED, button Ký enable
2. Checkbox chuyển sang UNCHECK
3. Button Ký hợp đồng chuyển sang trạng thái Disable; Button Hủy hợp đồng vẫn Enable (không phụ thuộc checkbox)

**H/I**: HIGH / CRITICAL

**graph_refs**: `ui_screen:mh01_xem_hop_dong_truoc_ky, field:checkbox_dong_y_3_hop_dong, validation_rule:terms_checkbox_required_for_sign`

### TC #4 — Kiểm tra button Ký hợp đồng enable khi checkbox checked

**D (Trường hợp)**: TH: Checkbox đồng ý đang ở trạng thái checked (giữ default)

**F (Các bước)**:
1. Mở MH01 (checkbox checked sẵn theo default)
2. Quan sát button Ký hợp đồng
3. Tap vào button Ký hợp đồng

**G (Kết quả mong muốn)**:
1. MH01 hiển thị đầy đủ, checkbox = checked
2. Button Ký hợp đồng hiển thị màu Enable (active), có thể tap được
3. App tiếp nhận thao tác tap, chuyển sang bước hiển thị popup Cảnh giác chiêu thức lừa đảo (Control 6)

**H/I**: HIGH / CRITICAL

**graph_refs**: `ui_screen:mh01_xem_hop_dong_truoc_ky, field:checkbox_dong_y_3_hop_dong, validation_rule:terms_checkbox_required_for_sign, ui_screen:popup_canh_giac_lua_dao`

### TC #5 — Kiểm tra button Ký hợp đồng disable khi checkbox uncheck

**D (Trường hợp)**: TH: KH bỏ tick checkbox đồng ý, sau đó cố gắng tap button Ký hợp đồng

**F (Các bước)**:
1. Mở MH01
2. Tap checkbox để chuyển sang trạng thái uncheck
3. Quan sát button Ký hợp đồng
4. Cố gắng tap vào button Ký hợp đồng

**G (Kết quả mong muốn)**:
1. MH01 hiển thị, checkbox checked
2. Checkbox chuyển sang uncheck
3. Button Ký hợp đồng chuyển sang trạng thái Disable (mờ, không active)
4. Tap không có tác dụng, App không chuyển màn hình, không gọi API

**H/I**: HIGH / CRITICAL

**graph_refs**: `ui_screen:mh01_xem_hop_dong_truoc_ky, field:checkbox_dong_y_3_hop_dong, validation_rule:terms_checkbox_required_for_sign`

### TC #6 — Kiểm tra button Hủy hợp đồng luôn enable bất kể checkbox

**D (Trường hợp)**: TH: Checkbox uncheck, KH tap button Hủy hợp đồng

**F (Các bước)**:
1. Mở MH01
2. Tap checkbox để chuyển sang uncheck
3. Quan sát button Hủy hợp đồng
4. Tap button Hủy hợp đồng

**G (Kết quả mong muốn)**:
1. MH01 hiển thị, checkbox checked
2. Checkbox chuyển sang uncheck, button Ký disable
3. Button Hủy hợp đồng vẫn Enable (active), không bị ảnh hưởng bởi checkbox
4. App hiển thị Popup "Hủy đăng ký"

**H/I**: HIGH / CRITICAL

**graph_refs**: `ui_screen:mh01_xem_hop_dong_truoc_ky, field:checkbox_dong_y_3_hop_dong, validation_rule:terms_checkbox_required_for_sign, ui_screen:popup_xac_nhan_huy_hop_dong`

### TC #7 — Kiểm tra hiển thị tab "HĐ Tín dụng" (mặc định)

**D (Trường hợp)**: TH: KH vào MH01, tab "HĐ Tín dụng" được chọn mặc định

**F (Các bước)**:
1. Mở MH01
2. Quan sát tab đang được chọn mặc định
3. Quan sát nội dung hiển thị trong vùng tab content

**G (Kết quả mong muốn)**:
1. MH01 hiển thị đầy đủ 2 tab
2. Tab "HĐ Tín dụng" được tô đậm/highlight, là tab active mặc định
3. Vùng nội dung hiển thị HĐ tín dụng đã được fill thông tin KH (mã HĐ, họ tên, SĐT, số tiền vay, thời hạn vay, lãi suất...) theo template HDTD_TINVAY_PAYDAY_VTMN.docx

**H/I**: MEDIUM / MAJOR

**Z (Notes)**: AMB-07: Mô tả Control 2 trong SRS ghi nhầm là "HĐ bảo hiểm" — đề xuất tab "HĐ Tín dụng" hiển thị HĐTD; cần BA confirm.

**graph_refs**: `ui_screen:mh01_xem_hop_dong_truoc_ky, field:contract_code, field:loan_contract_consumer, field:so_tien_de_nghi_vay, field:thoi_han_vay`

### TC #8 — Kiểm tra chuyển sang tab "Yêu cầu BH"

**D (Trường hợp)**: TH: KH tap vào tab "Yêu cầu BH" trên MH01

**F (Các bước)**:
1. Mở MH01 (tab "HĐ Tín dụng" đang active)
2. Tap vào tab "Yêu cầu BH"
3. Quan sát nội dung hiển thị

**G (Kết quả mong muốn)**:
1. MH01 hiển thị, tab "HĐ Tín dụng" active
2. Tab "Yêu cầu BH" trở thành tab active (được highlight), tab "HĐ Tín dụng" chuyển sang không active
3. Vùng nội dung hiển thị Giấy yêu cầu bảo hiểm (GYCBH) đã được fill thông tin KH (Mục I/II/III: SĐT, số HĐ tín dụng, thời hạn vay, số tiền bảo hiểm, thời hạn bảo hiểm, người thụ hưởng) theo template FORM_GYCBH.docx

**H/I**: MEDIUM / MAJOR

**Z (Notes)**: AMB-11/AMB-12: Tên công ty tài chính + tên sản phẩm bảo hiểm chưa được PO confirm — tester verify cấu trúc fill, không assert literal text.

**graph_refs**: `ui_screen:mh01_xem_hop_dong_truoc_ky, field:loan_contract_consumer, field:so_dien_thoai, field:so_tien_bao_hiem, field:thoi_han_bao_hiem, field:nguoi_thu_huong`

### TC #9 — Kiểm tra hiển thị và hành vi textlink Điều khoản sử dụng chứng từ số

**D (Trường hợp)**: TH: KH tap vào textlink "Điều khoản sử dụng chứng từ số" trên MH01

**F (Các bước)**:
1. Mở MH01
2. Quan sát textlink "Điều khoản sử dụng chứng từ số"
3. Tap vào textlink

**G (Kết quả mong muốn)**:
1. MH01 hiển thị đầy đủ các thành phần
2. Textlink hiển thị màu xanh, có gạch chân hoặc style underline, dạng tap được
3. App mở nội dung Điều khoản sử dụng chứng từ số (theo template Điều khoản BVDLCN)

**H/I**: MEDIUM / MAJOR

**Z (Notes)**: AMB-20: Cột "Bắt buộc" và "Mặc định" của Control 4 trong SRS trống — chưa rõ có bắt buộc click trước khi tick checkbox hay không. Cần BA confirm.

**graph_refs**: `ui_screen:mh01_xem_hop_dong_truoc_ky`

### TC #10 — Kiểm tra hành vi nhấn Icon back trên MH01 hiển thị popup Xác nhận ký sau

**D (Trường hợp)**: TH: KH nhấn icon back (góc trên trái) hoặc vuốt back trên MH01

**F (Các bước)**:
1. Mở MH01
2. Nhấn icon back ở góc trên trái màn hình
3. Quan sát popup hiển thị

**G (Kết quả mong muốn)**:
1. MH01 hiển thị đầy đủ
2. App tiếp nhận thao tác back, không thoát ngay khỏi MH01
3. Popup "Dừng đăng ký" hiển thị với 2 button "Ký sau" và "Tiếp tục" (nội dung popup do server trả về)

**H/I**: MEDIUM / MAJOR

**Z (Notes)**: AMB-14: Nội dung text popup do server trả về, không cố định — TC chỉ verify hành vi hiển thị + button.

**graph_refs**: `ui_screen:mh01_xem_hop_dong_truoc_ky, ui_screen:popup_xac_nhan_ky_sau`

### TC #11 — Kiểm tra hành vi vuốt back trên MH01 cũng hiển thị popup Xác nhận ký sau

**D (Trường hợp)**: TH: KH vuốt back (gesture) trên MH01 thay vì tap icon back

**F (Các bước)**:
1. Mở MH01
2. Thực hiện gesture vuốt từ mép trái sang phải (hoặc gesture back tương ứng OS)
3. Quan sát popup hiển thị

**G (Kết quả mong muốn)**:
1. MH01 hiển thị đầy đủ
2. App tiếp nhận gesture back
3. Popup "Dừng đăng ký" hiển thị (giống behavior tap icon back) với 2 button Ký sau / Tiếp tục

**H/I**: MEDIUM / MAJOR

**Z (Notes)**: AMB-14

**graph_refs**: `ui_screen:mh01_xem_hop_dong_truoc_ky, ui_screen:popup_xac_nhan_ky_sau`

### TC #12 — Kiểm tra hành vi tick lại checkbox sau khi đã bỏ tick

**D (Trường hợp)**: TH: KH bỏ tick checkbox rồi tick lại

**F (Các bước)**:
1. Mở MH01 (checkbox checked)
2. Tap checkbox bỏ tick
3. Tap checkbox tick lại
4. Quan sát trạng thái checkbox và button Ký hợp đồng

**G (Kết quả mong muốn)**:
1. MH01 hiển thị, checkbox checked, button Ký enable
2. Checkbox chuyển sang uncheck, button Ký disable
3. Checkbox chuyển sang checked
4. Button Ký hợp đồng chuyển trở lại trạng thái Enable

**H/I**: MEDIUM / MAJOR

**graph_refs**: `ui_screen:mh01_xem_hop_dong_truoc_ky, field:checkbox_dong_y_3_hop_dong, validation_rule:terms_checkbox_required_for_sign`

### TC #13 — Kiểm tra hiển thị và hành vi icon "?" hỗ trợ ở header MH01

**D (Trường hợp)**: TH: KH vào MH01 "Hợp đồng của bạn", quan sát icon "?" góc trên phải và tap thử

**F (Các bước)**:
1. Đăng nhập App ViettelPay, có khoản vay pending_esigning
2. Mở MH01 "Hợp đồng của bạn"
3. Quan sát header — vị trí icon "?" góc trên phải
4. Tap icon "?"
5. Quan sát hành vi

**G (Kết quả mong muốn)**:
1. KH đăng nhập thành công
2. MH01 hiển thị, header có: icon back ← (trái), title "Hợp đồng của bạn" (giữa), icon "?" (phải)
3. Icon "?" hiển thị rõ, có vùng tap đủ rộng (≥44pt)
4. Tap được, không bị disable
5. Hệ thống điều hướng tới MH/popup hỗ trợ (cần BA confirm đích đến — SRS không document)

**H/I**: MEDIUM / MINOR

**Z (Notes)**: UI có icon "?" ở góc phải header MH01 nhưng SRS không document. Cần BA confirm đích điều hướng khi tap (FAQ / popup hướng dẫn / chat support).

**graph_refs**: `ui_screen:mh01_xem_hop_dong_truoc_ky`

### TC #14 — (tiếp theo TC trước — merge col C)

**D (Trường hợp)**: TH: Checkbox đồng ý ở trạng thái CHECKED, KH quan sát button Hủy hợp đồng trên MH01

**E (Data test)**:
```
checkbox_dong_y=true
```

**F (Các bước)**:
1. Vào MH01
2. Đảm bảo checkbox đồng ý ở trạng thái CHECKED (mặc định)
3. Quan sát button Hủy hợp đồng
4. Nhấn 'Hủy hợp đồng'

**G (Kết quả mong muốn)**:
1. MH01 hiển thị
2. Checkbox CHECKED (default theo AMB-01)
3. Button Hủy hợp đồng Enable
4. Popup xác nhận hủy hiển thị

**H/I**: MEDIUM / MAJOR

**graph_refs**: `field:checkbox_dong_y_3_hop_dong, validation_rule:terms_checkbox_required_for_sign, ui_screen:mh01_xem_hop_dong_truoc_ky`

### TC #15 — (tiếp theo TC trước — merge col C)

**D (Trường hợp)**: TH: Checkbox đồng ý ở trạng thái UNCHECKED, KH quan sát button Hủy hợp đồng trên MH01

**E (Data test)**:
```
checkbox_dong_y=false
```

**F (Các bước)**:
1. Vào MH01
2. Bỏ check checkbox đồng ý → trạng thái UNCHECKED
3. Quan sát button Hủy hợp đồng
4. Quan sát button Ký hợp đồng để so sánh
5. Nhấn 'Hủy hợp đồng'

**G (Kết quả mong muốn)**:
1. MH01 hiển thị
2. Checkbox = UNCHECKED
3. Button Hủy hợp đồng vẫn Enable (không phụ thuộc checkbox)
4. Button Ký hợp đồng Disable (do checkbox uncheck)
5. Popup xác nhận hủy hiển thị bình thường

**H/I**: MEDIUM / MAJOR

**graph_refs**: `field:checkbox_dong_y_3_hop_dong, validation_rule:terms_checkbox_required_for_sign, ui_screen:mh01_xem_hop_dong_truoc_ky`

### TC #16 — Kiểm tra rule checkbox đồng ý × button Ký/Hủy (DT 2x2)

**D (Trường hợp)**: TH: Checkbox đồng ý CHECKED, KH bấm button Ký hợp đồng

**E (Data test)**:
```
checkbox_dong_y=true
```

**F (Các bước)**:
1. Vào MH01 - quan sát checkbox mặc định
2. Đảm bảo checkbox = CHECKED (mặc định CHECKED theo AMB-01)
3. Quan sát button Ký hợp đồng
4. Nhấn 'Ký hợp đồng'

**G (Kết quả mong muốn)**:
1. MH01 hiển thị
2. Checkbox CHECKED (default theo AMB-01)
3. Button 'Ký hợp đồng' Enable
4. App VTM gửi yêu cầu sinh OTP, Server Vay gọi Loanorder/Regenerate tùy theo trạng thái CTS

**H/I**: HIGH / CRITICAL

**Z (Notes)**: AMB-01 resolved: default CHECKED

**graph_refs**: `field:checkbox_dong_y_3_hop_dong, validation_rule:terms_checkbox_required_for_sign, ui_screen:mh01_xem_hop_dong_truoc_ky`

### TC #17 — (tiếp theo TC trước — merge col C)

**D (Trường hợp)**: TH: Checkbox đồng ý UNCHECKED, KH cố tap button Ký hợp đồng

**E (Data test)**:
```
checkbox_dong_y=false
```

**F (Các bước)**:
1. Vào MH01
2. Bỏ check checkbox đồng ý → trạng thái UNCHECKED
3. Quan sát button Ký hợp đồng
4. Thử nhấn button Ký

**G (Kết quả mong muốn)**:
1. MH01 hiển thị
2. Checkbox = UNCHECKED
3. Button 'Ký hợp đồng' Disable (không bấm được)
4. Không có hành động nào trigger, App giữ nguyên MH01

**H/I**: HIGH / CRITICAL

**graph_refs**: `field:checkbox_dong_y_3_hop_dong, validation_rule:terms_checkbox_required_for_sign, ui_screen:mh01_xem_hop_dong_truoc_ky`

### TC #18 — (tiếp theo TC trước — merge col C)

**D (Trường hợp)**: TH: Checkbox đồng ý CHECKED, KH bấm button Hủy hợp đồng

**E (Data test)**:
```
checkbox_dong_y=true
```

**F (Các bước)**:
1. Vào MH01
2. Checkbox CHECKED (mặc định)
3. Quan sát button Hủy hợp đồng
4. Nhấn 'Hủy hợp đồng'

**G (Kết quả mong muốn)**:
1. MH01 hiển thị
2. Checkbox CHECKED
3. Button 'Hủy hợp đồng' Enable
4. Popup "Hủy đăng ký" hiển thị

**H/I**: MEDIUM / MAJOR

**graph_refs**: `field:checkbox_dong_y_3_hop_dong, validation_rule:terms_checkbox_required_for_sign`

### TC #19 — (tiếp theo TC trước — merge col C)

**D (Trường hợp)**: TH: Checkbox đồng ý UNCHECKED, KH bấm button Hủy hợp đồng

**E (Data test)**:
```
checkbox_dong_y=false
```

**F (Các bước)**:
1. Vào MH01
2. Bỏ check checkbox
3. Quan sát button Hủy hợp đồng
4. Nhấn 'Hủy hợp đồng'

**G (Kết quả mong muốn)**:
1. MH01 hiển thị
2. Checkbox UNCHECKED
3. Button 'Hủy hợp đồng' vẫn Enable (theo rule: Hủy luôn enable bất kể checkbox)
4. Popup "Hủy đăng ký" hiển thị

**H/I**: HIGH / MAJOR

**graph_refs**: `field:checkbox_dong_y_3_hop_dong, validation_rule:terms_checkbox_required_for_sign`

### TC #20 — (tiếp theo TC trước — merge col C)

**D (Trường hợp)**: TH: KH toggle checkbox liên tục nhiều lần (check/uncheck/check...) - button Ký phản ứng đúng theo trạng thái cuối

**E (Data test)**:
```
Toggle checkbox 10 lần liên tiếp
```

**F (Các bước)**:
1. Vào MH01
2. Toggle checkbox liên tục 10 lần (kết thúc ở trạng thái UNCHECKED)
3. Quan sát button Ký
4. Toggle thêm 1 lần (kết thúc ở CHECKED)
5. Quan sát button Ký

**G (Kết quả mong muốn)**:
1. MH01 hiển thị
2. Sau 10 lần toggle kết thúc UNCHECKED, không có race condition hay flicker UI
3. Button Ký Disable (phản ánh đúng trạng thái cuối UNCHECKED)
4. Toggle thêm 1 lần → CHECKED
5. Button Ký chuyển sang Enable, không bị delay/lỗi hiển thị

**H/I**: LOW / MINOR

**graph_refs**: `field:checkbox_dong_y_3_hop_dong, validation_rule:terms_checkbox_required_for_sign`


## Popup phụ trợ

### TC #21 — Kiểm tra hiển thị Popup Cảnh giác chiêu thức lừa đảo (anchor)

**D (Trường hợp)**: TH: KH ở MH01 tick checkbox và tap button Ký hợp đồng

**F (Các bước)**:
1. Vào MH01 (checkbox checked)
2. Tap button Ký hợp đồng
3. Quan sát popup hiển thị
4. Quan sát chi tiết các thành phần popup

**G (Kết quả mong muốn)**:
1. MH01 hiển thị
2. App tiếp nhận tap
3. Popup Cảnh giác chiêu thức lừa đảo hiển thị overlay trên MH01
4. Popup gồm đầy đủ: header/title; nội dung text cảnh giác (do server trả về); Button "Bỏ qua" enable; Button "Đồng ý và ký hợp đồng" enable

**H/I**: HIGH / CRITICAL

**Z (Notes)**: Nội dung text popup do server trả về (AMB-14 tương tự), TC verify hành vi + button.

**graph_refs**: `ui_screen:popup_canh_giac_lua_dao, ui_screen:mh01_xem_hop_dong_truoc_ky`

### TC #22 — Kiểm tra hành vi 2 button trên Popup Cảnh giác lừa đảo

**D (Trường hợp)**: TH: KH ở Popup Cảnh giác, tap lần lượt Bỏ qua và Đồng ý và ký HĐ

**F (Các bước)**:
1. Mở Popup Cảnh giác từ MH01
2. Tap button "Bỏ qua"
3. Mở lại Popup, tap button "Đồng ý và ký hợp đồng"
4. Quan sát hành vi từng button

**G (Kết quả mong muốn)**:
1. Popup Cảnh giác hiển thị
2. Tap Bỏ qua → popup đóng, App giữ lại MH01 (không gọi API ký)
3. Popup hiển thị lại sau khi mở lần 2
4. Tap Đồng ý và ký → popup đóng, App tiến hành flow ký (gọi tạo CTS / Loanorder / Regenerate)

**H/I**: HIGH / CRITICAL

**graph_refs**: `ui_screen:popup_canh_giac_lua_dao, ui_screen:mh01_xem_hop_dong_truoc_ky, flow_step:15_request_otp`

### TC #23 — Kiểm tra hiển thị Popup "Hủy đăng ký" (anchor)

**D (Trường hợp)**: TH: KH ở MH01 tap button Hủy hợp đồng

**F (Các bước)**:
1. Vào MH01
2. Tap button Hủy hợp đồng
3. Quan sát popup hiển thị
4. Quan sát chi tiết popup

**G (Kết quả mong muốn)**:
1. MH01 hiển thị
2. App tiếp nhận tap
3. Popup "Hủy đăng ký" hiển thị overlay trên MH01
4. Popup gồm: title/text mô tả xác nhận hủy; Button "Xác nhận" enable; Button đóng/rời popup enable (text cụ thể của button đóng theo Figma — không nêu rõ trong SRS)

**H/I**: HIGH / CRITICAL

**Z (Notes)**: SRS không nêu rõ text của button thứ 2 (rời/đóng) — TC verify có 2 button, text cụ thể theo Figma.

**graph_refs**: `ui_screen:popup_xac_nhan_huy_hop_dong, ui_screen:mh01_xem_hop_dong_truoc_ky`

### TC #24 — Kiểm tra hành vi 2 button trên Popup "Hủy đăng ký"

**D (Trường hợp)**: TH: KH ở Popup Xác nhận hủy, tap lần lượt Xác nhận và button đóng

**F (Các bước)**:
1. Mở Popup Xác nhận hủy từ MH01
2. Tap button đóng/rời popup
3. Mở lại popup, tap button "Xác nhận"
4. Quan sát hành vi từng button

**G (Kết quả mong muốn)**:
1. Popup hiển thị
2. Tap đóng → popup đóng, App giữ lại MH01 (không hủy HĐ)
3. Popup hiển thị lại sau khi mở lần 2
4. Tap Xác nhận → App gọi API cập nhật status=Cancelled, sub=Cancelled_contract_by_customer, sau đó hiển thị MH QLKV

**H/I**: HIGH / CRITICAL

**graph_refs**: `ui_screen:popup_xac_nhan_huy_hop_dong, status:cancelled_by_customer, flow_step:14_1_cancel`

### TC #25 — Kiểm tra hiển thị Popup "Dừng đăng ký" (anchor)

**D (Trường hợp)**: TH: KH nhấn back/vuốt trên MH01

**F (Các bước)**:
1. Vào MH01
2. Nhấn icon back (hoặc vuốt back)
3. Quan sát popup hiển thị
4. Quan sát chi tiết popup

**G (Kết quả mong muốn)**:
1. MH01 hiển thị
2. App tiếp nhận thao tác back
3. Popup "Dừng đăng ký" hiển thị overlay trên MH01
4. Popup gồm: title/text mô tả xác nhận ký sau (nội dung server trả về); Button "Ký sau" enable; Button "Tiếp tục" enable

**H/I**: MEDIUM / MAJOR

**Z (Notes)**: AMB-14: Nội dung text do server trả về, không assert literal.

**graph_refs**: `ui_screen:popup_xac_nhan_ky_sau, ui_screen:mh01_xem_hop_dong_truoc_ky`

### TC #26 — Kiểm tra hành vi 2 button trên Popup Xác nhận ký sau

**D (Trường hợp)**: TH: KH ở Popup Xác nhận ký sau, tap lần lượt Ký sau và Tiếp tục

**F (Các bước)**:
1. Mở Popup Xác nhận ký sau (back từ MH01)
2. Tap button "Tiếp tục"
3. Mở lại popup (back lần nữa), tap button "Ký sau"
4. Quan sát hành vi từng button

**G (Kết quả mong muốn)**:
1. Popup hiển thị
2. Tap Tiếp tục → popup đóng, App giữ lại MH01 (KH tiếp tục flow ký)
3. Popup hiển thị lại
4. Tap Ký sau → popup đóng, App điều hướng KH về MH QLKV, khoản vay vẫn ở status pending_esigning

**H/I**: MEDIUM / MAJOR

**graph_refs**: `ui_screen:popup_xac_nhan_ky_sau, ui_screen:mh01_xem_hop_dong_truoc_ky, status:pending_esigning`

### TC #27 — Kiểm tra hiển thị Popup lỗi OTP sai (không có counter, yêu cầu gửi lại OTP)

**D (Trường hợp)**: TH: KH ở MH03, nhập OTP sai lần thứ 1 (trong giới hạn 3 lần)

**E (Data test)**:
```
otp_code = "000000" (sai)
```

**F (Các bước)**:
1. Vào MH03, OTP server gửi là 123456
2. Nhập "000000" và tap Xác nhận
3. Quan sát popup hiển thị

**G (Kết quả mong muốn)**:
1. MH03 hiển thị, OTP server gửi là 123456
2. App gửi verify OTP, server trả OTP sai
3. Popup hiển thị nội dung "Bạn đã nhập sai mã OTP. Vui lòng bấm "Gửi lại OTP"" với button Đóng. Sau khi tap Đóng → giữ lại MH03 nhưng input bị clear + disabled, button "Gửi lại OTP" highlight — KH phải bấm "Gửi lại OTP" để gen OTP mới

**H/I**: HIGH / CRITICAL

**Z (Notes)**: Nội dung popup theo SRS §3.3 Bước 25.

**graph_refs**: `ui_screen:mh03_xac_thuc_otp, field:otp_code, validation_rule:otp_max_3_attempts`

### TC #28 — Kiểm tra hiển thị Popup lỗi OTP hết lượt (>3 lần)

**D (Trường hợp)**: TH: KH ở MH03, nhập OTP sai lần thứ 4 (đã hết 3 lượt)

**E (Data test)**:
```
otp_code = sai 3 lần liên tiếp
```

**F (Các bước)**:
1. Vào MH03, nhập OTP sai 3 lần liên tiếp
2. Quan sát popup hiển thị sau lần sai thứ 3
3. Tap button Đóng trên popup

**G (Kết quả mong muốn)**:
1. MH03 hiển thị, đã nhập sai 3 lần
2. Popup hiển thị nội dung "Bạn đã nhập OTP sai liên tiếp quá số lần quy định. Vui lòng thực hiện ký lại sau 5 phút" với button Đóng
3. Tap Đóng → App điều hướng về MH QLKV, khoản vay giữ trạng thái Chờ ký, không cho ký lại trong 5 phút

**H/I**: HIGH / CRITICAL

**Z (Notes)**: Nội dung popup theo SRS §3.3 Bước 25.

**graph_refs**: `ui_screen:mh03_xac_thuc_otp, field:otp_code, validation_rule:otp_max_3_attempts, business_rule:resign_after_5_min`

### TC #29 — Kiểm tra hiển thị Popup HĐ đã ký thành công (đối tác báo HĐ đã ký)

**D (Trường hợp)**: TH: KH đang ký HĐ nhưng đối tác trả về thông báo HĐ đã được ký thành công ở phía khác

**F (Các bước)**:
1. Setup môi trường: simulate response Regenerate/ConfirmSignature trả về "HĐ đã ký"
2. KH thực hiện flow ký HĐ trên thiết bị hiện tại
3. Quan sát popup hiển thị
4. Tap button Đóng trên popup

**G (Kết quả mong muốn)**:
1. Môi trường sẵn sàng
2. App gọi API và nhận response HĐ đã ký
3. Popup hiển thị nội dung "HĐ của bạn đã được ký thành công. Vui lòng chờ phê duyệt trong ít phút" với button Đóng
4. Tap Đóng → App điều hướng KH về MH QLKV với trạng thái khoản vay "Chờ phê duyệt"

**H/I**: HIGH / CRITICAL

**Z (Notes)**: Nội dung popup theo SRS §3.3 Bước 18 và Bước 25.

**graph_refs**: `ui_screen:mh03_xac_thuc_otp, status:pending_underwritting, flow_step:18_check_result`

### TC #30 — Kiểm tra hiển thị Popup OTP gửi quá gần (AMB-05 — verify hành vi)

**D (Trường hợp)**: TH: KH yêu cầu gửi lại OTP nhưng đối tác trả về lỗi gửi OTP quá gần

**F (Các bước)**:
1. Setup môi trường: simulate response Regenerate trả về mã lỗi "gửi OTP quá gần"
2. KH tap button Gửi lại OTP trên MH03 sau khi countdown về 0
3. Quan sát popup hiển thị
4. Tap button Đóng trên popup

**G (Kết quả mong muốn)**:
1. Môi trường sẵn sàng
2. App gọi yêu cầu Regenerate, server trả lỗi
3. App hiển thị Popup thông báo OTP gửi quá gần với button Đóng
4. Tap Đóng → App điều hướng KH về MH QLKV với khoản vay ở trạng thái Chờ ký, cho phép ký lại

**H/I**: HIGH / CRITICAL

**Z (Notes)**: AMB-05: Nội dung popup đợi PO confirm — TC chỉ verify hành vi (popup hiển thị + button Đóng + về QLKV). Không assert literal text popup.

**graph_refs**: `ui_screen:mh03_xac_thuc_otp, field:otp_code, status:pending_esigning, flow_step:18_check_result`

### TC #31 — Kiểm tra hiển thị màn hình quá lượt OTP/ngày (block 24h)

**D (Trường hợp)**: TH: KH đã yêu cầu OTP quá 3 lần trong ngày — server reject, block KH đăng ký vay mới 24h

**F (Các bước)**:
1. Setup KH có khoản vay đã request OTP 3 lần (max)
2. Trên MH03, tap Gửi lại OTP thêm 1 lần nữa
3. Quan sát hành vi App
4. Quan sát trạng thái khoản vay và rule block 24h

**G (Kết quả mong muốn)**:
1. Môi trường sẵn sàng
2. App gọi Regenerate, server trả về vượt 3 lần/ngày
3. App điều hướng từ MH03 sang MH 2.1 (khoản vay bị từ chối) — verify cấu trúc giống MH 2.1 anchor
4. Status khoản vay = reject, sub=reject_by_lender; KH bị block đăng ký vay mới trong 24h (rule business_rule:block_new_loan_after_cancel_24h)

**H/I**: HIGH / CRITICAL

**Z (Notes)**: AMB-03 resolved: 3 lần/ngày. AMB-04: Mã lỗi cụ thể đợi BA confirm.

**graph_refs**: `ui_screen:mh02_1_khoan_vay_tu_choi, field:otp_code, validation_rule:otp_max_3_resend_per_day, business_rule:block_new_loan_after_cancel_24h, status:reject_by_lender`

### TC #32 — Kiểm tra hiển thị Popup Lỗi hệ thống (giữ pending_esigning, cho phép ký lại)

**D (Trường hợp)**: TH: Server gọi Loanorder/Regenerate/ConfirmSignature gặp lỗi hệ thống hoặc TB/TO

**F (Các bước)**:
1. Setup môi trường: simulate lỗi hệ thống/TB/TO từ đối tác
2. KH thực hiện flow ký HĐ (Loanorder/Regenerate/ConfirmSignature đều có nhánh này)
3. Quan sát popup hiển thị
4. Tap button Đóng trên popup

**G (Kết quả mong muốn)**:
1. Môi trường sẵn sàng
2. App gọi API và nhận response lỗi hệ thống
3. Popup Lỗi hệ thống hiển thị với button Đóng
4. Tap Đóng → App điều hướng KH về MH QLKV; khoản vay giữ status pending_esigning (hoặc pending_esigning+cert_success nếu lỗi ở ConfirmSignature) để cho phép KH vào ký lại

**H/I**: HIGH / CRITICAL

**Z (Notes)**: AMB-04: Mã lỗi cụ thể đợi BA confirm. AMB-13: Nếu lỗi xảy ra ở ConfirmSignature thì giữ cert_success — verify trong functional suite.

**graph_refs**: `ui_screen:mh03_xac_thuc_otp, status:pending_esigning, status:pending_esigning_cert_success, flow_step:18_check_result, flow_step:25_check_otp_result`

### TC #33 — Kiểm tra hiển thị inline message OTP hết hạn trên MH03

**D (Trường hợp)**: TH: KH bấm Xác nhận khi OTP đã hết hiệu lực (300s) — verify inline message

**E (Data test)**:
```
otp_code = "123456" (sau khi đợi >300s)
```

**F (Các bước)**:
1. Vào MH03 ngay sau khi OTP được sinh
2. Đợi countdown gần về 0 nhưng kịp nhập đủ 6 ký tự OTP
3. Tap Xác nhận khi server đã coi OTP hết hạn
4. Quan sát inline message dưới input OTP

**G (Kết quả mong muốn)**:
1. MH03 hiển thị, countdown đang chạy
2. KH nhập đủ 6 ký tự, button Xác nhận enable
3. App gửi verify OTP, server trả OTP hết hạn
4. Inline message hiển thị "Mã OTP hết hạn" ngay dưới input OTP, MH03 vẫn được giữ lại (không chuyển màn)

**H/I**: MEDIUM / MAJOR

**Z (Notes)**: AMB-13: Mâu thuẫn giữa auto-switch sau 300s (MH03 Control 3) vs inline message khi user kịp bấm Xác nhận. TC verify nhánh inline khi user bấm Xác nhận trước/cùng lúc countdown về 0.

**graph_refs**: `ui_screen:mh03_xac_thuc_otp, field:otp_code, field:countdown_otp, validation_rule:otp_validity_300s`

### TC #34 — (tiếp theo TC trước — merge col C)

**D (Trường hợp)**: TH: KH đang ở MH01 nhấn back, chọn 'Ký sau' trên popup xác nhận

**F (Các bước)**:
1. Mở MH01 "Hợp đồng của bạn"
2. Nhấn icon back (hoặc vuốt back)
3. Quan sát popup hiển thị
4. Nhấn button 'Ký sau' trên popup

**G (Kết quả mong muốn)**:
1. MH01 hiển thị đầy đủ
2. Popup "Dừng đăng ký" hiển thị, có 2 button 'Ký sau' và 'Tiếp tục'
3. Popup hiển thị với nội dung do server trả về
4. App đóng popup, đóng MH01, điều hướng quay về MH QLKV; khoản vay vẫn giữ status=pending_esigning

**H/I**: MEDIUM / MAJOR

**Z (Notes)**: Nội dung popup do server trả về (AMB-14) - TC verify hành vi 2 button

**graph_refs**: `ui_screen:mh01_xem_hop_dong_truoc_ky, ui_screen:popup_xac_nhan_ky_sau`

### TC #35 — (tiếp theo TC trước — merge col C)

**D (Trường hợp)**: TH: KH đang ở MH01 nhấn back, chọn 'Tiếp tục' trên popup xác nhận - giữ lại MH01

**F (Các bước)**:
1. Mở MH01
2. Nhấn icon back
3. Quan sát popup Xác nhận ký HĐ sau
4. Nhấn button 'Tiếp tục'

**G (Kết quả mong muốn)**:
1. MH01 hiển thị
2. Popup hiển thị với 2 button
3. Popup hiển thị nội dung do server trả về
4. Popup đóng, App giữ nguyên MH01 "Hợp đồng của bạn", KH có thể tiếp tục thao tác ký/hủy

**H/I**: MEDIUM / MINOR

**graph_refs**: `ui_screen:mh01_xem_hop_dong_truoc_ky, ui_screen:popup_xac_nhan_ky_sau`

### TC #36 — (tiếp theo TC trước — merge col C)

**D (Trường hợp)**: TH: KH back/vuốt trên MH01 ngay sau khi vào, nhấn 'Tiếp tục' trên popup xác nhận ký sau (luồng back được test cả 2 button)

**F (Các bước)**:
1. Mở MH01 ngay sau khi điều hướng từ MH QLKV
2. Bấm icon back (chưa thao tác checkbox/Ký)
3. Quan sát popup
4. Nhấn 'Tiếp tục'

**G (Kết quả mong muốn)**:
1. MH01 hiển thị, checkbox CHECKED mặc định
2. Popup Xác nhận ký HĐ sau hiển thị với 2 button 'Ký sau' và 'Tiếp tục'
3. Popup hiển thị nội dung do server trả về
4. Popup đóng, App giữ nguyên MH01 với toàn bộ thông tin HĐ và trạng thái checkbox không đổi

**H/I**: LOW / MINOR

**Z (Notes)**: Nội dung popup do server trả về (AMB-14)

**graph_refs**: `ui_screen:mh01_xem_hop_dong_truoc_ky, ui_screen:popup_xac_nhan_ky_sau`


## Màn hình 2.1 - Khoản vay bị từ chối (CTS fail eKYC)

### TC #37 — Kiểm tra hiển thị màn hình chung MH2.1 - Khoản vay bị từ chối (CTS fail ekyc)

**D (Trường hợp)**: TH: KH bấm Ký HĐ, đồng ý ký HĐ, tạo CTS thất bại do ekyc không hợp lệ (BE trả response CTS fail ekyc)

**F (Các bước)**:
1. Đăng nhập App, vào MH01 "Hợp đồng của bạn"
2. Tick checkbox đồng ý, tap button Ký hợp đồng → popup Cảnh giác lừa đảo → tap Đồng ý và ký HĐ
3. Setup môi trường: BE trả về kết quả CTS fail do ekyc không hợp lệ
4. Quan sát MH 2.1 hiển thị

**G (Kết quả mong muốn)**:
1. MH01 hiển thị, checkbox checked, button Ký enable
2. Popup Cảnh giác lừa đảo hiển thị, sau khi đồng ý App gửi yêu cầu tạo CTS
3. BE trả về kết quả CTS fail (ekyc)
4. App hiển thị MH 2.1 với đầy đủ thành phần: header tiêu đề; nội dung text+image thông báo khoản vay bị từ chối do ekyc/CTS không hợp lệ; Button "Trải nghiệm sản phẩm khác" enable; Button "Về trang chủ" enable

**H/I**: MEDIUM / MAJOR

**Z (Notes)**: AMB-04: Mã lỗi cụ thể partner trả về chưa có trong SRS — TC verify hành vi UI, không assert mã lỗi cụ thể. Cần BA confirm mã lỗi đối tác.

**graph_refs**: `ui_screen:mh02_1_khoan_vay_tu_choi, flow_step:7_show_error_screen, status:reject_by_lender`

### TC #38 — Kiểm tra hành vi button Trải nghiệm sản phẩm khác trên MH2.1

**D (Trường hợp)**: TH: KH ở MH 2.1, tap button "Trải nghiệm sản phẩm khác"

**F (Các bước)**:
1. Setup khoản vay đến MH 2.1 (CTS fail ekyc)
2. Tap button "Trải nghiệm sản phẩm khác"
3. Quan sát hành vi điều hướng

**G (Kết quả mong muốn)**:
1. MH 2.1 hiển thị đầy đủ
2. App tiếp nhận thao tác tap button
3. App điều hướng KH rời MH 2.1 sang màn hình giới thiệu/trải nghiệm sản phẩm tài chính khác (đích đến cụ thể đợi PO confirm — AMB-08)

**H/I**: MEDIUM / MAJOR

**Z (Notes)**: AMB-08: Button "Trải nghiệm sản phẩm khác" điều hướng đi đâu chưa rõ trong SRS — TC verify có điều hướng, không assert đích cụ thể. Cần BA confirm.

**graph_refs**: `ui_screen:mh02_1_khoan_vay_tu_choi`

### TC #39 — Kiểm tra hành vi button Về trang chủ trên MH2.1

**D (Trường hợp)**: TH: KH ở MH 2.1, tap button "Về trang chủ"

**F (Các bước)**:
1. Setup khoản vay đến MH 2.1
2. Tap button "Về trang chủ"
3. Quan sát hành vi

**G (Kết quả mong muốn)**:
1. MH 2.1 hiển thị
2. App tiếp nhận tap
3. App điều hướng KH về Trang chủ ViettelPay (rời khỏi luồng ký HĐ)

**H/I**: MEDIUM / MAJOR

**graph_refs**: `ui_screen:mh02_1_khoan_vay_tu_choi`

### TC #40 — Kiểm tra nội dung text + image của MH2.1

**D (Trường hợp)**: TH: KH ở MH 2.1, quan sát nội dung thông báo

**F (Các bước)**:
1. Setup khoản vay đến MH 2.1
2. Quan sát text title, text mô tả, image trên MH 2.1
3. So sánh với Figma/mockup

**G (Kết quả mong muốn)**:
1. MH 2.1 hiển thị
2. Text title, text mô tả lý do từ chối (CTS không hợp lệ do ekyc), image minh họa hiển thị đúng theo Figma/mockup
3. Bố cục text+image khớp design, không bị lệch/đè/thiếu icon

**H/I**: LOW / MINOR

**graph_refs**: `ui_screen:mh02_1_khoan_vay_tu_choi`


## Màn hình 2.2 - CTS lỗi hệ thống

### TC #41 — Kiểm tra hiển thị màn hình chung MH2.2 - CTS lỗi hệ thống

**D (Trường hợp)**: TH: KH bấm Ký HĐ, đồng ý ký HĐ, tạo CTS thất bại do lỗi hệ thống (lý do khác ngoài ekyc)

**F (Các bước)**:
1. Setup môi trường: BE trả về lỗi hệ thống khi tạo CTS
2. Mở MH01, tick checkbox, tap Ký HĐ → popup Cảnh giác → Đồng ý và ký
3. Quan sát MH 2.2 hiển thị
4. Quan sát các thành phần của MH 2.2

**G (Kết quả mong muốn)**:
1. Môi trường giả lập sẵn sàng
2. App thực hiện ký HĐ, BE trả về lỗi hệ thống tạo CTS
3. App hiển thị MH 2.2
4. MH 2.2 hiển thị đầy đủ: header tiêu đề; nội dung text+image thông báo lỗi hệ thống tạo CTS; Button "Về trang chủ" enable. Không có button Trải nghiệm sản phẩm khác (khác MH 2.1)

**H/I**: MEDIUM / MAJOR

**Z (Notes)**: AMB-04: Mã lỗi hệ thống cụ thể đợi BA confirm.

**graph_refs**: `ui_screen:mh02_2_cts_loi_he_thong, flow_step:7_show_error_screen`

### TC #42 — Kiểm tra hành vi button Về trang chủ trên MH2.2

**D (Trường hợp)**: TH: KH ở MH 2.2, tap button "Về trang chủ"

**F (Các bước)**:
1. Setup khoản vay đến MH 2.2 (CTS lỗi hệ thống)
2. Tap button "Về trang chủ"
3. Quan sát hành vi điều hướng

**G (Kết quả mong muốn)**:
1. MH 2.2 hiển thị
2. App tiếp nhận tap
3. App điều hướng KH về Trang chủ ViettelPay

**H/I**: MEDIUM / MAJOR

**graph_refs**: `ui_screen:mh02_2_cts_loi_he_thong`

### TC #43 — Kiểm tra nội dung text + image của MH2.2

**D (Trường hợp)**: TH: KH ở MH 2.2, quan sát nội dung thông báo lỗi hệ thống

**F (Các bước)**:
1. Setup khoản vay đến MH 2.2
2. Quan sát text title, text mô tả, image trên MH 2.2
3. So sánh với Figma/mockup

**G (Kết quả mong muốn)**:
1. MH 2.2 hiển thị
2. Text title, text mô tả lỗi hệ thống (CTS thất bại lý do khác), image minh họa hiển thị đúng Figma
3. Bố cục khớp design, đầy đủ icon/illustration

**H/I**: LOW / MINOR

**graph_refs**: `ui_screen:mh02_2_cts_loi_he_thong`


## Màn hình 2.3 - CTS timeout

### TC #44 — Kiểm tra hiển thị màn hình chung MH2.3 - CTS bị timeout

**D (Trường hợp)**: TH: KH bấm Ký HĐ, đồng ý ký HĐ, tạo CTS bị timeout (server không nhận được response trong thời gian quy định)

**F (Các bước)**:
1. Setup môi trường: simulate timeout khi tạo CTS
2. Mở MH01, tick checkbox, tap Ký HĐ → popup Cảnh giác → Đồng ý và ký
3. Đợi đến khi App nhận trạng thái timeout
4. Quan sát các thành phần của MH 2.3

**G (Kết quả mong muốn)**:
1. Môi trường giả lập timeout sẵn sàng
2. App thực hiện ký HĐ, gọi tạo CTS
3. Sau timeout, App hiển thị MH 2.3
4. MH 2.3 hiển thị đầy đủ: header tiêu đề; nội dung text+image thông báo CTS bị timeout; Button "Đóng" enable (button duy nhất, không có Về trang chủ / Trải nghiệm SP khác)

**H/I**: MEDIUM / MAJOR

**Z (Notes)**: AMB-04: Cần BA confirm config timeout cụ thể.

**graph_refs**: `ui_screen:mh02_3_cts_timeout, flow_step:7_show_error_screen`

### TC #45 — Kiểm tra hành vi button Đóng trên MH2.3 giữ lại MH01

**D (Trường hợp)**: TH: KH ở MH 2.3, tap button "Đóng"

**F (Các bước)**:
1. Setup khoản vay đến MH 2.3 (CTS timeout)
2. Tap button "Đóng"
3. Quan sát hành vi sau khi tap

**G (Kết quả mong muốn)**:
1. MH 2.3 hiển thị
2. App tiếp nhận tap
3. App đóng MH 2.3 và giữ lại MH01 "Hợp đồng của bạn" (không đẩy KH ra Trang chủ), cho phép KH thử ký lại

**H/I**: MEDIUM / MAJOR

**graph_refs**: `ui_screen:mh02_3_cts_timeout, ui_screen:mh01_xem_hop_dong_truoc_ky`

### TC #46 — Kiểm tra nội dung text + image của MH2.3

**D (Trường hợp)**: TH: KH ở MH 2.3, quan sát nội dung thông báo timeout

**F (Các bước)**:
1. Setup khoản vay đến MH 2.3
2. Quan sát text title, text mô tả, image trên MH 2.3
3. So sánh với Figma/mockup

**G (Kết quả mong muốn)**:
1. MH 2.3 hiển thị
2. Text title, text mô tả CTS timeout, image minh họa hiển thị đúng Figma
3. Bố cục text+image+button khớp design

**H/I**: LOW / MINOR

**graph_refs**: `ui_screen:mh02_3_cts_timeout`


## Màn hình 5 - Gửi hồ sơ vay không thành công

### TC #47 — Kiểm tra hiển thị màn hình chung MH05 - Gửi hồ sơ vay không thành công

**D (Trường hợp)**: TH: KH đã yêu cầu OTP quá 3 lần/ngày, Loanorder trả lỗi quá lượt OTP

**F (Các bước)**:
1. Setup KH có khoản vay đã yêu cầu OTP 3 lần trong ngày
2. Vào MH01, tick checkbox, tap Ký HĐ
3. Đợi App nhận response quá lượt OTP
4. Quan sát MH05 và các thành phần

**G (Kết quả mong muốn)**:
1. KH ở MH QLKV
2. App thực hiện ký, gửi yêu cầu OTP
3. Server trả về kết quả quá lượt OTP, update status=reject, sub=reject_by_lender, block KH đăng ký vay mới 24h
4. MH05 hiển thị đầy đủ: header tiêu đề; nội dung text+image thông báo gửi hồ sơ vay không thành công; Button "Trải nghiệm sản phẩm khác" enable; Button "Về trang chủ" enable

**H/I**: MEDIUM / MAJOR

**Z (Notes)**: AMB-04: Mã lỗi đối tác đợi BA confirm.

**graph_refs**: `ui_screen:mh05_gui_ho_so_vay_khong_thanh_cong, flow_step:19_show_error, status:reject_by_lender, business_rule:block_new_loan_after_cancel_24h`

### TC #48 — Kiểm tra hành vi button Trải nghiệm sản phẩm khác trên MH05

**D (Trường hợp)**: TH: KH ở MH05, tap button "Trải nghiệm sản phẩm khác"

**F (Các bước)**:
1. Setup KH đến MH05
2. Tap button "Trải nghiệm sản phẩm khác"
3. Quan sát hành vi

**G (Kết quả mong muốn)**:
1. MH05 hiển thị
2. App tiếp nhận tap
3. App điều hướng KH sang màn hình giới thiệu/trải nghiệm sản phẩm tài chính khác (đích đến cụ thể đợi PO confirm — AMB-08)

**H/I**: MEDIUM / MAJOR

**Z (Notes)**: AMB-08: Button "Trải nghiệm sản phẩm khác" điều hướng đi đâu chưa rõ — cần BA confirm.

**graph_refs**: `ui_screen:mh05_gui_ho_so_vay_khong_thanh_cong`

### TC #49 — Kiểm tra hành vi button Về trang chủ trên MH05

**D (Trường hợp)**: TH: KH ở MH05, tap button "Về trang chủ"

**F (Các bước)**:
1. Setup KH đến MH05
2. Tap button "Về trang chủ"
3. Quan sát hành vi điều hướng

**G (Kết quả mong muốn)**:
1. MH05 hiển thị
2. App tiếp nhận tap
3. App điều hướng KH về Trang chủ ViettelPay (khoản vay đang ở trạng thái reject, KH bị block đăng ký vay mới 24h)

**H/I**: MEDIUM / MAJOR

**graph_refs**: `ui_screen:mh05_gui_ho_so_vay_khong_thanh_cong, status:reject_by_lender`

### TC #50 — Kiểm tra nội dung text + image của MH05

**D (Trường hợp)**: TH: KH ở MH05, quan sát nội dung text+image thông báo gửi hồ sơ thất bại

**F (Các bước)**:
1. Setup KH đến MH05
2. Quan sát text title, text mô tả, image trên MH05
3. So sánh với Figma/mockup

**G (Kết quả mong muốn)**:
1. MH05 hiển thị
2. Text title, text mô tả nội dung gửi hồ sơ vay không thành công, image minh họa hiển thị đúng Figma
3. Bố cục khớp design, đầy đủ icon/illustration

**H/I**: LOW / MINOR

**graph_refs**: `ui_screen:mh05_gui_ho_so_vay_khong_thanh_cong`


## Màn hình 3 - Xác thực OTP

### TC #51 — Kiểm tra hiển thị màn hình chung MH03 - Xác thực OTP

**D (Trường hợp)**: TH: KH vào MH03 lần đầu sau khi tạo CTS thành công và Loanorder/Regenerate trả OTP thành công

**F (Các bước)**:
1. Setup môi trường: KH thực hiện đến bước nhận OTP thành công (Loanorder hoặc Regenerate OK)
2. Mở MH01 → tick checkbox → tap Ký HĐ → popup Cảnh giác → Đồng ý và ký
3. Đợi App chuyển sang MH03
4. Quan sát toàn bộ thành phần của MH03

**G (Kết quả mong muốn)**:
1. Môi trường sẵn sàng, OTP đã được sinh và gửi đến SĐT KH
2. App thực hiện flow ký, server gọi Loanorder/Regenerate thành công
3. App chuyển sang MH03
4. MH03 hiển thị đầy đủ: Label hướng dẫn nhập OTP (kèm SĐT mask vd 0987***456); Input "Nhập mã OTP" (numeric only, max 6 chữ số, đang trống); Icon countdown 300s (đang đếm ngược từ 5:00); Button "Bỏ qua" enable; Button "Gửi lại OTP" hiện ở vị trí countdown nhưng đang bị thay bởi icon countdown (chưa hết 300s); Button "Xác nhận" disable (do chưa nhập đủ 6 ký tự)

**H/I**: HIGH / CRITICAL

**Z (Notes)**: AMB-09: STT 5 trùng giữa Gửi lại OTP và Xác nhận trong SRS — không ảnh hưởng test, chỉ note tham chiếu.

**graph_refs**: `ui_screen:mh03_xac_thuc_otp, field:otp_code, field:countdown_otp, field:so_dien_thoai, flow_step:20_show_otp, validation_rule:otp_format, validation_rule:otp_validity_300s`

### TC #52 — Kiểm tra label hướng dẫn và phone mask trên MH03

**D (Trường hợp)**: TH: KH vào MH03, quan sát label hướng dẫn nhập OTP

**E (Data test)**:
```
so_dien_thoai = "0987654321"
```

**F (Các bước)**:
1. Setup KH có SĐT = 0987654321, vào được MH03
2. Quan sát label hướng dẫn ở phía trên input OTP
3. Kiểm tra SĐT hiển thị có bị mask không

**G (Kết quả mong muốn)**:
1. KH vào MH03 thành công
2. Label hướng dẫn hiển thị nội dung yêu cầu nhập OTP gửi về SĐT, kèm SĐT của KH
3. SĐT hiển thị dạng mask (vd 0987***321 hoặc 098****4321) — không lộ đầy đủ 10 chữ số

**H/I**: HIGH / MAJOR

**graph_refs**: `ui_screen:mh03_xac_thuc_otp, field:so_dien_thoai`

### TC #53 — Kiểm tra input OTP chỉ cho phép số (chặn chữ cái)

**D (Trường hợp)**: TH: KH nhập ký tự chữ cái vào input OTP

**E (Data test)**:
```
otp_code input = "abc123"
```

**F (Các bước)**:
1. Vào MH03
2. Tap vào input "Nhập mã OTP"
3. Thử nhập "abc123" (gồm chữ và số)
4. Quan sát giá trị hiển thị trong input

**G (Kết quả mong muốn)**:
1. MH03 hiển thị
2. Input focus, bàn phím numeric mở lên
3. Hệ thống chặn không cho nhập ký tự chữ "abc" (không xuất hiện trong input)
4. Input chỉ chứa "123" (3 ký tự số)

**H/I**: HIGH / CRITICAL

**graph_refs**: `ui_screen:mh03_xac_thuc_otp, field:otp_code, validation_rule:otp_format`

### TC #54 — Kiểm tra input OTP chặn ký tự đặc biệt

**D (Trường hợp)**: TH: KH dán/nhập ký tự đặc biệt vào input OTP

**E (Data test)**:
```
otp_code input = "!@#$%^"
```

**F (Các bước)**:
1. Vào MH03
2. Tap vào input OTP
3. Thử paste hoặc nhập "!@#$%^"
4. Quan sát giá trị input

**G (Kết quả mong muốn)**:
1. MH03 hiển thị
2. Input focus, bàn phím số mở lên
3. Hệ thống chặn không cho ký tự đặc biệt được nhập vào
4. Input vẫn trống, không có ký tự nào hiển thị

**H/I**: HIGH / MAJOR

**graph_refs**: `ui_screen:mh03_xac_thuc_otp, field:otp_code, validation_rule:otp_format`

### TC #55 — Kiểm tra input OTP max length = 6 (biên dưới)

**D (Trường hợp)**: TH: KH nhập 5 chữ số vào input OTP

**E (Data test)**:
```
otp_code = "12345" (5 ký tự)
```

**F (Các bước)**:
1. Vào MH03
2. Nhập "12345" vào input OTP
3. Quan sát giá trị input và trạng thái button Xác nhận

**G (Kết quả mong muốn)**:
1. MH03 hiển thị
2. Input hiển thị "12345" (5 ký tự số)
3. Button "Xác nhận" vẫn DISABLE (chưa đủ 6 ký tự theo rule otp_format)

**H/I**: HIGH / MAJOR

**graph_refs**: `ui_screen:mh03_xac_thuc_otp, field:otp_code, validation_rule:otp_format`

### TC #56 — Kiểm tra input OTP max length = 6 (biên đúng)

**D (Trường hợp)**: TH: KH nhập đủ 6 chữ số vào input OTP

**E (Data test)**:
```
otp_code = "123456" (6 ký tự)
```

**F (Các bước)**:
1. Vào MH03
2. Nhập "123456" vào input OTP
3. Quan sát giá trị input và button Xác nhận

**G (Kết quả mong muốn)**:
1. MH03 hiển thị
2. Input hiển thị "123456" (đủ 6 ký tự)
3. Button "Xác nhận" chuyển sang ENABLE (active)

**H/I**: HIGH / CRITICAL

**graph_refs**: `ui_screen:mh03_xac_thuc_otp, field:otp_code, validation_rule:otp_format`

### TC #57 — Kiểm tra input OTP max length = 6 (biên trên)

**D (Trường hợp)**: TH: KH cố gắng nhập 7 chữ số (vượt max)

**E (Data test)**:
```
otp_code input = "1234567"
```

**F (Các bước)**:
1. Vào MH03
2. Cố gắng nhập "1234567" (7 chữ số) vào input OTP
3. Quan sát giá trị input

**G (Kết quả mong muốn)**:
1. MH03 hiển thị
2. Hệ thống chặn ký tự thứ 7, không cho nhập tiếp
3. Input chỉ chứa 6 ký tự "123456", ký tự "7" bị bỏ qua

**H/I**: HIGH / MAJOR

**graph_refs**: `ui_screen:mh03_xac_thuc_otp, field:otp_code, validation_rule:otp_format`

### TC #58 — Kiểm tra icon countdown 300s hiển thị và đếm ngược

**D (Trường hợp)**: TH: KH vừa vào MH03, OTP vừa được sinh thành công

**F (Các bước)**:
1. Vào MH03 ngay sau khi nhận OTP thành công
2. Quan sát icon countdown ở vị trí Control 3
3. Đợi 5 giây và quan sát giá trị countdown

**G (Kết quả mong muốn)**:
1. MH03 hiển thị
2. Icon countdown hiển thị giá trị 300 giây (5:00) ở trạng thái đếm ngược, không phải button Gửi lại OTP
3. Sau 5 giây giá trị countdown giảm xuống còn ~4:55 (295s), đếm liên tục

**H/I**: HIGH / MAJOR

**graph_refs**: `ui_screen:mh03_xac_thuc_otp, field:countdown_otp, validation_rule:otp_validity_300s`

### TC #59 — Kiểm tra countdown chuyển thành button Gửi lại OTP sau 300s

**D (Trường hợp)**: TH: KH ở MH03 và đợi đủ 300s (countdown về 0)

**F (Các bước)**:
1. Vào MH03 ngay sau khi OTP được sinh
2. Đợi countdown đếm về 0 (300s/5 phút)
3. Quan sát vị trí Control 3

**G (Kết quả mong muốn)**:
1. MH03 hiển thị, countdown bắt đầu từ 5:00
2. Countdown đếm về 0:00
3. Icon countdown được thay bằng button "Gửi lại OTP" (text in xanh, enable, có thể tap)

**H/I**: HIGH / CRITICAL

**graph_refs**: `ui_screen:mh03_xac_thuc_otp, field:countdown_otp, validation_rule:otp_validity_300s`

### TC #60 — Kiểm tra button Xác nhận disable khi input OTP rỗng

**D (Trường hợp)**: TH: KH vừa vào MH03, input OTP đang trống

**E (Data test)**:
```
otp_code = "" (empty)
```

**F (Các bước)**:
1. Vào MH03
2. Không nhập gì vào input OTP
3. Quan sát trạng thái button Xác nhận

**G (Kết quả mong muốn)**:
1. MH03 hiển thị
2. Input OTP trống (0 ký tự)
3. Button "Xác nhận" ở trạng thái DISABLE (mờ, không tap được)

**H/I**: HIGH / MAJOR

**graph_refs**: `ui_screen:mh03_xac_thuc_otp, field:otp_code, validation_rule:otp_format`

### TC #61 — Kiểm tra button Xác nhận chuyển trạng thái khi xoá ký tự thứ 6

**D (Trường hợp)**: TH: KH nhập đủ 6 chữ số rồi xoá 1 chữ

**E (Data test)**:
```
otp_code = "123456" → xoá còn "12345"
```

**F (Các bước)**:
1. Vào MH03
2. Nhập "123456" — quan sát button Xác nhận
3. Bấm xoá 1 ký tự (còn "12345") — quan sát button Xác nhận

**G (Kết quả mong muốn)**:
1. MH03 hiển thị
2. Button Xác nhận chuyển sang ENABLE khi đủ 6 ký tự
3. Button Xác nhận chuyển trở lại DISABLE khi xoá còn 5 ký tự

**H/I**: MEDIUM / MAJOR

**graph_refs**: `ui_screen:mh03_xac_thuc_otp, field:otp_code, validation_rule:otp_format`

### TC #62 — Kiểm tra hành vi button Bỏ qua trên MH03

**D (Trường hợp)**: TH: KH tap button "Bỏ qua" trên MH03

**F (Các bước)**:
1. Vào MH03
2. Tap button "Bỏ qua"
3. Quan sát hành vi điều hướng

**G (Kết quả mong muốn)**:
1. MH03 hiển thị
2. App tiếp nhận tap
3. App rời MH03, KH trở về MH QLKV (cho phép ký sau), trạng thái khoản vay vẫn pending_esigning

**H/I**: MEDIUM / MAJOR

**graph_refs**: `ui_screen:mh03_xac_thuc_otp, status:pending_esigning`

### TC #63 — Kiểm tra hành vi button Gửi lại OTP (resend trong giới hạn 3 lần/ngày)

**D (Trường hợp)**: TH: Countdown đã về 0, KH tap button Gửi lại OTP lần đầu trong ngày

**F (Các bước)**:
1. Vào MH03, đợi countdown về 0:00
2. Quan sát button Gửi lại OTP
3. Tap button Gửi lại OTP
4. Quan sát countdown và state OTP

**G (Kết quả mong muốn)**:
1. MH03 hiển thị, countdown đếm về 0
2. Button Gửi lại OTP hiện ở vị trí countdown, enable
3. App gọi yêu cầu sinh lại OTP
4. Countdown reset về 300s (5:00), button Gửi lại OTP biến mất, icon countdown trở lại; input OTP trống

**H/I**: HIGH / CRITICAL

**Z (Notes)**: AMB-03 resolved: 3 lần/ngày theo MH03 Control 5.

**graph_refs**: `ui_screen:mh03_xac_thuc_otp, field:otp_code, field:countdown_otp, validation_rule:otp_max_3_resend_per_day`

### TC #64 — Kiểm tra trạng thái MH03 sau khi tap Gửi lại OTP và OTP mới được gửi

**D (Trường hợp)**: TH: Sau khi tap Gửi lại OTP và server trả về thành công, KH quan sát lại MH03

**F (Các bước)**:
1. Vào MH03, đợi countdown về 0:00, tap Gửi lại OTP
2. Quan sát input OTP sau khi resend
3. Quan sát countdown và icon hiển thị tại Control 3
4. Quan sát button Xác nhận và button Bỏ qua

**G (Kết quả mong muốn)**:
1. Server trả OTP mới, App load lại MH03
2. Input OTP ở trạng thái trống, focus sẵn cho KH nhập
3. Icon countdown 300s xuất hiện trở lại (5:00, đang đếm), button Gửi lại OTP biến mất
4. Button Xác nhận disable (input đang trống), button Bỏ qua vẫn enable

**H/I**: MEDIUM / MAJOR

**graph_refs**: `ui_screen:mh03_xac_thuc_otp, field:otp_code, field:countdown_otp, validation_rule:otp_validity_300s`

### TC #65 — Kiểm tra recovery — KH nhập sai OTP 1 lần, bấm Gửi lại OTP, nhập đúng OTP mới

**D (Trường hợp)**: TH: KH nhập sai OTP lần 1, sau đó dùng button "Gửi lại OTP" để gen OTP mới và nhập đúng (recovery sau lần sai đầu)

**E (Data test)**:
```
OTP cũ (server gửi lần 1) = "123456"; OTP KH nhập sai = "999999"; OTP mới (sau resend) = "654321"
```

**F (Các bước)**:
1. Vào MH03, KH nhận OTP "123456"
2. Nhập OTP sai "999999", bấm Xác nhận
3. Popup hiển thị → bấm Đóng
4. Quan sát: input bị clear + disabled, button "Gửi lại OTP" highlight
5. Bấm "Gửi lại OTP"
6. KH nhận OTP mới "654321" qua SMS, input unlock
7. Nhập đúng OTP mới "654321", bấm Xác nhận
8. Quan sát kết quả

**G (Kết quả mong muốn)**:
1. MH03 hiển thị, countdown 300s
2. App gửi verify, đối tác trả OTP sai
3. Popup "Bạn đã nhập sai mã OTP. Vui lòng bấm Gửi lại OTP"; bấm Đóng
4. Input clear + disabled; button Gửi lại OTP highlight; button Xác nhận disable
5. App gửi yêu cầu Regenerate, đối tác trả OTP mới thành công
6. Input unlock, countdown reset 300s, KH có OTP mới
7. App gửi verify OTP mới, server gọi ConfirmSignature thành công
8. Server update status=pending_underwritting, sub=null, gửi SMS tiếp nhận → App hiển thị MH04 "Gửi đăng ký vay thành công"

**H/I**: HIGH / CRITICAL

**Z (Notes)**: Recovery path quan trọng — bộ đếm sai OTP không được reset KH gen OTP mới, nhưng KH vẫn ký được nếu nhập đúng trong cùng phiên CTS.

**graph_refs**: `field:otp_code, validation_rule:otp_max_3_attempts, status:pending_underwritting, ui_screen:mh03_xac_thuc_otp, ui_screen:mh04_gui_dang_ky_vay_thanh_cong`

### TC #66 — Kiểm tra ưu tiên giữa "sai OTP" và "OTP hết hạn" — submit sai OTP đúng lúc countdown vừa hết 300s

**D (Trường hợp)**: TH: KH nhập OTP sai và bấm Xác nhận đúng lúc countdown vừa đếm về 0 (race giữa expired và verify-fail)

**E (Data test)**:
```
OTP đúng server sinh = "123456"; OTP KH nhập = "999999"; thời điểm submit = countdown 0-1s
```

**F (Các bước)**:
1. Vào MH03, đợi countdown gần hết (còn 1-2s)
2. Nhập OTP sai "999999"
3. Bấm Xác nhận ngay khi countdown đếm tới 0
4. Quan sát thông báo lỗi nào hiển thị: "Mã OTP đã hết hiệu lực" (inline) hay popup "Bạn đã nhập sai mã OTP"

**G (Kết quả mong muốn)**:
1. MH03 hiển thị, countdown đếm tới 1s
2. Input OTP "999999"
3. App gửi verify ngay
4. Server PHẢI kiểm tra OTP expiry TRƯỚC OTP correctness → hiển thị "Mã OTP đã hết hiệu lực. Vui lòng bấm gửi lại OTP" (inline error đỏ trên MH03) — KHÔNG hiển thị popup "sai mã OTP" (vì OTP đã expired thì wrong-attempt count không tăng). Countdown auto-switch thành button "Gửi lại OTP" theo SRS A5. Input có thể giữ enable hoặc clear (cần BA confirm).

**H/I**: HIGH / MAJOR

**Z (Notes)**: Edge case race condition. Quan trọng vì nếu server check sai thứ tự (check correctness trước expiry) → wrong-attempt counter bị consume oan trên OTP đã expired → có thể trigger nhầm popup "quá số lần quy định" / block 5 phút. Cần BA + dev confirm thứ tự validation server-side.

**graph_refs**: `field:otp_code, field:countdown_otp, validation_rule:otp_validity_300s, validation_rule:otp_max_3_attempts, ui_screen:mh03_xac_thuc_otp`

### TC #67 — (tiếp theo TC trước — merge col C)

**D (Trường hợp)**: TH: Verify SĐT trên MH03 (Xác thực OTP) bị mask theo pattern bảo mật chuẩn

**E (Data test)**:
```
SĐT mẫu = 0901234567
```

**F (Các bước)**:
1. KH đăng nhập App với SĐT 0901234567, có khoản vay pending_esigning
2. Vào MH01, nhấn Ký hợp đồng để chuyển sang MH03 sau khi Loanorder thành công
3. Quan sát label hướng dẫn trên MH03 hiển thị SĐT
4. Chụp/screenshot màn hình để kiểm tra không có sự cố leak SĐT trong UI
5. Kiểm tra log client (nếu có thể) để xác nhận SĐT không bị log dạng plain text

**G (Kết quả mong muốn)**:
1. KH đăng nhập thành công
2. App điều hướng đến MH03, label hướng dẫn hiển thị có SĐT mask
3. SĐT được mask theo pattern bảo mật (ví dụ 090****567 hoặc xxx****xxxx), không hiển thị toàn bộ 10 số
4. Screenshot xác nhận không lộ full số
5. Log/Console không in plain SĐT (kiểm tra ở mức best-effort qua bug report tool)

**H/I**: MEDIUM / MAJOR

**Z (Notes)**: OWASP Mobile Top 10 - M2 Insecure Data Storage. Cần BA confirm pattern mask chính xác (số ký tự mask, vị trí). SRS chỉ nói 'có SĐT' trong label MH03 Control 1, không quy định mask format cụ thể.

**graph_refs**: `field:so_dien_thoai, ui_screen:mh03_xac_thuc_otp`

### TC #68 — (tiếp theo TC trước — merge col C)

**D (Trường hợp)**: TH: Nhập OTP có ký tự chữ "12345a" - hệ thống không cho nhập chữ vào input numeric

**E (Data test)**:
```
otp_code attempt="12345a"
```

**F (Các bước)**:
1. Vào MH03
2. Thử nhập "12345a" vào input OTP
3. Quan sát giá trị thực tế trong input
4. Quan sát button Xác nhận

**G (Kết quả mong muốn)**:
1. MH03 hiển thị
2. Hệ thống chỉ cho phép nhập số → ký tự 'a' bị từ chối, input chỉ giữ lại "12345"
3. Input hiển thị "12345" (5 ký tự số)
4. Button 'Xác nhận' Disable (chưa đủ 6 ký tự)

**H/I**: HIGH / MAJOR

**graph_refs**: `field:otp_code, validation_rule:otp_format`

### TC #69 — (tiếp theo TC trước — merge col C)

**D (Trường hợp)**: TH: Nhập OTP có space "12345 " - hệ thống không cho nhập space

**E (Data test)**:
```
otp_code attempt="12345 "
```

**F (Các bước)**:
1. Vào MH03
2. Nhập "12345" rồi gõ phím space
3. Quan sát input
4. Quan sát button Xác nhận

**G (Kết quả mong muốn)**:
1. MH03 hiển thị
2. Space bị từ chối, input chỉ giữ "12345"
3. Input hiển thị 5 ký tự số
4. Button 'Xác nhận' Disable

**H/I**: MEDIUM / MAJOR

**graph_refs**: `field:otp_code, validation_rule:otp_format`

### TC #70 — (tiếp theo TC trước — merge col C)

**D (Trường hợp)**: TH: Nhập OTP 5 ký tự (= max - 1, < min 6)

**E (Data test)**:
```
otp_code="12345"
```

**F (Các bước)**:
1. Vào MH03
2. Nhập "12345" (5 ký tự)
3. Quan sát button Xác nhận

**G (Kết quả mong muốn)**:
1. MH03 hiển thị
2. Input hiển thị "12345" (5 ký tự)
3. Button 'Xác nhận' Disable (chưa đủ 6 chữ số)

**H/I**: HIGH / MAJOR

**graph_refs**: `field:otp_code, validation_rule:otp_format`

### TC #71 — (tiếp theo TC trước — merge col C)

**D (Trường hợp)**: TH: Thử nhập OTP 7 ký tự "1234567" - hệ thống chặn ký tự thứ 7

**E (Data test)**:
```
otp_code attempt="1234567"
```

**F (Các bước)**:
1. Vào MH03
2. Nhập "123456" rồi tiếp tục gõ số "7"
3. Quan sát giá trị trong input
4. Quan sát button Xác nhận

**G (Kết quả mong muốn)**:
1. MH03 hiển thị
2. Ký tự thứ 7 bị từ chối, input giữ nguyên "123456"
3. Input hiển thị đúng 6 ký tự
4. Button 'Xác nhận' vẫn Enable

**H/I**: MEDIUM / MAJOR

**graph_refs**: `field:otp_code, validation_rule:otp_format`

### TC #72 — Kiểm tra OTP input chỉ chấp nhận ký tự số — chặn SQL injection / XSS payload / special chars

**D (Trường hợp)**: TH: KH paste SQL injection payload (vd "' OR 1=1--", "<script>alert(1)</script>") hoặc special chars (`!@#$%`) vào input OTP trên MH03. Mong muốn: input chỉ chấp nhận digit 0-9, mọi ký tự khác bị strip/reject.

**E (Data test)**:
```
Input thử: ["' OR 1=1--", "<script>alert(1)</script>", "DROP TABLE;", "!@#$%^&*", "123' OR '1'='1"]
```

**F (Các bước)**:
1. KH login App, đến MH03 "Xác thực OTP"
2. Paste "' OR 1=1--" vào input OTP
3. Quan sát hiển thị trong ô input
4. Thử paste lần lượt các payload: "<script>alert(1)</script>", "DROP TABLE;", "!@#$%", "123' OR '1'='1"
5. Với mỗi input, nhấn button Xác nhận (nếu enable)
6. Quan sát behavior client/server

**G (Kết quả mong muốn)**:
1. MH03 hiển thị input OTP
2. Input strip tất cả ký tự non-digit; chỉ giữ "11" (từ payload "' OR 1=1--")
3. Hiển thị "11" (2 ký tự số), button Xác nhận disable (chưa đủ 6 ký tự)
4. Tương tự: "<script>alert(1)</script>" → "1" (1 ký tự); "DROP TABLE;" → "" (rỗng); "!@#$%" → ""; "123' OR '1'='1" → "12311" (5 ký tự, vẫn không đủ)
5. Không gửi được request với payload (button disable). Nếu bypass UI mà gửi qua API → server phải reject với lỗi format, không thực thi SQL/script
6. Không crash client, không leak stacktrace, không thực thi script (XSS)

**H/I**: HIGH / CRITICAL

**Z (Notes)**: OWASP Mobile Top 10 M7 (Client Code Quality) + M4 (Auth). Tham chiếu validation_rule:otp_format. Đảm bảo input sanitization ở cả client (strip non-digit) và server (reject format invalid).

**graph_refs**: `field:otp_code, validation_rule:otp_format, ui_screen:mh03_xac_thuc_otp`

### TC #73 — Kiểm tra input sanitization trên field OTP - chặn ký tự non-digit

**D (Trường hợp)**: TH: KH nhập OTP có lẫn ký tự Unicode VN có dấu (vd '12345ạ', '1ạ3456') vào input OTP trên MH03

**E (Data test)**:
```
Input thử: ['12345ạ', '1ạ3456', '123áb6', 'ăâê56']
```

**F (Các bước)**:
1. KH login App, vào MH01 và nhấn Ký hợp đồng để đến MH03
2. Tại input Nhập mã OTP, dùng bàn phím tiếng Việt nhập '12345ạ'
3. Quan sát ô input có chấp nhận ký tự 'ạ' không
4. Thử thêm các input '1ạ3456', '123áb6', 'ăâê56'
5. Nhấn Xác nhận (nếu enable)
6. Quan sát thông báo lỗi và state của button Xác nhận

**G (Kết quả mong muốn)**:
1. MH03 hiển thị input OTP, keyboard tiếng Việt active
2. Ô input chỉ chấp nhận 5 ký tự số '12345', ký tự 'ạ' bị block hoặc strip
3. Input hiển thị '12345' (chỉ số), không có ký tự dấu
4. Tương tự với các input còn lại: chỉ giữ phần digit, strip non-digit
5. Button Xác nhận disable khi input chưa đủ 6 ký tự số (theo validation_rule:otp_format)
6. Không có lỗi crash, không submit request với payload chứa ký tự lạ

**H/I**: HIGH / MAJOR

**Z (Notes)**: OWASP Mobile Top 10 - M7 Client Code Quality. Tham chiếu validation_rule:otp_format (numeric only, max 6).

**graph_refs**: `field:otp_code, validation_rule:otp_format, ui_screen:mh03_xac_thuc_otp`

### TC #74 — Kiểm tra input OTP bị disable sau khi popup "sai OTP" đóng — KH không thể gõ vào input

**D (Trường hợp)**: TH: Sau khi popup "sai OTP" hiển thị và KH tap Đóng, KH thử gõ ký tự số vào input OTP — input phải KHÔNG nhận ký tự (disabled state)

**F (Các bước)**:
1. Trên MH03, nhập OTP sai và bấm Xác nhận để trigger popup "sai OTP"
2. Tap Đóng trên popup
3. Quan sát trạng thái input OTP (màu, opacity, cursor)
4. Thử tap vào input để show keyboard
5. Gõ thử các ký tự "1", "2", "3" vào input
6. Quan sát hiển thị trong ô input

**G (Kết quả mong muốn)**:
1. Popup "Bạn đã nhập sai mã OTP. Vui lòng bấm Gửi lại OTP" hiển thị
2. Popup đóng, quay về MH03
3. Input OTP hiển thị disabled state: mờ (opacity giảm), border xám, không có blinking cursor
4. Tap vào input — KHÔNG show keyboard (input không focus được)
5. Gõ ký tự — KHÔNG có ký tự nào xuất hiện trong input (input rỗng, không nhận input)
6. Hint label dưới input có thể hiển thị "Vui lòng bấm Gửi lại OTP để có OTP mới" hoặc tương tự (cần BA confirm)

**H/I**: HIGH / MAJOR

**Z (Notes)**: Kiểm tra rằng KH KHÔNG thể bypass lock bằng cách tap vào input và gõ. UI phải enforce disabled state nghiêm ngặt.

**graph_refs**: `field:otp_code, ui_screen:mh03_xac_thuc_otp`

### TC #75 — Kiểm tra button "Gửi lại OTP" highlight/active sau khi popup "sai OTP" đóng

**D (Trường hợp)**: TH: Sau khi popup "sai OTP" đóng, button "Gửi lại OTP" phải thay đổi visual state: từ secondary/mờ sang primary/active để hướng KH bấm nó

**F (Các bước)**:
1. Trên MH03 lúc bình thường, quan sát visual state của button/link "Gửi lại OTP" (default state)
2. Nhập OTP sai và bấm Xác nhận để trigger popup
3. Tap Đóng trên popup
4. So sánh visual state của button "Gửi lại OTP" sau khi popup đóng vs default state ở bước 1

**G (Kết quả mong muốn)**:
1. Default: button/link "Gửi lại OTP" ở trạng thái secondary (màu xám, hoặc text link mờ, hoặc disabled khi countdown chưa hết tùy theo SRS A5)
2. Popup hiển thị
3. Popup đóng
4. Button "Gửi lại OTP" CHUYỂN sang trạng thái highlight/active: màu đỏ primary (hoặc text link đậm, hoặc nổi bật rõ ràng) — visual cue rõ ràng để KH biết phải bấm nó. Tap được, không bị disable bởi countdown nữa (vì input đang lock, cần resend để unlock)

**H/I**: MEDIUM / MAJOR

**Z (Notes)**: UI UX: button highlight cần đủ rõ để KH biết next action. Có thể kèm hint label hướng dẫn. Cần BA confirm exact visual style.

**graph_refs**: `field:otp_code, ui_screen:mh03_xac_thuc_otp, validation_rule:otp_max_3_resend_per_day`

### TC #76 — (tiếp theo TC trước — merge col C)

**D (Trường hợp)**: TH: Input OTP để trống (0 ký tự)

**E (Data test)**:
```
otp_code=""
```

**F (Các bước)**:
1. Vào MH03
2. Không nhập OTP
3. Quan sát input và button

**G (Kết quả mong muốn)**:
1. MH03 hiển thị
2. Input rỗng (placeholder hiển thị)
3. Button 'Xác nhận' Disable

**H/I**: HIGH / MAJOR

**graph_refs**: `field:otp_code, validation_rule:otp_format`

### TC #77 — (tiếp theo TC trước — merge col C)

**D (Trường hợp)**: TH: KH nhập emoji hoặc ZWNJ (zero-width non-joiner U+200C) vào input OTP

**E (Data test)**:
```
Input thử: ['😀12345', '12\u200C3456', '1️⃣2️⃣3️⃣4️⃣5️⃣6️⃣', '12345🔥']
```

**F (Các bước)**:
1. KH login App, đến MH03
2. Tại input OTP, paste hoặc gõ chuỗi '😀12345' (emoji + 5 số)
3. Quan sát hiển thị trong ô input
4. Thử paste '12\u200C3456' (có ZWNJ ở giữa)
5. Thử paste '1️⃣2️⃣3️⃣4️⃣5️⃣6️⃣' (number emoji)
6. Nếu button Xác nhận enable, nhấn để check server behavior

**G (Kết quả mong muốn)**:
1. MH03 hiển thị, input OTP active
2. Ô input strip emoji '😀', chỉ giữ '12345'
3. Hiển thị '12345', button Xác nhận disable (chưa đủ 6 ký tự số)
4. Ô input strip ZWNJ, hiển thị '123456' (6 số liền), button Xác nhận enable
5. Number emoji được strip hoặc reject - không chấp nhận làm digit hợp lệ
6. Nếu submit được: server phải trả lỗi sai OTP hoặc reject input format, không crash và không leak stacktrace; sub-status không có giá trị mới ngoài danh sách documented

**H/I**: HIGH / MAJOR

**Z (Notes)**: OWASP Mobile Top 10 - M7 Client Code Quality / Unicode handling. ZWNJ là zero-width invisible char - hay được dùng để bypass filter.

**graph_refs**: `field:otp_code, validation_rule:otp_format, ui_screen:mh03_xac_thuc_otp`

### TC #78 — (tiếp theo TC trước — merge col C)

**D (Trường hợp)**: TH: KH paste OTP có khoảng trắng leading/trailing (vd ' 123456 ', '12 3456')

**E (Data test)**:
```
Input thử: [' 123456 ', '12 3456', '\t123456', '123456\n']
```

**F (Các bước)**:
1. KH login App, đến MH03
2. Copy chuỗi ' 123456 ' (có space đầu/cuối), paste vào input OTP
3. Quan sát: hệ thống trim hay reject
4. Thử paste '12 3456' (space ở giữa)
5. Thử paste có tab/newline
6. Nhấn Xác nhận (nếu enable) để check server response

**G (Kết quả mong muốn)**:
1. MH03 hiển thị, input OTP active
2. Paste ' 123456 ' - hệ thống nên trim space đầu cuối, hiển thị '123456'
3. Button Xác nhận enable (theo validation_rule:otp_format đủ 6 số)
4. Paste '12 3456' - space giữa bị strip, hiển thị '123456' hoặc reject toàn bộ; behavior phải nhất quán không tùy random
5. Tab/newline bị strip tương tự, không gây xuống dòng hay chuyển field
6. Nếu OTP đúng và trim/strip → server xử lý bình thường (verify OTP thành công); nếu reject → hiển thị thông báo OTP không hợp lệ, không submit request với payload chứa whitespace

**H/I**: MEDIUM / MAJOR

**Z (Notes)**: OWASP Mobile Top 10 - M7. Cần BA confirm behavior chuẩn: trim hay reject. SRS không quy định rõ.

**graph_refs**: `field:otp_code, validation_rule:otp_format, ui_screen:mh03_xac_thuc_otp`

### TC #79 — Kiểm tra input OTP unlock + countdown reset sau khi Gửi lại OTP thành công

**D (Trường hợp)**: TH: KH bấm "Gửi lại OTP" thành công sau popup sai OTP — input phải unlock, countdown reset về 300s, KH gõ được OTP mới

**F (Các bước)**:
1. Trigger flow: nhập sai OTP → popup → Đóng → input lock
2. Bấm button "Gửi lại OTP"
3. Đợi Server xử lý xong (Regenerate thành công)
4. Quan sát visual state của input OTP
5. Quan sát countdown
6. Tap vào input và gõ thử OTP mới
7. Bấm button Xác nhận

**G (Kết quả mong muốn)**:
1. State setup: input disabled, button Gửi lại highlight
2. App gửi request Regenerate, server gọi RegenerateAuthorizationCode
3. Server trả thành công, KH nhận SMS OTP mới
4. Input OTP UNLOCK: opacity bình thường, border xanh, focus được
5. Countdown reset về 300s, đếm xuống
6. Tap input → show keyboard → gõ được ký tự số (mỗi ký tự gõ xuất hiện đúng vị trí), button Xác nhận enable khi đủ 6 ký tự
7. Verify thành công nếu OTP đúng → chuyển sang MH04

**H/I**: HIGH / CRITICAL

**Z (Notes)**: Critical positive case — đảm bảo unlock hoạt động đúng. Nếu unlock fail sau resend → KH bị kẹt không thể nhập tiếp dù resend đã thành công.

**graph_refs**: `field:otp_code, field:countdown_otp, ui_screen:mh03_xac_thuc_otp, validation_rule:otp_max_3_resend_per_day`


## Màn hình 4 - Gửi đăng ký vay thành công

### TC #80 — Kiểm tra hiển thị màn hình chung MH04 - Gửi đăng ký vay thành công

**D (Trường hợp)**: TH: KH nhập đúng OTP và verify thành công, App điều hướng đến MH04

**F (Các bước)**:
1. Setup KH đến MH03, OTP hợp lệ (vd "123456")
2. Nhập đúng OTP, tap Xác nhận
3. Đợi server verify OTP thành công
4. Quan sát MH04 và các thành phần

**G (Kết quả mong muốn)**:
1. MH03 hiển thị, OTP sẵn sàng
2. App gửi verify OTP
3. Server trả thành công, update status=pending_underwritting, gửi SMS tiếp nhận
4. MH04 hiển thị đầy đủ: header tiêu đề; nội dung text+image thông báo gửi đăng ký vay thành công, khoản vay đang chờ duyệt; Button "Về trang chủ" enable

**H/I**: LOW / MINOR

**graph_refs**: `ui_screen:mh04_gui_dang_ky_vay_thanh_cong, flow_step:28_show_success, status:pending_underwritting`

### TC #81 — Kiểm tra hành vi button Về trang chủ trên MH04

**D (Trường hợp)**: TH: KH ở MH04, tap button "Về trang chủ"

**F (Các bước)**:
1. Setup KH đến MH04 (ký HĐ thành công)
2. Tap button "Về trang chủ"
3. Quan sát hành vi điều hướng

**G (Kết quả mong muốn)**:
1. MH04 hiển thị
2. App tiếp nhận tap
3. App điều hướng KH về Trang chủ ViettelPay (rời khỏi luồng ký HĐ, khoản vay đang ở trạng thái Chờ phê duyệt)

**H/I**: LOW / MINOR

**graph_refs**: `ui_screen:mh04_gui_dang_ky_vay_thanh_cong, status:pending_underwritting`

### TC #82 — Kiểm tra nội dung text + image của MH04

**D (Trường hợp)**: TH: KH ở MH04, quan sát nội dung thành công

**F (Các bước)**:
1. Setup KH đến MH04
2. Quan sát text title, text mô tả và image trên MH04
3. So sánh với Figma/mockup

**G (Kết quả mong muốn)**:
1. MH04 hiển thị
2. Text title, text mô tả nội dung thành công (khoản vay Chờ duyệt) và image minh họa hiển thị đúng Figma
3. Bố cục khớp design, đầy đủ icon/illustration

**H/I**: LOW / MINOR

**graph_refs**: `ui_screen:mh04_gui_dang_ky_vay_thanh_cong`


# Suite 1: Chức năng


## Kiểm tra điều kiện trước ký

### TC #83 — (tiếp theo TC trước — merge col C)

**D (Trường hợp)**: TH: KH vào luồng ký từ luồng Đăng ký vay - đi thẳng vào bước 12 (bỏ qua bước 2-11 do đã verify trong luồng đăng ký vay)

**F (Các bước)**:
1. KH thực hiện luồng Đăng ký vay mới hoàn tất (precheck/credit/ekyc/decision making đã pass trong luồng đó)
2. Quan sát điều hướng sau khi hoàn tất đăng ký vay
3. Kiểm tra Server Vay có gọi lại precheck/credit/ekyc không
4. Quan sát MH hiển thị

**G (Kết quả mong muốn)**:
1. Luồng Đăng ký vay hoàn tất, khoản vay được set status=pending_esigning
2. Hệ thống điều hướng KH thẳng vào MH01 "Hợp đồng của bạn" (không qua MH QLKV)
3. Server Vay đi thẳng vào bước 12 (fill thông tin HĐ), KHÔNG gọi lại các bước 2-11
4. MH01 hiển thị HĐ đã được fill thông tin KH theo template HDTD/GYCBH/Điều khoản BVDLCN

**H/I**: HIGH / MAJOR

**graph_refs**: `activity_flow:ky_hop_dong_vc_payday, flow_step:1_entry, flow_step:12_fill_contract, ui_screen:mh01_xem_hop_dong_truoc_ky`

### TC #84 — (tiếp theo TC trước — merge col C)

**D (Trường hợp)**: TH: KH đã có >= 1 lần kiểm tra điều kiện trong X ngày (bước 5 returns >=1) - bỏ qua re-check precheck/credit/fraud, đi thẳng tới ekyc

**F (Các bước)**:
1. Setup KH đã có lịch sử check điều kiện >= 1 lần trong X ngày gần nhất
2. KH vào MH QLKV, nhấn 'Ký hợp đồng'
3. Quan sát Server Vay có thực hiện re-check Precheck VDS/Credit/Fraud không
4. Quan sát bước tiếp theo của Server Vay

**G (Kết quả mong muốn)**:
1. KH có lịch sử check >= 1 trong X ngày được setup thành công
2. App điều hướng tới flow ký HĐ, Server Vay kiểm tra số lần check
3. Server Vay BỎ QUA bước 6 (re-check Precheck/Credit/Fraud)
4. Server Vay đi thẳng tới bước 11 (check ekyc 1 ảnh)

**H/I**: MEDIUM / MAJOR

**Z (Notes)**: Giá trị X ngày chưa được PO confirm (AMB-06) - TC chỉ verify hành vi nhánh

**graph_refs**: `business_rule:check_again_condition_x_days, flow_step:5_check_count_x_days, flow_step:11_ekyc_check`

### TC #85 — (tiếp theo TC trước — merge col C)

**D (Trường hợp)**: TH: KH có < 1 lần check trong X ngày - hệ thống thực hiện đầy đủ Precheck VDS/Credit/Fraud trước khi cho ký

**F (Các bước)**:
1. Setup KH chưa có lần check nào trong X ngày gần nhất (số lần = 0)
2. KH nhấn 'Ký hợp đồng' từ MH QLKV
3. Quan sát Server Vay thực hiện re-check
4. Quan sát bước kế tiếp

**G (Kết quả mong muốn)**:
1. Setup thành công, số lần check = 0
2. Hệ thống vào luồng ký
3. Server Vay thực hiện đầy đủ bước 6: Precheck VDS → Chấm credit → Chấm Fraud & Decision Making
4. Khi tất cả pass → chuyển sang bước 11 (check ekyc)

**H/I**: HIGH / MAJOR

**graph_refs**: `business_rule:check_again_condition_x_days, business_rule:precheck_vds, business_rule:credit_scoring, business_rule:fraud_decision_making, flow_step:6_recheck_conditions`

### TC #86 — (tiếp theo TC trước — merge col C)

**D (Trường hợp)**: TH: khoản vay từ pending_esigning sang reject + sub=pre_check_vds_fail khi precheck VDS fail

**E (Data test)**:
```
loan_status_before=pending_esigning; precheck VDS fail
```

**F (Các bước)**:
1. Khoản vay setup pending_esigning, KH có < 1 lần check trong X ngày
2. KH bấm Ký, Server Vay re-check Precheck VDS
3. Precheck VDS fail
4. Query status

**G (Kết quả mong muốn)**:
1. Khoản vay setup, KH chưa check
2. Server Vay thực hiện re-check Precheck VDS
3. Precheck fail → Server Vay update status
4. status=reject, sub=pre_check_vds_fail (đúng transition); App hiển thị màn hình lỗi 'Không có khoản vay phù hợp'

**H/I**: HIGH / CRITICAL

**Z (Notes)**: Cần BA confirm chi tiết MH lỗi và mã lỗi (AMB-04)

**graph_refs**: `status:pending_esigning, status:reject_pre_check_vds_fail, business_rule:precheck_vds`

### TC #87 — (tiếp theo TC trước — merge col C)

**D (Trường hợp)**: TH: khoản vay từ pending_esigning sang reject + sub=unsuitable_package_loan khi Credit chấm không thỏa gói offer

**E (Data test)**:
```
loan_status_before=pending_esigning; credit không thỏa gói
```

**F (Các bước)**:
1. Khoản vay setup pending_esigning, < 1 lần check
2. KH bấm Ký, Server Vay re-check Credit
3. Credit chấm thành công nhưng không thỏa gói đã offer
4. Query status

**G (Kết quả mong muốn)**:
1. Khoản vay setup
2. Server Vay thực hiện chấm Credit
3. Credit kết quả không thỏa offer → reject
4. status=reject, sub=unsuitable_package_loan

**H/I**: HIGH / CRITICAL

**Z (Notes)**: Cần BA confirm chi tiết MH hiển thị (AMB-04)

**graph_refs**: `status:pending_esigning, status:reject_unsuitable_package, business_rule:credit_scoring`

### TC #88 — (tiếp theo TC trước — merge col C)

**D (Trường hợp)**: TH: khoản vay từ pending_esigning sang reject + sub=reject_by_vds khi Fraud/Decision Making fail

**E (Data test)**:
```
loan_status_before=pending_esigning; fraud/decision fail
```

**F (Các bước)**:
1. Khoản vay setup pending_esigning, < 1 lần check
2. Server Vay re-check Fraud & Decision Making
3. Fraud/Decision Making không thỏa
4. Query status

**G (Kết quả mong muốn)**:
1. Khoản vay setup
2. Server Vay chấm Fraud + Decision Making
3. Kết quả không thỏa → reject
4. status=reject, sub=reject_by_vds

**H/I**: HIGH / CRITICAL

**Z (Notes)**: Cần BA confirm chi tiết MH lỗi (AMB-04)

**graph_refs**: `status:pending_esigning, status:reject_by_vds, business_rule:fraud_decision_making`

### TC #89 — (tiếp theo TC trước — merge col C)

**D (Trường hợp)**: TH: KH có >= 1 lần check + ekyc FM hợp lệ - hệ thống fill HĐ và hiển thị MH01

**F (Các bước)**:
1. Setup KH có >= 1 lần check trong X ngày
2. KH nhấn 'Ký hợp đồng' từ MH QLKV
3. Quan sát Server Vay check ekyc
4. Quan sát MH hiển thị sau khi fill HĐ thành công

**G (Kết quả mong muốn)**:
1. Setup thành công
2. Hệ thống điều hướng vào luồng ký
3. Server Vay check ekyc 1 ảnh, FM hợp lệ → bước 12 fill thông tin KH vào template HDTD/GYCBH/Điều khoản BVDLCN
4. App VTM hiển thị MH01 "Hợp đồng của bạn" với nội dung HĐ đã được fill

**H/I**: MEDIUM / MAJOR

**graph_refs**: `flow_step:5_check_count_x_days, flow_step:11_ekyc_check, flow_step:12_fill_contract, flow_step:13_show_view_contract, business_rule:ekyc_1_anh`

### TC #90 — Kiểm tra luồng eKYC FM fail tại bước 11 (Face Matching không hợp lệ) - kết thúc luồng ký

**D (Trường hợp)**: TH: KH bấm Ký HĐ. Server Vay gọi eKYC 1 ảnh để verify. eKYC FM trả kết quả không khớp (face matching fail). Server kết thúc luồng tại bước 12.1.

**E (Data test)**:
```
KH với ảnh eKYC đã lưu trong hệ thống nhưng face matching score thấp (< threshold)
```

**F (Các bước)**:
1. Setup KH có khoản vay pending_esigning, ảnh eKYC trong DB nhưng FM threshold không đạt
2. KH bấm "Ký hợp đồng" trên MH01
3. Server Vay khởi động luồng check, đến bước 11 gọi eKYC API
4. eKYC API trả kết quả FM fail (score < threshold)
5. Quan sát hành vi Server Vay và App

**G (Kết quả mong muốn)**:
1. Khoản vay setup, FM threshold không đạt
2. KH bấm Ký HĐ
3. Server Vay gọi eKYC 1 ảnh
4. Response trả FM fail (face matching không khớp)
5. Server Vay không tiếp tục bước 12 (fill HĐ), kết thúc luồng tại 12.1; App hiển thị màn lỗi tương ứng (MH lỗi eKYC — cần BA confirm màn cụ thể) hoặc về MH QLKV với thông báo eKYC fail

**H/I**: HIGH / CRITICAL

**Z (Notes)**: SRS §3.3 bước 11: "FM hợp lệ → bước 12; FM fail → 12.1 kết thúc". SRS không document chi tiết MH hiển thị ở 12.1 — cần BA confirm. Đây là eKYC pre-check, khác với eKYC fail trong Loanorder (P3 E5 reject_by_lender).

**graph_refs**: `business_rule:ekyc_1_anh, flow_step:11_ekyc_check`

### TC #91 — Kiểm tra eKYC FM hợp lệ tại bước 11 - flow tiếp tục bình thường tới bước 12

**D (Trường hợp)**: TH: Server Vay gọi eKYC 1 ảnh, FM trả kết quả hợp lệ (score >= threshold). Server tiếp tục bước 12 fill HĐ.

**E (Data test)**:
```
KH với ảnh eKYC FM score >= threshold (face matching pass)
```

**F (Các bước)**:
1. Setup KH có khoản vay pending_esigning, ảnh eKYC FM score đạt threshold
2. KH bấm "Ký hợp đồng"
3. Server đến bước 11 gọi eKYC
4. eKYC trả FM hợp lệ
5. Quan sát bước tiếp theo của Server

**G (Kết quả mong muốn)**:
1. Setup thành công
2. KH bấm Ký HĐ
3. Server gọi eKYC API
4. Response FM hợp lệ
5. Server tiếp tục bước 12 - lấy thông tin và fill 3 template HĐ; sau đó hiển thị MH01 với nội dung HĐ

**H/I**: HIGH / CRITICAL

**Z (Notes)**: Happy path eKYC pre-check. Verify Server không skip bước 12 ngay cả khi eKYC pass nhanh.

**graph_refs**: `business_rule:ekyc_1_anh, flow_step:11_ekyc_check, flow_step:12_fill_contract`

### TC #92 — Kiểm tra eKYC API lỗi hệ thống/timeout - xử lý phù hợp

**D (Trường hợp)**: TH: Server Vay gọi eKYC API nhưng API trả lỗi hệ thống / timeout / 5xx. Verify Server xử lý fallback.

**F (Các bước)**:
1. Mock eKYC API trả lỗi 500 / timeout / connection refused
2. KH bấm "Ký hợp đồng", Server đến bước 11
3. Server gọi eKYC, gặp lỗi
4. Quan sát hành vi Server: retry? popup? về QLKV?
5. Quan sát trạng thái khoản vay sau khi gặp lỗi

**G (Kết quả mong muốn)**:
1. Mock setup thành công
2. KH bấm Ký
3. Server gọi eKYC, gặp lỗi
4. Server PHẢI không kết luận sai (không reject KH oan, không fill HĐ trên dữ liệu eKYC chưa verify); cần retry (vd 2-3 lần) hoặc trả popup "Lỗi hệ thống, vui lòng thử lại" → về MH QLKV
5. Khoản vay giữ pending_esigning, KH có thể vào ký lại

**H/I**: HIGH / MAJOR

**Z (Notes)**: SRS không document explicit hành vi eKYC error (chỉ có "FM hợp lệ / FM fail"). Cần BA + dev confirm: retry strategy, timeout threshold, popup nội dung, có log lỗi server-side không.

**graph_refs**: `business_rule:ekyc_1_anh, flow_step:11_ekyc_check`

### TC #93 — Kiểm tra eKYC ảnh không đạt chất lượng - không thực hiện được FM, kết thúc luồng

**D (Trường hợp)**: TH: Ảnh eKYC của KH trong hệ thống không đạt tiêu chuẩn chất lượng để FM (mờ, thiếu sáng, không có khuôn mặt, nhiều khuôn mặt trong ảnh, resolution thấp, bị che mặt...). eKYC API trả lỗi quality, Server không thực hiện FM.

**E (Data test)**:
```
Mock các ảnh eKYC fail quality: [ảnh mờ, ảnh thiếu sáng, ảnh không có khuôn mặt, ảnh có 2+ khuôn mặt, ảnh resolution < threshold, ảnh che mặt (khẩu trang/kính râm dày)]
```

**F (Các bước)**:
1. Setup KH có khoản vay pending_esigning với ảnh eKYC chất lượng kém (lần lượt mock từng case quality fail)
2. KH bấm "Ký hợp đồng"
3. Server đến bước 11 gọi eKYC API
4. eKYC API kiểm tra ảnh trước FM → trả lỗi quality (vd: image_blurry / no_face_detected / multiple_faces / low_resolution / face_occluded)
5. Quan sát Server xử lý lỗi quality (khác với FM fail)

**G (Kết quả mong muốn)**:
1. Setup từng case quality fail thành công
2. KH bấm Ký HĐ
3. Server gọi eKYC
4. API phát hiện quality fail trước FM, trả mã lỗi tương ứng
5. Server KHÔNG kết luận FM (vì không thực hiện được), kết thúc luồng tại 12.1; App hiển thị thông báo yêu cầu KH cập nhật lại ảnh eKYC (chụp lại CCCD/selfie); KH được hướng dẫn quay lại luồng cập nhật eKYC trước khi ký lại

**H/I**: HIGH / MAJOR

**Z (Notes)**: Quality fail khác FM fail: quality fail = không đánh giá được, FM fail = đánh giá xong và không khớp. SRS không document chi tiết hành vi khi quality fail — cần BA confirm: có hiển thị thông báo cụ thể không, có gửi KH sang luồng update eKYC không.

**graph_refs**: `business_rule:ekyc_1_anh, flow_step:11_ekyc_check`

### TC #94 — Kiểm tra eKYC quá số lần verify trong ngày - bị block, không cho gọi eKYC tiếp

**D (Trường hợp)**: TH: KH có lịch sử N lần verify eKYC trong 24h gần nhất, đã đạt threshold (giả định 5 lần/ngày — cần BA confirm). KH thực hiện thao tác Ký HĐ lần thứ N+1.

**E (Data test)**:
```
Setup KH có lịch sử N lần verify eKYC trong 24h gần nhất; threshold giả định = 5 lần/ngày (cần BA confirm con số chính xác)
```

**F (Các bước)**:
1. Setup KH với lịch sử eKYC verify đã đạt threshold (vd 5 lần/24h)
2. KH bấm "Ký hợp đồng" lần thứ N+1
3. Server đến bước 11 chuẩn bị gọi eKYC API
4. Quan sát: Server có check rate limit trước khi gọi không
5. Verify response và hành vi tiếp theo

**G (Kết quả mong muốn)**:
1. Setup đạt threshold
2. KH bấm Ký lần N+1
3. Server kiểm tra rate limit
4. Server PHẢI từ chối gọi eKYC API (tránh DDoS đối tác eKYC), trả về luôn lỗi rate-limit
5. App hiển thị thông báo "Bạn đã thực hiện xác thực eKYC quá số lần cho phép. Vui lòng quay lại sau X giờ" (text TBD theo BA); KH về MH QLKV, khoản vay giữ pending_esigning, không cho ký trong khoảng cooldown

**H/I**: HIGH / MAJOR

**Z (Notes)**: SRS không document explicit về rate limit eKYC (chỉ có bước 5 "X ngày" cho re-check). Rate limit eKYC độc lập với rate limit ký HĐ. Cần BA confirm: threshold cụ thể, cooldown duration, scope (per-KH / per-CCCD / per-device), nội dung message hiển thị.

**graph_refs**: `business_rule:ekyc_1_anh, flow_step:11_ekyc_check`


## Kiểm tra hợp đồng

### TC #95 — Kiểm tra fill 3 template HĐ từ thông tin KH

**D (Trường hợp)**: TH: Server Vay fill HĐ tín dụng (template HDTD_TINVAY_PAYDAY_VTMN.docx) - Mục A + Mục B với contract_code và thông tin KH

**E (Data test)**:
```
contract_code="HD2026051800001"; loan_contract_consumer="LCC2026051800001"; thoi_han_vay=180; so_tien_de_nghi_vay=10000000
```

**F (Các bước)**:
1. Setup khoản vay với contract_code và loan_contract_consumer cụ thể
2. KH vào luồng ký HĐ tới bước 12 (Server Vay fill)
3. Vào MH01 - chọn Tab "HĐ Tín dụng"
4. Verify nội dung HĐ tín dụng được fill

**G (Kết quả mong muốn)**:
1. Khoản vay được setup với contract_code và loan_contract_consumer
2. Server Vay sử dụng template HDTD_TINVAY_PAYDAY_VTMN.docx, fill thông tin KH
3. MH01 Tab "HĐ Tín dụng" hiển thị nội dung HĐTD đã render
4. Mục A và Mục B của HĐTD có dữ liệu contract_code = "HD2026051800001", thông tin KH (họ tên, CCCD, SĐT), thời hạn vay 180 ngày, số tiền 10.000.000 VND đúng giá trị setup

**H/I**: HIGH / CRITICAL

**graph_refs**: `field:contract_code, field:loan_contract_consumer, field:thoi_han_vay, field:so_tien_de_nghi_vay, flow_step:12_fill_contract`

### TC #96 — (tiếp theo TC trước — merge col C)

**D (Trường hợp)**: TH: Server Vay fill Giấy yêu cầu bảo hiểm (FORM_GYCBH.docx) - Mục I, II, III với SĐT/HĐ tín dụng số/người thụ hưởng

**E (Data test)**:
```
loan_contract_consumer="LCC2026051800001"; so_dien_thoai="0987654321"; nguoi_thu_huong="<<PO confirm>>"
```

**F (Các bước)**:
1. Khoản vay setup với loan_contract_consumer, SĐT cụ thể
2. Vào luồng ký tới bước 12
3. Trong MH01, chọn Tab "Yêu cầu BH"
4. Verify nội dung GYCBH

**G (Kết quả mong muốn)**:
1. Khoản vay được setup
2. Server Vay sử dụng template FORM_GYCBH.docx fill thông tin
3. Tab "Yêu cầu BH" hiển thị nội dung GYCBH đã render
4. Mục I (thông tin KH), Mục II (loan_contract_consumer = "LCC2026051800001", SĐT = "0987654321"), Mục III (Người thụ hưởng đầu tiên - giá trị từ PO confirm) hiển thị đúng

**H/I**: HIGH / MAJOR

**Z (Notes)**: Tên công ty tài chính (người thụ hưởng) chưa PO confirm (AMB-11). TC verify cấu trúc fill, không assert literal text

**graph_refs**: `field:loan_contract_consumer, field:so_dien_thoai, field:nguoi_thu_huong, flow_step:12_fill_contract`

### TC #97 — (tiếp theo TC trước — merge col C)

**D (Trường hợp)**: TH: Server Vay fill Điều khoản BVDLCN từ template - hiển thị qua Textlink trên MH01

**F (Các bước)**:
1. Khoản vay tới bước 12 (fill xong)
2. Vào MH01
3. Nhấn Tab "Điều khoản CTS" (BVDLCN)
4. Verify nội dung hiển thị

**G (Kết quả mong muốn)**:
1. Khoản vay đã fill
2. MH01 hiển thị với 2 tab + textlink điều khoản BVDLCN
3. App điều hướng tới MH/popup hiển thị nội dung điều khoản BVDLCN
4. Nội dung điều khoản BVDLCN được render từ template, có dữ liệu KH (họ tên, CCCD) chèn vào đúng vị trí

**H/I**: MEDIUM / MAJOR

**Z (Notes)**: AMB-20: cột Bắt buộc/Mặc định của Textlink Điều khoản trống — TC verify hành vi link mở nội dung

**graph_refs**: `flow_step:12_fill_contract, ui_screen:mh01_xem_hop_dong_truoc_ky`

### TC #98 — (tiếp theo TC trước — merge col C)

**D (Trường hợp)**: TH: so_tien_de_nghi_vay là tổng số tiền vay tiêu dùng + vay bảo hiểm (không bao gồm lãi) - verify giá trị fill

**E (Data test)**:
```
so_tien_vay_tieu_dung=8000000; so_tien_bao_hiem=2000000; so_tien_de_nghi_vay_expected=10000000 (KHÔNG bao gồm lãi)
```

**F (Các bước)**:
1. Setup khoản vay: vay tiêu dùng 8.000.000 VND + vay bảo hiểm 2.000.000 VND
2. Vào luồng ký, tới bước 12
3. Vào Tab "HĐ Tín dụng" trên MH01
4. Verify so_tien_de_nghi_vay được fill

**G (Kết quả mong muốn)**:
1. Khoản vay setup tổng vay 10.000.000
2. Server Vay fill HĐTD
3. Tab "HĐ Tín dụng" hiển thị nội dung
4. so_tien_de_nghi_vay được fill = 10.000.000 VND (tổng tiêu dùng + bảo hiểm, không gồm lãi vay)

**H/I**: HIGH / MAJOR

**graph_refs**: `field:so_tien_de_nghi_vay, field:so_tien_bao_hiem, flow_step:12_fill_contract`

### TC #99 — (tiếp theo TC trước — merge col C)

**D (Trường hợp)**: TH: thoi_han_vay đơn vị ngày - fill đúng vào HĐTD và GYCBH

**E (Data test)**:
```
thoi_han_vay=180 ngày
```

**F (Các bước)**:
1. Setup khoản vay thoi_han_vay=180 ngày
2. Vào MH01 Tab "HĐ Tín dụng" - kiểm tra thoi_han_vay
3. Vào Tab "Yêu cầu BH" - kiểm tra thoi_han_vay

**G (Kết quả mong muốn)**:
1. Khoản vay setup 180 ngày
2. HĐ tín dụng hiển thị thời hạn vay = 180 ngày (đúng đơn vị ngày)
3. GYCBH hiển thị thời hạn vay = 180 ngày (đồng bộ với HĐTD)

**H/I**: HIGH / MAJOR

**graph_refs**: `field:thoi_han_vay, flow_step:12_fill_contract`

### TC #100 — (tiếp theo TC trước — merge col C)

**D (Trường hợp)**: TH: thoi_han_bao_hiem = min = thời hạn vay (boundary dưới)

**E (Data test)**:
```
thoi_han_vay=12 tháng (~360 ngày); thoi_han_bao_hiem=12 tháng (= min)
```

**F (Các bước)**:
1. Setup khoản vay thoi_han_vay = 12 tháng, KH chọn thoi_han_bao_hiem = 12 tháng
2. Vào bước 12, kiểm tra fill
3. Vào MH01 Tab "Yêu cầu BH"

**G (Kết quả mong muốn)**:
1. Khoản vay setup 12 tháng vay, 12 tháng BH
2. Server Vay fill GYCBH
3. Tab "Yêu cầu BH" hiển thị thoi_han_bao_hiem = 12 tháng (= min = thoi_han_vay), hệ thống chấp nhận giá trị min

**H/I**: HIGH / MAJOR

**graph_refs**: `field:thoi_han_bao_hiem, field:thoi_han_vay`

### TC #101 — (tiếp theo TC trước — merge col C)

**D (Trường hợp)**: TH: thoi_han_bao_hiem = 48 tháng (= max boundary)

**E (Data test)**:
```
thoi_han_vay=12 tháng; thoi_han_bao_hiem=48 tháng (= max)
```

**F (Các bước)**:
1. Setup khoản vay thoi_han_vay = 12 tháng, thoi_han_bao_hiem = 48 tháng
2. Vào bước 12
3. Vào MH01 Tab "Yêu cầu BH"

**G (Kết quả mong muốn)**:
1. Setup thành công
2. Server Vay fill
3. Tab "Yêu cầu BH" hiển thị thoi_han_bao_hiem = 48 tháng (= max), hệ thống chấp nhận biên trên

**H/I**: HIGH / MAJOR

**graph_refs**: `field:thoi_han_bao_hiem`

### TC #102 — (tiếp theo TC trước — merge col C)

**D (Trường hợp)**: TH: so_tien_bao_hiem phải >= số tiền vay/người/HĐ bảo hiểm (constraint min)

**E (Data test)**:
```
so_tien_vay_per_HDBH=2000000; so_tien_bao_hiem_test=2000000 (= min)
```

**F (Các bước)**:
1. Setup khoản vay với số tiền vay/người/HĐBH = 2.000.000 VND, KH yêu cầu so_tien_bao_hiem = 2.000.000
2. Vào bước 12
3. Vào Tab "Yêu cầu BH" trên MH01

**G (Kết quả mong muốn)**:
1. Setup thành công
2. Server Vay fill GYCBH
3. Tab "Yêu cầu BH" hiển thị so_tien_bao_hiem = 2.000.000 VND, đáp ứng constraint tối thiểu, hệ thống chấp nhận

**H/I**: MEDIUM / MAJOR

**Z (Notes)**: Tên sản phẩm bảo hiểm chưa PO confirm (AMB-12)

**graph_refs**: `field:so_tien_bao_hiem, field:so_tien_de_nghi_vay`


## Kiểm tra yêu cầu ký lần đầu

### TC #103 — Kiểm tra request đầu vào API Loanorder (lần đầu gen CTS + OTP)

**D (Trường hợp)**: TH: Server Vay gọi API Loanorder sang Lender để gen chứng từ số và OTP đầu tiên. Verify request payload có đủ thông tin theo nghiệp vụ.

**E (Data test)**:
```
KH với khoản vay pending_esigning chưa từng gen OTP, SĐT="0987654321", contract_code, thông tin KH đã verify từ eKYC
```

**F (Các bước)**:
1. KH bấm "Ký hợp đồng" → bấm "Đồng ý và ký HĐ" trên popup Cảnh giác → Server Vay gửi request Loanorder
2. Capture request payload Server Vay → Lender
3. Verify payload chứa các thông tin cần để Lender:
   - Sinh chứng từ số (CTS): thông tin định danh + ký hiệu CTS
   - Sinh OTP: SĐT để gửi OTP
   - Xác định khoản vay: contract_code, loan_contract_consumer
4. Verify format payload (JSON/SOAP — theo DD)

**G (Kết quả mong muốn)**:
1. Server Vay khởi tạo request Loanorder
2. Capture được request
3. Request có đủ: thông tin định danh KH (CCCD, họ tên, ngày sinh); thông tin liên hệ (SĐT để gửi OTP); thông tin khoản vay (contract_code, loan_contract_consumer, số tiền, thời hạn); thông tin verify eKYC (CTS reference, ảnh)
4. Payload đúng format chuẩn của Lender; signature/auth header đúng; timestamp request không quá cũ

**H/I**: HIGH / CRITICAL

**Z (Notes)**: SRS chỉ tên API Loanorder, không có method/path/schema — cần DD confirm. TC verify ở mức nghiệp vụ. Bảo mật: payload không leak thông tin nhạy cảm ngoài phạm vi cần thiết.

**graph_refs**: `business_rule:loanorder_vs_regenerate, flow_step:16_choose_api, field:so_dien_thoai, field:contract_code`

### TC #104 — Kiểm tra response từ Loanorder và Server Vay xử lý đúng các nhánh thành công/lỗi

**D (Trường hợp)**: TH: Server Vay nhận response từ Loanorder. Verify xử lý các nhánh: thành công (update pending_esigning + cert_success) / lỗi dữ liệu (send_failed) / lỗi eKYC/CTS (reject_by_lender) / lỗi hệ thống / timeout đối tác đã/chưa nhận mã.

**F (Các bước)**:
1. Mock Lender trả response thành công → Server Vay xử lý → update status
2. Mock trả lỗi dữ liệu → Server Vay update reject + sub=send_failed
3. Mock trả lỗi eKYC/CTS → Server Vay update reject + sub=reject_by_lender → App hiển thị MH 2.1
4. Mock trả lỗi hệ thống/timeout → Server Vay giữ pending_esigning + popup lỗi
5. Mock timeout với đối tác đã nhận mã (gọi lại Loanorder → "khoản vay đã tồn tại") → Lender chuyển sang gọi RegenerateAuthorizationCode
6. Mock timeout với đối tác chưa nhận mã → retry Loanorder thành công

**G (Kết quả mong muốn)**:
1. Response thành công → status=pending_esigning + cert_success, App điều hướng MH03 OTP
2. Lỗi dữ liệu → status=reject + sub=send_failed → MH05 hiển thị
3. Lỗi eKYC/CTS → status=reject + sub=reject_by_lender → MH 2.1 hiển thị
4. Lỗi hệ thống → giữ pending_esigning, popup "Lỗi hệ thống" → KH có thể ký lại
5. Timeout đối tác đã nhận mã → tự động chuyển sang Regenerate, KH thấy OTP gửi mới
6. Timeout đối tác chưa nhận → retry Loanorder thành công, OTP gửi sau retry

**H/I**: HIGH / CRITICAL

**Z (Notes)**: SRS §5 bảng mã lỗi đối tác trống — không có code cụ thể để map. Verify Server Vay xử lý đúng hành vi mỗi nhánh response. Mã lỗi cần BA confirm sau.

**graph_refs**: `business_rule:loanorder_vs_regenerate, flow_step:18_check_result, status:pending_esigning_cert_success, status:reject_send_failed, status:reject_by_lender`

### TC #105 — (tiếp theo TC trước — merge col C)

**D (Trường hợp)**: TH: Loanorder timeout - đối tác đã nhận mã (Lender báo 'khoản vay đã tồn tại') - hệ thống gọi RegenerateAuthorizationCode để gửi OTP

**F (Các bước)**:
1. Setup môi trường để Server Vay gọi Loanorder lần đầu nhưng timeout
2. Quan sát Server Vay gọi lại Loanorder (retry)
3. Đối tác trả về thông báo 'khoản vay đã tồn tại'
4. Quan sát Server Vay xử lý tiếp
5. Quan sát MH hiển thị cho KH

**G (Kết quả mong muốn)**:
1. Setup timeout thành công
2. Server Vay retry gọi Loanorder
3. Đối tác nhận biết khoản vay đã tồn tại → trả về mã báo trùng
4. Server Vay chuyển sang gọi RegenerateAuthorizationCode để xin OTP mới
5. App VTM hiển thị MH03 Xác thực OTP, KH nhận OTP qua SMS

**H/I**: HIGH / MAJOR

**Z (Notes)**: Cần BA confirm mã lỗi đối tác báo 'khoản vay đã tồn tại' (AMB-04)

**graph_refs**: `flow_step:18_check_result, business_rule:loanorder_vs_regenerate, ui_screen:mh03_xac_thuc_otp`

### TC #106 — (tiếp theo TC trước — merge col C)

**D (Trường hợp)**: TH: Loanorder timeout - đối tác CHƯA nhận mã - hệ thống retry Loanorder thành công

**F (Các bước)**:
1. Setup Loanorder lần đầu timeout, Lender chưa nhận được mã
2. Quan sát Server Vay retry Loanorder
3. Đối tác trả về thành công cho lần retry
4. Quan sát MH cho KH

**G (Kết quả mong muốn)**:
1. Setup timeout thành công
2. Server Vay retry gọi Loanorder lần 2
3. Đối tác xử lý lần retry và trả về thành công, sinh OTP gửi KH
4. App VTM tiếp tục luồng bình thường, hiển thị MH03 Xác thực OTP

**H/I**: MEDIUM / MAJOR

**Z (Notes)**: Cần BA confirm cơ chế xác định 'đối tác chưa nhận mã' (AMB-04)

**graph_refs**: `flow_step:18_check_result, ui_screen:mh03_xac_thuc_otp`

### TC #107 — (tiếp theo TC trước — merge col C)

**D (Trường hợp)**: TH: Server Vay gọi Loanorder, đối tác trả lỗi tạo CTS do eKYC không hợp lệ

**F (Các bước)**:
1. Setup KH có ekyc không hợp lệ
2. Vào MH01, nhấn 'Ký hợp đồng'
3. Server Vay xử lý tạo CTS, lỗi do ekyc fail
4. Quan sát MH hiển thị
5. Quan sát button 'Trải nghiệm sản phẩm khác' và 'Về trang chủ'

**G (Kết quả mong muốn)**:
1. KH có ekyc fail được setup
2. App điều hướng vào luồng ký
3. Server Vay gọi Loanorder, đối tác trả lỗi ekyc/CTS → status=reject, sub=reject_by_lender
4. App VTM hiển thị MH 2.1 'Khoản vay bị từ chối' với nội dung text+image
5. Button 'Trải nghiệm sản phẩm khác' và 'Về trang chủ' Enable

**H/I**: HIGH / CRITICAL

**Z (Notes)**: Cần BA confirm mã lỗi cụ thể CTS fail ekyc (AMB-04)

**graph_refs**: `status:reject_by_lender, ui_screen:mh02_1_khoan_vay_tu_choi, business_rule:ekyc_1_anh, flow_step:18_check_result`

### TC #108 — (tiếp theo TC trước — merge col C)

**D (Trường hợp)**: TH: Server Vay gọi Loanorder, đối tác trả lỗi hệ thống khi tạo CTS

**F (Các bước)**:
1. Setup môi trường để đối tác trả lỗi hệ thống khi tạo CTS
2. Vào MH01, nhấn 'Ký hợp đồng'
3. Server Vay nhận lỗi từ đối tác
4. Quan sát MH hiển thị
5. Kiểm tra button 'Về trang chủ'

**G (Kết quả mong muốn)**:
1. Setup đối tác lỗi thành công
2. App điều hướng vào luồng ký
3. Server Vay nhận response lỗi hệ thống (không phải ekyc)
4. App VTM hiển thị MH 2.2 'CTS lỗi hệ thống' với text+image
5. Button 'Về trang chủ' hiển thị Enable

**H/I**: MEDIUM / MAJOR

**Z (Notes)**: Cần BA confirm mã lỗi đối tác (AMB-04)

**graph_refs**: `ui_screen:mh02_2_cts_loi_he_thong, flow_step:18_check_result`

### TC #109 — (tiếp theo TC trước — merge col C)

**D (Trường hợp)**: TH: Server Vay gọi Loanorder, request tạo CTS bị timeout

**F (Các bước)**:
1. Setup môi trường để Server Vay timeout khi gọi tạo CTS
2. Vào MH01, nhấn 'Ký hợp đồng'
3. Đợi timeout
4. Quan sát MH hiển thị
5. Nhấn button 'Đóng' trên MH 2.3

**G (Kết quả mong muốn)**:
1. Setup timeout thành công
2. Server Vay gọi tạo CTS bị timeout
3. Server Vay giữ khoản vay ở status=pending_esigning (cho ký lại sau)
4. App VTM hiển thị MH 2.3 'CTS bị timeout' với button 'Đóng'
5. Nhấn 'Đóng' đưa KH quay về MH01 "Hợp đồng của bạn" (giữ lại MH HĐ để ký lại)

**H/I**: MEDIUM / MAJOR

**Z (Notes)**: Cần BA confirm timeout threshold (AMB-04, AMB-06)

**graph_refs**: `ui_screen:mh02_3_cts_timeout, status:pending_esigning, flow_step:18_check_result`

### TC #110 — (tiếp theo TC trước — merge col C)

**D (Trường hợp)**: TH: Server Vay gọi Loanorder, đối tác trả lỗi dữ liệu đầu vào không hợp lệ

**F (Các bước)**:
1. Setup data khoản vay không hợp lệ (đối tác sẽ reject vì dữ liệu)
2. Vào MH01, nhấn 'Ký hợp đồng'
3. Server Vay gọi Loanorder, đối tác trả lỗi dữ liệu
4. Quan sát status update
5. Quan sát MH hiển thị

**G (Kết quả mong muốn)**:
1. Setup khoản vay dữ liệu invalid
2. App điều hướng vào luồng ký
3. Server Vay gọi Loanorder → đối tác từ chối do data
4. Server Vay update status=reject, sub=send_failed
5. App VTM hiển thị MH 05 'Gửi hồ sơ vay không thành công' với 2 button 'Trải nghiệm sản phẩm khác' và 'Về trang chủ'

**H/I**: HIGH / CRITICAL

**Z (Notes)**: Cần BA confirm mã lỗi data invalid từ đối tác (AMB-04)

**graph_refs**: `status:reject_send_failed, ui_screen:mh05_gui_ho_so_vay_khong_thanh_cong, flow_step:18_check_result`

### TC #111 — (tiếp theo TC trước — merge col C)

**D (Trường hợp)**: TH: Server Vay gọi Loanorder, đối tác trả lỗi eKYC/CTS sau khi tạo

**F (Các bước)**:
1. Setup đối tác trả lỗi ekyc/CTS
2. Vào MH01, nhấn 'Ký hợp đồng'
3. Server Vay gọi Loanorder, đối tác reject_by_lender
4. Quan sát status update
5. Quan sát MH hiển thị

**G (Kết quả mong muốn)**:
1. Setup thành công
2. App điều hướng vào luồng ký
3. Server Vay gọi Loanorder, đối tác trả về lỗi ekyc/CTS
4. Server Vay update status=reject, sub=reject_by_lender
5. App VTM hiển thị MH 2.1 'Khoản vay bị từ chối' với 2 button

**H/I**: HIGH / CRITICAL

**Z (Notes)**: Cần BA confirm mã lỗi đối tác (AMB-04)

**graph_refs**: `status:reject_by_lender, ui_screen:mh02_1_khoan_vay_tu_choi, flow_step:18_check_result`

### TC #112 — (tiếp theo TC trước — merge col C)

**D (Trường hợp)**: TH: Loanorder/Regenerate lỗi hệ thống hoặc timeout - giữ status=pending_esigning, hiển thị popup Lỗi hệ thống

**F (Các bước)**:
1. Setup môi trường để đối tác trả lỗi hệ thống (5xx) khi gọi Loanorder
2. Vào MH01, nhấn 'Ký hợp đồng'
3. Server Vay nhận lỗi hệ thống
4. Quan sát status và popup
5. Nhấn 'Đóng' trên popup

**G (Kết quả mong muốn)**:
1. Setup lỗi hệ thống thành công
2. App điều hướng vào luồng ký
3. Server Vay gọi Loanorder gặp lỗi hệ thống/timeout
4. Server Vay GIỮ status=pending_esigning (không reject) + popup 'Lỗi hệ thống' hiển thị
5. Nhấn 'Đóng' đưa KH về MH QLKV, khoản vay vẫn ở 'Chờ ký' để có thể vào ký lại

**H/I**: HIGH / MAJOR

**Z (Notes)**: Cần BA confirm nội dung popup lỗi hệ thống và mã lỗi (AMB-04)

**graph_refs**: `status:pending_esigning, flow_step:18_check_result`

### TC #113 — Kiểm tra quyết định gọi Loanorder vs RegenerateAuthorizationCode

**D (Trường hợp)**: TH: DT bước 16 - 2 nhánh: (a) khoản vay chưa từng gen OTP - hệ thống gọi Loanorder; (b) khoản vay đã có pending_esigning + sub=cert_success - hệ thống gọi RegenerateAuthorizationCode

**E (Data test)**:
```
(a) loan_status=pending_esigning, sub=null; (b) loan_status=pending_esigning, sub=cert_success
```

**F (Các bước)**:
1. Setup nhánh (a): khoản vay status=pending_esigning, sub=null (chưa gen OTP lần nào)
2. KH bấm 'Ký hợp đồng' trên MH01 → quan sát API Server Vay gọi
3. Setup nhánh (b): khoản vay status=pending_esigning, sub=cert_success (đã gen OTP trước đó, đã có CTS)
4. KH vào lại MH01 và bấm 'Ký hợp đồng' → quan sát API Server Vay gọi
5. So sánh kết quả 2 nhánh

**G (Kết quả mong muốn)**:
1. Khoản vay nhánh (a) được setup ở status pending_esigning, sub=null
2. Server Vay quyết định gọi API Loanorder (vì chưa từng gen OTP) → đối tác sinh CTS + OTP lần đầu
3. Khoản vay nhánh (b) được setup ở status pending_esigning + cert_success
4. Server Vay quyết định gọi API RegenerateAuthorizationCode (vì đã có cert_success) → đối tác sinh OTP mới với CTS cũ
5. 2 nhánh dẫn tới đúng API tương ứng theo business rule, không bị hoán đổi

**H/I**: HIGH / CRITICAL

**graph_refs**: `business_rule:loanorder_vs_regenerate, status:pending_esigning, status:pending_esigning_cert_success, flow_step:16_choose_api`

### TC #114 — (tiếp theo TC trước — merge col C)

**D (Trường hợp)**: TH: khoản vay từ pending_esigning sang reject + sub=send_failed khi Loanorder trả lỗi dữ liệu không hợp lệ

**E (Data test)**:
```
loan_status_before=pending_esigning; loanorder data invalid
```

**F (Các bước)**:
1. Khoản vay setup pending_esigning
2. KH bấm Ký, Server Vay gọi Loanorder với data invalid
3. Đối tác trả lỗi data
4. Query status

**G (Kết quả mong muốn)**:
1. Khoản vay setup
2. Server Vay gọi Loanorder
3. Đối tác từ chối vì data invalid
4. status=reject, sub=send_failed; App hiển thị MH 05

**H/I**: HIGH / CRITICAL

**Z (Notes)**: Cần BA confirm mã lỗi data invalid (AMB-04)

**graph_refs**: `status:pending_esigning, status:reject_send_failed, ui_screen:mh05_gui_ho_so_vay_khong_thanh_cong`

### TC #115 — (tiếp theo TC trước — merge col C)

**D (Trường hợp)**: TH: khoản vay từ pending_esigning sang reject + sub=reject_by_lender khi Loanorder trả ekyc/CTS fail

**E (Data test)**:
```
loan_status_before=pending_esigning; loanorder ekyc fail
```

**F (Các bước)**:
1. Khoản vay setup pending_esigning
2. KH bấm Ký, Server Vay gọi Loanorder
3. Đối tác trả ekyc/CTS fail
4. Query status

**G (Kết quả mong muốn)**:
1. Khoản vay setup
2. Server Vay gọi Loanorder
3. Đối tác trả lỗi ekyc/CTS
4. status=reject, sub=reject_by_lender; App hiển thị MH 2.1

**H/I**: HIGH / CRITICAL

**Z (Notes)**: Cần BA confirm mã lỗi ekyc/CTS từ đối tác (AMB-04)

**graph_refs**: `status:pending_esigning, status:reject_by_lender, ui_screen:mh02_1_khoan_vay_tu_choi`

### TC #116 — (tiếp theo TC trước — merge col C)

**D (Trường hợp)**: TH: pending_esigning được GIỮ NGUYÊN khi Loanorder timeout/lỗi hệ thống (không reject, cho ký lại)

**E (Data test)**:
```
loan_status_before=pending_esigning; loanorder timeout
```

**F (Các bước)**:
1. Khoản vay setup pending_esigning
2. KH bấm Ký, Server Vay gọi Loanorder bị timeout / 5xx
3. Quan sát behavior Server Vay
4. Query status sau khi popup lỗi hiển thị

**G (Kết quả mong muốn)**:
1. Khoản vay setup
2. Server Vay gặp lỗi hệ thống/timeout khi gọi Loanorder
3. Server Vay không update reject, giữ nguyên pending_esigning; App hiển thị popup 'Lỗi hệ thống'
4. status=pending_esigning (không thay đổi), KH có thể đóng popup về QLKV và vào ký lại

**H/I**: HIGH / CRITICAL

**Z (Notes)**: Cần BA confirm popup nội dung lỗi hệ thống và mã lỗi (AMB-04)

**graph_refs**: `status:pending_esigning, flow_step:18_check_result`


## Kiểm tra gửi lại OTP

### TC #117 — Kiểm tra request đầu vào API RegenerateAuthorizationCode (sinh lại OTP)

**D (Trường hợp)**: TH: Server Vay gọi API RegenerateAuthorizationCode khi KH bấm "Gửi lại OTP" hoặc khi đã có cert_success từ trước. Verify payload chứa reference đúng tới CTS/loan đã tạo.

**E (Data test)**:
```
Khoản vay đã có cert_success từ Loanorder trước đó; cert_id và contract_code có sẵn
```

**F (Các bước)**:
1. Trigger flow: KH ở MH03 bấm "Gửi lại OTP" hoặc khoản vay đã có cert_success quay lại ký
2. Capture request Server Vay → Lender
3. Verify request chứa: reference tới CTS đã tạo (cert_id / chứng từ số ID), contract_code, SĐT (để gửi OTP mới)
4. Verify request KHÔNG cần lại đầy đủ thông tin định danh + eKYC (đã có ở Loanorder trước)

**G (Kết quả mong muốn)**:
1. Trigger thành công
2. Capture request
3. Request chứa cert_id/CTS reference, contract_code, SĐT — đủ để Lender xác định khoản vay nào cần gen OTP
4. Payload gọn hơn Loanorder (không cần lại thông tin định danh đầy đủ) — performance và đỡ leak data

**H/I**: HIGH / MAJOR

**Z (Notes)**: API RegenerateAuthorizationCode (a.k.a. regenerateAuthenticationCode trong SRS) chỉ tên trong SRS, schema cần DD. Verify reuse cert đã tạo, không gen CTS mới.

**graph_refs**: `business_rule:loanorder_vs_regenerate, validation_rule:otp_max_3_resend_per_day, ui_screen:mh03_xac_thuc_otp, status:pending_esigning_cert_success`

### TC #118 — Kiểm tra response từ RegenerateAuthorizationCode và Server Vay xử lý các nhánh

**D (Trường hợp)**: TH: Server Vay nhận response từ Regenerate. Verify xử lý nhánh thành công (countdown reset, OTP mới về SMS) / HĐ đã ký / OTP gửi quá gần / quá số lượt OTP/ngày / lỗi hệ thống.

**F (Các bước)**:
1. Mock response thành công → Server Vay reset countdown 300s, OTP mới gửi qua SMS
2. Mock response "HĐ đã ký" → popup HĐ đã ký, về QLKV trạng thái Chờ phê duyệt
3. Mock response "gửi OTP quá gần" → popup nội dung tương ứng (PO confirm), Đóng về QLKV trạng thái Chờ ký
4. Mock response "quá số lượt OTP/ngày" → status=reject + sub=reject_by_lender, block 24h vay mới
5. Mock response lỗi hệ thống/timeout → popup "Lỗi hệ thống", giữ pending_esigning

**G (Kết quả mong muốn)**:
1. Thành công → countdown reset, input OTP unlock (nếu lock từ wrong-OTP trước), SMS OTP mới
2. HĐ đã ký → popup hiển thị nội dung đúng → bấm Đóng về QLKV Chờ phê duyệt
3. OTP quá gần → popup hiển thị (nội dung TBD theo PO), bấm Đóng về QLKV
4. Quá lượt OTP → reject + reject_by_lender → block 24h enforce server-side (không cho đăng ký vay mới trong 24h)
5. Lỗi hệ thống → giữ pending_esigning, popup Lỗi hệ thống → KH có thể vào lại ký

**H/I**: HIGH / CRITICAL

**Z (Notes)**: Verify enforcement block 24h ở server side, không phải client. Verify nội dung popup OTP quá gần đợi PO confirm.

**graph_refs**: `validation_rule:otp_max_3_resend_per_day, business_rule:block_new_loan_after_cancel_24h, status:reject_by_lender`

### TC #119 — (tiếp theo TC trước — merge col C)

**D (Trường hợp)**: TH: KH nhấn 'Gửi lại OTP' sau khi countdown 300s hết - hệ thống gọi RegenerateAuthorizationCode thành công

**F (Các bước)**:
1. Vào MH03 Xác thực OTP, đợi 300s đến khi icon countdown đổi thành button 'Gửi lại OTP'
2. Nhấn button 'Gửi lại OTP'
3. Quan sát Server Vay gọi API
4. Quan sát countdown và OTP mới

**G (Kết quả mong muốn)**:
1. Sau 300s, icon countdown được thay bằng button 'Gửi lại OTP'
2. App VTM gửi yêu cầu sinh lại OTP
3. Server Vay gọi API RegenerateAuthorizationCode sang đối tác → đối tác trả thành công
4. Countdown reset về 300s, KH nhận OTP mới qua SMS, MH03 vẫn hiển thị (KH nhập OTP mới)

**H/I**: HIGH / MAJOR

**graph_refs**: `business_rule:loanorder_vs_regenerate, validation_rule:otp_validity_300s, validation_rule:otp_max_3_resend_per_day, ui_screen:mh03_xac_thuc_otp, field:countdown_otp`

### TC #120 — (tiếp theo TC trước — merge col C)

**D (Trường hợp)**: TH: Regenerate trả về 'HĐ đã ký' (khoản vay đã được ký trước đó) - popup HĐ đã ký

**F (Các bước)**:
1. Setup khoản vay đã được ký thành công trên device/session khác
2. KH vào MH03 OTP và bấm 'Gửi lại OTP'
3. Server Vay gọi RegenerateAuthorizationCode
4. Đối tác trả response 'HĐ đã ký'
5. Quan sát popup và button Đóng

**G (Kết quả mong muốn)**:
1. Khoản vay đã ký được setup
2. KH ở MH03 OTP, nhấn 'Gửi lại OTP'
3. Server Vay gọi RegenerateAuthorizationCode
4. Đối tác trả về thông tin HĐ đã ký thành công
5. App hiển thị popup 'HĐ của bạn đã được ký thành công. Vui lòng chờ phê duyệt trong ít phút' với button 'Đóng' → bấm Đóng đưa về MH QLKV, khoản vay hiển thị trạng thái 'Chờ phê duyệt'

**H/I**: HIGH / MAJOR

**Z (Notes)**: Cần BA confirm mã lỗi 'HĐ đã ký' (AMB-04)

**graph_refs**: `status:pending_underwritting, business_rule:loanorder_vs_regenerate, flow_step:18_check_result`

### TC #121 — (tiếp theo TC trước — merge col C)

**D (Trường hợp)**: TH: Server Vay gọi RegenerateAuthorizationCode khi khoảng cách giữa 2 lần gửi OTP quá ngắn

**F (Các bước)**:
1. Setup môi trường để đối tác trả lỗi 'OTP gửi quá gần' khi gọi RegenerateAuthorizationCode
2. Vào MH03, bấm 'Gửi lại OTP' quá gần lần gửi trước
3. Server Vay gọi RegenerateAuthorizationCode
4. Quan sát popup hiển thị
5. Nhấn 'Đóng' trên popup

**G (Kết quả mong muốn)**:
1. Setup thành công
2. KH ở MH03, nhấn 'Gửi lại OTP'
3. Server Vay gọi RegenerateAuthorizationCode → đối tác trả lỗi 'OTP gửi quá gần'
4. App hiển thị popup (nội dung đang chờ PO confirm) với button 'Đóng'
5. Nhấn 'Đóng' đưa KH về MH QLKV với khoản vay status=pending_esigning (Chờ ký), cho phép ký lại sau

**H/I**: MEDIUM / MAJOR

**Z (Notes)**: Nội dung popup chờ PO confirm (AMB-05); cần BA confirm mã lỗi 'OTP quá gần' (AMB-04). TC verify hành vi popup hiển thị + đóng về QLKV

**graph_refs**: `status:pending_esigning, flow_step:18_check_result, validation_rule:otp_max_3_resend_per_day`

### TC #122 — (tiếp theo TC trước — merge col C)

**D (Trường hợp)**: TH: Resend OTP lần 1 + lần 2 + lần 3 trong ngày - đều OK

**E (Data test)**:
```
Đếm trong ngày: lần 1 OK, lần 2 OK, lần 3 OK
```

**F (Các bước)**:
1. Setup counter resend = 0 cho ngày hiện tại
2. Vào MH03, đợi 300s hết, bấm 'Gửi lại OTP' lần 1
3. Đợi 300s, bấm 'Gửi lại OTP' lần 2
4. Đợi 300s, bấm 'Gửi lại OTP' lần 3
5. Quan sát các lần resend

**G (Kết quả mong muốn)**:
1. Counter = 0
2. Lần 1 resend OK: Server Vay gọi RegenerateAuthorizationCode thành công, OTP mới gửi qua SMS, countdown reset 300s, counter = 1
3. Lần 2 resend OK: counter = 2
4. Lần 3 resend OK: counter = 3, OTP mới gửi
5. Cả 3 lần đều thành công trong ngày, theo AMB-03 quyết định 3 lần/ngày

**H/I**: HIGH / MAJOR

**Z (Notes)**: AMB-03 resolved: chọn 3 lần/ngày theo MH03 Control 5 (không theo CTS)

**graph_refs**: `validation_rule:otp_max_3_resend_per_day, field:countdown_otp`

### TC #123 — (tiếp theo TC trước — merge col C)

**D (Trường hợp)**: TH: Resend lần 4 trong ngày - bị reject, popup quá số lần, về QLKV, status=reject sub=reject_by_lender, block 24h

**E (Data test)**:
```
Đếm trong ngày: lần 1,2,3 OK; lần 4 reject
```

**F (Các bước)**:
1. Setup counter resend = 3 cho ngày hiện tại
2. Vào MH03, bấm 'Gửi lại OTP' lần 4
3. Quan sát hành vi
4. Bấm 'Đóng' trên popup
5. Trong vòng 24h, KH thử đăng ký vay mới

**G (Kết quả mong muốn)**:
1. Counter = 3 trong ngày
2. App gửi yêu cầu resend, Server Vay gọi RegenerateAuthorizationCode
3. Đối tác trả lỗi 'quá số lần OTP/ngày'; Server Vay update status=reject, sub=reject_by_lender; App hiển thị popup 'Bạn đã yêu cầu gửi lại OTP quá số lần quy định...' với button Đóng
4. Đóng popup → App điều hướng về MH QLKV với khoản vay ở trạng thái 'Bị từ chối'
5. KH bị chặn đăng ký vay mới 24h kể từ thời điểm reject (block 24h enforced)

**H/I**: HIGH / CRITICAL

**Z (Notes)**: AMB-03 resolved 3/ngày. Cần BA confirm mã lỗi đối tác trả về (AMB-04)

**graph_refs**: `validation_rule:otp_max_3_resend_per_day, status:reject_by_lender, business_rule:block_new_loan_after_cancel_24h`

### TC #124 — (tiếp theo TC trước — merge col C)

**D (Trường hợp)**: TH: Resend OTP lần đầu trong giới hạn (counter=0) - thành công, countdown reset

**E (Data test)**:
```
Counter resend trong ngày = 0
```

**F (Các bước)**:
1. Vào MH03, đợi countdown hết (300s)
2. Bấm button 'Gửi lại OTP'
3. Quan sát API call và phản hồi
4. Quan sát countdown

**G (Kết quả mong muốn)**:
1. MH03 hiển thị, sau 300s icon countdown đổi thành button 'Gửi lại OTP'
2. App VTM gọi yêu cầu resend
3. Server Vay gọi RegenerateAuthorizationCode → đối tác trả thành công, gửi OTP mới qua SMS
4. Countdown reset về 300s, KH nhận OTP mới và nhập

**H/I**: MEDIUM / MAJOR

**graph_refs**: `validation_rule:otp_max_3_resend_per_day, field:countdown_otp`


## Kiểm tra xác thực OTP

### TC #125 — Kiểm tra request đầu vào API ConfirmSignature (verify OTP)

**D (Trường hợp)**: TH: Server Vay gọi API ConfirmSignature sang Lender để verify OTP KH nhập. Verify payload chứa OTP, cert reference, contract_code.

**E (Data test)**:
```
OTP server gửi = "123456"; KH nhập OTP cùng giá trị; cert_id và contract_code đã có từ Loanorder
```

**F (Các bước)**:
1. KH nhập OTP đúng trên MH03, bấm Xác nhận
2. App VTM gửi yêu cầu verify sang Server Vay
3. Server Vay gọi ConfirmSignature sang Lender
4. Capture request Server Vay → Lender
5. Verify payload chứa: OTP KH nhập (6 số), cert reference, contract_code, timestamp
6. Verify OTP được transmit secure (HTTPS, không log plain OTP ở Server Vay)

**G (Kết quả mong muốn)**:
1. KH nhập OTP đúng
2. App gửi verify
3. Server Vay khởi tạo request ConfirmSignature
4. Capture được request
5. Request chứa: otp_code (6 số), cert_id, contract_code, timestamp request, signature/auth header
6. OTP transmit qua HTTPS encrypted, Server Vay không log plain text OTP (chỉ log hashed hoặc masked)

**H/I**: HIGH / CRITICAL

**Z (Notes)**: Bảo mật: OTP là sensitive data, không được log/cache plain text. Verify TLS handshake với Lender. SRS chỉ tên API, schema cần DD.

**graph_refs**: `field:otp_code, flow_step:23_server_send_verify, ui_screen:mh03_xac_thuc_otp`

### TC #126 — Kiểm tra response từ ConfirmSignature và Server Vay xử lý các nhánh

**D (Trường hợp)**: TH: Server Vay nhận response từ ConfirmSignature. Verify xử lý nhánh thành công (pending_underwritting, MH04) / sai OTP / OTP hết hạn / HĐ đã ký / lỗi hệ thống / lỗi đầu vào.

**F (Các bước)**:
1. Mock response thành công → Server Vay update status=pending_underwritting, sub=null, gửi SMS tiếp nhận → MH04 hiển thị
2. Mock response sai OTP → popup "Bạn đã nhập sai mã OTP. Vui lòng bấm Gửi lại OTP" → input lock
3. Mock response OTP hết hạn → inline "Mã OTP đã hết hiệu lực. Vui lòng bấm gửi lại OTP"
4. Mock response "HĐ đã ký" → popup HĐ đã ký, về QLKV Chờ phê duyệt
5. Mock response lỗi đầu vào (sai thông tin) → status=reject + sub=reject_by_lender, MH khoản vay bị từ chối
6. Mock response lỗi hệ thống → giữ pending_esigning + cert_success, popup lỗi

**G (Kết quả mong muốn)**:
1. Thành công → status=pending_underwritting, MH04 "Gửi đăng ký vay thành công", về QLKV Chờ phê duyệt
2. Sai OTP → popup không có counter (không hiển thị n/3), input clear+disabled, button Gửi lại OTP highlight
3. OTP hết hạn → inline error đỏ, countdown đã auto-switch sang button Gửi lại OTP
4. HĐ đã ký → popup nội dung "HĐ của bạn đã được ký thành công..."
5. Lỗi đầu vào → reject + reject_by_lender, MH khoản vay bị từ chối
6. Lỗi hệ thống → giữ pending_esigning + cert_success, popup Lỗi hệ thống → KH có thể vào lại

**H/I**: HIGH / CRITICAL

**Z (Notes)**: Critical TC tổng hợp tất cả nhánh response ConfirmSignature. Mỗi nhánh cần verify status + sub + UI hiển thị đồng bộ.

**graph_refs**: `flow_step:25_check_otp_result, status:pending_underwritting, business_rule:sms_success_signing, ui_screen:mh04_gui_dang_ky_vay_thanh_cong`

### TC #127 — Kiểm tra luồng ký hợp đồng - Main success path (QLKV → MH04)

**D (Trường hợp)**: TH: KH có khoản vay status=pending_esigning, vào từ QLKV , thuộc whitelist/feature flag ON, đã thỏa precheck/credit/ekyc, checkbox đồng ý mặc định CHECKED, nhập OTP đúng 6 số trong 300s

**E (Data test)**:
```
checkbox_dong_y=true; otp_code=123456 (đúng); thoi_han_vay=180 ngày; so_tien_de_nghi_vay=10000000
```

**F (Các bước)**:
1. Đăng nhập App VTM với KH thỏa precondition (whitelist + khoản vay pending_esigning + ekyc OK)
2. Mở icon FE Credit Cashloan → MH QLKV
3. Quan sát khoản vay 'Chờ ký', nhấn button 'Ký hợp đồng'
4. Quan sát MH01 "Hợp đồng của bạn" (checkbox mặc định, button Ký HĐ/Hủy HĐ)
5. Nhấn button 'Ký hợp đồng' trên MH01
6. Quan sát hệ thống gửi yêu cầu sinh OTP và Server Vay gọi API Loanorder (do chưa từng gen OTP)
7. Đợi MH03 Xác thực OTP hiển thị, nhập OTP đúng (6 số) trong vòng 300s
8. Nhấn button 'Xác nhận'
9. Quan sát kết quả

**G (Kết quả mong muốn)**:
1. KH đăng nhập thành công, vào được App VTM
2. MH QLKV hiển thị khoản vay với trạng thái 'Chờ ký hợp đồng'
3. Hệ thống điều hướng vào MH01 "Hợp đồng của bạn"
4. MH01 hiển thị đầy đủ 3 Tab: HĐ Tín dụng (selected), Điều khoản CTS, Yêu cầu BH + Checkbox đồng ý ở trạng thái CHECKED (theo AMB-01 default checked) + Button Ký hợp đồng Enable + Button Hủy hợp đồng Enable
5. App VTM gửi yêu cầu sinh OTP sang Server Vay
6. Server Vay gọi API Loanorder sang đối tác → đối tác trả thành công → Server Vay update khoản vay sang trạng thái pending_esigning + cert_success
7. MH03 hiển thị: label hướng dẫn (kèm SĐT mask), input OTP, icon countdown 300s, button Bỏ qua/Gửi lại OTP/Xác nhận. OTP được nhập hiển thị đúng 6 số, button Xác nhận Enable
8. App VTM gửi yêu cầu verify OTP, Server Vay gọi API ConfirmSignature sang đối tác
9. Đối tác trả thành công → Server Vay update status=pending_underwritting, sub=null, gửi SMS tiếp nhận → App VTM hiển thị MH04 'Gửi đăng ký vay thành công, khoản vay Chờ duyệt'

**H/I**: HIGH / CRITICAL

**Z (Notes)**: Chờ BA confirm chi tiết các bước 8/9/10 (AMB-02) — hiện SRS đánh số nhảy từ 7 → 11

**graph_refs**: `activity_flow:ky_hop_dong_vc_payday, status:pending_esigning, status:pending_esigning_cert_success, status:pending_underwritting, business_rule:loanorder_vs_regenerate, business_rule:sms_success_signing, flow_step:1_entry, flow_step:16_choose_api, flow_step:23_server_send_verify, flow_step:28_show_success, ui_screen:mh01_xem_hop_dong_truoc_ky, ui_screen:mh03_xac_thuc_otp, ui_screen:mh04_gui_dang_ky_vay_thanh_cong`

### TC #128 — (tiếp theo TC trước — merge col C)

**D (Trường hợp)**: TH: OTP hết hạn (KH bấm Xác nhận sau 300s, trước khi auto-switch hiện) - inline message 'Mã OTP hết hạn'

**E (Data test)**:
```
otp_code=123456 (đã hết hạn sau 300s)
```

**F (Các bước)**:
1. Vào MH03, đợi countdown gần 300s
2. Nhập OTP đúng format 6 số
3. Bấm 'Xác nhận' ngay khi/sau khi countdown vừa hết
4. Quan sát inline message

**G (Kết quả mong muốn)**:
1. MH03 hiển thị với countdown sắp hết
2. OTP 6 số được nhập, button Xác nhận Enable
3. App VTM gửi verify OTP, Server Vay gọi ConfirmSignature → đối tác trả 'OTP hết hạn'
4. Inline message 'Mã OTP hết hạn' hiển thị dưới input OTP, MH03 vẫn giữ nguyên (không auto-switch sang button Gửi lại OTP), KH có thể bấm Gửi lại OTP để xin OTP mới

**H/I**: HIGH / MAJOR

**Z (Notes)**: AMB-13: hành vi mâu thuẫn với MH03 Control 3 (auto-switch sau 300s). Cần BA confirm priority giữa inline message vs auto-switch. Cần BA confirm mã lỗi OTP hết hạn (AMB-04)

**graph_refs**: `validation_rule:otp_validity_300s, ui_screen:mh03_xac_thuc_otp, flow_step:25_check_otp_result`

### TC #129 — (tiếp theo TC trước — merge col C)

**D (Trường hợp)**: TH: ConfirmSignature gặp lỗi hệ thống/TB/TO - giữ pending_esigning + cert_success, lần sau gọi RegenerateAuthorizationCode

**F (Các bước)**:
1. Setup đối tác trả lỗi hệ thống khi verify OTP (timeout/5xx)
2. KH ở MH03 nhập OTP, bấm Xác nhận
3. Server Vay gọi ConfirmSignature, nhận lỗi
4. Quan sát status và popup
5. KH bấm 'Đóng' → quay lại ký - quan sát Server Vay gọi API nào

**G (Kết quả mong muốn)**:
1. Setup lỗi hệ thống thành công
2. OTP 6 số nhập, Xác nhận trigger verify
3. Server Vay gọi ConfirmSignature → nhận lỗi hệ thống/timeout từ đối tác
4. Server Vay GIỮ status=pending_esigning + sub=cert_success, App hiển thị popup 'Lỗi hệ thống', nút Đóng
5. KH bấm Đóng về MH QLKV; lần vào ký lại Server Vay gọi RegenerateAuthorizationCode (vì cert_success đã có) → flow tiếp tục bình thường

**H/I**: HIGH / MAJOR

**Z (Notes)**: Cần BA confirm mã lỗi hệ thống đối tác trả về (AMB-04)

**graph_refs**: `status:pending_esigning_cert_success, business_rule:loanorder_vs_regenerate, flow_step:25_check_otp_result`

### TC #130 — Kiểm tra OTP rule - format & length & validity

**D (Trường hợp)**: TH: Nhập OTP 6 chữ số đúng format (numeric, đủ 6 ký tự) trong 300s

**E (Data test)**:
```
otp_code="123456"
```

**F (Các bước)**:
1. Vào MH03 Xác thực OTP với countdown đang chạy (< 300s)
2. Nhập OTP = "123456"
3. Quan sát button Xác nhận
4. Nhấn 'Xác nhận'

**G (Kết quả mong muốn)**:
1. MH03 hiển thị input OTP, countdown đang chạy
2. Giá trị "123456" được nhập, hiển thị 6 ký tự số
3. Button 'Xác nhận' Enable (vì đủ 6 chữ số)
4. App VTM gửi verify OTP, Server Vay gọi ConfirmSignature, đối tác xác nhận đúng → flow tiếp tục sang MH04

**H/I**: HIGH / CRITICAL

**graph_refs**: `field:otp_code, validation_rule:otp_format`

### TC #131 — (tiếp theo TC trước — merge col C)

**D (Trường hợp)**: TH: Nhập OTP toàn số 0 (giá trị extreme valid - "000000")

**E (Data test)**:
```
otp_code="000000"
```

**F (Các bước)**:
1. Vào MH03
2. Nhập OTP = "000000"
3. Quan sát button Xác nhận và verify
4. Nhấn 'Xác nhận'

**G (Kết quả mong muốn)**:
1. MH03 hiển thị
2. Giá trị "000000" được nhập, hiển thị đủ 6 số 0
3. Button 'Xác nhận' Enable (đủ 6 chữ số, format hợp lệ)
4. App gửi verify; nếu đối tác xác định OTP không khớp → popup lỗi OTP; nếu khớp → tiếp tục flow

**H/I**: MEDIUM / MINOR

**graph_refs**: `field:otp_code, validation_rule:otp_format`

### TC #132 — (tiếp theo TC trước — merge col C)

**D (Trường hợp)**: TH: Nhập OTP đúng 6 ký tự (= boundary)

**E (Data test)**:
```
otp_code="123456"
```

**F (Các bước)**:
1. Vào MH03
2. Nhập "123456" (đúng 6 ký tự)
3. Quan sát button Xác nhận

**G (Kết quả mong muốn)**:
1. MH03 hiển thị
2. Input hiển thị "123456" (6 ký tự)
3. Button 'Xác nhận' Enable (đủ 6 chữ số)

**H/I**: HIGH / CRITICAL

**graph_refs**: `field:otp_code, validation_rule:otp_format`

### TC #133 — (tiếp theo TC trước — merge col C)

**D (Trường hợp)**: TH: Xác nhận OTP tại thời điểm countdown = 299s (boundary trong hiệu lực) - hệ thống chấp nhận

**E (Data test)**:
```
otp_code="123456"; thời điểm xác nhận: countdown ~299s (~ 1s sau khi gen OTP)
```

**F (Các bước)**:
1. Vào MH03 ngay khi vừa nhận OTP (countdown = 299s)
2. Nhập OTP đúng và bấm 'Xác nhận' trong 1s
3. Quan sát kết quả verify

**G (Kết quả mong muốn)**:
1. MH03 hiển thị, countdown 299s đếm ngược
2. App gửi verify OTP ngay
3. Server Vay gọi ConfirmSignature; OTP vẫn trong 300s → đối tác xác nhận thành công, flow tiếp tục sang MH04

**H/I**: HIGH / CRITICAL

**graph_refs**: `field:countdown_otp, validation_rule:otp_validity_300s`

### TC #134 — (tiếp theo TC trước — merge col C)

**D (Trường hợp)**: TH: Xác nhận OTP sau 301s (vượt 300s) - OTP hết hạn

**E (Data test)**:
```
otp_code="123456"; thời điểm xác nhận = 301s sau khi gen
```

**F (Các bước)**:
1. Vào MH03, không nhập OTP và đợi countdown chạy hết
2. Sau 301s, nhập OTP đúng 6 số
3. Bấm 'Xác nhận' nếu button còn hiện (hoặc theo nhánh inline message)
4. Quan sát hành vi hệ thống

**G (Kết quả mong muốn)**:
1. MH03 hiển thị, countdown chạy về 0 sau 300s, icon được thay thành button 'Gửi lại OTP'
2. KH nhập OTP nhưng OTP đã hết hạn
3. Nếu KH kịp bấm Xác nhận trước khi auto-switch hoàn tất: Server Vay gọi ConfirmSignature, đối tác trả OTP hết hạn → inline message 'Mã OTP hết hạn' hiển thị; nếu auto-switch đã hoàn tất: chỉ còn button 'Gửi lại OTP'
4. Hệ thống không xác nhận OTP, KH cần bấm 'Gửi lại OTP' để xin mã mới

**H/I**: HIGH / MAJOR

**Z (Notes)**: AMB-13: cover cả 2 nhánh - auto-switch sau 300s VÀ inline message khi user kịp bấm Xác nhận. Cần BA confirm mã lỗi OTP hết hạn (AMB-04)

**graph_refs**: `field:countdown_otp, validation_rule:otp_validity_300s, flow_step:25_check_otp_result`

### TC #135 — (tiếp theo TC trước — merge col C)

**D (Trường hợp)**: TH: Nhập OTP đúng ngay lần 1 (không cần resend) - thành công

**E (Data test)**:
```
lần 1: otp_code="123456" (đúng)
```

**F (Các bước)**:
1. Vào MH03 với OTP đúng = "123456"
2. Nhập "123456" lần 1
3. Bấm 'Xác nhận'

**G (Kết quả mong muốn)**:
1. MH03 hiển thị
2. Input nhận "123456"
3. App gửi verify OTP, Server Vay gọi ConfirmSignature → đối tác xác nhận thành công lần 1; status update pending_underwritting, sub=null, gửi SMS; App hiển thị MH04

**H/I**: HIGH / CRITICAL

**graph_refs**: `validation_rule:otp_max_3_attempts, status:pending_underwritting, flow_step:25_check_otp_result`

### TC #136 — (tiếp theo TC trước — merge col C)

**D (Trường hợp)**: TH: KH nhập OTP sai (không khớp OTP server đã gửi) 1 lần và bấm Xác nhận

**E (Data test)**:
```
lần 1: otp_code="999999" (sai)
```

**F (Các bước)**:
1. Vào MH03 "Xác thực OTP", server gửi OTP đúng = "123456"
2. KH nhập OTP sai = "999999", bấm Xác nhận
3. Quan sát popup hiển thị
4. Tap button "Đóng" trên popup
5. Quan sát trạng thái input OTP và button "Gửi lại OTP" trên MH03
6. Bấm button "Gửi lại OTP"
7. Quan sát hành vi sau khi server xử lý xong

**G (Kết quả mong muốn)**:
1. MH03 hiển thị, countdown 300s đang chạy, input OTP enable
2. App gửi verify, đối tác trả OTP sai
3. Popup hiển thị nội dung "Bạn đã nhập sai mã OTP. Vui lòng bấm Gửi lại OTP" với 1 button "Đóng"
4. Popup đóng, quay về MH03
5. Input OTP: clear (rỗng) + disabled (mờ, không gõ được). Button "Gửi lại OTP" chuyển sang trạng thái highlight/active. Button "Xác nhận" disable (do input rỗng + disabled)
6. App gửi yêu cầu gen lại OTP, server gọi RegenerateAuthorizationCode → đối tác trả thành công
7. Server lưu OTP mới, KH nhận OTP mới qua SMS; trên MH03: input OTP unlock + clear, countdown reset 300s, button "Gửi lại OTP" mờ trở lại (counter tăng); KH có thể nhập OTP mới

**H/I**: HIGH / MAJOR

**Z (Notes)**: Cần BA confirm mã lỗi OTP sai từ đối tác (AMB-04)

**graph_refs**: `validation_rule:otp_max_3_attempts, flow_step:25_check_otp_result, flow_step:26_popup_otp_error`

### TC #137 — (tiếp theo TC trước — merge col C)

**D (Trường hợp)**: TH: KH nhập sai OTP 3 lần liên tiếp (giữa mỗi lần sai, KH phải bấm "Gửi lại OTP" để gen OTP mới rồi nhập). Server đếm tích lũy số lần sai.

**E (Data test)**:
```
lần 1,2,3: otp_code="999999" (sai)
```

**F (Các bước)**:
1. Vào MH03, nhập OTP sai lần 1 → popup → Đóng
2. Bấm Gửi lại OTP → OTP mới gen, input unlock
3. Nhập OTP sai lần 2 → popup → Đóng
4. Bấm Gửi lại OTP → OTP mới, input unlock
5. Nhập OTP sai lần 3 → quan sát popup sau lần sai thứ 3
6. Tap button Đóng trên popup

**G (Kết quả mong muốn)**:
1. Lần 1 sai: popup "Bạn đã nhập sai mã OTP. Vui lòng bấm Gửi lại OTP" → Đóng → input clear+disabled, button Gửi lại OTP highlight
2. Gửi lại OTP thành công, OTP mới về SMS, input unlock
3. Lần 2 sai: popup tương tự lần 1 → Đóng → input lock
4. Gửi lại OTP thành công lần 2
5. Lần 3 sai: popup chuyển sang nội dung "Bạn đã nhập OTP sai liên tiếp quá số lần quy định. Vui lòng thực hiện ký lại sau 5 phút" với button Đóng
6. Tap Đóng → App điều hướng về MH QLKV, khoản vay giữ trạng thái Chờ ký, server enforce không cho ký lại trong vòng 5 phút (E10)

**H/I**: HIGH / CRITICAL

**Z (Notes)**: Cần BA confirm enforce thực tế cooldown 5 phút (AMB-04)

**graph_refs**: `validation_rule:otp_max_3_attempts, business_rule:resign_after_5_min, status:pending_esigning, flow_step:25_check_otp_result, flow_step:26_popup_otp_error`

### TC #138 — (tiếp theo TC trước — merge col C)

**D (Trường hợp)**: TH: Sau khi sai OTP 3 lần block 5 phút, KH thử ký lại trong vòng 5 phút - bị chặn

**F (Các bước)**:
1. Setup KH vừa sai OTP 3 lần, popup 5 phút đã đóng, về QLKV
2. Trong vòng 5 phút, KH bấm lại 'Ký hợp đồng'
3. Quan sát hành vi

**G (Kết quả mong muốn)**:
1. KH ở MH QLKV, khoản vay vẫn 'Chờ ký'
2. KH bấm 'Ký hợp đồng' trong vòng 5 phút
3. Hệ thống chặn ký lại (hiển thị thông báo phù hợp), KH phải đợi qua 5 phút

**H/I**: MEDIUM / MAJOR

**Z (Notes)**: Cần BA confirm cơ chế enforce 5 phút (popup vs disabled button vs chặn API) và mã lỗi (AMB-04)

**graph_refs**: `business_rule:resign_after_5_min, validation_rule:otp_max_3_attempts`

### TC #139 — Kiểm tra state transition khoản vay từ pending_esigning

**D (Trường hợp)**: TH: khoản vay từ pending_esigning sang pending_esigning + cert_success khi Loanorder thành công (đối tác tạo CTS + sinh OTP lần đầu)

**E (Data test)**:
```
loan_status_before=pending_esigning, sub=null
```

**F (Các bước)**:
1. Khoản vay ở status=pending_esigning, sub=null
2. KH ký HĐ, Server Vay gọi Loanorder, đối tác trả thành công
3. Query status khoản vay sau khi Loanorder OK
4. Verify giá trị

**G (Kết quả mong muốn)**:
1. Khoản vay được setup pending_esigning, sub=null
2. Server Vay gọi Loanorder, đối tác tạo CTS và sinh OTP
3. Hệ thống/Server Vay trả về status hiện tại
4. status=pending_esigning, sub=cert_success (đúng transition)

**H/I**: HIGH / CRITICAL

**graph_refs**: `status:pending_esigning, status:pending_esigning_cert_success, business_rule:loanorder_vs_regenerate`

### TC #140 — (tiếp theo TC trước — merge col C)

**D (Trường hợp)**: TH: khoản vay từ pending_esigning + cert_success sang pending_underwritting, sub=null khi ConfirmSignature thành công

**E (Data test)**:
```
loan_status_before=pending_esigning + cert_success; OTP verify OK
```

**F (Các bước)**:
1. Khoản vay ở pending_esigning + cert_success (đã gen OTP)
2. KH nhập OTP đúng, Server Vay gọi ConfirmSignature, đối tác xác nhận thành công
3. Query status khoản vay
4. Verify giá trị

**G (Kết quả mong muốn)**:
1. Khoản vay setup ở pending_esigning + cert_success
2. Server Vay gọi ConfirmSignature thành công, gửi SMS tiếp nhận
3. Hệ thống trả về status hiện tại
4. status=pending_underwritting, sub=null (đúng transition)

**H/I**: HIGH / CRITICAL

**graph_refs**: `status:pending_esigning_cert_success, status:pending_underwritting, business_rule:sms_success_signing`

### TC #141 — Kiểm tra cơ chế chặn brute force OTP - giới hạn 3 lần nhập sai/CTS

**D (Trường hợp)**: TH: KH cố tình thử OTP bằng cách nhập lần lượt 000000, 111111, 222222 trong khi OTP còn hiệu lực 300s

**E (Data test)**:
```
Danh sách OTP thử: ['000000', '111111', '222222', '333333', '444444']
```

**F (Các bước)**:
1. Đăng nhập App ViettelPay với KH có khoản vay status=pending_esigning
2. Vào MH01 "Hợp đồng của bạn", nhấn Ký hợp đồng để gen OTP
3. Tại MH03 Xác thực OTP, nhập OTP sai lần 1 = '000000' rồi nhấn Xác nhận
4. Nhập OTP sai lần 2 = '111111' rồi nhấn Xác nhận
5. Nhập OTP sai lần 3 = '222222' rồi nhấn Xác nhận
6. Nhập OTP sai lần 4 = '333333' rồi nhấn Xác nhận
7. Quan sát trạng thái khoản vay sau khi vượt quá 3 lần

**G (Kết quả mong muốn)**:
1. KH đăng nhập thành công, khoản vay ở trạng thái Chờ ký
2. Server gọi Loanorder, App điều hướng đến MH03 với countdown 300s
3. Hệ thống hiển thị popup 'Bạn đã nhập sai mã OTP. Vui lòng bấm "Gửi lại OTP"', form OTP cho phép nhập lại
4. Hệ thống hiển thị popup 'Bạn đã nhập sai mã OTP. Vui lòng bấm "Gửi lại OTP"'
5. Hệ thống hiển thị popup 'Bạn đã nhập sai mã OTP. Vui lòng bấm "Gửi lại OTP"' hoặc chuyển sang popup khóa
6. Hệ thống hiển thị popup 'Bạn đã nhập OTP sai liên tiếp quá số lần quy định. Vui lòng thực hiện ký lại sau 5 phút' (E10), không cho phép nhập tiếp
7. KH bấm Đóng → về QLKV, khoản vay ở trạng thái Chờ ký, không cho ký lại trong 5 phút

**H/I**: HIGH / CRITICAL

**Z (Notes)**: OWASP Mobile Top 10 - M4 Insufficient Authentication. Cần BA confirm: cơ chế đếm 3 lần là per-OTP/per-CTS hay per-device. Tham chiếu validation_rule:otp_max_3_attempts + business_rule:resign_after_5_min (E10).

**graph_refs**: `field:otp_code, validation_rule:otp_max_3_attempts, business_rule:resign_after_5_min, ui_screen:mh03_xac_thuc_otp`

### TC #142 — (tiếp theo TC trước — merge col C)

**D (Trường hợp)**: TH: KH dùng lại OTP cũ đã verify thành công 1 lần trước đó (replay attack)

**F (Các bước)**:
1. Đăng nhập App ViettelPay với KH có khoản vay pending_esigning
2. Nhấn Ký hợp đồng tại MH01, gen OTP, nhận OTP qua SMS (vd: 123456)
3. Nhập OTP 123456 tại MH03 và Xác nhận - verify thành công
4. Quay trở lại luồng ký (giả lập replay): từ QLKV của khoản vay khác hoặc cố tình submit lại OTP cũ thông qua proxy/replay request
5. Nhập lại OTP 123456 đã sử dụng ở bước 3 tại MH03
6. Nhấn Xác nhận để gửi request verify

**G (Kết quả mong muốn)**:
1. KH đăng nhập thành công
2. App điều hướng đến MH03, countdown 300s bắt đầu, KH nhận SMS OTP
3. App điều hướng đến MH04 Gửi đăng ký vay thành công, khoản vay chuyển sang pending_underwritting
4. Khoản vay đã ký không còn ở trạng thái pending_esigning, KH không thể vào lại luồng nhập OTP cho khoản vay đã ký
5. OTP cũ được nhập vào ô input
6. Hệ thống reject OTP đã sử dụng - hiển thị popup HĐ đã ký (E12) 'Hợp đồng của bạn đã được ký thành công. Vui lòng chờ phê duyệt' hoặc thông báo OTP không hợp lệ; không tạo verify thành công lần 2

**H/I**: HIGH / CRITICAL

**Z (Notes)**: OWASP Mobile Top 10 - M9 Reverse Engineering / M4 Auth. Cần BA confirm: server đánh dấu OTP đã sử dụng sau verify thành công hay không. Tham chiếu E12 ConfirmSignature - HĐ đã ký.

**graph_refs**: `field:otp_code, validation_rule:otp_validity_300s, ui_screen:mh03_xac_thuc_otp, status:pending_underwritting`

### TC #143 — (tiếp theo TC trước — merge col C)

**D (Trường hợp)**: TH: SĐT đăng ký tài khoản VTM thay đổi giữa thời điểm Loanorder (gửi OTP đầu) và ConfirmSignature (verify OTP)

**F (Các bước)**:
1. KH đăng nhập App ViettelPay với SĐT A (vd 0901234567), có khoản vay pending_esigning
2. Nhấn Ký hợp đồng tại MH01, server gọi Loanorder với SĐT A, OTP được gửi đến SĐT A
3. Giả lập đổi SIM/SĐT đăng ký tài khoản VTM sang SĐT B (vd 0907654321) trong khi MH03 còn countdown
4. Nhập OTP đã nhận trên SĐT A vào MH03
5. Nhấn Xác nhận - server gọi ConfirmSignature
6. Quan sát hành vi server

**G (Kết quả mong muốn)**:
1. KH đăng nhập thành công với SĐT A
2. Server gọi Loanorder, lưu SĐT A vào payload OTP, App điều hướng đến MH03 hiển thị mask SĐT A (vd 090***4567)
3. SĐT của tài khoản VTM thay đổi sang B, MH03 vẫn hiển thị mask SĐT A theo data lúc gen OTP
4. OTP được nhập vào input
5. Server gọi ConfirmSignature - phải verify SĐT trên payload trùng với SĐT khi gen OTP (SĐT A), không cho phép bypass khi SĐT tài khoản đã đổi
6. Server phải reject hoặc giữ ràng buộc SĐT A; nếu reject thì hiển thị màn 'Khoản vay bị từ chối' hoặc giữ pending_esigning

**H/I**: HIGH / CRITICAL

**Z (Notes)**: OWASP Mobile Top 10 - M3 Insecure Communication / M4 Auth. Cần BA confirm: cơ chế bind SĐT giữa Loanorder và ConfirmSignature, ai chịu trách nhiệm check (Server Vay hay Lender). SRS không document explicit check này.

**graph_refs**: `field:so_dien_thoai, field:otp_code, ui_screen:mh03_xac_thuc_otp`

### TC #144 — (tiếp theo TC trước — merge col C)

**D (Trường hợp)**: Charter ET: Khám phá rate limit OTP request - thử bypass quota '3 lần/ngày' bằng cách dùng nhiều device/SIM cho cùng 1 tài khoản KH

**E (Data test)**:
```
Charter: Time-box 2h. Goal: tìm cách bypass rate limit 3 lần/ngày của OTP resend. Heuristics: đổi device, đổi IP, change locale, replay request, force reinstall app, share session token.
```

**F (Các bước)**:
1. Chuẩn bị: KH có khoản vay pending_esigning trên SĐT A, đã exhaust 3 lần gửi lại OTP/ngày trên Device 1
2. Trên Device 2 (đã clear data App), login cùng tài khoản KH, vào MH01 và nhấn Ký hợp đồng
3. Quan sát: server có cho phép gen OTP mới trên Device 2 hay vẫn enforce quota 3 lần/ngày global
4. Thử biến thể: đổi SIM physical (giữ SĐT đăng ký), reinstall app, retry sau midnight
5. Ghi nhận từng kết quả vào ET log + flag bất kỳ behavior nào cho phép bypass quota

**G (Kết quả mong muốn)**:
1. Precondition: quota OTP của SĐT A đã = 3/3 trên Device 1
2. Device 2 login thành công, vào MH01
3. Server phải enforce quota global per-CCCD/per-account (không per-device): Device 2 vẫn nhận popup 'quá số lần gửi lại OTP' (E9) → reject_by_lender → block 24h. Nếu Device 2 gen được OTP thành công → BUG (quota bypass)
4. Mọi biến thể device/SIM/reinstall vẫn enforce quota; chỉ reset sau 24h (theo business_rule:block_new_loan_after_cancel_24h)
5. Charter report ghi nhận pass/fail từng heuristic, đính kèm vào col_z BA-flag nếu có bypass

**H/I**: HIGH / CRITICAL

**Z (Notes)**: OWASP Mobile Top 10 - M4 Insufficient Authentication. Exploratory Testing charter (ET) - time-box 2h. AMB-03 đã chốt 3 lần/ngày (theo MH03). Kết quả charter cần ghi lại + flag BA nếu phát hiện quota bypass.

**graph_refs**: `field:otp_code, validation_rule:otp_max_3_resend_per_day, business_rule:block_new_loan_after_cancel_24h, status:reject_by_lender`

### TC #145 — Kiểm tra race condition khi 2 device cùng ký 1 khoản vay đồng thời

**D (Trường hợp)**: TH: KH login App trên Device 1 và Device 2 cùng lúc, cả 2 device cùng nhấn Ký hợp đồng tại MH01 trong khoảng <500ms

**F (Các bước)**:
1. KH login cùng tài khoản trên Device 1 (Android) và Device 2 (iOS), cả 2 đang ở MH QLKV với khoản vay pending_esigning
2. Trên Device 1: vào MH01, nhấn Ký hợp đồng → checkbox đã CHECKED → nhấn Ký HĐ
3. Đồng thời (gần như cùng lúc) trên Device 2: vào MH01, nhấn Ký hợp đồng → nhấn Ký HĐ
4. Quan sát kết quả gen OTP trên cả 2 device
5. Trên device nào nhận OTP trước, nhập OTP và Xác nhận để complete
6. Quan sát hành vi của device còn lại

**G (Kết quả mong muốn)**:
1. Cả 2 device đăng nhập thành công, hiển thị MH QLKV
2. Device 1 chuyển sang MH03, server xử lý Loanorder thành công, status chuyển pending_esigning + cert_success
3. Device 2: server xử lý request thứ 2 - phải detect race và return E7 hoặc gọi RegenerateAuthorizationCode (theo business_rule:loanorder_vs_regenerate); không tạo 2 CTS song song
4. Một device chuyển MH03 hiển thị OTP countdown; device còn lại có thể nhận response RegenerateAuthorizationCode hoặc popup E7 'HĐ đã ký'
5. Device A verify OTP thành công, khoản vay chuyển pending_underwritting, MH04 hiển thị
6. Device B: nếu vẫn ở MH03 và bấm Xác nhận sau khi Device A đã ký → hiển thị popup E12 'Hợp đồng của bạn đã được ký thành công. Vui lòng chờ phê duyệt' → click Đóng về QLKV với trạng thái Chờ phê duyệt

**H/I**: HIGH / CRITICAL

**Z (Notes)**: OWASP Mobile Top 10 - M4 Auth / Race condition. Cần BA confirm: server có lock/serialize request Ký HĐ ở level khoản vay không. Tham chiếu E7 Regenerate-HĐ đã ký + E12 ConfirmSignature-HĐ đã ký. SRS đã document 2 popup này nhưng không nói rõ cơ chế lock.

**graph_refs**: `field:otp_code, business_rule:loanorder_vs_regenerate, status:pending_underwritting, status:pending_esigning_cert_success`

### TC #146 — (tiếp theo TC trước — merge col C)

**D (Trường hợp)**: TH: Race ConfirmSignature - sau khi Device 1 verify OTP thành công, Device 2 vẫn còn MH03 và bấm Xác nhận với OTP đã nhận

**F (Các bước)**:
1. KH login cả Device 1 và Device 2, cả 2 đều đến MH03 với cùng 1 OTP (sau khi đã handle race ở luồng Loanorder/Regenerate)
2. Device 1: nhập OTP đúng và bấm Xác nhận
3. Đợi Device 1 hoàn tất - khoản vay chuyển sang pending_underwritting, hiển thị MH04
4. Trên Device 2 (vẫn còn MH03): nhập cùng OTP và bấm Xác nhận
5. Quan sát response server cho Device 2
6. KH bấm Đóng trên popup của Device 2

**G (Kết quả mong muốn)**:
1. Cả 2 device ở MH03, countdown đang chạy
2. Device 1 gửi ConfirmSignature thành công
3. Device 1: server update pending_underwritting, sub=null, gửi SMS tiếp nhận, App điều hướng đến MH04
4. Device 2 gửi ConfirmSignature lần 2 - server phải detect HĐ đã ký
5. Device 2 nhận popup E12 'Hợp đồng của bạn đã được ký thành công. Vui lòng chờ phê duyệt'; không update state lần 2, không gửi thêm SMS
6. Click Đóng trên Device 2 → về QLKV với trạng thái Chờ phê duyệt

**H/I**: HIGH / CRITICAL

**Z (Notes)**: OWASP Mobile Top 10 - M4 Auth. Tham chiếu E12 ConfirmSignature-HĐ đã ký + business_rule:sms_success_signing (chỉ gửi SMS 1 lần).

**graph_refs**: `field:otp_code, business_rule:sms_success_signing, status:pending_underwritting`

### TC #147 — (tiếp theo TC trước — merge col C)

**D (Trường hợp)**: TH: KH bấm Hủy hợp đồng trong khi request ConfirmSignature đang in-flight (chưa nhận response) - race state giữa hủy và verify thành công

**F (Các bước)**:
1. KH ở MH03, nhập OTP đúng và bấm Xác nhận - request ConfirmSignature đang gửi đi
2. Trong khi đang chờ response (giả lập network latency), thoát về MH01 và bấm Hủy hợp đồng
3. Tại popup Xác nhận hủy, bấm Xác nhận
4. Quan sát: server xử lý đồng thời ConfirmSignature (verify thành công) và yêu cầu hủy
5. Kiểm tra status cuối cùng của khoản vay
6. Kiểm tra block 24h có được apply không

**G (Kết quả mong muốn)**:
1. Request ConfirmSignature gửi đi, App có thể vẫn ở MH03 loading
2. KH thoát về MH01, button Hủy enable (luôn enable theo SRS)
3. Popup xác nhận hủy hiển thị, click Xác nhận - server nhận yêu cầu hủy
4. Server phải serialize 2 request - nếu ConfirmSignature đã verify thành công trước: reject Hủy với popup E12 'HĐ đã ký'; nếu Hủy được xử lý trước verify: cancel ConfirmSignature, status=Cancelled
5. Status cuối cùng phải nhất quán: hoặc pending_underwritting (ký thắng race) hoặc cancelled_by_customer (hủy thắng race); không có state lẫn lộn
6. Nếu ký thắng race: không apply block 24h (HĐ đã ký xong); nếu hủy thắng race: apply block 24h vì khoản vay đã gửi Loanorder thành công (E14)

**H/I**: HIGH / CRITICAL

**Z (Notes)**: OWASP Mobile Top 10 - M4 Auth / State consistency. Cần BA confirm: cơ chế ưu tiên giữa Cancel vs Verify in-flight. SRS không document tường minh trường hợp này.

**graph_refs**: `business_rule:block_new_loan_after_cancel_24h, status:cancelled_by_customer, status:pending_underwritting`


## Kiểm tra hủy hợp đồng

### TC #148 — Kiểm tra luồng hủy hợp đồng - Main success (chưa gửi đối tác, không block 24h)

**D (Trường hợp)**: TH: KH hủy HĐ khi khoản vay CHƯA gửi sang đối tác thành công (chưa gen OTP, chưa có cert_success) - không block 24h

**E (Data test)**:
```
loan_status=pending_esigning, sub=null (chưa có cert_success)
```

**F (Các bước)**:
1. Vào MH01 "Hợp đồng của bạn" với khoản vay status=pending_esigning, sub=null
2. Nhấn button 'Hủy hợp đồng'
3. Quan sát popup xác nhận
4. Nhấn 'Xác nhận' trên popup
5. Quan sát status update và MH hiển thị
6. Kiểm tra KH có thể đăng ký vay mới ngay không (không bị block 24h)

**G (Kết quả mong muốn)**:
1. MH01 hiển thị, button Hủy hợp đồng luôn Enable
2. Popup "Hủy đăng ký" hiển thị với 2 button
3. Popup có 2 button 'Xác nhận' và 'Đóng'
4. Server Vay cập nhật status=Cancelled, sub=Cancelled_contract_by_customer
5. App điều hướng về MH Quản lý khoản vay, khoản vay hiển thị 'Đã hủy'
6. KH có thể truy cập icon FE Credit Cashloan và đăng ký khoản vay mới ngay lập tức (không bị chặn 24h)

**H/I**: HIGH / CRITICAL

**graph_refs**: `activity_flow:huy_hop_dong_vc_payday, status:cancelled_by_customer, business_rule:block_new_loan_after_cancel_24h, ui_screen:mh01_xem_hop_dong_truoc_ky, flow_step:14_1_cancel`

### TC #149 — (tiếp theo TC trước — merge col C)

**D (Trường hợp)**: TH: KH hủy HĐ khi khoản vay ĐÃ gửi sang đối tác thành công (đã có cert_success) - bị block 24h khi đăng ký vay mới (E14)

**E (Data test)**:
```
loan_status=pending_esigning, sub=cert_success (đã gửi đối tác thành công)
```

**F (Các bước)**:
1. Vào MH01 với khoản vay đã từng gửi sang đối tác (sub=cert_success)
2. Nhấn 'Hủy hợp đồng' → popup xác nhận
3. Nhấn 'Xác nhận'
4. Quan sát status
5. KH thử đăng ký vay mới trong vòng 24h kể từ thời điểm hủy

**G (Kết quả mong muốn)**:
1. MH01 hiển thị
2. Popup xác nhận hủy hiển thị
3. Server Vay update status=Cancelled, sub=Cancelled_contract_by_customer; ghi nhận timestamp hủy
4. App về MH QLKV, khoản vay hiển thị 'Đã hủy'
5. Khi KH thử đăng ký vay mới trong vòng 24h → hệ thống chặn không cho phép đăng ký, hiển thị thông báo từ chối (block 24h được enforce)

**H/I**: HIGH / CRITICAL

**Z (Notes)**: Cần BA confirm thông báo block 24h và mã lỗi nếu có (AMB-04)

**graph_refs**: `activity_flow:huy_hop_dong_vc_payday, status:cancelled_by_customer, business_rule:block_new_loan_after_cancel_24h, flow_step:14_1_cancel`

### TC #150 — (tiếp theo TC trước — merge col C)

**D (Trường hợp)**: TH: KH bấm 'Hủy hợp đồng', chọn 'Xác nhận' trên popup - status update đúng

**F (Các bước)**:
1. Vào MH01, nhấn 'Hủy hợp đồng'
2. Quan sát popup
3. Nhấn 'Xác nhận' trên popup
4. Quan sát Server Vay update status

**G (Kết quả mong muốn)**:
1. Popup "Hủy đăng ký" hiển thị
2. Popup có 2 button 'Xác nhận' và 'Đóng'
3. App gửi yêu cầu hủy lên Server Vay
4. Server Vay update khoản vay: status=Cancelled, sub=Cancelled_contract_by_customer; điều hướng về MH QLKV

**H/I**: HIGH / CRITICAL

**graph_refs**: `status:cancelled_by_customer, flow_step:14_1_cancel`

### TC #151 — (tiếp theo TC trước — merge col C)

**D (Trường hợp)**: TH: KH bấm 'Hủy hợp đồng', chọn 'Đóng' trên popup xác nhận - không hủy, giữ MH01

**F (Các bước)**:
1. Vào MH01, nhấn 'Hủy hợp đồng'
2. Quan sát popup
3. Nhấn 'Đóng' trên popup
4. Quan sát MH và status khoản vay

**G (Kết quả mong muốn)**:
1. Popup Xác nhận hủy hiển thị
2. Popup có 2 button
3. Popup đóng, App giữ lại MH01
4. Khoản vay vẫn ở status=pending_esigning (không bị hủy), KH có thể tiếp tục ký

**H/I**: MEDIUM / MAJOR

**graph_refs**: `status:pending_esigning, flow_step:14_1_cancel`

### TC #152 — (tiếp theo TC trước — merge col C)

**D (Trường hợp)**: TH: Sau khi hủy HĐ thành công, KH bấm back/quay về QLKV

**F (Các bước)**:
1. Hủy HĐ thành công (status=Cancelled)
2. Ở MH QLKV, kiểm tra hiển thị khoản vay đã hủy
3. Nhấn icon khoản vay đã hủy hoặc back/refresh
4. Quan sát MH

**G (Kết quả mong muốn)**:
1. Khoản vay đã có status=Cancelled, sub=Cancelled_contract_by_customer
2. MH QLKV hiển thị khoản vay với trạng thái 'Đã hủy'
3. App load lại MH QLKV
4. MH QLKV không cho phép vào lại MH01 Ký HĐ cho khoản vay đã hủy

**H/I**: MEDIUM / MINOR

**graph_refs**: `status:cancelled_by_customer, flow_step:14_1_cancel`

### TC #153 — (tiếp theo TC trước — merge col C)

**D (Trường hợp)**: TH: KH thử đăng ký vay mới sau khi hủy HĐ (đã gửi đối tác thành công) trong vòng 24h - block

**F (Các bước)**:
1. Setup khoản vay đã hủy 1h trước (sub=cert_success trước khi hủy)
2. KH truy cập icon FE Credit Cashloan thử đăng ký vay mới
3. Quan sát hành vi hệ thống

**G (Kết quả mong muốn)**:
1. Khoản vay đã hủy đúng 1h trước, timestamp hủy được lưu
2. KH bấm đăng ký vay mới
3. Hệ thống chặn không cho đăng ký, hiển thị thông báo không thể đăng ký vay mới (do chưa qua 24h kể từ thời điểm hủy)

**H/I**: HIGH / CRITICAL

**Z (Notes)**: Cần BA confirm nội dung popup và mã lỗi block 24h (AMB-04)

**graph_refs**: `business_rule:block_new_loan_after_cancel_24h, status:cancelled_by_customer`

### TC #154 — (tiếp theo TC trước — merge col C)

**D (Trường hợp)**: TH: KH đăng ký vay mới sau khi hủy HĐ đã quá 24h - cho phép đăng ký

**F (Các bước)**:
1. Setup khoản vay đã hủy 25h trước
2. KH truy cập icon dịch vụ đăng ký vay mới
3. Quan sát hành vi

**G (Kết quả mong muốn)**:
1. Khoản vay đã hủy 25h trước, timestamp hủy được lưu
2. KH bấm đăng ký vay mới
3. Hệ thống cho phép vào luồng đăng ký vay mới bình thường (block 24h đã qua)

**H/I**: MEDIUM / MAJOR

**graph_refs**: `business_rule:block_new_loan_after_cancel_24h`

### TC #155 — (tiếp theo TC trước — merge col C)

**D (Trường hợp)**: TH: khoản vay từ pending_esigning sang cancelled_by_customer sau khi KH hủy HĐ thành công

**E (Data test)**:
```
loan_status before=pending_esigning
```

**F (Các bước)**:
1. Setup khoản vay status=pending_esigning
2. KH thực hiện luồng hủy: vào MH01 → 'Hủy hợp đồng' → 'Xác nhận'
3. Query trạng thái khoản vay trên Server Vay sau khi hủy thành công
4. Verify giá trị status và sub

**G (Kết quả mong muốn)**:
1. Khoản vay được setup pending_esigning, sub=null
2. Luồng hủy chạy thành công, App về MH QLKV
3. Hệ thống/Server Vay trả về status hiện tại của khoản vay
4. status=Cancelled, sub=Cancelled_contract_by_customer (transition đúng, không bypass sang trạng thái khác)

**H/I**: HIGH / CRITICAL

**graph_refs**: `status:pending_esigning, status:cancelled_by_customer`

### TC #156 — (tiếp theo TC trước — merge col C)

**D (Trường hợp)**: TH: khoản vay từ pending_esigning sang Cancelled + sub=Cancelled_contract_by_customer khi KH hủy HĐ

**E (Data test)**:
```
loan_status_before=pending_esigning
```

**F (Các bước)**:
1. Khoản vay setup pending_esigning
2. KH thực hiện hủy HĐ trên MH01, xác nhận trên popup
3. Query status
4. Verify giá trị

**G (Kết quả mong muốn)**:
1. Khoản vay setup pending_esigning
2. Server Vay nhận yêu cầu hủy và update
3. Hệ thống trả về status hiện tại
4. status=Cancelled, sub=Cancelled_contract_by_customer (đúng transition)

**H/I**: HIGH / CRITICAL

**graph_refs**: `status:pending_esigning, status:cancelled_by_customer, flow_step:14_1_cancel`

### TC #157 — (tiếp theo TC trước — merge col C)

**D (Trường hợp)**: TH: KH hủy HĐ trên MH01 sau khi khoản vay đã gửi Loanorder thành công lần đầu (cert_success), sau đó cố đăng ký vay mới trong vòng 24h

**F (Các bước)**:
1. KH login App, có khoản vay pending_esigning đã gửi Loanorder thành công (sub=cert_success)
2. Vào MH01, nhấn Hủy hợp đồng (button luôn enable)
3. Tại Popup 'Hủy đăng ký', nhấn Xác nhận
4. Quan sát: khoản vay chuyển status, KH về MH QLKV
5. Trong vòng 24h kể từ thời điểm hủy, KH thử vào luồng Đăng ký vay mới VC Payday
6. Quan sát hệ thống có cho phép submit đăng ký vay mới hay không

**G (Kết quả mong muốn)**:
1. KH login thành công, khoản vay pending_esigning + cert_success
2. App điều hướng đến MH01, button Hủy hợp đồng enable
3. Popup xác nhận hủy hiển thị, click Xác nhận server cập nhật status=Cancelled, sub=Cancelled_contract_by_customer
4. App quay về MH QLKV, khoản vay hiển thị trạng thái đã hủy
5. KH vào luồng đăng ký vay mới - hệ thống phải chặn theo business_rule:block_new_loan_after_cancel_24h (E14)
6. Hệ thống hiển thị popup/thông báo chặn đăng ký vay mới (theo hành vi E14), không cho submit; sau 24h từ thời điểm hủy thì cho phép lại

**H/I**: HIGH / CRITICAL

**Z (Notes)**: OWASP Mobile Top 10 - M4 Auth / Business Logic. Cần BA confirm: nội dung message hiển thị khi block 24h (SRS không document text cụ thể). Tham chiếu E14 + business_rule:block_new_loan_after_cancel_24h (X=24h).

**graph_refs**: `business_rule:block_new_loan_after_cancel_24h, status:cancelled_by_customer, status:pending_esigning_cert_success`

### TC #158 — (tiếp theo TC trước — merge col C)

**D (Trường hợp)**: TH: KH cố bypass block 24h bằng cách thay đổi device/SIM/reinstall App sau khi hủy HĐ thành công

**F (Các bước)**:
1. Thực hiện hủy HĐ trên Device 1 (đã gửi Loanorder thành công) → status=Cancelled, sub=Cancelled_contract_by_customer
2. Trên Device 2 (đã clear data hoặc thiết bị mới), login cùng tài khoản KH (cùng CCCD)
3. Trong vòng 24h kể từ hủy, vào luồng Đăng ký vay mới
4. Submit form đăng ký vay
5. Quan sát: server có check theo CCCD/customer ID hay theo device ID
6. Lặp lại với scenario thay SIM giữ SĐT, hoặc uninstall/reinstall App

**G (Kết quả mong muốn)**:
1. Khoản vay trên Device 1 đã hủy thành công, status=Cancelled
2. Device 2 login thành công với cùng tài khoản KH
3. KH thấy luồng Đăng ký vay mới, có thể fill form
4. Server phải enforce block 24h server-side theo CCCD/customer ID, không theo device ID; reject request đăng ký vay mới
5. Hệ thống hiển thị thông báo chặn đăng ký vay mới (E14), không cho submit
6. Mọi biến thể device/SIM/reinstall đều bị enforce block - không có cách bypass

**H/I**: HIGH / CRITICAL

**Z (Notes)**: OWASP Mobile Top 10 - M4 Auth / Business Logic bypass. Cần BA confirm: block enforce theo CCCD hay customer ID hay SĐT. Critical bug nếu bypass được bằng device change.

**graph_refs**: `business_rule:block_new_loan_after_cancel_24h, status:cancelled_by_customer`
