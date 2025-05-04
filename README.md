# Hệ thống quản lý kho hàng trung chuyển

## Cấu trúc thư mục

```
main
├── core/
│   └── python/
│       ├── app.py
│       ├── models.py
│       ├── reset_db.py
│       ├── check_users.py
│       └── utils/
│           └── __init__.py
├── src/
│   ├── auth/
│   │   ├── login/
│   │   │   ├── login.css
│   │   │   ├── login.html
│   │   │   └── login.js
│   │   └── signup/
│   │       ├── signup.css
│   │       ├── signup.html
│   │       └── signup.js
│   ├── css/
│   │   ├── common.css
│   │   ├── layout.css
│   │   └── themes.css
│   ├── dashboard/
│   │   ├── dashboard.js
│   │   ├── main.css
│   │   └── main.html
│   ├── main/
│   │   ├── admin/
│   │   │   ├── management.css
│   │   │   ├── management.html
│   │   │   └── management.js
│   │   └── user/
│   │       ├── inventory.css
│   │       ├── inventory.html
│   │       └── inventory.js
│   ├── notification/
│   │   ├── notification-dropdown.css
│   │   └── notification.js
│   ├── pages/
│   │   └── error.html
│   ├── profile/
│   │   ├── profile.css
│   │   ├── profile.html
│   │   └── profile.js
│   └── settings/
│       ├── settings.css
│       ├── settings.html
│       └── settings.js
├── config/
│   └── client_secret.json
├── requirements.txt
└── README.md
```

## Công nghệ sử dụng

- **Backend:** Python (Flask)
- **Frontend:** HTML, CSS, JavaScript

## Tính năng chính

- Quản lý nhập/xuất kho.
- Quản sản phẩm.
- Quản lý người dùng và phân quyền.
- Hệ thống xác thực (Đăng nhập, Đăng ký).
- Quản lý hồ sơ người dùng.
- Cài đặt ứng dụng.
- Thông báo.

## Cài đặt và chạy ứng dụng

1.  **Cài đặt Python và pip:** Đảm bảo bạn đã cài đặt Python và trình quản lý gói pip.
2.  **Cài đặt các thư viện Python:**
    ```bash
    pip install -r requirements.txt
    ```
3.  **Thiết lập cơ sở dữ liệu:** Chạy script để tạo và thiết lập cơ sở dữ liệu ban đầu.
    ```bash
    python core/python/reset_db.py
    ```
4.  **Chạy ứng dụng:**
    ```bash
    python core/python/app.py
    ```

## Đóng góp

Hướng dẫn đóng góp sẽ được bổ sung sau.

## Giấy phép

Thông tin giấy phép sẽ được bổ sung sau.
