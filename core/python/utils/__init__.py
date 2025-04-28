import pyodbc
from app import CAU_HINH_CSDL
print("Đã nhập cấu hình cơ sở dữ liệu từ app.py")

def view_database():
    try:
        conn = pyodbc.connect(
            f"DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={CAU_HINH_CSDL['may_chu']};DATABASE={CAU_HINH_CSDL['co_so_du_lieu']};Trusted_Connection=yes"
        )
        cursor = conn.cursor()
        
        
        print("\n=== BẢNG NGƯỜI DÙNG ===")
        cursor.execute("SELECT id, username, email, password, is_admin FROM [user]")
        users = cursor.fetchall()
        
        if not users:
            print("Không tìm thấy người dùng nào trong cơ sở dữ liệu.")
        else:
            print(f"{'ID':<5} {'Tên đăng nhập':<20} {'Email':<30} {'Mã hóa mật khẩu (rút gọn)':<30} {'Quản trị'}")
            print("-" * 90)
            for user in users:
                password_hash = user.password[:20] + "..." if user.password else "Không có"
                is_admin = "Có" if user.is_admin else "Không"
                print(f"{user.id:<5} {user.username:<20} {user.email:<30} {password_hash:<30} {is_admin}")
        
        
        cursor.execute()
        other_tables = cursor.fetchall()
        
        if other_tables:
            
            pass

    except Exception as e:
        print(f"Lỗi kết nối cơ sở dữ liệu: {str(e)}")
    finally:
        if 'conn' in locals():
            conn.close()



if __name__ == "__main__":
    view_database()
