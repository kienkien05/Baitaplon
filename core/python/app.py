from flask import Flask, request, jsonify, render_template, redirect, url_for, session
#from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
import os
import re
from datetime import datetime, timedelta
from typing import TypeVar, Type, List, Dict, Union, Any
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from bson import ObjectId 
import uuid
from urllib.parse import quote_plus
import ssl



T = TypeVar('T')  # what is this ? -> TypeVar is a generic type that can be used to define a type that can be any type


# Database configuration
CAU_HINH_CSDL = {
    'may_chu': 'localhost\\SQLEXPRESS',
    'co_so_du_lieu': 'user_db', 
    'xac_thuc_windows': 'yes'  
}

# App initialization
app = Flask(__name__,
    template_folder='../../src',
    static_folder='../../src',
    static_url_path=''
)

# Basic configurations (Session and Secrurity)
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
app.config['SECRET_KEY'] = os.urandom(24)
app.config['SESSION_COOKIE_SECURE'] = False
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)

# CORS configuration
CORS(app, supports_credentials=True) # Allow credentials in CORS requests


# Database setup
"""app.config['SQLALCHEMY_DATABASE_URI'] = f"mssql+pyodbc:///?odbc_connect=DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={CAU_HINH_CSDL['may_chu']};DATABASE={CAU_HINH_CSDL['co_so_du_lieu']};Trusted_Connection=yes"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)
"""


username = quote_plus("vletrial002")  # Replace with your actual username
password = quote_plus("@@123456@@")  # Replace with your actual password
# MongoDB connection
Mongo_uri = f"mongodb+srv://{username}:{password}@cluster0.zg87ay1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
# Update MongoDB connection with proper error handling
try:
    client = MongoClient(
        Mongo_uri,
        server_api=ServerApi('1'),
        tls=True,
        tlsAllowInvalidCertificates=True,
        connectTimeoutMS=5000, # ensure connection timout
        socketTimeoutMS=5000    
    )
    # Test connection
    client.admin.command('ping') # ping is a command to check if the server is reachable
    print("Successfully connected to MongoDB!")
    #Database_test_01
    db = client["Database_test_01"]  # connect to test Database
    users_collection = db['users'] 
    products_collection = db['products']
    notifications_collection = db['notifications']
except Exception as e:
    print(f"Failed to connect to MongoDB: {str(e)}")
    exit(1)

# 3 collection -> User, Product, Notification


"""# Models
class Notification(db.Model):  # type: ignore
    __tablename__ = 'notification'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    message = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=db.func.now())
    
    user = db.relationship('User', backref=db.backref('notifications', lazy=True))

class User(db.Model):  # type: ignore
    __tablename__ = 'user'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    name = db.Column(db.String(80), nullable=True)
    date_of_birth = db.Column(db.Date, nullable=True)
    address = db.Column(db.String(255), nullable=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    phone = db.Column(db.String(15), nullable=True)  # Removed unique constraint from nullable field
    is_admin = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Product(db.Model):  # type: ignore
    __tablename__ = 'product'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    price = db.Column(db.Float, nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    source = db.Column(db.String(255), nullable=True)
    category = db.Column(db.String(100), nullable=True)
    description = db.Column(db.Text, nullable=True)
    min_stock = db.Column(db.Integer, default=0)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.now())
    user = db.relationship('User', backref=db.backref('products', lazy=True))
"""

# Validation functions
def validate_username(username: str) -> tuple[bool, str]:
    if not username or len(username) < 3 or len(username) > 20:
        return False, 'Tên đăng nhập phải từ 3-20 ký tự'
    
    if not re.match(r'^[a-zA-Z0-9_]+$', username):
        return False, 'Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới'
    
    # old
    """if User.query.filter_by(username=username).first():  
        return False, 'Tên đăng nhập đã tồn tại' """    
    # new
    if users_collection.find_one({"username": username}):
        return False,'Tên đăng nhập đã tồn tại'

    return True, ''

def validate_email(email: str) -> tuple[bool, str]:
    if not email or len(email) > 120:
        return False, 'Email không được để trống và không quá 120 ký tự'
    
    if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
        return False, 'Email không hợp lệ'
    #old
    """if User.query.filter_by(email=email).first():
        return False, 'Email đã được đăng ký'"""
    #new
    if users_collection.find_one({"email":email}):
        return False, 'Email đã được đăng ký'
    
    return True, ''

def validate_phone(phone: str) -> tuple[bool, str]:
    if not phone:
        return True, ''
        
    if not re.match(r'^[0-9]{10}$', phone):
        return False, 'Số điện thoại phải có 10 chữ số'
    # old
    """
    if User.query.filter_by(phone=phone).first():
        return False, 'Số điện thoại đã được đăng ký'"""
    # new
    if users_collection.find_one({"phone":phone}):
        return  False, 'Số điện thoại đã được đăng ký'

    return True, ''

