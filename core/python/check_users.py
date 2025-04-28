from app import app, User, db
from werkzeug.security import check_password_hash

def check_users():
    with app.app_context():
        users = User.query.all()
        print("\nAll users in database:")
        print("-" * 70)
        print(f"{'ID':<5} {'Username':<20} {'Email':<30} {'Is Admin':<10}")
        print("-" * 70)
        for user in users:
            print(f"{user.id:<5} {user.username:<20} {user.email:<30} {str(user.is_admin):<10}")
        print("-" * 70)
        print(f"Total users: {len(users)}")

def verify_user_credentials(username, password):
    with app.app_context():
        user = User.query.filter_by(username=username).first()
        if user and check_password_hash(user.password, password):
            print("\nCredentials are valid!")
            return True
        print("\nInvalid credentials!")
        return False

def find_user(username=None, email=None):
    with app.app_context():
        if username:
            user = User.query.filter_by(username=username).first()
        elif email:
            user = User.query.filter_by(email=email).first()
        else:
            print("Please provide either username or email")
            return

        if user:
            print("\nUser found:")
            print("-" * 50)
            print(f"ID: {user.id}")
            print(f"Username: {user.username}")
            print(f"Email: {user.email}")
            print(f"Is Admin: {user.is_admin}")
            print("-" * 50)
        else:
            print("\nUser not found!")

if __name__ == "__main__":
    print("\n=== Database User Management ===")
    print("1. List all users")
    print("2. Verify user credentials")
    print("3. Find user by username")
    print("4. Find user by email")
    
    choice = input("\nEnter your choice (1-4): ")
    
    if choice == "1":
        check_users()
    elif choice == "2":
        username = input("Enter username: ")
        password = input("Enter password: ")
        verify_user_credentials(username, password)
    elif choice == "3":
        username = input("Enter username to find: ")
        find_user(username=username)
    elif choice == "4":
        email = input("Enter email to find: ")
        find_user(email=email)
    else:
        print("Invalid choice!")