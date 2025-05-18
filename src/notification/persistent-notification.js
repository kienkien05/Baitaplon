class NotificationManager {
    constructor() {
        console.log('NotificationManager initialized');
        this.init();
    }

    init() {
        this.setupNotifications();
    }

    setupNotifications() {
        const notificationBtn = document.getElementById('notificationBtn');
        const dropdownContent = document.querySelector('.dropdown-content');
        const markAllReadBtn = document.getElementById('markAllRead');
        const userData = JSON.parse(localStorage.getItem('auth_user')) || {};

        console.log('notificationBtn:', notificationBtn);
        console.log('dropdownContent:', dropdownContent);
        console.log('markAllReadBtn:', markAllReadBtn);

        if (notificationBtn && dropdownContent) {
            this.loadNotifications(); // Load notifications initially
            
            notificationBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isVisible = dropdownContent.classList.contains('show');
                
                // Close all other dropdowns first
                document.querySelectorAll('.dropdown-content.show').forEach(dropdown => {
                    if (dropdown !== dropdownContent) {
                        dropdown.classList.remove('show');
                    }
                });
                
                dropdownContent.classList.toggle('show');
                
                if (!isVisible) {
                    this.loadNotifications();
                }
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!dropdownContent.contains(e.target) && !notificationBtn.contains(e.target)) {
                    dropdownContent.classList.remove('show');
                }
            });

            // Prevent dropdown from closing when clicking inside it
            dropdownContent.addEventListener('click', (e) => {
                e.stopPropagation();
            });

            // Add send notification button for admin users
            if (userData.is_admin) {
                const sendNotifBtn = document.createElement('button');
                sendNotifBtn.id = 'sendNotificationBtn';
                sendNotifBtn.className = 'btn btn-primary';
                sendNotifBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Gửi thông báo';
                dropdownContent.querySelector('.notification-header').appendChild(sendNotifBtn);

                sendNotifBtn.addEventListener('click', () => {
                    this.showNotificationModal();
                });
            }
        }

        if (markAllReadBtn) {
            markAllReadBtn.addEventListener('click', async () => {
                try {
                    const response = await fetch('/api/notifications/mark-read', {
                        method: 'POST',
                    });
                    if (!response.ok) throw new Error('Failed to mark notifications as read');
                    
                    const notifications = document.querySelectorAll('.notification-item.unread');
                    notifications.forEach(notification => {
                        notification.classList.remove('unread');
                    });
                    document.querySelector('.notification-badge').textContent = '0';
                } catch (error) {
                    console.error('Error marking notifications as read:', error);
                    showNotification('Không thể đánh dấu thông báo đã đọc', 'error');
                }
            });
        }
    }

    loadNotifications() {
        fetch('/api/notifications')
            .then(response => {
                if (!response.ok) throw new Error('Failed to fetch notifications');
                return response.json();
            })
            .then(notifications => {
                const notificationList = document.querySelector('.notification-list');
                notificationList.innerHTML = '';
                
                let unreadCount = 0;
                
                notifications.forEach(notification => {
                    const notifItem = document.createElement('div');
                    notifItem.className = `notification-item ${notification.is_read ? '' : 'unread'}`;
                    const createdAt = new Date(notification.created_at).toLocaleString();
                    let formattedMessage = notification.message;
                    
                    // If this is a registration notification, format it specially
                    if (notification.title === 'Người dùng mới đăng ký') {
                        const username = notification.message.split(': ')[1];
                        formattedMessage = `<span class="register-time" style="color: #000000; font-weight: 600; display: inline-block; margin-right: 8px;">Có người đăng ký lúc ${createdAt}:</span><span class="username" style="color: #000000; display: inline;">Tài khoản mới được tạo với tên đăng nhập: ${username}</span>`;
                    }
                    
                    notifItem.innerHTML = `
                        <div class="notification-content">
                            <div class="notification-left-column">
                                <h4 class="notification-title">${notification.title}</h4>
                                <span class="notification-time">${createdAt}</span>
                            </div>
                            <div class="notification-right-column">
                                <p class="notification-message">${formattedMessage}</p>
                            </div>
                        </div>
                        <button class="delete-notification-btn" title="Xóa thông báo">
                            <i class="fas fa-trash"></i>
                        </button>
                    `;
                    
                    if (!notification.is_read) {
                        unreadCount++;
                        notifItem.addEventListener('click', () => {
                            this.markNotificationAsRead(notification.id, notifItem);
                        });
                    }

                    // Add delete button click handler
                    const deleteBtn = notifItem.querySelector('.delete-notification-btn');
                    deleteBtn.addEventListener('click', async (e) => {
                        e.stopPropagation(); // Prevent triggering the mark as read
                        await this.deleteNotification(notification.id, notifItem);
                    });
                    
                    notificationList.appendChild(notifItem);
                });
                
                const badge = document.querySelector('.notification-badge');
                badge.textContent = unreadCount;
                badge.style.display = unreadCount > 0 ? 'flex' : 'none';
                
                if (notifications.length === 0) {
                    notificationList.innerHTML = '<div class="no-notifications">Không có thông báo nào</div>';
                }
            })
            .catch(error => {
                console.error('Error loading notifications:', error);
                document.querySelector('.notification-list').innerHTML =
                    '<div class="error-message">Không thể tải thông báo. Vui lòng thử lại sau.</div>';
            });
    }

    markNotificationAsRead(notificationId, notifItem) {
        fetch(`/api/notifications/${notificationId}/mark-read`, {
            method: 'POST'
        })
        .then(response => {
            if (!response.ok) throw new Error('Failed to mark notification as read');
            notifItem.classList.remove('unread');
            const badge = document.querySelector('.notification-badge');
            badge.textContent = Math.max(0, parseInt(badge.textContent) - 1);
        })
        .catch(error => {
            console.error('Error marking notification as read:', error);
        });
    }

    showNotificationModal() {
        const modalHtml = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <h3>Gửi thông báo mới</h3>
                    <input type="text" id="notifTitle" placeholder="Tiêu đề thông báo" required>
                    <textarea id="notifMessage" placeholder="Nội dung thông báo" required></textarea>
                    <div class="modal-actions">
                        <button type="button" class="btn btn-secondary" id="cancelNotif">Hủy</button>
                        <button type="button" class="btn btn-primary" id="sendNotifConfirm">Gửi</button>
                    </div>
                </div>
            </div>
        `;
        
        const modalDiv = document.createElement('div');
        modalDiv.innerHTML = modalHtml;
        document.body.appendChild(modalDiv);

        // Add close modal functionality
        document.getElementById('cancelNotif').addEventListener('click', () => {
            modalDiv.querySelector('.modal-overlay').remove();
        });

        // Close modal when clicking outside
        modalDiv.querySelector('.modal-overlay').addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                e.target.remove();
            }
        });

        // Add event listener for send button
        document.getElementById('sendNotifConfirm').addEventListener('click', async () => {
            const title = document.getElementById('notifTitle').value.trim();
            const message = document.getElementById('notifMessage').value.trim();

            if (!title || !message) {
                showNotification('Vui lòng điền đầy đủ thông tin', 'error');
                return;
            }

            try {
                const response = await fetch('/api/admin/notifications/send', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        title: title,
                        message: message,
                        recipient_type: 'all'
                    })
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || 'Failed to send notification');
                }
                
                modalDiv.querySelector('.modal-overlay').remove();
                showNotification('Đã gửi thông báo thành công!', 'success');
                this.loadNotifications(); // Reload notifications to show the new one
            } catch (error) {
                console.error('Error sending notification:', error);
                showNotification(error.message || 'Không thể gửi thông báo. Vui lòng thử lại.', 'error');
            }
        });
    }

    async deleteNotification(notificationId, notifItem) {
        try {
            const response = await fetch(`/api/notifications/${notificationId}`, {
                method: 'POST'
            });

            if (!response.ok) throw new Error('Failed to delete notification');

            // Remove the notification item with animation
            notifItem.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                notifItem.remove();
                // Update empty state if needed
                const notificationList = document.querySelector('.notification-list');
                if (notificationList.children.length === 0) {
                    notificationList.innerHTML = '<div class="no-notifications">Không có thông báo nào</div>';
                }
            }, 300);

            this.showNotification('Đã xóa thông báo', 'success');
        } catch (error) {
            console.error('Error deleting notification:', error);
            this.showNotification('Không thể xóa thông báo', 'error');
        }
    }
}

export function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.5s ease';
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}


document.addEventListener('DOMContentLoaded', () => {
    new NotificationManager();
});