# Decorators -> Problem : if the sessionis expired, the user will be redirected to the login page
'''
def login_required(f):  # ensure user is logged in
    @wraps(f)
    def decorated_function(*args: Any, **kwargs: Any) -> Any:
        if 'user_id' not in session:  # when user login -> session['user_id'] = user['_id'] 
            return redirect(url_for('login_page'))
        return f(*args, **kwargs)  # call the original function
    return decorated_function
'''
def login_required(f):
    @wraps(f) # used to preserve the original function's metadata
    def decorated_func(*args, **kwargs):
        if 'user_id' not in session:
            # if the request is for an API endpoint -> return json instead of redirect
            if request.path.startswith('/api/'): # is this API endpoint?
                return jsonify({'error': 'Authentication required'}), 401 # return if session expired
            return redirect(url_for('login_page')) # if not API endpoint -> redirect to login page
        return f(*args, **kwargs) # call the original function
    return decorated_func

# decorator to check if user is admin
def admin_required(f):
    @wraps(f)
    def decorated_function(*args: Any, **kwargs: Any) -> Any:
        if 'user_id' not in session or not session.get('is_admin'):  # when user login as admin -> session['is_admin'] = True
            return jsonify({'error': 'Admin access required'}), 403  
        return f(*args, **kwargs)                                     
    return decorated_function

# Auth Routes
@app.route('/')
def root():
    return redirect(url_for('login_page'))


@app.route('/auth/signup', methods=['GET'])
def signup_page():
    if 'user_id' in session:
        if session.get('is_admin'): # session['is_admin'] = True -> session.get('is_admin') = True
            return redirect(url_for('admin_management'))
        return redirect(url_for('inventory_page'))
    return render_template('auth/signup/signup.html')

@app.route('/auth/signup', methods=['POST'])  # Flask receive POST request from auth/signup when user enter username, email, password
def signup():
    data = request.get_json()  # request.get_json() -> get JSON data from request body
    if not data:
        return jsonify({'success': False, 'error': 'Invalid JSON'}), 400

    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    phone = data.get('phone')

    if not username or not email or not password: # when user not enter username, email, password
        return jsonify({'success': False, 'error': 'Missing required fields'}), 400

    # Validate fields
    username_valid, username_error = validate_username(username)  # check valid 
    if not username_valid:
        return jsonify({'success': False, 'error': username_error}), 400

    email_valid, email_error = validate_email(email)
    if not email_valid:
        return jsonify({'success': False, 'error': email_error}), 400

    if phone:
        phone_valid, phone_error = validate_phone(phone)
        if not phone_valid:
            return jsonify({'success': False, 'error': phone_error}), 400

    try:
        # Create new user document  -> from data.get_json()
        new_user = {
            "username": username,
            "email": email,
            "password": generate_password_hash(password),
            "plain_password": password, # Storing plain text password (for demonstration purposes only - NOT RECOMMENDED FOR PRODUCTION)
            "phone": phone,
            "is_admin": False,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }

        # Insert into new user into MongoDB
        result = users_collection.insert_one(new_user)
        
        if not result.inserted_id:  # result.inserted_id -> Unique Id (ObjectId) auto generated by MongoDB
            raise Exception("Failed to insert user document")

        print(f"New user created with ID: {result.inserted_id}") 

        # Notify admins about new registration
        try:
            admins = list(users_collection.find({"is_admin": True}))
            if admins:
                for admin in admins:
                    notification = {
                        "user_id": admin["_id"],
                        "title": 'Người dùng mới đăng ký',
                        "message": f'Tài khoản mới được tạo với tên đăng nhập: {username}',
                        "is_read": False,
                        "created_at": datetime.utcnow()
                    }
                    notifications_collection.insert_one(notification)
        except Exception as notify_error:
            print(f"Error sending admin notifications: {str(notify_error)}")
            # Continue even if notification fails
        
        return jsonify({'success': True, 'message': 'Registration successful'})

    except Exception as e:
        print(f"Error in signup: {str(e)}")
        return jsonify({'success': False, 'error': 'Registration failed'}), 500

@app.route('/auth/login', methods=['GET'])
def login_page():
    if 'user_id' in session: 
        if session.get('is_admin'): 
            return redirect(url_for('admin_management'))
        return redirect(url_for('inventory_page'))
    return render_template('auth/login/login.html')

