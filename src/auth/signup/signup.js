const { CONFIG } = await import(window.configPath);

class SignupManager {
  constructor() {
    this.form = document.getElementById('signupForm');
    this.setup();
  }

  setup() {
    this.form?.addEventListener('submit', this.handleSignup.bind(this));
    this.setupPasswordToggle();
    this.setupGoogleSignup();
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

  setupGoogleSignup() {
    // Button now uses onclick handler directly in HTML
  }

  async handleSignup(e) {
    e.preventDefault();
    
    const data = {
      username: this.form.username.value,
      email: this.form.email.value,
      password: this.form.password.value,
      confirmPassword: this.form.confirmPassword.value
    };

    if (!this.validateForm(data)) return;

    try {
      window.location.href = CONFIG.AUTH.BASE_URL + '/login_page';
    } catch (err) {
      alert('Đăng ký thất bại!');
    }
  }

  validateForm(data) {
    if (!data.username || !data.email || !data.password || !data.confirmPassword) {
      alert('Vui lòng điền đầy đủ thông tin');
      return false;
    }

    if (data.password !== data.confirmPassword) {
      alert('Mật khẩu xác nhận không khớp');
      return false;
    }

    if (data.password.length < 6) {
      alert('Mật khẩu phải có ít nhất 6 ký tự');
      return false;
    }

    return true;
  }


  loadGoogleSDK() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
}

new SignupManager();