console.log('inventory.js script started');
class InventoryManagement {
  constructor() {
    this.products = [];
    
    // Các nút và modal
    this.addProductBtn = document.getElementById('addProductBtn');
    this.productModal = document.getElementById('productModal');
    this.modalBackdrop = document.getElementById('modalBackdrop');
    this.closeModalBtn = document.getElementById('closeModal');
    this.cancelBtn = document.getElementById('cancelBtn');
    
    // Danh sách sản phẩm
    this.productList = document.getElementById('productList');
    this.container = this.productList;

    // Sự kiện mở modal Thêm
    this.addProductBtn.addEventListener('click', e => {
      e.preventDefault();
      this.showAddModal(); // Call the new method
    });

    // Delegate sự kiện Edit từ grid
    this.container.addEventListener('click', e => {
      const editBtn = e.target.closest('.edit-btn');
      if (editBtn) {
        const id = e.target.closest('.product-card').dataset.id;
        this.showEditModal(id);
      }
      const deleteBtn = e.target.closest('.delete-btn');
      if (deleteBtn) {
        const id = e.target.closest('.product-card').dataset.id;
        this.showDeleteConfirm(id);
      }
    });

    // Đóng modal Thêm
    this.closeModalBtn.addEventListener('click', () => this.hideModal());
    this.cancelBtn.addEventListener('click', () => this.hideModal());
    
    this.editingProductId = null;
    this.deletingProductId = null;
    this.categories = new Set();
    this.editItemOrig = null; // Store original item for comparison
    this.editForm = {}; // Store form data for editing
    
    this.initializeElements();
    this.init();
  }

  initializeElements() {
    // Controls tìm kiếm, lọc
    this.searchInput = document.getElementById('productSearch');
    this.categoryFilter = document.getElementById('categoryFilter');
    this.sortOrder = document.getElementById('sortOrder');
    this.stockFilter = document.getElementById('stockFilter');
    // Form Thêm / Edit
    this.productForm = document.getElementById('productForm');
    // Modal xóa
    this.deleteConfirmModal = document.getElementById('deleteConfirmModal');
    this.closeDeleteModal = document.getElementById('closeDeleteModal');
    this.confirmDeleteBtn = document.getElementById('confirmDelete');
    this.cancelDeleteBtn = document.getElementById('cancelDelete');

    // Ẩn modals ban đầu
    this.productModal.style.display = 'none';
    this.deleteConfirmModal.style.display = 'none';
    this.modalBackdrop.style.display = 'none';

    // Đóng modal khi click backdrop
    this.productModal.addEventListener('click', e => {
      if (e.target === this.productModal) this.hideModal();
    });
    this.deleteConfirmModal.addEventListener('click', e => {
      if (e.target === this.deleteConfirmModal) this.hideDeleteConfirmModal();
    });

    // Xử lý nút xóa
    this.closeDeleteModal.addEventListener('click', () => this.hideDeleteConfirmModal());
    this.cancelDeleteBtn.addEventListener('click', () => this.hideDeleteConfirmModal());
    this.confirmDeleteBtn.addEventListener('click', async () => {
      if (this.deletingProductId) {
        await this.deleteProduct(this.deletingProductId);
        this.hideDeleteConfirmModal();
        await this.fetchProducts(); // Tải lại danh sách sau khi xóa
        this.showNotification('Xóa sản phẩm thành công', true);
      }
    });
  }

  async init() {
    this.setupEventListeners();
    this.setupNotifications();
    await this.fetchProducts(); // Tải dữ liệu sản phẩm khi khởi tạo
    this.handleSearch();
    // Đã xóa location.reload() ở đây
  }

  setupEventListeners() {
    this.searchInput.addEventListener('input', () => this.handleSearch());
    this.categoryFilter.addEventListener('change', () => this.handleSearch());
    this.sortOrder.addEventListener('change', () => this.handleSearch());
    this.stockFilter.addEventListener('change', () => this.handleSearch());
    if (this.productForm) {
      this.productForm.addEventListener('submit', e => this.handleFormSubmit(e));
    }

    document.querySelectorAll('input[type="number"]').forEach(input => {
      input.addEventListener('input', () => {
        if (input.value < 0) input.value = 0;
      });
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') this.hideModal();
    });
  }

  async fetchProducts() {
    try {
      const res = await fetch('/api/inventory/products'); 
      const data = await res.json();
      this.products = data;
      this.renderProducts(this.products);
      // Cập nhật danh sách các danh mục để lọc
      this.updateCategoryFilter();
    } catch (err) {
      console.error('Error fetching products:', err);
      this.showNotification('Có lỗi khi tải danh sách sản phẩm', false);
    }
  }