# route check login(admin/user) -> when user click login button -> send request to this route ->send data to backend
@app.route('/auth/login', methods=['POST'])  # method POST: get info to check (from FE -> js collect form data -> send to BE(Flask))
def login_api():
    data = request.get_json() # get data from request body (from frontend and js send to backend)
    if not data:
        return jsonify({'success': False, 'error': 'Invalid JSON'}), 400
        
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'success': False, 'error': 'Vui lòng điền đầy đủ thông tin!'}), 400

    try:
        # Find user in MongoDB 
        user = users_collection.find_one({"username": username})
        
        if not user or not check_password_hash(user['password'], password): # hash password check with password in database
            return jsonify({'success': False, 'error': 'Tên đăng nhập hoặc mật khẩu không đúng!'}), 401

        # Set session data using MongoDB document fields
        session['user_id'] = str(user['_id'])  # Convert ObjectId to string
        session['is_admin'] = user.get('is_admin', False)
        session['username'] = user['username']
        session.permanent = True  # Set session to be permanent (optional) -> session will be persist for duration set (PERMANENT_SESSION_LIFETIME)
        # why need set session -> because when user login, we need to store user info in session to use later
        
        if user.get('is_admin'):
            return jsonify({'success': True, 'redirect': '/main/admin/management'}), 200
        return jsonify({'success': True, 'redirect': '/main/user/inventory'}), 200

    except Exception as e:
        print(f"Login error: {str(e)}")
        return jsonify({'success': False, 'error': 'Có lỗi xảy ra khi đăng nhập!'}), 500

@app.route('/auth/logout')
def logout():
    session.clear()
    return redirect(url_for('login_page'))

# Main routes
@app.route('/profile')
@login_required # login_required -> if user not login -> not allow to access this page
def profile_page():
    user = users_collection.find_one({"_id": ObjectId(session['user_id'])}) 
    # session lưu trữ id của user (session của môi người là khác nhau) 
    if not user: # if user not found  -> user have not login 
        session.clear()
        return redirect(url_for('login_page'))
    
    # else user found -> get user info from database
    # prepare user data to send to frontend (display in profile page)
    user_data = { # 
        'username': user['username'],
        'email': user['email'],
        'name': user.get('name'),
        'date_of_birth': user.get('date_of_birth'),
        'phone': user.get('phone'),
        'address': user.get('address'),
        'is_admin': user.get('is_admin', False)
    }
    
    if request.headers.get('Accept') == 'application/json':
        return jsonify({'user': user_data})
    return render_template('profile/profile.html', user=user_data) # user is variable to send to frontend
    #<span id="name">{{ user.name if user.name else '---' }}</span> -> use user variable to get name

@app.route('/api/check-username', methods=['POST'])
def check_username_exists():
    data = request.get_json()
    username = data.get('username')
    if not username:
        return jsonify({'exists': False})
    
    # Updated to use MongoDB
    existing_user = users_collection.find_one({
        "username": username,
        "_id": {"$ne": ObjectId(session.get('user_id'))}  # Exclude current user
    })
    
    return jsonify({'exists': existing_user is not None})

@app.route('/api/check-email', methods=['POST'])
def check_email_exists():
    data = request.get_json()
    email = data.get('email')
    if not email:
        return jsonify({'exists': False})
    
    # Updated to use MongoDB
    existing_user = users_collection.find_one({
        "email": email,
        "_id": {"$ne": ObjectId(session.get('user_id'))}  # Exclude current user
    })
    
    return jsonify({'exists': existing_user is not None})

@app.route('/settings')
@login_required
def settings_page():
    user = users_collection.find_one({"_id": ObjectId(session['user_id'])})
    if not user:
        session.clear()
        return redirect(url_for('login_page'))
    
    # prepare user data to send to frontend (display in settings page)
    user_data = {
        'username': user['username'],
        'email': user['email'],
        'name': user.get('name', ''),
        'date_of_birth': user.get('date_of_birth', '').strftime('%Y-%m-%d') if user.get('date_of_birth') else '',
        'phone': user.get('phone', ''),
        'address': user.get('address', ''),
        'is_admin': user.get('is_admin', False)
    }
    
    if request.headers.get('Accept') == 'application/json':
        return jsonify({'success': True, 'user': user_data})
    return render_template('settings/settings.html', user=user_data)

