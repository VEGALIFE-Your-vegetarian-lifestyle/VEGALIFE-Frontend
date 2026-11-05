Admin Category Management (CRUD) dành riêng cho cổng quản trị VEGALIFE (SCREEN_154), bám sát 100% cấu trúc schema của bảng dữ liệu Category:

1. Ánh xạ các trường dữ liệu (Database Schema Mapping)
category_id (UUID - PK, Not Null): Hiển thị dưới dạng mã băm UUID thu gọn (8e2b1c40...e101) kèm icon một chạm copy nhanh mã định danh và thông tin nguyên vẹn.
name (VARCHAR(100), Not Null): Tên danh mục thực tế (Pure Vegan Essentials, High-Protein Plant Fuel, Raw & Living Vitality, Quick 20-Min Dinners, Keto Vegan Fusion, Gluten-Free Herb Bowls), kèm số lượng nội dung liên kết (Recipes, Blogs, Videos).
description (TEXT, Allow Null): Hiển thị mô tả chi tiết, hỗ trợ hiển thị tóm lược sạch sẽ không làm vỡ cấu trúc dòng.
created_at (DATETIME, Not Null): Hiển thị ngày và giờ tạo danh mục theo định dạng tiêu chuẩn UTC.
deleted_at (DATETIME, Allow Null):
Trạng thái Hoạt động (NULL): Hiển thị badge xanh ● Active.
Trạng thái Xóa mềm (≠ NULL): Hiển thị badge xám/cam Soft Deleted kèm mốc thời gian xóa cụ thể (ví dụ: 2024-03-01 17:30:12).
2. Các tính năng & Khối giao diện CRUD đầy đủ
Thanh chỉ số tổng quan (Metric KPI Cards):

Total Categories: 18 danh mục đã tạo.
Active Categories: 15 danh mục đang phát hành thực tế.
Soft Deleted / Archived: 3 danh mục đã xóa mềm (có thể phục hồi bất cứ lúc nào).
Associated Content: 428 bài viết, công thức và video thuộc các danh mục.
Bộ lọc & Điều hướng CRUD chuyên nghiệp:

Bộ lọc nhanh theo trạng thái: Tab All (18), Active (15), và Soft Deleted (3) giúp Admin lọc riêng các danh mục đã xóa mềm hoặc đang hoạt động.
Thanh tìm kiếm & Sắp xếp: Tìm kiếm theo tên hoặc UUID; sắp xếp theo Newest Created (created_at DESC), tên A-Z hoặc số lượng bài viết.
Nút hành động chính: Nút xanh thương hiệu "+ Create New Category" và nút "Export CSV".
Bảng dữ liệu & Thao tác dòng (Row Actions):

Đối với danh mục Active: Hỗ trợ nút chỉnh sửa Edit, xem nội dung liên quan và nút Soft Delete (Archive).
Đối với danh mục Soft Deleted: Hỗ trợ nút Restore (Khôi phục trạng thái bằng cách đặt lại deleted_at = NULL) và tùy chọn xóa vĩnh viễn (Permanent Delete).
Phân trang chuẩn mực (Pagination: 1, 2, 3, Next) và hiển thị số bản ghi.
Khung Navigation Shell chuẩn Admin:

Sidebar điều hướng cố định: Dashboard, Categories (đang chọn active), Recipes & Posts, Vegan Places, Users, Analytics, Settings.
Header quản trị: Logo VEGALIFE, nhãn ADMIN PORTAL, thanh tìm kiếm toàn hệ thống và avatar tài khoản Super Admin.