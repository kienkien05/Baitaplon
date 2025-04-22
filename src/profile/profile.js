console.log("Profile module loaded.");

class ProfileManager {
    constructor() {
        this.profileButton = document.getElementById('profileButton');
        this.profileDropdown = document.getElementById('profileDropdown');
        this.avatarElements = document.querySelectorAll('#userAvatar, #userAvatarLarge');
        this.userName = document.getElementById('userName');
        this.userEmail = document.getElementById('userEmail');
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadUserData();
    }

    setupEventListeners() {
        // Toggle dropdown
        this.profileButton?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleDropdown();
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (this.profileDropdown && !this.profileDropdown.contains(e.target)) {
                this.hideDropdown();
            }
        });

        // Handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideDropdown();
            }
        });

        // Handle logout
const logoutBtn = document.getElementById('logoutBtn');
        logoutBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleLogout();
        });
    }

    toggleDropdown() {
        this.profileDropdown?.classList.toggle('active');
    }

    hideDropdown() {
        this.profileDropdown?.classList.remove('active');
    }

    loadUserData() {
        try {
            const userData = JSON.parse(localStorage.getItem('auth_user')) || {};
            
            // Show/hide admin features based on user role
            if (userData.role !== 'admin') {
                document.querySelectorAll('.admin-only').forEach(el => {
                    el.style.display = 'none';
                });
            }

            // Update avatars
            this.avatarElements.forEach(avatar => {
                if (avatar) {
                    avatar.src = userData.avatar || '../assets/default-avatar.png';
                    avatar.alt = userData.name || 'User Avatar';
                    avatar.onerror = () => {
                        avatar.src = '../assets/default-avatar.png';
                    };
                }
            });

            // Update text elements
            if (this.userName) {
                this.userName.textContent = userData.name || 'Guest User';
            }
            if (this.userEmail) {
                this.userEmail.textContent = userData.email || '';
            }

        } catch (error) {
            console.error('Error loading user data:', error);
            this.handleLoadError();
        }
    }

    handleLogout() {
        try {
            localStorage.removeItem('auth_user');
            localStorage.removeItem('auth_token');
            window.location.href = '/login_page';
        } catch (error) {
            console.error('Error during logout:', error);
            alert('Đã xảy ra lỗi khi đăng xuất. Vui lòng thử lại.');
        }
    }

    handleLoadError() {
        this.avatarElements.forEach(avatar => {
            if (avatar) {
                avatar.src = '../assets/default-avatar.png';
                avatar.alt = 'Default Avatar';
            }
        });
        if (this.userName) this.userName.textContent = 'Guest User';
        if (this.userEmail) this.userEmail.textContent = '';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const profileManager = new ProfileManager();
});
