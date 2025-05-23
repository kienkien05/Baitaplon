"""Utility functions for the application."""
from typing import Dict, Any, Optional, Tuple, Union
from werkzeug.security import generate_password_hash, check_password_hash
import re
from datetime import datetime

def format_phone_number(phone: Optional[str]) -> str:
    """Format phone number for display.
    
    Args:
        phone: Phone number to format
        
    Returns:
        Formatted phone number or empty string
    """
    if not phone:
        return ""
    return f"{phone[:4]}.{phone[4:7]}.{phone[7:]}" if len(phone) == 10 else phone

def create_response(
    success: bool = True,
    message: Optional[str] = None,
    data: Optional[Dict[str, Any]] = None,
    errors: Optional[Dict[str, str]] = None
) -> Dict[str, Any]:
    """Create standard API response format.
    
    Args:
        success: Whether request was successful
        message: Optional message to include
        data: Optional data to include
        errors: Optional error messages
        
    Returns:
        Formatted response dictionary
    """
    response: Dict[str, Union[bool, str, Dict[str, Any], None]] = {
        'success': success
    }
    
    if message:
        response['message'] = message
    if data:
        response['data'] = data
    if errors:
        response['errors'] = errors
        
    return response

def hash_password(password: str) -> str:
    """Hash password using werkzeug security.
    
    Args:
        password: Password to hash
        
    Returns:
        Hashed password
    """
    return generate_password_hash(password)

def verify_password(password_hash: str, password: str) -> bool:
    """Verify password against hash.
    
    Args:
        password_hash: Hashed password
        password: Password to verify
        
    Returns:
        Whether password matches hash
    """
    return check_password_hash(password_hash, password)

def truncate_string(text: str, length: int = 50) -> str:
    """Truncate string to specified length with ellipsis.
    
    Args:
        text: String to truncate
        length: Max length (default 50)
        
    Returns:
        Truncated string
    """
    return f"{text[:length]}..." if len(text) > length else text
