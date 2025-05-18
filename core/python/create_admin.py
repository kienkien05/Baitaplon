from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from werkzeug.security import generate_password_hash
from urllib.parse import quote_plus
from datetime import datetime
import os

# Database configuration (copied from app.py)
username = quote_plus("vletrial002")
password = quote_plus("@@123456@@")
Mongo_uri = f"mongodb+srv://{username}:{password}@cluster0.zg87ay1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

# Admin user details
admin_username = "admin01"
admin_password = "taolabo"

# MongoDB connection
try:
    client = MongoClient(
        Mongo_uri,
        server_api=ServerApi('1'),
        tls=True,
        tlsAllowInvalidCertificates=True,
        connectTimeoutMS=5000,
        socketTimeoutMS=5000
    )
    client.admin.command('ping')
    print("Successfully connected to MongoDB!")

    db = client["Database_test_01"]
    users_collection = db['users']

    # Check if admin user already exists
    existing_admin = users_collection.find_one({"username": admin_username})
    if existing_admin:
        print(f"Admin user '{admin_username}' already exists.")
    else:
        # Create new admin user document
        new_admin_user = {
            "username": admin_username,
            "email": f"{admin_username}@example.com", # Placeholder email
            "password": generate_password_hash(admin_password),
            "phone": None,
            "is_admin": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }

        # Insert new admin user into MongoDB
        result = users_collection.insert_one(new_admin_user)

        if result.inserted_id:
            print(f"Admin user '{admin_username}' created successfully with ID: {result.inserted_id}")
        else:
            print(f"Failed to create admin user '{admin_username}'.")

except Exception as e:
    print(f"Failed to connect to MongoDB or create admin user: {str(e)}")
    exit(1)