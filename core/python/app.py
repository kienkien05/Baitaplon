from flask import Flask, request, jsonify, render_template, redirect, url_for, session, flash, make_response
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
import pyodbc
import os
from datetime import timedelta
import secrets


CAU_HINH_CSDL = {
    'may_chu': 'localhost\\SQLEXPRESS',
    'co_so_du_lieu': 'user_db',
    'xac_thuc_windows': 'yes'  
}


KHOA_BI_MAT = os.urandom(24)
print("Đã thiết lập cấu hình CSDL và khóa bí mật.")

app = Flask(__name__,
    template_folder='../../src',
    static_folder='../../src',
    static_url_path=''
)


app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

@app.route('/')
def root():
    return redirect(url_for('login_page'))

@app.route('/login')
def login_redirect():
    return redirect(url_for('login_page'))  # This redirects to /auth/login

app.config.update(
    SESSION_COOKIE_SECURE=False,
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE='Lax',
    PERMANENT_SESSION_LIFETIME=timedelta(days=7),
    SESSION_COOKIE_NAME='warehouse_session',
    SESSION_COOKIE_PATH='/'
)


CORS(app, supports_credentials=True, resources={
    r"/*": {
        "origins": ["http://127.0.0.1:5000", "http://localhost:5000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "expose_headers": ["Content-Type", "Set-Cookie"],
        "supports_credentials": True,
        "max_age": 600
    }
})

app.config['SQLALCHEMY_DATABASE_URI'] = f"mssql+pyodbc:///?odbc_connect=DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={CAU_HINH_CSDL['may_chu']};DATABASE={CAU_HINH_CSDL['co_so_du_lieu']};Trusted_Connection=yes"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = KHOA_BI_MAT
db = SQLAlchemy(app)

class User(db.Model):
    __tablename__ = 'user'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)

