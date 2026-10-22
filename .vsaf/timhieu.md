Task: Phân tích và giải thích Skill autotest-pw-web
1. Mục tiêu
Tôi là Automation Tester, đang tìm hiểu cách xây dựng và áp dụng AI Skills vào quá trình phát triển automation test.
Hãy phân tích Skill autotest-pw-web để giúp tôi hiểu rõ:
•	Kiến trúc tổng thể của skill và framework automation test được tạo ra.
•	Cách Playwright kết hợp với Cucumber trong framework kiểm thử Web.
•	Vai trò, chức năng và mối quan hệ giữa các file, folder được skill tạo ra hoặc sử dụng.
2. Source cần phân tích
Đọc trực tiếp source code tại đường dẫn:
/Users/hieunv67/auto/demo_playwright_web/.claude/skills/autotest-pw-web
Bắt buộc đọc file SKILL.md đầu tiên:
/Users/hieunv67/auto/demo_playwright_web/.claude/skills/autotest-pw-web/SKILL.md
Sau khi hiểu nội dung SKILL.md, tiếp tục kiểm tra các file và folder liên quan bên trong skill để làm rõ cách skill được thiết kế và hoạt động.
Nếu skill tham chiếu đến các file template, script, configuration, reference hoặc skill phụ khác, hãy đọc những file đó khi cần thiết để xác minh cách triển khai thực tế.
Không chỉ dựa vào tên file để suy đoán chức năng. Hãy kiểm tra nội dung source code trước khi đưa ra kết luận.
3. Nội dung phân tích
Phần 1: Tổng quan về Skill
Giải thích:
•	Skill autotest-pw-web là gì và giải quyết vấn đề gì?
•	Skill được kích hoạt hoặc sử dụng trong trường hợp nào?
•	Skill cung cấp những workflow, quy tắc và hướng dẫn nào?
Phân biệt rõ:
1.	AI Skill: hướng dẫn AI thực hiện công việc.
2.	Automation framework: mã nguồn và cấu trúc được sử dụng để viết, quản lý và chạy test.
3.	Test cases: các kịch bản kiểm thử cụ thể của ứng dụng.
Phần 2: Phân tích kiến trúc tổng thể của framework
Dựa trên source code và các template thực tế, trình bày kiến trúc framework mà skill hướng đến.
Làm rõ:
•	Framework sử dụng Playwright và Cucumber như thế nào?
•	Vì sao kết hợp hai công cụ này thay vì chỉ sử dụng Playwright Test?
•	Cucumber, Gherkin, Playwright và TypeScript (nếu có) đóng vai trò gì?
•	Các thành phần chính trong framework và trách nhiệm của từng thành phần.
•	Luồng gọi giữa các thành phần khi một test case được thực thi.
•	Cách tổ chức Page Object, Step Definitions, Feature Files, Hooks, Fixtures, configuration và các thành phần khác nếu thực sự có trong source.
Hãy trình bày sơ đồ kiến trúc bằng Mermaid nếu phù hợp. Sơ đồ phải phản ánh source code thực tế, không tự thêm thành phần chưa được xác minh.
Phần 4: Giải thích chi tiết từng file và folder
Đây là phần quan trọng nhất.
Lập bảng gồm các cột:
File/Folder	Vai trò	Chức năng cụ thể	Được gọi hoặc sử dụng bởi	Liên hệ với các thành phần khác
Yêu cầu:
•	Phân tích tất cả file và folder có ý nghĩa trong phạm vi skill.
•	Phân biệt file hướng dẫn AI, file cấu hình, file template, script hỗ trợ và mã nguồn framework.
•	Với mỗi file quan trọng, giải thích nó giải quyết vấn đề gì và vì sao cần có.
•	Chỉ rõ file nào được tạo ra khi khởi tạo project, file nào được sinh ra khi viết test và file nào chỉ được sử dụng lúc chạy test, nếu source cho phép xác định.
•	Nếu một file tham chiếu hoặc phụ thuộc vào file khác, giải thích mối quan hệ đó.
•	Nếu có file trùng chức năng hoặc có vẻ dư thừa, chỉ ra và giải thích dựa trên source.
Đưa ra một ví dụ luồng thực thi xuyên suốt từ một scenario trong Feature File đến câu lệnh Playwright thực sự thao tác trên Web.
Phần 6: Cơ chế sinh file và sử dụng Skill
Phân tích cách skill hướng dẫn AI tạo hoặc chỉnh sửa framework.
Làm rõ:
•	Khi nhận yêu cầu tạo automation test, AI sẽ dựa vào những quy tắc nào?
•	Skill có quy định template, naming convention, cấu trúc folder hoặc coding convention không?
•	Những file nào được tạo mới, file nào được cập nhật và file nào được tái sử dụng?
•	Có cơ chế kiểm tra file tồn tại, tránh ghi đè hoặc xác thực code hay không?
•	Sau khi tạo test, framework được chạy và xác minh kết quả bằng cách nào?
•	Có workflow sửa lỗi khi test thất bại hay không?
4. Yêu cầu về cách trình bày
•	Viết bằng tiếng Việt, giữ nguyên tên kỹ thuật và tên file bằng tiếng Anh.
•	Trình bày từ tổng quan đến chi tiết, từ kiến trúc đến từng file.
•	Giải thích rõ ràng, dễ hiểu nhưng đủ sâu về mặt kỹ thuật.
•	Dùng ví dụ code ngắn trích từ source khi cần thiết, kèm đường dẫn file và giải thích.
•	Dùng bảng để tổng hợp file/folder và Mermaid để mô tả luồng hoạt động khi phù hợp.
•	Phân biệt rõ thông tin đã xác minh, suy luận và đề xuất.
•	Không bịa ra file, chức năng, quy trình hoặc khả năng mà source không thể hiện.
•	Không bỏ qua các file quan trọng chỉ vì chúng không phải file .ts.
•	Không chỉnh sửa source code; nhiệm vụ chỉ là đọc, phân tích và giải thích.
5. Cấu trúc đầu ra bắt buộc
Trình bày kết quả theo thứ tự:
1.	Tóm tắt nhanh về Skill autotest-pw-web.
2.	Kiến trúc tổng thể và sơ đồ thành phần.
3.	Công nghệ được sử dụng và vai trò của từng công nghệ.
4.	Luồng thực thi một test case từ đầu đến cuối.
5.	Bảng giải thích chi tiết từng file và folder.
6.	Ví dụ thực tế về Feature File → Step Definitions → Page Object → Playwright.
7.	Cơ chế AI Skill tạo, tái sử dụng và kiểm tra file.
8.	Đánh giá ưu điểm, hạn chế và hướng cải tiến.
9.	Kết luận: những kiến thức Automation Tester cần nắm để sử dụng và mở rộng skill hiệu quả.
Hãy bắt đầu bằng việc đọc SKILL.md, sau đó khám phá source liên quan và mới tiến hành viết báo cáo. Nếu không truy cập được đường dẫn hoặc thiếu file, hãy thông báo chính xác vấn đề thay vì tự suy đoán nội dung.

