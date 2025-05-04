from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from typing import Optional, Dict, Any, Type
from sqlalchemy.ext.declarative import DeclarativeMeta

db = SQLAlchemy()
Model: Type[DeclarativeMeta] = db.Model

class User(Model):  # type: ignore
    """User model for storing user-related data."""
    __tablename__ = 'user'
    
    id: int = db.Column(db.Integer, primary_key=True)
    username: str = db.Column(db.String(80), unique=True, nullable=False)
    name: Optional[str] = db.Column(db.String(80), nullable=True)
    date_of_birth: Optional[datetime] = db.Column(db.Date, nullable=True)
    address: Optional[str] = db.Column(db.String(255), nullable=True)
    email: str = db.Column(db.String(120), unique=True, nullable=False)
    password: str = db.Column(db.String(255), nullable=False)
    phone: Optional[str] = db.Column(db.String(15), unique=True, nullable=True)
    avatar: Optional[str] = db.Column(db.String(255), nullable=True)  # Path to avatar image
    is_admin: bool = db.Column(db.Boolean, default=False)
    created_at: datetime = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at: datetime = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    products = db.relationship('Product',
                             backref='user',
                             lazy=True,
                             cascade='all, delete-orphan',
                             primaryjoin="and_(User.id==Product.user_id, User.is_admin==False)")
    notifications = db.relationship('Notification', backref='user', lazy=True, cascade='all, delete-orphan')

    def __repr__(self) -> str:
        return f'<User {self.username}>'

    def to_dict(self) -> Dict[str, Any]:
        return {
            'id': self.id,
            'username': self.username,
            'name': self.name,
            'email': self.email,
            'phone': self.phone,
            'date_of_birth': self.date_of_birth.isoformat() if self.date_of_birth else None,
            'address': self.address,
            'avatar': self.avatar,
            'is_admin': self.is_admin,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

class Product(Model):  # type: ignore
    """Product model for storing product-related data."""
    __tablename__ = 'product'
    
    id: int = db.Column(db.Integer, primary_key=True)
    name: str = db.Column(db.String(255), nullable=False)
    price: float = db.Column(db.Float, nullable=False)
    quantity: int = db.Column(db.Integer, nullable=False)
    source: Optional[str] = db.Column(db.String(255), nullable=True)
    category: Optional[str] = db.Column(db.String(100), nullable=True)
    description: Optional[str] = db.Column(db.Text, nullable=True)
    image: Optional[str] = db.Column(db.String(255), nullable=True)  # Path to product image
    min_stock: int = db.Column(db.Integer, default=0)
    user_id: int = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at: datetime = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at: datetime = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self) -> str:
        return f'<Product {self.name}>'

    def to_dict(self) -> Dict[str, Any]:
        return {
            'id': self.id,
            'name': self.name,
            'price': self.price,
            'quantity': self.quantity,
            'source': self.source,
            'category': self.category,
            'description': self.description,
            'minStock': self.min_stock,
            'image': self.image,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

class Notification(Model):  # type: ignore
    """Notification model for storing user notifications."""
    __tablename__ = 'notification'
    
    id: int = db.Column(db.Integer, primary_key=True)
    user_id: int = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title: str = db.Column(db.String(100), nullable=False)
    message: str = db.Column(db.Text, nullable=False)
    is_read: bool = db.Column(db.Boolean, default=False)
    type: str = db.Column(db.String(50), nullable=False)  # e.g., 'low_stock', 'system', etc.
    created_at: datetime = db.Column(db.DateTime, default=datetime.utcnow)
    reference_id: Optional[int] = db.Column(db.Integer, nullable=True)  # For linking to products/orders

    def __repr__(self) -> str:
        return f'<Notification {self.id} for User {self.user_id}>'

    def to_dict(self) -> Dict[str, Any]:
        return {
            'id': self.id,
            'title': self.title,
            'message': self.message,
            'is_read': self.is_read,
            'type': self.type,
            'created_at': self.created_at.isoformat(),
            'reference_id': self.reference_id
        }

def init_db(app) -> None:
    """Initialize the database with app context."""
    db.init_app(app)
    with app.app_context():
        db.create_all()