class Product(db.Model):
    __tablename__ = 'product'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    price = db.Column(db.Float, nullable=False)
    amount = db.Column(db.Integer, nullable=False)
    source = db.Column(db.String(255), nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    user = db.relationship('User', backref=db.backref('products', lazy=True))

app.jinja_env.globals['User'] = User

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login_page'))
        return f(*args, **kwargs)
    return decorated_function



@app.route('/api/products', methods=['GET'])
@login_required
def get_products():
    user_id = session['user_id']
    products = Product.query.filter_by(user_id=user_id).all()
    return jsonify([
        {
            'id': p.id,
            'name': p.name,
            'price': p.price,
            'amount': p.amount,
            'source': p.source
        } for p in products
    ])

@app.route('/api/products', methods=['POST'])
@login_required
def add_product():
    user_id = session['user_id']
    data = request.get_json()
    product = Product(
        name=data.get('name'),
        price=data.get('price'),
        amount=data.get('amount'),
        source=data.get('source'),
        user_id=user_id
    )
    db.session.add(product)
    db.session.commit()
    return jsonify({'message': 'Product added successfully', 'id': product.id})

@app.route('/api/products/<int:product_id>', methods=['PUT'])
@login_required
def update_product(product_id):
    user_id = session['user_id']
    product = Product.query.filter_by(id=product_id, user_id=user_id).first()
    if not product:
        return jsonify({'error': 'Không tìm thấy sản phẩm'}), 404
    data = request.get_json()
    product.name = data.get('name', product.name)
    product.price = data.get('price', product.price)
    product.amount = data.get('amount', product.amount)
    product.source = data.get('source', product.source)
    db.session.commit()
    return jsonify({'message': 'Product updated successfully'})

@app.route('/api/products/<int:product_id>', methods=['DELETE'])
@login_required
def delete_product(product_id):
    user_id = session['user_id']
    product = Product.query.filter_by(id=product_id, user_id=user_id).first()
    if not product:
        return jsonify({'error': 'Không tìm thấy sản phẩm'}), 404
    db.session.delete(product)
    db.session.commit()
    return jsonify({'message': 'Product deleted successfully'})

@app.route('/api/check-username', methods=['POST'])
def check_username():
    data = request.get_json()
    username = data.get('username')
    
    if not username:
        return jsonify({'valid': False, 'error': 'Tên đăng nhập không được để trống'})
    
    existing_user = User.query.filter_by(username=username).first()
    if existing_user:
        return jsonify({'valid': False, 'error': 'Tên đăng nhập đã tồn tại!'})
    
    return jsonify({'valid': True})

@app.route('/api/check-email', methods=['POST'])
def check_email():
    data = request.get_json()
    email = data.get('email')
    
    if not email:
        return jsonify({'valid': False, 'error': 'Email không được để trống'})
    
    existing_email = User.query.filter_by(email=email).first()
    if existing_email:
        return jsonify({'valid': False, 'error': 'Email đã được đăng ký!'})
    
    return jsonify({'valid': True})

def generate_session_token():
    return secrets.token_urlsafe(32)

@app.route('/')
def index():
    return redirect(url_for('login_page'))  # This will redirect to /auth/login

@app.route('/profile')
@login_required
def profile_page():
    user = User.query.get(session['user_id'])
    if not user:
        session.clear()
        return redirect(url_for('login_page'))
    
    user_data = {
        'username': user.username,
        'email': user.email,
        'is_admin': user.is_admin
    }
    return render_template('profile/profile.html', user=user_data)

@app.route('/auth/login')
def login_page():
    # Clear any existing session when accessing login page
    if request.args.get('logout') == 'true':
        session.clear()
        response = make_response(render_template('auth/login/login.html'))
        response.delete_cookie('warehouse_session')
        response.delete_cookie('session')
        response.delete_cookie('remember_token')
        
        # Prevent caching to stop back-button access
        response.headers.update({
            'Cache-Control': 'no-cache, no-store, must-revalidate, private',
            'Pragma': 'no-cache',
            'Expires': '0'
        })
        return response
    
    # Check if user is already logged in
    if 'user_id' in session:
        try:
            user = User.query.get(session['user_id'])
            if user:
                return redirect(url_for('profile_page'))
        except:
            session.clear()
    
    # Return login page with no-cache headers
    response = make_response(render_template('auth/login/login.html'))
    response.headers.update({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    })
    return response

@app.route('/auth/signup', methods=['GET'])
def signup_page():
    if 'user_id' in session:
        return redirect(url_for('profile_page'))
    return render_template('auth/signup/signup.html')

@app.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard/main.html')

@app.route('/auth/logout')
def logout():
    """Handle user logout"""
    # Clear session
    session.clear()
    
    # Create redirect response
    response = make_response(redirect(url_for('login_page', logout='true')))
    
    # Clear all cookies
    response.delete_cookie('warehouse_session')
    response.delete_cookie('session')
    response.delete_cookie('remember_token')
    
    # Set cache control headers
    response.headers.update({
        'Cache-Control': 'no-cache, no-store, must-revalidate, private',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff'
    })
    
    # Immediately redirect to login
    return response, 302

@app.before_request
def check_valid_session():
    """Check if the session is valid before each request"""
    if 'user_id' in session and request.endpoint != 'logout':
        try:
            user = User.query.get(session['user_id'])
            if not user:
                session.clear()
                return redirect(url_for('login_page'))
        except:
            session.clear()
            return redirect(url_for('login_page'))

@app.route('/auth/signup', methods=['POST'])
def signup_api():
    print("[DEBUG] Signup API called")
    try:
        data = request.get_json()
        print("[DEBUG] Received data:", data)  # Debug log
        
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')

        # Validate required fields
        if not username or not email or not password:
            print("[DEBUG] Missing required fields")
            return jsonify({
                'success': False,
                'error': 'Vui lòng điền đầy đủ thông tin!'
            }), 400

        # Check for existing user
        existing_user = User.query.filter_by(username=username).first()
        if existing_user:
            print("[DEBUG] Username already exists:", username)
            return jsonify({
                'success': False,
                'error': 'Tên đăng nhập đã tồn tại!'
            }), 409

        existing_email = User.query.filter_by(email=email).first()
        if existing_email:
            print("[DEBUG] Email already exists:", email)
            return jsonify({
                'success': False,
                'error': 'Email đã được đăng ký!'
            }), 409

        # Create new user
        try:
            new_user = User(
                username=username,
                email=email,
                password=generate_password_hash(password),
                is_admin=False
            )
            print("[DEBUG] Created new user object")
            
            db.session.add(new_user)
            print("[DEBUG] Added user to session")
            
            db.session.commit()
            print("[DEBUG] Successfully committed to database")

            # Store user data in session
            session['user_id'] = new_user.id
            session['username'] = new_user.username
            session['is_admin'] = new_user.is_admin

            return jsonify({
                'success': True,
                'message': 'Đăng ký thành công!',
                'redirect': '/profile'  # Redirect to profile after signup
            }), 201

        except Exception as db_error:
            print("[ERROR] Database error:", str(db_error))
            db.session.rollback()
            return jsonify({
                'success': False,
                'error': 'Lỗi khi lưu vào cơ sở dữ liệu!'
            }), 500

    except Exception as e:
        print("[ERROR] General error:", str(e))
        return jsonify({
            'success': False,
            'error': 'Có lỗi xảy ra khi đăng ký!'
        }), 500

@app.route('/auth/login', methods=['POST'])
def login_api():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        print(f"[DEBUG] Login attempt for user: {username}")

        if not username or not password:
            return jsonify({
                'success': False,
                'error': 'Vui lòng điền đầy đủ thông tin!'
            }), 400

        # Check user exists
        user = User.query.filter_by(username=username).first()
        
        if not user:
            print(f"[DEBUG] User not found: {username}")
            return jsonify({
                'success': False,
                'error': 'Tên đăng nhập hoặc mật khẩu không đúng!'
            }), 401

        if not check_password_hash(user.password, password):
            print(f"[DEBUG] Invalid password for user: {username}")
            return jsonify({
                'success': False,
                'error': 'Tên đăng nhập hoặc mật khẩu không đúng!'
            }), 401

        # Login successful
        print(f"[DEBUG] Login successful for user: {username}")
        
        # Clear any existing session
        session.clear()
        
        # Set new session data
        session['user_id'] = user.id
        session['is_admin'] = user.is_admin
        session['username'] = user.username
        
        response = jsonify({
            'success': True,
            'redirect': '/profile'
        })
        
        # Set cache control headers
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
        
        return response, 200

    except Exception as e:
        print("[ERROR] Login error:", str(e))
        return jsonify({
            'success': False,
            'error': 'Có lỗi xảy ra khi đăng nhập!'
        }), 500

if __name__ == '__main__':
    with app.app_context():
        try:
            db.create_all()
            print("Database connected successfully")
            
            # Create admin account if not exists
            admin = User.query.filter_by(username='admin123').first()
            if not admin:
                admin = User(
                    username='admin123',
                    email='admin@example.com',
                    password=generate_password_hash('k051205'),
                    is_admin=True
                )
                db.session.add(admin)
                db.session.commit()
                print("Admin account created successfully")
                
        except Exception as e:
            print(f"Database error: {str(e)}")
            exit(1)
    
    app.run(debug=True)
