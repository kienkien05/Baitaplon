class LoginForm {
    constructor() {
        this.form = document.getElementById('loginForm');
        this.forgotPasswordLink = document.getElementById('forgotPasswordLink');
        this.forgotPasswordForm = document.getElementById('forgotPasswordForm');
        this.cancelForgotPassword = document.getElementById('cancelForgotPassword');
        this.submitForgotPassword = document.getElementById('submitForgotPassword');
        this.emailInput = document.getElementById('email');
        this.emailError = null;
        this.setup();
    }

    setup() {
        this.form?.addEventListener('submit', this.handleLogin.bind(this));
        // Disabled backend realtime validation (API removed)
        // this.setupRealtimeValidation();
        this.setupPasswordToggle();
        this.setupForgotPassword();
    }

    // Removed setupRealtimeValidation (no backend API, no frontend-only validation implemented)

    clearErrors() {
        const errors = document.querySelectorAll('.error-message');
        errors.forEach(error => error.textContent = '');
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

    setupForgotPassword() {
        this.forgotPasswordLink?.addEventListener('click', this.showForgotPasswordForm.bind(this));
        this.cancelForgotPassword?.addEventListener('click', this.hideForgotPasswordForm.bind(this));
        this.submitForgotPassword?.addEventListener('click', this.handleForgotPassword.bind(this));

        // Modal centering and overlay
        if (this.forgotPasswordForm) {
            this.forgotPasswordForm.style.position = 'fixed';
            this.forgotPasswordForm.style.top = '50%';
            this.forgotPasswordForm.style.left = '50%';
            this.forgotPasswordForm.style.transform = 'translate(-50%, -50%)';
            this.forgotPasswordForm.style.zIndex = '1001';
            this.forgotPasswordForm.style.background = '#fff';
            this.forgotPasswordForm.style.boxShadow = '0 0 20px rgba(0,0,0,0.2)';
            this.forgotPasswordForm.style.display = 'none';
        }
        // Overlay for modal
        if (!document.getElementById('modalOverlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'modalOverlay';
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100vw';
            overlay.style.height = '100vh';
            overlay.style.background = 'rgba(0,0,0,0.3)';
            overlay.style.zIndex = '1000';
            overlay.style.display = 'none';
            document.body.appendChild(overlay);
        }
        this.overlay = document.getElementById('modalOverlay');

        // Real-time email validation for forgot password
        if (this.emailInput) {
            if (!document.getElementById('forgot-email-error')) {
                this.emailError = document.createElement('span');
                this.emailError.id = 'forgot-email-error';
                this.emailError.className = 'error-message';
                this.emailError.style.color = 'red';
                this.emailError.style.fontSize = '0.95em';
                this.emailError.style.display = 'block';
                this.emailError.style.marginTop = '2px';
                this.emailInput.parentElement.appendChild(this.emailError);
            } else {
                this.emailError = document.getElementById('forgot-email-error');
            }
            let emailTimeout;
            this.emailInput.addEventListener('input', () => {
                clearTimeout(emailTimeout);
                emailTimeout = setTimeout(async () => {
                    const email = this.emailInput.value.trim();
                    if (!email) {
                        this.emailError.innerText = '';
                        return;
                    }
                    try {
                        const res = await fetch('/api/check-email', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email })
                        });
                        const data = await res.json();
                        if (data.exists) {
                            this.emailError.innerText = '';
                        } else {
                            this.emailError.innerText = data.error || 'Email không tồn tại trong hệ thống';
                        }
                    } catch (err) {
                        this.emailError.innerText = 'Lỗi kiểm tra email';
                    }
                }, 400);
            });
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const errorMessage = document.getElementById('errorMessage');

        if (!username || !password) {
            errorMessage.textContent = 'Vui lòng điền đầy đủ thông tin!';
            errorMessage.style.display = 'block';
            return;
        }

        try {
            const response = await fetch('/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache, no-store',
                    'Pragma': 'no-cache'
                },
                credentials: 'include',
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            
            if (data.success) {
                window.location.href = data.redirect;
            } else {
                errorMessage.textContent = data.error;
                errorMessage.style.display = 'block';
            }
        } catch (error) {
            console.error('Login error:', error);
            errorMessage.textContent = 'Có lỗi xảy ra khi đăng nhập!';
            errorMessage.style.display = 'block';
        }
    }

    showForgotPasswordForm() {
        this.form.style.display = 'none';
        this.forgotPasswordForm.style.display = 'block';
        if (this.overlay) this.overlay.style.display = 'block';
    }

    hideForgotPasswordForm() {
        this.forgotPasswordForm.style.display = 'none';
        this.form.style.display = 'block';
        if (this.overlay) this.overlay.style.display = 'none';
        if (this.emailError) this.emailError.innerText = '';
        if (this.emailInput) this.emailInput.value = '';
    }

    async handleForgotPassword() {
        const email = document.getElementById('email').value;

        if (!email) {
            alert('Vui lòng nhập địa chỉ email!');
            return;
        }

        try {

            console.log('Gửi yêu cầu khôi phục mật khẩu cho email:', email);
            alert('Đã gửi yêu cầu khôi phục mật khẩu! Vui lòng kiểm tra email.');
            this.hideForgotPasswordForm();
        } catch (err) {
            alert('Có lỗi khi gửi yêu cầu khôi phục mật khẩu!');
            console.error(err);
        }
    }

    async loadGoogleSDK() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new LoginForm();
});