@app.route('/api/profile/update', methods=['POST'])  # receive data from settings page(settings.js)
@login_required
def update_profile(): 
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'error': 'Invalid JSON'}), 400

    try:
        user = users_collection.find_one({"_id": ObjectId(session['user_id'])})
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404

        update_fields = {} # disctionnary to store fields to update

        # Handle email update
        if 'email' in data and data['email']:
            new_email = data['email'].strip()
            if new_email != user['email']:
                # Check if email is already taken by another user
                existing_user = users_collection.find_one({
                    "email": new_email,
                    "_id": {"$ne": ObjectId(session['user_id'])}
                })
                if existing_user:
                    return jsonify({'success': False, 'error': 'Email đã được sử dụng'}), 400
                update_fields['email'] = new_email

        # Handle name update
        if 'name' in data:
            name = data['name'].strip()
            if name and len(name) < 2:
                return jsonify({'success': False, 'error': 'Tên phải có ít nhất 2 ký tự'}), 400
            update_fields['name'] = name

        # Handle phone update
        if 'phone' in data:
            phone = data['phone'].strip() if data['phone'] else None
            if phone:
                if not re.match(r'^[0-9]{10}$', phone):
                    return jsonify({'success': False, 'error': 'Số điện thoại không hợp lệ'}), 400
                # Check if phone is already taken
                existing_user = users_collection.find_one({
                    "phone": phone,
                    "_id": {"$ne": ObjectId(session['user_id'])}
                })
                if existing_user:
                    return jsonify({'success': False, 'error': 'Số điện thoại đã được sử dụng'}), 400
            update_fields['phone'] = phone

        # Handle address update
        if 'address' in data:
            update_fields['address'] = data['address'].strip() 

        # Handle date of birth update
        if 'date_of_birth' in data and data['date_of_birth']:
            try:
                dob = datetime.strptime(data['date_of_birth'], '%Y-%m-%d')
                update_fields['date_of_birth'] = dob
            except ValueError:
                return jsonify({'success': False, 'error': 'Ngày sinh không hợp lệ'}), 400

        if update_fields: # if update_fields is not empty
            update_fields['updated_at'] = datetime.utcnow() # update time when user update profile
            # Update user in database
            result = users_collection.update_one(
                {"_id": ObjectId(session['user_id'])},
                {"$set": update_fields} # $set is a MongoDB operator to update fields
            )

            if result.modified_count > 0: # if update success -> modified_count > 0 
                # Fetch updated user data
                updated_user = users_collection.find_one({"_id": ObjectId(session['user_id'])})
                return jsonify({
                    'success': True,
                    'message': 'Cập nhật thông tin thành công',
                    'user': {
                        'username': updated_user['username'],
                        'email': updated_user['email'],
                        'name': updated_user.get('name'),
                        'phone': updated_user.get('phone'),
                        'address': updated_user.get('address'),
                        'date_of_birth': updated_user.get('date_of_birth').strftime('%Y-%m-%d') if updated_user.get('date_of_birth') else None,
                        'is_admin': updated_user.get('is_admin', False)
                    }
                })
            
        return jsonify({'success': True, 'message': 'Không có thông tin nào được cập nhật'})

    except Exception as e:
        print(f"Error updating profile: {str(e)}")
        return jsonify({'success': False, 'error': 'Có lỗi khi cập nhật thông tin'}), 500

@app.route('/main/user/inventory')
@login_required
def inventory_page():
    if session.get('is_admin'):
        return redirect(url_for('admin_management'))
    
    user = users_collection.find_one({"_id": ObjectId(session['user_id'])})
    if not user:
        session.clear()
        return redirect(url_for('login_page'))
    
    return render_template('main/user/inventory.html', is_admin=user.get('is_admin', False))

# Product API endpoints  # -> display in inventory page
@app.route('/api/inventory/products', methods=['GET'])
@login_required
def get_products():
    if session.get('is_admin'):
        return jsonify({'error': 'Admins không có quyền truy cập kho hàng'}), 403
        
    user_id = session['user_id']
    products = products_collection.find({"user_id": ObjectId(user_id)}) # ưhen user login -> FE call api GET to get products from database
    return jsonify([{
        'id': str(p['_id']),
        'name': p['name'],
        'price': p['price'],
        'quantity': p['quantity'],
        'source': p.get('source', ''),
        'category': p.get('category', ''),
        'description': p.get('description', ''),
        'minStock': p.get('min_stock', 0),
        'created_at': p.get('created_at').isoformat() if p.get('created_at') else None
    } for p in products])

# Admin Product API endpoints
@app.route('/api/admin/products', methods=['GET'])
@admin_required
def get_all_products_admin():
    try:
        products = products_collection.find()
        return jsonify([{
            'id': str(p['_id']),
            'name': p['name'],
            'price': p['price'],
            'quantity': p['quantity'],
            'source': p.get('source', ''),
            'category': p.get('category', ''),
            'description': p.get('description', ''),
            'minStock': p.get('min_stock', 0),
            'created_at': p.get('created_at').isoformat() if p.get('created_at') else None
        } for p in products])
    except Exception as e:
        print(f"Error fetching all products (admin): {str(e)}")
        return jsonify({'error': 'Có lỗi khi tải danh sách sản phẩm'}), 500

# GET: list all product 
@app.route('/api/admin/products/<string:product_id>', methods=['GET'])
@admin_required
def get_product_admin(product_id: str):
    try:
        product = products_collection.find_one({"_id": ObjectId(product_id)})
        if not product:
            return jsonify({'error': 'Không tìm thấy sản phẩm'}), 404
        return jsonify({
            'id': str(product['_id']),
            'name': product['name'],
            'price': product['price'],
            'quantity': product['quantity'],
            'source': product.get('source', ''),
            'category': product.get('category', ''),
            'description': product.get('description', ''),
            'minStock': product.get('min_stock', 0),
            'created_at': product.get('created_at').isoformat() if product.get('created_at') else None
        })
    except Exception as e:
        print(f"Error fetching product (admin): {str(e)}")
        return jsonify({'error': 'Có lỗi khi tải thông tin sản phẩm'}), 500


