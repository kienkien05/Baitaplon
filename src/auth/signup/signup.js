class SignupManager {
    constructor() {
        console.log('[DEBUG] SignupManager initialized');
        this.form = document.getElementById('signupForm');
        this.setup();
    }

    setup() {
        this.form?.addEventListener('submit', this.handleSignup.bind(this));
        this.setupPasswordToggle();
        this.setupRealtimeValidation();
    }

    setupPasswordToggle() {
        const passwordInput = document.getElementById('password');
        const toggleBtn = document.createElement('i');
        toggleBtn.className = 'fas fa-eye password-toggle';
        passwordInput?.parentElement?.appendChild(toggleBtn);

        toggleBtn.onclick = () => {
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                toggleBtn.className = 'fas fa-eye-slash password-toggle';
            } else {
                passwordInput.type = 'password';
                toggleBtn.className = 'fas fa-eye password-toggle';
            }
        };
    }

    async setupRealtimeValidation() {
        const usernameInput = document.getElementById('username');
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirmPassword');

        const usernameError = document.getElementById('username-error');
        const emailError = document.getElementById('email-error');
        const passwordError = document.getElementById('password-error');
        const confirmPasswordError = document.getElementById('confirm-password-error');

        let timeouts = {};

        if (usernameInput) {
            usernameInput.addEventListener('input', () => {
                if (!this.validateUsername(usernameInput.value)) {
                    usernameError.textContent = 'Tên đăng nhập phải có ít nhất 3 ký tự và không chứa ký tự đặc biệt';
                    usernameInput.classList.add('invalid');
                    return;
                }
                this.handleInputValidation('username', usernameInput, usernameError, timeouts);
            });
        }

        if (emailInput) {
            emailInput.addEventListener('input', () => {
                if (!this.validateEmail(emailInput.value)) {
                    emailError.textContent = 'Email không hợp lệ';
                    emailInput.classList.add('invalid');
                    return;
                }
                this.handleInputValidation('email', emailInput, emailError, timeouts);
            });
        }

        if (passwordInput) {
            passwordInput.addEventListener('input', () => {
                this.validatePassword(passwordInput.value);
            });
        }

        if (confirmPasswordInput) {
            confirmPasswordInput.addEventListener('input', () => {
                if (confirmPasswordInput.value !== passwordInput.value) {
                    confirmPasswordError.textContent = 'Mật khẩu không khớp';
                    confirmPasswordInput.classList.add('invalid');
                } else {
                    confirmPasswordError.textContent = '';
                    confirmPasswordInput.classList.remove('invalid');
                }
            });
        }
    }

    validateUsername(username) {
        // Match backend validation exactly
        return /^[a-zA-Z0-9_]{3,20}$/.test(username) && !/^\d+$/.test(username);
    }

    validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    async handleInputValidation(field, input, errorElement, timeouts) {
        clearTimeout(timeouts[field]);
        const value = input.value.trim();

        if (!value) {
            errorElement.textContent = '';
            input.classList.remove('invalid');
            return;
        }

        // Do local validation first
        if (field === 'username' && !this.validateUsername(value)) {
            errorElement.textContent = 'Tên đăng nhập phải từ 3-20 ký tự và chỉ chứa chữ cái, số, gạch dưới';
            input.classList.add('invalid');
            return;
        }

        if (field === 'email' && !this.validateEmail(value)) {
            errorElement.textContent = 'Email không hợp lệ';
            input.classList.add('invalid');
            return;
        }

        // Only check with server if local validation passes
        timeouts[field] = setTimeout(async () => {
            try {
                const response = await fetch(`/api/check-${field}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ [field]: value })
                });

                const data = await response.json();
                
                if (response.ok) {
                    if (!data.valid) {
                        errorElement.textContent = data.error;
                        input.classList.add('invalid');
                    } else {
                        errorElement.textContent = '';
                        input.classList.remove('invalid');
                    }
                } else {
                    throw new Error(data.error || `Lỗi kiểm tra ${field}`);
                }
            } catch (err) {
                console.error(`Error checking ${field}:`, err);
                errorElement.textContent = err.message || `Lỗi kiểm tra ${field === 'username' ? 'tên đăng nhập' : 'email'}`;
                input.classList.add('invalid');
            }
        }, 400);
    }

    validatePassword(password) {
        const passwordError = document.getElementById('password-error');
        const passwordInput = document.getElementById('password');

        if (!password) {
            passwordError.textContent = 'Mật khẩu không được để trống';
            passwordInput.classList.add('invalid');
            return false;
        }

        if (password.length < 6) {
            passwordError.textContent = 'Mật khẩu phải có ít nhất 6 ký tự';
            passwordInput.classList.add('invalid');
            return false;
        }

        const patterns = {
            lowercase: /[a-z]/.test(password),
            uppercase: /[A-Z]/.test(password),
            numbers: /\d/.test(password),
            symbols: /[!@#$%^&*]/.test(password)
        };

        let strength = Object.values(patterns).filter(Boolean).length;

        if (strength < 2) {
            passwordError.textContent = 'Mật khẩu phải chứa ít nhất 2 loại ký tự khác nhau (chữ hoa, chữ thường, số, ký tự đặc biệt)';
            passwordInput.classList.add('invalid');
            return false;
        }

        passwordError.textContent = '';
        passwordInput.classList.remove('invalid');
        return true;
    }

    async handleSignup(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Check for any existing error messages
        const errorElements = document.querySelectorAll('.error-message');
        for (let error of errorElements) {
            if (error.textContent) {
                this.showMessage('Vui lòng sửa các lỗi trước khi đăng ký', false);
                return;
            }
        }

        if (!this.validateForm({username, email, password, confirmPassword})) {
            return;
        }

        try {
            const response = await fetch('/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache, no-store',
                    'Pragma': 'no-cache'
                },
                credentials: 'include',
                body: JSON.stringify({ username, email, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                if (data.redirect) {
                    window.location.href = data.redirect;
                } else {
                    window.location.href = '/auth/login?signup_success=true';
                }
            } else {
                this.showMessage(data.error || 'Có lỗi xảy ra khi đăng ký!', false);
            }
        } catch (error) {
            console.error('Signup error:', error);
            this.showMessage('Lỗi kết nối, vui lòng thử lại sau!', false);
        }
    }

    showMessage(message, isSuccess = true) {
        const notification = document.createElement('div');
        notification.className = `notification ${isSuccess ? 'success' : 'error'}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.5s ease';
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }

    validateForm(data) {
        if (!data.username || !data.email || !data.password || !data.confirmPassword) {
            this.showMessage('Vui lòng điền đầy đủ thông tin', false);
            return false;
        }

        if (!this.validateUsername(data.username)) {
            this.showMessage('Tên đăng nhập không hợp lệ', false);
            return false;
        }

        if (!this.validateEmail(data.email)) {
            this.showMessage('Email không hợp lệ', false);
            return false;
        }

        if (!this.validatePassword(data.password)) {
            return false;
        }

        if (data.password !== data.confirmPassword) {
            this.showMessage('Mật khẩu xác nhận không khớp', false);
            return false;
        }

        return true;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SignupManager();
});
