document.addEventListener("DOMContentLoaded", function () {
    const API_BASE = 'http://127.0.0.1:8000/api';

    // 1. Lấy tham số id và name từ URL (ví dụ: ?id=1&name=Vegetables)
    const urlParams = new URLSearchParams(window.location.search);
    const categoryId = urlParams.get('id');
    const categoryName = urlParams.get('name');

    if (categoryName) {
        document.getElementById('category-title').innerText = categoryName;
        document.getElementById('breadcrumb-category').innerText = categoryName;
    }

    const sidebarContainer = document.getElementById('sidebar-categories');
    if (sidebarContainer) {
        fetch(`${API_BASE}/category/`)
            .then(res => res.json())
            .then(data => {
                sidebarContainer.innerHTML = '';
                data.forEach(cat => {
                    const isActive = cat.id == categoryId ? 'text-success fw-bold' : 'text-dark';
                    const catLink = `
                        <li class="mb-2 pb-2 border-bottom border-light">
                            <a href="detail.html?id=${cat.id}&name=${cat.name}" 
                               class="text-decoration-none ${isActive} d-flex justify-content-between align-items-center small">
                                ${cat.name}
                                <i class="fa-solid fa-chevron-right" style="font-size: 0.7rem;"></i>
                            </a>
                        </li>
                    `;
                    sidebarContainer.insertAdjacentHTML('beforeend', catLink);
                });
            });
    }

    if (categoryId) {
        loadProductDetail(categoryId);
    }
});

function loadProductDetail(categoryId) {
    const productContainer = document.getElementById('product-list');
    const BASE_URL = 'http://127.0.0.1:8000';

    productContainer.innerHTML = `
        <div class="text-center w-100 py-5">
            <div class="spinner-border text-success" role="status"></div>
            <p class="mt-2 text-muted">Đang tải sản phẩm...</p>
        </div>`;

    fetch(`${BASE_URL}/api/product/?category_id=${categoryId}`)
        .then(res => res.json())
        .then(data => {
            productContainer.innerHTML = '';

            if (data.length === 0) {
                productContainer.innerHTML = `
                    <div class="col-12 text-center py-5">
                        <img src="https://cdn-icons-png.flaticon.com/512/7486/7486744.png" width="80" class="opacity-25 mb-3">
                        <h5 class="text-muted">Không tìm thấy sản phẩm nào trong danh mục này.</h5>
                    </div>`;
                return;
            }

            data.forEach(p => {
                const formatPrice = new Intl.NumberFormat('vi-VN').format(p.price);
                let imageUrl = p.images?.length > 0 ? BASE_URL + p.images[0].image : 'img/default.png';

                const html = `
                    <div class="col-6 col-md-4">
                        <div class="card h-100 border-0 shadow-sm product-card p-2">
                            <div class="position-relative overflow-hidden rounded bg-light p-4 text-center">
                                <img src="${imageUrl}" class="img-fluid product-img-main" style="height: 160px; object-fit: contain;">
                                <div class="product-action-buttons d-flex justify-content-center gap-2">
                                    <button class="btn-action" title="Xem nhanh" onclick="viewQuick(${p.id})"><i class="fa-regular fa-eye"></i></button>
                                    <button class="btn-action" title="Thêm vào giỏ" onclick="addToCart(${p.id})"><i class="fa-solid fa-cart-shopping"></i></button>
                                    <button class="btn-action" title="Yêu thích"><i class="fa-regular fa-heart"></i></button>
                                    <button class="btn-action" title="So sánh"><i class="fa-solid fa-arrows-rotate"></i></button>
                                </div>
                            </div>
                            <div class="card-body text-center mt-2 px-1">
                                <h6 class="text-muted small mb-1" style="font-size: 0.75rem;">${p.category_name}</h6>
                                <a href="product-detail.html?id=${p.id}" class="text-decoration-none text-dark fw-bold d-block mb-2 text-truncate">${p.name}</a>
                                <div class="text-success fw-bold fs-5">${formatPrice}đ</div>
                            </div>
                        </div>
                    </div>
                `;
                productContainer.insertAdjacentHTML('beforeend', html);
            });
        })
        .catch(err => {
            console.error("Lỗi:", err);
            productContainer.innerHTML = '<p class="text-center text-danger py-5">Lỗi kết nối máy chủ.</p>';
        });
}