@app.route('/api/admin/products', methods=['POST'])
@admin_required
def add_product_admin():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Invalid JSON'}), 400

    try:
        name = data.get('name')
        price = data.get('price')
        quantity = data.get('amount', 0)  # Changed from 'quantity' to 'amount'
        description = data.get('description')
        source = data.get('source')
        category = data.get('category')
        min_stock = data.get('minStock', 0)

        if not name or price is None or quantity is None:
            return jsonify({'error': 'Tên, giá và số lượng sản phẩm là bắt buộc'}), 400

        try:
            price = float(price)
            quantity = int(quantity)
            min_stock = int(min_stock)
        except (ValueError, TypeError):
            return jsonify({'error': 'Giá, số lượng và tồn kho tối thiểu phải là số'}), 400

        if price < 0 or min_stock < 0:
            return jsonify({'error': 'Giá và tồn kho tối thiểu không được âm'}), 400

        # Assuming admin adds products, associate with the admin user
        admin_user_id = session.get('user_id')
        if not admin_user_id:
            return jsonify({'error': 'Admin user not found in session'}), 500

        product = {
            "name": name,
            "price": price,
            "quantity": quantity,
            "source": source,
            "category": category,
            "description": description,
            "min_stock": min_stock,
            "user_id": ObjectId(admin_user_id),
            "created_at": datetime.utcnow()
        }

        # Insert into MongoDB
        result = products_collection.insert_one(product)

        return jsonify({'message': 'Product added successfully', 'id': str(result.inserted_id)}), 201
    except Exception as e:
        print(f"Error adding product (admin): {str(e)}")
        return jsonify({'error': 'Có lỗi khi thêm sản phẩm'}), 500

@app.route('/api/admin/products/<string:product_id>', methods=['PUT'])
@admin_required
def update_product_admin(product_id: str):
    product = products_collection.find_one({"_id": ObjectId(product_id)})
    if not product:
        return jsonify({'error': 'Không tìm thấy sản phẩm'}), 404

    data = request.get_json()
    if not data:
        return jsonify({'error': 'Invalid JSON'}), 400

    try:
        update_fields = {}
        # Update fields if provided in data
        if 'name' in data:
            update_fields['name'] = data['name']
        if 'price' in data:
            try:
                price = float(data['price'])
                if price < 0:
                    return jsonify({'error': 'Giá sản phẩm không được âm'}), 400
                update_fields['price'] = price
            except (ValueError, TypeError):
                return jsonify({'error': 'Giá sản phẩm phải là số'}), 400
        if 'quantity' in data:
            try:
                quantity = int(data['quantity'])
                if quantity < 0:
                    return jsonify({'error': 'Số lượng sản phẩm không được âm'}), 400
                update_fields['quantity'] = quantity
            except (ValueError, TypeError):
                return jsonify({'error': 'Số lượng sản phẩm phải là số nguyên'}), 400
        if 'description' in data:
            update_fields['description'] = data['description']
        if 'source' in data:
            update_fields['source'] = data['source']
        if 'category' in data:
            update_fields['category'] = data['category']
        if 'minStock' in data:
            try:
                min_stock = int(data['minStock'])
                if min_stock < 0:
                    return jsonify({'error': 'Tồn kho tối thiểu không được âm'}), 400
                update_fields['min_stock'] = min_stock
            except (ValueError, TypeError):
                return jsonify({'error': 'Tồn kho tối thiểu phải là số nguyên'}), 400

        # Update product in MongoDB
        products_collection.update_one({"_id": ObjectId(product_id)}, {"$set": update_fields})

        # Notify admins about the product update by an admin
        admin_username = session.get('username', 'Admin không xác định')
        notify_admins('Sản phẩm đã được cập nhật (Admin)', f'Sản phẩm "{product["name"]}" (ID: {product_id}) đã được cập nhật bởi admin {admin_username}.')
        return jsonify({'message': 'Product updated successfully'}), 200
    except Exception as e:
        print(f"Error updating product (admin): {str(e)}")
        return jsonify({'error': 'Có lỗi khi cập nhật sản phẩm'}), 500

