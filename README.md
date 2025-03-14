# Hệ thống quản lý kho hàng trung chuyển

## Cấu trúc thư mục và ý nghĩa

```
main/
├── src/              # Source code - Chứa mã nguồn chính của ứng dụng
│   ├── js/          # JavaScript - Chứa mã xử lý, logic của ứng dụng
│   │   ├── core/    # Core - Chứa các chức năng cốt lõi, nền tảng
│   │   ├── modules/ # Modules - Chứa các module chức năng riêng biệt
│   │   └── utils/   # Utilities - Chứa các hàm tiện ích dùng chung
│   ├── css/         # Stylesheets - Chứa các file định dạng giao diện
│   └── pages/       # Pages - Chứa các trang HTML của ứng dụng
├── docs/            # Documentation - Chứa tài liệu hướng dẫn, tham khảo
└── tests/           # Tests - Chứa các file kiểm thử
```

## Core Modules
- Authentication (auth.js)
- Logistics Management (logistics.js)
- Inventory Tracking (inventory.js)
- Shipping Management (shipping.js)
- Reporting (reports.js)

## Features
- Quản lý nhập/xuất kho
- Theo dõi vận chuyển
- Quản lý lô hàng
- Báo cáo thống kê
- Quản lý người dùng

## Tech Stack
- HTML5
- CSS3
- JavaScript (ES6+)
- FontAwesome 5.15.4
