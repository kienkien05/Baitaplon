
async function fetchProducts() {
  const res = await fetch('/api/products');
  const products = await res.json();
  renderProductTable(products);
}

function renderProductTable(products) {
  const tbody = document.querySelector('#productTable tbody');
  tbody.innerHTML = '';
  products.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.id}</td>
      <td>${p.name}</td>
      <td>${p.price}</td>
      <td>${p.amount}</td>
      <td>${p.source || ''}</td>
      <td>
        <button class="btn-edit" data-id="${p.id}"><i class="fas fa-edit"></i></button>
        <button class="btn-delete" data-id="${p.id}"><i class="fas fa-trash"></i></button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

document.addEventListener('DOMContentLoaded', function() {
  fetchProducts();

  // Add logout handler
  document.querySelector('a[href="/auth/logout"]').addEventListener('click', async (e) => {
    e.preventDefault();
    try {
      const AuthService = (await import('../services/AuthService.js')).default;
      await AuthService.logout();
      window.location.href = '/auth/login?logout=true';
    } catch (error) {
      console.error('Logout error:', error);
    }
  });

  
  const modal = document.getElementById('productModal');
  const btnAdd = document.getElementById('btnAddProduct');
  const closeModal = document.getElementById('closeProductModal');
  const form = document.getElementById('productForm');

  btnAdd.onclick = () => {
    form.reset();
    document.getElementById('modalTitle').textContent = 'Thêm sản phẩm';
    document.getElementById('productId').value = '';
    modal.style.display = 'block';
  };
  closeModal.onclick = () => modal.style.display = 'none';

  
  document.querySelector('#productTable').addEventListener('click', async (e) => {
    if (e.target.closest('.btn-edit')) {
      const id = e.target.closest('.btn-edit').dataset.id;
      const res = await fetch('/api/products');
      const products = await res.json();
      const p = products.find(x => x.id == id);
      if (p) {
        document.getElementById('modalTitle').textContent = 'Sửa sản phẩm';
        document.getElementById('productId').value = p.id;
        document.getElementById('productName').value = p.name;
        document.getElementById('productPrice').value = p.price;
        document.getElementById('productAmount').value = p.amount;
        document.getElementById('productSource').value = p.source || '';
        modal.style.display = 'block';
      }
    }
    
    if (e.target.closest('.btn-delete')) {
      const id = e.target.closest('.btn-delete').dataset.id;
      if (confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
        await fetch('/api/products/' + id, { method: 'DELETE' });
        fetchProducts();
      }
    }
  });

  
  form.onsubmit = async (e) => {
    e.preventDefault();
    const id = document.getElementById('productId').value;
    const data = {
      name: document.getElementById('productName').value,
      price: parseFloat(document.getElementById('productPrice').value),
      amount: parseInt(document.getElementById('productAmount').value),
      source: document.getElementById('productSource').value
    };
    if (id) {
      await fetch('/api/products/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } else {
      await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    }
    modal.style.display = 'none';
    fetchProducts();
  };
});