@app.route('/api/admin/products/<string:product_id>', methods=['DELETE'])
@admin_required
def delete_product_admin(product_id: str):
    product = products_collection.find_one({"_id": ObjectId(product_id)})
    if not product:
        return jsonify({'error': 'Không tìm thấy sản phẩm'}), 404

    try:
        products_collection.delete_one({"_id": ObjectId(product_id)})
        # Notify admins about the product deletion by an admin
        admin_username = session.get('username', 'Admin không xác định')
        notify_admins('Sản phẩm đã bị xóa (Admin)', f'Sản phẩm (ID: {product_id}) đã bị xóa bởi admin {admin_username}.')
        return jsonify({'message': 'Product deleted successfully'}), 200
    except Exception as e:
        print(f"Error deleting product (admin): {str(e)}")
        return jsonify({'error': 'Có lỗi khi xóa sản phẩm'}), 500


# User put new product
@app.route('/api/inventory/products', methods=['POST'])
@login_required
def add_product():
    if not session.get('user_id'):
        return jsonify({'error': 'Authentication required'}), 401

    user_id = session['user_id']
    if session.get('is_admin'):
        return jsonify({'error': 'Admins không có quyền thêm sản phẩm'}), 403
    
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Invalid JSON'}), 400

    try:
        name = data.get('name')
        price = data.get('price')
        quantity = data.get('quantity', 0)

        if not name or not price:
            return jsonify({'error': 'Tên và giá sản phẩm là bắt buộc'}), 400

        try:
            price = float(price)
            quantity = int(quantity)
            min_stock = int(data.get('minStock', 0))
        except (ValueError, TypeError):
            return jsonify({'error': 'Giá, số lượng và tồn kho tối thiểu phải là số'}), 400

        if price < 0 or quantity < 0 or min_stock < 0:
            return jsonify({'error': 'Giá, số lượng và tồn kho tối thiểu không được âm'}), 400

        product = {
            "name": name,
            "price": price,
            "quantity": quantity,
            "source": data.get('source'),
            "category": data.get('category'),
            "description": data.get('description'),
            "min_stock": min_stock,
            "user_id": ObjectId(user_id),
            "created_at": datetime.utcnow()
        }

        # Insert into MongoDB
        result = products_collection.insert_one(product)

        # Notify the user about the new product
        create_notification(
            user_id,
            'Sản phẩm mới được thêm',
            f'Bạn đã thêm sản phẩm mới: {name}'
        )

        return jsonify({'message': 'Product added successfully', 'id': str(result.inserted_id)})
    except Exception as e:
        print(f"Error creating product: {str(e)}")
        return jsonify({'error': 'Có lỗi khi thêm sản phẩm'}), 500

@app.route('/api/inventory/products/<string:product_id>', methods=['PUT', 'PATCH'])
@login_required
def update_product(product_id: str):   #mỗi sản phẩm dc render có id riêng (product_id -> phục vụ tìm sp trong db)
    if session.get('is_admin'):
        return jsonify({'error': 'Admins không có quyền cập nhật sản phẩm'}), 403

    user_id = session['user_id']
    product = products_collection.find_one({"_id": ObjectId(product_id), "user_id": ObjectId(user_id)})
    if not product:
        return jsonify({'error': 'Không tìm thấy sản phẩm'}), 404

    data = request.get_json() # get from request body (from frontend and js send to backend)
    if not data:
        return jsonify({'error': 'Invalid JSON'}), 400

    try:
        update_fields = {}  # dictonary to prepare fields to update
        # Update fields if provided in data
        if 'name' in data: # data['name'] 
            update_fields['name'] = data['name']
        if 'price' in data:
            try:
                price = float(data['price'])
                if price < 0:
                    return jsonify({'error': 'Giá sản phẩm không được âm'}), 400
                update_fields['price'] = price
            except (ValueError, TypeError):
                return jsonify({'error': 'Giá sản phẩm phải là số'}), 400
        if 'quantity' in data:
            try:
                quantity = int(data['quantity'])
                if quantity < 0:
                    return jsonify({'error': 'Số lượng sản phẩm không được âm'}), 400
                update_fields['quantity'] = quantity
            except (ValueError, TypeError):
                return jsonify({'error': 'Số lượng sản phẩm phải là số nguyên'}), 400
        if 'source' in data:
            update_fields['source'] = data['source']
        if 'category' in data:
            update_fields['category'] = data['category']
        if 'description' in data:
            update_fields['description'] = data['description']
        if 'minStock' in data:
            try:
                min_stock = int(data['minStock']) 
                if min_stock < 0:
                    return jsonify({'error': 'Tồn kho tối thiểu không được âm'}), 400 # if min_stock < 0 -> 400 is bad request
                update_fields['min_stock'] = min_stock
            except (ValueError, TypeError):
                return jsonify({'error': 'Tồn kho tối thiểu phải là số nguyên'}), 400

        # Update product in MongoDB
        products_collection.update_one({"_id": ObjectId(product_id)}, {"$set": update_fields})

        # Check if quantity is below min_stock after update
        if update_fields.get('quantity', product['quantity']) <= update_fields.get('min_stock', product.get('min_stock', 0)):
            # Notify product owner about low stock
            create_notification(
                user_id,
                'Cảnh báo: Hàng sắp hết',
                f'Sản phẩm {product["name"]} sắp hết hàng (Còn lại: {update_fields.get("quantity", product["quantity"])})'
            )

        return jsonify({'message': 'Product updated successfully'})
    except Exception as e:
        print(f"Error updating product: {str(e)}")
        return jsonify({'error': 'Có lỗi khi cập nhật sản phẩm'}), 500

