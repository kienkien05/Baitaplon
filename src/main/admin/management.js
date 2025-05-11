class ManagementSystem {
    constructor() {
        // User management elements
        this.userGrid = document.getElementById('userGrid');
        this.searchInput = document.getElementById('userSearch');
        this.searchButton = document.getElementById('searchButton');
        this.userModal = document.getElementById('userModal');
        this.userForm = document.getElementById('userForm');
        this.closeModal = document.getElementById('closeModal');
        this.deleteConfirmModal = document.getElementById('deleteConfirmModal');
        this.closeDeleteModal = document.getElementById('closeDeleteModal');
        
        // Send notification elements (in search section)
        this.sendNotificationBtn = document.querySelector('.search-section #sendNotificationBtn');
        this.sendNotificationModal = document.getElementById('sendNotificationModal');
        this.notificationForm = document.getElementById('notificationForm');
        this.closeNotificationModal = document.getElementById('closeNotificationModal');
        this.cancelNotificationBtn = document.getElementById('cancelNotificationBtn');
        this.notificationRecipient = document.getElementById('notificationRecipient');
        this.userSelectList = document.getElementById('userSelectList');
        
        this.users = [];
        this.filteredUsers = [];
        this.editingUserId = null;
        this.selectedUsers = new Set();
        this.editUserOrig = null; // Store original user for comparison
        this.editUserForm = {}; // Store form data for editing

        this.init();
    }

    init() {
        this.fetchUsers();
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.closeModal.addEventListener('click', () => this.hideModal());
        this.closeDeleteModal.addEventListener('click', () => this.hideDeleteConfirmModal());
        this.userForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        // Send notification button in search section
        document.querySelector('.search-section #sendNotificationBtn').addEventListener('click', () => this.showNotificationModal());
        this.closeNotificationModal.addEventListener('click', () => this.hideNotificationModal());
        this.cancelNotificationBtn.addEventListener('click', () => this.hideNotificationModal());
        this.notificationForm.addEventListener('submit', (e) => this.handleNotificationSubmit(e));
        this.notificationRecipient.addEventListener('change', () => this.toggleUserSelect());
        
        // Search functionality
        this.searchButton.addEventListener('click', () => this.handleSearch());
        this.searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') this.handleSearch();
        });

        // Phone number validation
        const phoneInput = document.getElementById('phone');
        if (phoneInput) {
            phoneInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length > 10) value = value.slice(0, 10);
                e.target.value = value;
            });
        }

        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === this.userModal) {
                this.hideModal();
            }
            if (e.target === this.deleteConfirmModal) {
                this.hideDeleteConfirmModal();
            }
        });

        // Handle Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.userModal.classList.contains('show')) {
                    this.hideModal();
                }
                if (this.deleteConfirmModal.classList.contains('show')) {
                    this.hideDeleteConfirmModal();
                }
            }
        });
    }

    handleSearch() {
        const searchTerm = this.searchInput.value.toLowerCase().trim();
        
        if (!searchTerm) {
            this.filteredUsers = [...this.users];
        } else {
            this.filteredUsers = this.users.filter(user => 
                user.username.toLowerCase().includes(searchTerm) ||
                user.email.toLowerCase().includes(searchTerm) ||
                (user.phone && user.phone.includes(searchTerm))
            );
        }
        
        this.renderUsers();
    }

    async fetchUsers() {
        try {
            const response = await fetch('/api/admin/users');
            if (!response.ok) throw new Error('Failed to fetch users');
            this.users = await response.json();
            this.filteredUsers = [...this.users];
            this.renderUsers();
        } catch (error) {
            console.error('Error fetching users:', error);
            this.showNotification('Có lỗi khi tải danh sách người dùng', false);
        }
    }

    renderUsers() {
        this.userGrid.innerHTML = '';
        if (this.filteredUsers.length === 0) {
            if (this.searchInput.value) {
                this.userGrid.innerHTML = '<div class="no-users">Không tìm thấy người dùng phù hợp</div>';
            } else {
                this.userGrid.innerHTML = '<div class="no-users">Không có người dùng nào</div>';
            }
            return;
        }

        this.filteredUsers.forEach(user => {
            const userCard = this.createUserCard(user);
            this.userGrid.appendChild(userCard);
        });
    }

    createUserCard(user) {
        const card = document.createElement('div');
        card.className = 'user-card';
        
        card.innerHTML = `
            <div class="user-info">
                <h3 class="user-name">${user.username}</h3>
                <span class="user-role ${user.is_admin ? 'admin' : 'user'}">
                    ${user.is_admin ? 'Admin' : 'User'}
                </span>
            </div>
            <div class="user-actions">
                <button class="edit-btn" onclick="managementSystem.editUser('${user.id}')">
                    <i class="fas fa-edit"></i> Sửa
                </button>
                <button class="delete-btn" onclick="managementSystem.showDeleteConfirm('${user.id}')">
                    <i class="fas fa-trash"></i> Xóa
                </button>
            </div>
        `;

        return card;
    }

    showModal(editingUser) {
        if (!editingUser) return;
        this.userModal.classList.add('show');
        const modalTitle = document.querySelector('#userModal .modal-header h3');
        modalTitle.textContent = `Sửa thông tin - ${editingUser.username}`;
        document.getElementById('password').value = '';
        document.getElementById('role').value = editingUser.is_admin ? 'admin' : 'user';
        this.editingUserId = editingUser.id;
    }

    hideModal() {
        this.userModal.classList.remove('show');
        this.userForm.reset();
        this.editingUserId = null;
        document.getElementById('formError').textContent = '';
    }

    showDeleteConfirm(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        this.deleteConfirmModal.classList.add('show');
        const confirmMessage = document.querySelector('#deleteConfirmModal p');
        confirmMessage.textContent = `Bạn có chắc chắn muốn xóa người dùng "${user.username}"?`;
        
        document.getElementById('confirmDelete').onclick = () => {
            this.deleteUser(userId);
            this.hideDeleteConfirmModal();
        };
        
        document.getElementById('cancelDelete').onclick = () => {
            this.hideDeleteConfirmModal();
        };
    }

    hideDeleteConfirmModal() {
        this.deleteConfirmModal.classList.remove('show');
    }

    async editUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        // Store original user and populate edit form
        this.editUserOrig = { ...user };
        this.editUserForm = {
            username: user.username,
            email: user.email,
            role: user.is_admin ? 'admin' : 'user', // Map boolean is_admin to role string
            active: user.active,
        };

        // Populate form inputs from editUserForm
        document.getElementById('username').value = this.editUserForm.username;
        document.getElementById('email').value = this.editUserForm.email;
        document.getElementById('role').value = this.editUserForm.role;
        document.getElementById('active').checked = this.editUserForm.active;
        document.getElementById('password').value = ''; // Clear password field

        this.editingUserId = user.id;
        this.showModal(user); // Pass user to showModal for title update
    }

    showNotification(message, isSuccess = true) {
        const notification = document.createElement('div');
        notification.className = `notification ${isSuccess ? 'success' : 'error'}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.5s ease';
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        const errorElement = document.getElementById('formError');
        errorElement.textContent = '';

        // Get current form values
        const currentFormValues = {
            username: document.getElementById('username').value.trim(),
            email: document.getElementById('email').value.trim(),
            role: document.getElementById('role').value,
            active: document.getElementById('active').checked,
            password: document.getElementById('password').value.trim(),
        };

        // Calculate changes for partial update
        const changes = {};
        for (const key of Object.keys(currentFormValues)) {
            // Special handling for role (map 'admin'/'user' to boolean is_admin)
            if (key === 'role') {
                const isAdmin = currentFormValues[key] === 'admin';
                if (isAdmin !== this.editUserOrig.is_admin) {
                    changes.is_admin = isAdmin;
                }
            } else if (key === 'password') {
                // Only include password if it's not empty
                if (currentFormValues[key] !== '') {
                    changes[key] = currentFormValues[key];
                }
            }
            // Compare other fields
            else if (currentFormValues[key] !== this.editUserOrig[key]) {
                changes[key] = currentFormValues[key];
            }
        }

        if (Object.keys(changes).length === 0) {
            this.showNotification('Không có thay đổi nào để lưu', false);
            this.hideModal();
            return;
        }

        try {
            await this.updateUser(this.editingUserId, changes); // Send only changes
            this.showNotification('Cập nhật thông tin thành công', true);

            this.hideModal();
            await this.fetchUsers(); // Reload users after update
        } catch (error) {
            const errorMessage = error.message || 'Có lỗi khi lưu thông tin';
            errorElement.textContent = errorMessage;
            console.error('Error saving user:', error);
            this.showNotification(errorMessage, false);
        }
    }

    async updateUser(userId, userData) {
        const response = await fetch(`/api/admin/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to update user');
        }
    }

    async sendNotification(data) {
        const response = await fetch('/api/admin/notifications/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('Có lỗi khi gửi thông báo');
        }

        return await response.json();
    }

    showNotificationModal() {
        this.sendNotificationModal.classList.add('show');
        this.updateUserSelectList();
    }

    hideNotificationModal() {
        this.sendNotificationModal.classList.remove('show');
        this.notificationForm.reset();
        this.selectedUsers.clear();
        document.getElementById('notificationError').textContent = '';
        document.querySelector('.user-select-group').style.display = 'none';
    }

    toggleUserSelect() {
        const userSelectGroup = document.querySelector('.user-select-group');
        userSelectGroup.style.display =
            this.notificationRecipient.value === 'select' ? 'block' : 'none';
        
        if (this.notificationRecipient.value === 'select') {
            this.updateUserSelectList();
        }
    }

    updateUserSelectList() {
        if (!this.userSelectList) return;

        this.userSelectList.innerHTML = this.users
            .filter(user => !user.is_admin)
            .map(user => `
                <div class="user-select-item">
                    <label>
                        <input type="checkbox" value="${user.id}"
                            ${this.selectedUsers.has(user.id) ? 'checked' : ''}>
                        ${user.username}
                    </label>
                </div>
            `).join('');

        this.userSelectList.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const userId = e.target.value;
                if (e.target.checked) {
                    this.selectedUsers.add(userId);
                } else {
                    this.selectedUsers.delete(userId);
                }
            });
        });
    }

    async handleNotificationSubmit(e) {
        e.preventDefault();
        const errorElement = document.getElementById('notificationError');
        errorElement.textContent = '';

        try {
            const title = document.getElementById('notificationTitle').value.trim();
            const message = document.getElementById('notificationMessage').value.trim();
            const recipient = this.notificationRecipient.value;
            
            if (!title || !message) {
                throw new Error('Vui lòng điền đầy đủ thông tin');
            }

            const data = {
                title,
                message,
                recipient_type: recipient,
                recipient_ids: recipient === 'select' ? Array.from(this.selectedUsers) : null
            };

            if (recipient === 'select' && this.selectedUsers.size === 0) {
                throw new Error('Vui lòng chọn ít nhất một người dùng');
            }

            await this.sendNotification(data);
            this.showNotification('Gửi thông báo thành công', true);
            this.hideNotificationModal();
        } catch (error) {
            errorElement.textContent = error.message || 'Có lỗi xảy ra';
        }
    }

    async deleteUser(userId) {
        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete user');
            }

            await this.fetchUsers();
            this.showNotification('Xóa người dùng thành công', true);
        } catch (error) {
            console.error('Error deleting user:', error);
            this.showNotification('Có lỗi khi xóa người dùng', false);
        }
    }
}

// Initialize when DOM is loaded
let managementSystem;
document.addEventListener('DOMContentLoaded', () => {
    managementSystem = new ManagementSystem();
});