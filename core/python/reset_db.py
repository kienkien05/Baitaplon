from app import app, db
from models import User
from werkzeug.security import generate_password_hash

def reset_database():
    with app.app_context():
        # Drop all tables
        db.drop_all()
        # Create all tables
        db.create_all()

        # Create admin user
        admin = User(
            username='admin0512',
            email='admin@example.com',
            password=generate_password_hash('k051205'),
            is_admin=True
        )
        db.session.add(admin)
        db.session.commit()

        print("Database has been reset successfully!")
        print("Admin user created:")
        print("Username: admin0512")
        print("Password: k051205")

if __name__ == "__main__":
    reset_database()