# each route start with api => execute -> put, get , delete
@app.route('/api/inventory/products/<string:product_id>', methods=['DELETE'])
@login_required
def delete_product(product_id: str):
    if session.get('is_admin'):  # check if user is admin
        return jsonify({'error': 'Admins không có quyền xóa sản phẩm'}), 403

    user_id = session['user_id']  # get user_id from session
    # get product from product_id (from db)
    product = products_collection.find_one({"_id": ObjectId(product_id), "user_id": ObjectId(user_id)})
    # if not -> send bad request
    if not product:
        return jsonify({'error': 'Không tìm thấy sản phẩm'}), 404

    try:
        # Delete product from MongoDB (from product_id)
        products_collection.delete_one({"_id": ObjectId(product_id)})
        # Notify the user about the product deletion
        create_notification(
            user_id,
            'Sản phẩm đã bị xóa',
            f'Sản phẩm "{product["name"]}" đã bị xóa khỏi kho hàng của bạn.'
        )
        return jsonify({'message': 'Product deleted successfully'})
    except Exception as e:
        print(f"Error deleting product: {str(e)}")
        return jsonify({'error': 'Có lỗi khi xóa sản phẩm'}), 500




# Admin routes
@app.route('/main/admin/management')
@login_required
@admin_required
def admin_management():
    cache_buster = int(datetime.utcnow().timestamp())
    return render_template('main/admin/management.html', cache_buster=cache_buster)

@app.route('/api/admin/users', methods=['GET'])
@login_required
@admin_required
def get_all_users():
    try:
        users = users_collection.find()
        return jsonify([{
            'id': str(user['_id']),
            'username': user['username'],
            'email': user['email'],
            'phone': user.get('phone', ''),
            'is_admin': user.get('is_admin', False),
            'password': user.get('password', ''), # NOTE: This is the hashed password, not plain text. Returning plain text passwords is a security risk.
            'plain_password': user.get('plain_password', '') # Added plain text password (for demonstration purposes only - NOT RECOMMENDED FOR PRODUCTION)
        } for user in users])
    except Exception as e:
        print(f"Error fetching users: {str(e)}")
        return jsonify({'error': 'Có lỗi khi tải danh sách người dùng'}), 500

@app.route('/api/admin/users/<string:user_id>', methods=['PUT'])
@login_required
@admin_required
def update_user(user_id: str):
    user = users_collection.find_one({"_id": ObjectId(user_id)}) # find user through user_id
    if not user:
        return jsonify({'error': 'Không tìm thấy người dùng'}), 404 # return notificatino if not

    data = request.get_json()
    if not data:
        return jsonify({'error': 'Dữ liệu không hợp lệ'}), 400

    try:
        update_fields = {} # dictionary
        # Only allow password and admin status changes
        if 'password' in data and data['password']:  
            update_fields['password'] = generate_password_hash(data['password'])

        if 'is_admin' in data: 
            # Prevent removing admin status from last admin
            if not data['is_admin'] and user.get('is_admin', False):
                admin_count = users_collection.count_documents({"is_admin": True})
                if admin_count <= 1:
                    return jsonify({'error': 'Không thể xóa quyền admin của người dùng cuối cùng'}), 400
            update_fields['is_admin'] = data['is_admin']

        # Update user in MongoDB
        users_collection.update_one({"_id": ObjectId(user_id)}, {"$set": update_fields})

        updated_user = users_collection.find_one({"_id": ObjectId(user_id)})

        return jsonify({
            'success': True,
            'message': 'Cập nhật thông tin thành công',
            'user': {
                'id': str(updated_user['_id']),
                'username': updated_user['username'],
                'email': updated_user['email'],
                'phone': updated_user.get('phone', ''),
                'is_admin': updated_user.get('is_admin', False)
            }
        })

    except Exception as e:
        print(f"Error updating user: {str(e)}")
        return jsonify({'error': 'Có lỗi khi cập nhật thông tin'}), 500

@app.route('/api/admin/users/<string:user_id>', methods=['DELETE'])
@login_required
@admin_required
def delete_user(user_id: str):
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        return jsonify({'error': 'Không tìm thấy người dùng'}), 404

    # Prevent deleting the last admin
    if user.get('is_admin', False):
        admin_count = users_collection.count_documents({"is_admin": True})
        if admin_count <= 1:
            return jsonify({'error': 'Không thể xóa admin cuối cùng'}), 400

    # Prevent self-deletion
    if str(user_id) == str(session['user_id']):
        return jsonify({'error': 'Không thể tự xóa tài khoản của mình'}), 400

    try:
        users_collection.delete_one({"_id": ObjectId(user_id)})
        return jsonify({'message': 'Xóa người dùng thành công'})
    except Exception as e:
        print(f"Error deleting user: {str(e)}")
        return jsonify({'error': 'Có lỗi khi xóa người dùng'}), 500

