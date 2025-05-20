console.log('inventory.js script started');
class InventoryManagement {
  constructor() {
    // Wait for DOM to be ready before initialization
    this._onDOMReady = this.init.bind(this);
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', this._onDOMReady);
    } else {
      setTimeout(this._onDOMReady, 0);
    }
  }

  setupEventListeners() {
    // Add button and modal events
    if (this.addProductBtn) {
      this.addProductBtn.addEventListener('click', e => {
        e.preventDefault();
        this.showAddModal();
      });
    }

    // Export button and modal events
    if (this.exportBtn) {
      this.exportBtn.addEventListener('click', () => this.showExportModal());
    }
    if (this.closeExportModal) {
      this.closeExportModal.addEventListener('click', () => this.hideExportModal());
    }
    if (this.cancelExportBtn) {
      this.cancelExportBtn.addEventListener('click', () => this.hideExportModal());
    }
    if (this.confirmExportBtn) {
      this.confirmExportBtn.addEventListener('click', () => this.processExport());
    }

    // Export search event handler
    const setupExportSearch = () => {
      if (this.exportSearch) {
        this.exportSearch.addEventListener('input', (e) => {
          const searchTerm = e.target.value.toLowerCase();
          this.filteredExportProducts = this.products.filter(p =>
            p.name.toLowerCase().includes(searchTerm) ||
            (p.category && p.category.toLowerCase().includes(searchTerm)) ||
            (p.description && p.description.toLowerCase().includes(searchTerm)) ||
            (p.source && p.source.toLowerCase().includes(searchTerm))
          );
          this.renderExportList();
        });
      }
    };
    setupExportSearch();

    // Product list event delegation
    if (this.container) {
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
    }

    // Modal close events
    if (this.closeModalBtn) {
      this.closeModalBtn.addEventListener('click', () => this.hideModal());
    }
    if (this.cancelBtn) {
      this.cancelBtn.addEventListener('click', () => this.hideModal());
    }

    // Search and filter controls
    if (this.searchInput) {
      this.searchInput.addEventListener('input', () => this.handleSearch());
    }
    if (this.categoryFilter) {
      this.categoryFilter.addEventListener('change', () => this.handleSearch());
    }
    if (this.sortOrder) {
      this.sortOrder.addEventListener('change', () => this.handleSearch());
    }
    if (this.stockFilter) {
      this.stockFilter.addEventListener('change', () => this.handleSearch());
    }

    // Form handling
    if (this.productForm) {
      this.productForm.addEventListener('submit', e => this.handleFormSubmit(e));
    }

    // Number input validation
    document.querySelectorAll('input[type="number"]').forEach(input => {
      input.addEventListener('input', () => {
        if (input.value < 0) input.value = 0;
      });
    });

    // Global escape key handler
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') this.hideModal();
    });

    // Delete modal events
    if (this.closeDeleteModal) {
      this.closeDeleteModal.addEventListener('click', () => this.hideDeleteConfirmModal());
    }
    if (this.cancelDeleteBtn) {
      this.cancelDeleteBtn.addEventListener('click', () => this.hideDeleteConfirmModal());
    }
    if (this.confirmDeleteBtn) {
      this.confirmDeleteBtn.addEventListener('click', async () => {
        if (this.deletingProductId) {
          await this.deleteProduct(this.deletingProductId);
          this.hideDeleteConfirmModal();
          await this.fetchProducts();
          this.showNotification('Xóa sản phẩm thành công', true);
        }
      });
    }
  }

  async init() {
    try {
      // Initialize state
      this.products = [];
      this.filteredExportProducts = [];
      this.editingProductId = null;
      this.deletingProductId = null;
      this.categories = new Set();
      this.editItemOrig = null;
      this.editForm = {};

      // Initialize DOM elements
      this.initializeDOMElements();

      // Hide all modals immediately
      const modals = document.querySelectorAll('.modal');
      modals.forEach(modal => modal.style.display = 'none');
      
      const backdrop = document.getElementById('modalBackdrop');
      if (backdrop) backdrop.style.display = 'none';

      // Load initial data
      await this.fetchProducts();

      // Setup event handlers after everything is loaded
      this.setupEventListeners();
    } catch (error) {
      console.error('Initialization error:', error);
      window.showNotification('Không thể khởi tạo giao diện', 'error');
    }
  }

  initializeDOMElements() {
    // Main container and buttons
    this.container = document.querySelector('.inventory-container');
    this.addProductBtn = document.getElementById('addProductBtn');
    this.exportBtn = document.getElementById('exportBtn');
    
    // Modals
    this.productModal = document.getElementById('productModal');
    this.exportModal = document.getElementById('exportModal');
    this.deleteConfirmModal = document.getElementById('deleteConfirmModal');
    this.modalBackdrop = document.getElementById('modalBackdrop');
    
    // Modal controls
    this.closeModalBtn = document.getElementById('closeModal');
    this.closeExportModal = document.getElementById('closeExportModal');
    this.cancelBtn = document.getElementById('cancelBtn');
    this.cancelExportBtn = document.getElementById('cancelExport');
    this.confirmExportBtn = document.getElementById('confirmExport');
    
    // Lists and forms
    this.productList = document.getElementById('productList');
    this.exportProductList = document.querySelector('.export-product-list .export-products');
    this.exportSearch = document.getElementById('exportSearch');
    this.productForm = document.getElementById('productForm');
    
    // Filters and search
    this.searchInput = document.getElementById('productSearch');
    this.categoryFilter = document.getElementById('categoryFilter');
    this.sortOrder = document.getElementById('sortOrder');
    this.stockFilter = document.getElementById('stockFilter');
    
    // Delete modal controls
    this.closeDeleteModal = document.querySelector('#deleteConfirmModal .close-btn');
    this.confirmDeleteBtn = document.getElementById('confirmDelete');
    this.cancelDeleteBtn = document.getElementById('cancelDelete');

  }

  async fetchProducts() {
    try {
      const res = await fetch('/api/inventory/products');
      const data = await res.json();
      this.products = data;
      this.filteredExportProducts = [...this.products];
      
      if (this.productList) {
        this.renderProducts(this.products);
      }
      if (this.categoryFilter) {
        this.updateCategoryFilter();
      }
      if (this.searchInput && this.stockFilter && this.sortOrder) {
        this.handleSearch();
      }
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
    if (!this.searchInput || !this.categoryFilter || !this.sortOrder || !this.stockFilter) return;

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
        if (stockStatus === 'in-stock') return p.quantity > 200;
        if (stockStatus === 'low-stock') return p.quantity > 0 && p.quantity <= 200;
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
      // Add this after successful form submission:
      document.dispatchEvent(new Event('productFormSubmit'));
      
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

  showExportModal() {
    if (!this.exportModal || !this.modalBackdrop) return;
    
    // Reset state first
    this.filteredExportProducts = [...this.products];
    if (this.exportSearch) {
      this.exportSearch.value = '';
    }

    // Update UI
    this.modalBackdrop.style.display = 'block';
    this.exportModal.style.display = 'flex';
    this.renderExportList();
  }

  hideExportModal() {
    if (!this.exportModal || !this.modalBackdrop) return;
    this.exportModal.style.display = 'none';
    this.modalBackdrop.style.display = 'none';
  }

  renderExportList() {
    if (!this.exportProductList) return;
    
    this.exportProductList.innerHTML = '';
    
    if (this.filteredExportProducts.length === 0) {
      this.exportProductList.innerHTML = '<div class="no-products">Không tìm thấy sản phẩm nào</div>';
      return;
    }
    
    this.filteredExportProducts.forEach(p => {
      if (p.quantity <= 0) return; // Skip out of stock items
      
      const item = document.createElement('div');
      item.className = 'export-product-item';
      item.innerHTML = `
        <div class="export-product-info">
          <div class="export-product-name">${p.name}</div>
          <div class="export-product-details">
            Tồn kho: ${p.quantity} | Giá: ${p.price.toLocaleString('vi-VN')} VNĐ
            ${p.category ? `<br>Danh mục: ${p.category}` : ''}
            ${p.source ? `<br>Nguồn: ${p.source}` : ''}
          </div>
        </div>
        <div class="export-quantity">
          <input type="number"
                 min="0"
                 max="${p.quantity}"
                 value="0"
                 data-id="${p.id}"
                 class="export-quantity-input">
        </div>
      `;

      // Add quantity input handler
      const input = item.querySelector('input');
      input.addEventListener('input', () => {
        const val = parseInt(input.value);
        const max = parseInt(input.max);
        if (val > max) {
          input.value = max;
        }
        if (val < 0) {
          input.value = 0;
        }
      });

      this.exportProductList.appendChild(item);
    });
  }

  async processExport() {
    try {
      const selectedProducts = [];
      if (!this.exportProductList) return;

      const inputs = this.exportProductList.querySelectorAll('.export-quantity-input');
      inputs.forEach(input => {
        const quantity = parseInt(input.value);
        if (quantity > 0) {
          selectedProducts.push({
            id: input.dataset.id,
            quantity: quantity
          });
        }
      });

      if (selectedProducts.length === 0) {
        this.showNotification('Vui lòng chọn sản phẩm để xuất', false);
        return;
      }

      // Update quantities
      for (const product of selectedProducts) {
        const currentProduct = this.products.find(p => p.id === product.id);
        if (currentProduct) {
          const newQuantity = currentProduct.quantity - product.quantity;
          await this.updateProduct(product.id, { quantity: newQuantity });
        }
      }

      this.hideExportModal();
      await this.fetchProducts();
      this.showNotification('Xuất hàng thành công', true);
    } catch (error) {
      console.error('Export error:', error);
      this.showNotification('Có lỗi khi xuất hàng', false);
    }
  }

  getStockStatusClass(p) {
    if (!p || typeof p.quantity !== 'number') return '';
    if (p.quantity <= 0) return 'out-of-stock';
    return p.quantity <= 200 ? 'low-stock' : 'in-stock';
  }
  
  getStockStatusText(p) {
    if (!p || typeof p.quantity !== 'number') return 'N/A';
    if (p.quantity <= 0) return 'Hết hàng';
    return p.quantity <= 200 ? 'Sắp hết hàng' : 'Còn hàng';
  }

  handleExportSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    this.filteredExportProducts = this.products.filter(p =>
      p.name.toLowerCase().includes(searchTerm) ||
      (p.category && p.category.toLowerCase().includes(searchTerm)) ||
      (p.description && p.description.toLowerCase().includes(searchTerm)) ||
      (p.source && p.source.toLowerCase().includes(searchTerm))
    );
    this.renderExportList();
  }

  showExportModal() {
    if (!this.exportModal || !this.modalBackdrop) return;
    
    // Reset state first
    this.filteredExportProducts = [...this.products];
    if (this.exportSearch) {
        this.exportSearch.value = '';
    }

    // Update UI
    this.modalBackdrop.style.display = 'block';
    this.exportModal.style.display = 'flex';
    this.renderExportList();
  }

  hideExportModal() {
    if (!this.exportModal || !this.modalBackdrop) return;
    this.exportModal.style.display = 'none';
    this.modalBackdrop.style.display = 'none';
  }

  renderExportList() {
    if (!this.exportProductList) return;
    
    this.exportProductList.innerHTML = '';
    
    if (this.filteredExportProducts.length === 0) {
      this.exportProductList.innerHTML = '<div class="no-products">Không tìm thấy sản phẩm nào</div>';
      return;
    }
    
    this.filteredExportProducts.forEach(p => {
      if (p.quantity <= 0) return; // Skip out of stock items
      
      const item = document.createElement('div');
      item.className = 'export-product-item';
      item.innerHTML = `
        <div class="export-product-info">
          <div class="export-product-name">${p.name}</div>
          <div class="export-product-details">
            Tồn kho: ${p.quantity} | Giá: ${p.price.toLocaleString('vi-VN')} VNĐ
            ${p.category ? `<br>Danh mục: ${p.category}` : ''}
            ${p.source ? `<br>Nguồn: ${p.source}` : ''}
          </div>
        </div>
        <div class="export-quantity">
          <input type="number"
                 min="0"
                 max="${p.quantity}"
                 value="0"
                 data-id="${p.id}"
                 class="export-quantity-input">
        </div>
      `;

      const input = item.querySelector('input');
      input.addEventListener('input', () => {
        const val = parseInt(input.value);
        const max = parseInt(input.max);
        if (val > max) {
          input.value = max;
        }
        if (val < 0) {
          input.value = 0;
        }
      });

      this.exportProductList.appendChild(item);
    });
  }

  async processExport() {
    try {
      const exports = [];
      const inputs = this.exportProductList.querySelectorAll('.export-quantity-input');
      
      inputs.forEach(input => {
        const quantity = parseInt(input.value);
        if (quantity > 0) {
          const productId = input.dataset.id;
          const product = this.products.find(p => p.id === productId);
          if (product) {
            exports.push({
              id: productId,
              name: product.name,
              quantity: quantity
            });
          }
        }
      });

      if (exports.length === 0) {
        this.showNotification('Vui lòng chọn sản phẩm để xuất', false);
        return;
      }

      // Here you would typically send this to your backend
      console.log('Exporting products:', exports);
      
      // Update local inventory
      for (const item of exports) {
        const product = this.products.find(p => p.id === item.id);
        if (product) {
          const newQuantity = product.quantity - item.quantity;
          await this.updateProduct(item.id, { quantity: newQuantity });
        }
      }

      // Refresh the display
      await this.fetchProducts();
      this.hideExportModal();
      this.showNotification('Xuất hàng thành công', true);
    } catch (error) {
      console.error('Export error:', error);
      this.showNotification('Có lỗi khi xuất hàng', false);
    }
  }

  showNotification(msg, success = true) {
    // Use the global showNotification function from persistent-notification.js
    window.showNotification(msg, success ? 'success' : 'error');
  }
}

// Wait for DOM to be ready before initializing
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new InventoryManagement());
} else {
    new InventoryManagement();
}