  // Thêm method để cập nhật danh sách danh mục
  updateCategoryFilter() {
    // Lưu giá trị hiện tại
    const currentValue = this.categoryFilter.value;
    
    // Lấy tất cả danh mục từ sản phẩm
    this.categories = new Set();
    this.products.forEach(p => {
      if (p.category) this.categories.add(p.category);
    });
    
    // Cập nhật select
    const options = ['<option value="">Tất cả danh mục</option>'];
    this.categories.forEach(cat => {
      options.push(`<option value="${cat}">${cat}</option>`);
    });
    
    this.categoryFilter.innerHTML = options.join('');
    
    // Khôi phục giá trị đã chọn trước đó
    if (currentValue) this.categoryFilter.value = currentValue;
  }

  renderProducts(list) {
    this.productList.innerHTML = '';
    if (list.length === 0) {
      this.productList.innerHTML = '<div class="no-products">Không có sản phẩm nào</div>';
      return;
    }
    list.forEach(p => {
      const card = this.createProductElement(p);
      this.productList.appendChild(card);
    });
  }

  createProductElement(p) {   // get result from BE -> create product tag
    const card = document.createElement('div');
    card.className = 'product-card';
    card.dataset.id = p.id;
    card.innerHTML = `
      <div class="product-header">
        <h3 class="product-title">${p.name}</h3>
        <span class="product-category">${p.category || 'Chưa phân loại'}</span>
      </div>
      <div class="product-info">
        <p class="product-price">Giá: ${p.price.toLocaleString('vi-VN')} VNĐ</p>
        <p class="product-quantity">Số lượng: ${p.quantity}</p>
        <p class="product-source">Nguồn: ${p.source || 'N/A'}</p>
        <p class="stock-status ${this.getStockStatusClass(p)}">${this.getStockStatusText(p)}</p>
      </div>
      <div class="product-actions">
        <button class="edit-btn"><i class="fas fa-edit"></i> Chỉnh sửa</button>
        <button class="delete-btn"><i class="fas fa-trash"></i> Xóa</button>
      </div>
    `;
    return card;
  }

  showAddModal() {
    this.clearForm(); // Clear form and reset editingProductId
    this.productModal.style.display = 'flex';
    this.modalBackdrop.style.display = 'block';
  }

  hideModal() {
    this.productModal.style.display = 'none';
    this.modalBackdrop.style.display = 'none';
    this.clearForm(); // Also clear form when hiding modal
  }

  showEditModal(id) {
    this.editingProductId = id;
    const p = this.products.find(x => x.id === id);
    if (!p) return;

    // Store original item and populate edit form
    this.editItemOrig = { ...p };
    this.editForm = {
      name: p.name,
      price: p.price,
      quantity: p.quantity,
      source: p.source || '',
      category: p.category || '',
      description: p.description || '',
    };

    // Populate form inputs from editForm
    this.productForm.name.value = this.editForm.name;
    this.productForm.price.value = this.editForm.price;
    this.productForm.quantity.value = this.editForm.quantity;
    this.productForm.source.value = this.editForm.source;
    this.productForm.category.value = this.editForm.category;
    this.productForm.description.value = this.editForm.description;

    // Show the modal directly without clearing the form
    this.productModal.style.display = 'flex';
    this.modalBackdrop.style.display = 'block';
  }

  showDeleteConfirm(id) {
    this.deletingProductId = id;
    this.deleteConfirmModal.style.display = 'flex';
    this.modalBackdrop.style.display = 'block';
  }

  hideDeleteConfirmModal() {
    this.deleteConfirmModal.style.display = 'none';
    this.modalBackdrop.style.display = 'none';
    this.deletingProductId = null;
  }

  clearForm() {
    this.productForm.reset();
    document.getElementById('formError').textContent = '';
    this.editingProductId = null;
  }