def create_notification(user_id: str, title: str, message: str):
    """Helper function to create notifications"""
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        print(f"User {user_id} not found")
        return False

    try:
        notification = {
            "user_id": ObjectId(user_id),
            "title": title,
            "message": message,
            "is_read": False,
            "created_at": datetime.utcnow()
        }
        notifications_collection.insert_one(notification)
        return True
    except Exception as e:
        print(f"Error creating notification: {str(e)}")
        return False

# Helper function to notify admins
def notify_admins(title: str, message: str):
    try:
        admins = users_collection.find({"is_admin": True})
        if not admins:
            print("No admin users found")
            return

        for admin in admins:
            create_notification(str(admin["_id"]), title, message)
        print(f"Notification sent to admins: {title}")
    except Exception as e:
        print(f"Error in notify_admins: {str(e)}")

# Helper function to notify specific users
def notify_users(user_ids: list, title: str, message: str):
    for user_id in user_ids:
        create_notification(user_id, title, message)

# Notification endpoints
@app.route('/api/admin/notifications/send', methods=['POST'])

@app.route('/api/notifications', methods=['GET'])
@login_required
def get_notifications():
    try:
        user_id = session['user_id']
        notifications = notifications_collection.find({"user_id": ObjectId(user_id)}).sort("created_at", -1)
        
        if not notifications:
            return jsonify([])
            
        return jsonify([{
            'id': str(n['_id']),
            'title': n['title'],
            'message': n['message'],
            'is_read': n.get('is_read', False),
            'created_at': n['created_at'].isoformat() if n.get('created_at') else None
        } for n in notifications])
    except Exception as e:
        print(f"Error fetching notifications: {str(e)}")
        return jsonify({'error': 'Failed to fetch notifications'}), 500

@app.route('/api/notifications/mark-read', methods=['POST'])
@login_required
def mark_notifications_read():  # this function marks all notifications as read
    try:
        user_id = session['user_id']
        notifications_collection.update_many({"user_id": ObjectId(user_id)}, {"$set": {"is_read": True}})
        return jsonify({'message': 'Notifications marked as read'})
    except Exception as e:
        print(f"Error marking notifications as read: {str(e)}")
        return jsonify({'error': 'Có lỗi khi cập nhật thông báo'}), 500

@app.route('/api/notifications/<string:notification_id>/mark-read', methods=['POST'])
@login_required
def mark_notification_read(notification_id): # this function marks a specific notification as read
    try:
        user_id = session['user_id']
        notification = notifications_collection.find_one({"_id": ObjectId(notification_id), "user_id": ObjectId(user_id)})
        if notification:
            notifications_collection.update_one({"_id": ObjectId(notification_id)}, {"$set": {"is_read": True}})
            return jsonify({'message': 'Notification marked as read'})
        return jsonify({'error': 'Không tìm thấy thông báo'}), 404
    except Exception as e:
        print(f"Error marking notification as read: {str(e)}")
        return jsonify({'error': 'Có lỗi khi cập nhật thông báo'}), 500

if __name__ == '__main__':
    # Add validation endpoints
    @app.route('/api/check-username', methods=['POST'])
    def check_username():
        data = request.get_json()
        if not data or 'username' not in data:
            return jsonify({'valid': False, 'error': 'Missing username'}), 400

        username = data['username']
        is_valid, error = validate_username(username)
        return jsonify({'valid': is_valid, 'error': error})

    @app.route('/api/check-email', methods=['POST'])
    def check_email():
        data = request.get_json()
        if not data or 'email' not in data:
            return jsonify({'valid': False, 'error': 'Missing email'}), 400

        email = data['email']
        is_valid, error = validate_email(email)
        return jsonify({'valid': is_valid, 'error': error})

    with app.app_context():
        try:
            # Check both username and email for admin account in MongoDB
            admin = users_collection.find_one({
                "$or": [
                    {"username": "admin123"},
                    {"email": "admin@example.com"}
                ]
            })
            
            if not admin:
                admin = {
                    "username": "admin123",
                    "email": "admin@example.com",
                    "password": generate_password_hash("k051205"),
                    "is_admin": True,
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
                users_collection.insert_one(admin)
                print("Admin account created successfully")
            else:
                print("Admin account already exists")
                
        except Exception as e:
            print(f"Database error: {str(e)}")
            exit(1)
    
    app.run(debug=True, port=5000)  # Run the Flask app on port 5000