  // Thêm method để xử lý tìm kiếm và lọc
  handleSearch() {
    const searchTerm = this.searchInput.value.toLowerCase();
    const category = this.categoryFilter.value;
    const sortBy = this.sortOrder.value;
    const stockStatus = this.stockFilter.value;
    
    let filtered = [...this.products];
    
    // Lọc theo từ khóa
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchTerm) || 
        (p.description && p.description.toLowerCase().includes(searchTerm)) ||
        (p.source && p.source.toLowerCase().includes(searchTerm))
      );
    }
    
    // Lọc theo danh mục
    if (category) {
      filtered = filtered.filter(p => p.category === category);
    }
    
    // Lọc theo trạng thái tồn kho
    if (stockStatus !== 'all') {
      filtered = filtered.filter(p => {
        const min = p.minStock ?? 10;
        if (stockStatus === 'in-stock') return p.quantity > min;
        if (stockStatus === 'low-stock') return p.quantity > 0 && p.quantity <= min;
        if (stockStatus === 'out-of-stock') return p.quantity <= 0;
        return true;
      });
    }
    
    // Sắp xếp
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc': return a.name.localeCompare(b.name);
        case 'name-desc': return b.name.localeCompare(a.name);
        case 'price-asc': return a.price - b.price;
        case 'price-desc': return b.price - a.price;
        case 'quantity-asc': return a.quantity - b.quantity;
        case 'quantity-desc': return b.quantity - a.quantity;
        default: return 0;
      }
    });
    
    this.renderProducts(filtered);
  }

  async handleFormSubmit(e) {
    e.preventDefault();
    const errorDiv = document.getElementById('formError');
    errorDiv.textContent = '';

    const name = this.productForm.name.value.trim();
    const price = parseFloat(this.productForm.price.value);
    const qty = parseInt(this.productForm.quantity.value, 10);
    const source = this.productForm.source.value.trim();
    const category = this.productForm.category.value.trim();
    const description = this.productForm.description.value.trim();

    if (!name) {
      errorDiv.textContent = 'Tên sản phẩm không được để trống.';
      return;
    }

    if (isNaN(price) || price < 0) {
      errorDiv.textContent = 'Giá sản phẩm phải là số ≥ 0.';
      return;
    }

    if (isNaN(qty) || qty < 0) {
      errorDiv.textContent = 'Số lượng sản phẩm phải là số nguyên ≥ 0.';
      return;
    }

    // Populate editForm from current form values
    this.editForm = {
      name: name,
      price: price,
      quantity: qty,
      source: source,
      category: category,
      description: description,
    };

    try {
      if (this.editingProductId) {
        // Calculate changes for partial update
        const changes = {};
        for (const key of Object.keys(this.editForm)) {
          // Compare current form value with original value
          if (this.editForm[key] !== this.editItemOrig[key]) {
            changes[key] = this.editForm[key];
          }
        }

        if (Object.keys(changes).length === 0) {
          this.showNotification('Không có thay đổi nào để lưu', false);
          this.hideModal();
          return;
        }

        await this.updateProduct(this.editingProductId, changes); // Send only changes
        this.showNotification('Cập nhật sản phẩm thành công', true);
      } else {
        // Original logic for creating a new product
        const data = {
          name: name,
          price: price,
          quantity: qty,
          source: source,
          category: category,
          description: description,
        };
        await this.createProduct(data);
        this.showNotification('Thêm sản phẩm thành công', true);
      }
      this.hideModal();
      await this.fetchProducts(); // Tải lại danh sách sản phẩm sau khi lưu
    } catch (err) {
      console.error('Save error:', err);
      errorDiv.textContent = err.message || 'Có lỗi khi lưu sản phẩm';
      this.showNotification(err.message || 'Có lỗi khi lưu sản phẩm', false);
    }
  }

  async createProduct(data) {
    // send a POST request to below route
    const res = await fetch('/api/inventory/products', { 
      method: 'POST',
      headers: {'Content-Type':'application/json'}, 
      body: JSON.stringify(data)   // data get from func async handleFormSubmit 
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Không thể tạo sản phẩm');
    }
    return await res.json();
  }

  async updateProduct(id, data) {
    const res = await fetch(`/api/inventory/products/${id}`, {  // Corrected URL to match backend route
      method: 'PATCH',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Có lỗi khi cập nhật sản phẩm');
    }
    return await res.json();
  }

  async deleteProduct(id) {  // get id at product card -> send to api/inventory/product method['Delete]
    const res = await fetch(`/api/inventory/products/${id}`, {
      method: 'DELETE', 
      headers: {'Content-Type':'application/json'}
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Không thể xóa sản phẩm');
    }
  }

  getStockStatusClass(p) {
    if (p.quantity <= 0) return 'out-of-stock';
    const min = p.minStock ?? 10;
    return p.quantity <= min ? 'low-stock' : 'in-stock';
  }
  
  getStockStatusText(p) {
    if (p.quantity <= 0) return 'Hết hàng';
    const min = p.minStock ?? 10;
    return p.quantity <= min ? 'Sắp hết hàng' : 'Còn hàng';
  }

  setupNotifications() {
    // Giữ nguyên phần notifications
  }

  showNotification(msg, success = true) {
    let container = document.querySelector('.notification-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'notification-container';
      document.body.appendChild(container);
    }
    const note = document.createElement('div');
    note.className = `notification ${success ? 'success' : 'error'}`;
    note.textContent = msg;
    container.appendChild(note);
    requestAnimationFrame(() => note.classList.add('show'));
    setTimeout(() => {
      note.classList.remove('show');
      note.classList.add('fade-out');
      setTimeout(() => {
        note.remove();
        if (!container.children.length) container.remove();
      }, 300);
    }, 3000);
  }
}

document.addEventListener('DOMContentLoaded', () => new InventoryManagement());