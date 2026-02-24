document.addEventListener("DOMContentLoaded", function () {
    const API_BASE = 'http://127.0.0.1:8000/api';

    const urlParams = new URLSearchParams(window.location.search);
    const categoryId = urlParams.get('id');
    const categoryName = urlParams.get('name');


    const sidebarContainer = document.getElementById('sidebar-categories');
    const sortSelect = document.getElementById('sort-select');
    const btnFilter = document.querySelector('.btn-veggie');

    if (categoryName) {
        document.getElementById('category-title').innerText = categoryName;
        document.getElementById('breadcrumb-category').innerText = categoryName;
    }

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
    if (btnFilter) {
        btnFilter.addEventListener('click', function (e) {
            e.preventDefault();
            applyFilters();
        });
    }
    if (sortSelect) {
        sortSelect.addEventListener('change', function () {
            applyFilters();
        });
    }

    applyFilters();
});

function loadProducts(apiUrl) {

    const productContainer = document.getElementById('product-list');
    const BASE_URL = 'http://127.0.0.1:8000';

    productContainer.innerHTML = `
        <div class="text-center w-100 py-5">
            <div class="spinner-border text-success"></div>
        </div>`;

    fetch(apiUrl)
        .then(res => res.json())
        .then(data => {

            productContainer.innerHTML = '';

            if (data.length === 0) {
                productContainer.innerHTML = `
                    <div class="col-12 text-center py-5">
                        <h5 class="text-muted">Không tìm thấy sản phẩm phù hợp.</h5>
                    </div>`;
                return;
            }

            data.results.forEach(p => {
                const formatPrice = new Intl.NumberFormat('vi-VN').format(p.price);
                const imageUrl = p.images?.length > 0
                    ? BASE_URL + p.images[0].image
                    : 'img/default.png';

                const html = `
                    <div class="col-6 col-md-4">
                        <div class="card h-100 border-0 shadow-sm product-card p-2">
                            <div class="position-relative overflow-hidden rounded bg-light p-4 text-center">
                                <img src="${imageUrl}" class="img-fluid" style="height:160px; object-fit:contain;">
                                 <div class="product-action-buttons d-flex justify-content-center gap-2">
                                    <button class="btn-action" title="Xem nhanh"><i class="fa-regular fa-eye"></i></button>
                                    <button class="btn-action" title="Thêm vào giỏ"><i class="fa-solid fa-cart-shopping"></i></button>
                                    <button class="btn-action" title="Yêu thích"><i class="fa-regular fa-heart"></i></button>
                                    <button class="btn-action" title="So sánh"><i class="fa-solid fa-arrows-rotate"></i></button>
                                </div>
                            </div>
                            <div class="card-body text-center">
                                <h6 class="text-muted small">${p.category_name}</h6>
                                <a href="product-detail.html?id=${p.id}" class="fw-bold text-dark text-decoration-none">
                                    ${p.name}
                                </a>
                                <div class="text-success fw-bold">${formatPrice}đ</div>
                            </div>
                        </div>
                    </div>
                `;

                productContainer.insertAdjacentHTML('beforeend', html);
            });
            renderPagination(data);
        })
        .catch(err => {
            console.error(err);
            productContainer.innerHTML =
                '<p class="text-center text-danger py-5">Lỗi kết nối máy chủ.</p>';
        });
}


function applyFilters(page = 1) {

    currentPage = page;

    const BASE_URL = 'http://127.0.0.1:8000';
    const minPrice = document.querySelector('input[placeholder="From Vnd"]').value;
    const maxPrice = document.querySelector('input[placeholder="To Vnd"]').value;
    const sortValue = document.getElementById('sort-select').value;
    const urlParams = new URLSearchParams(window.location.search);
    const categoryId = urlParams.get('id');

    let apiUrl = `${BASE_URL}/api/product/?page=${page}&`;

    if (categoryId) apiUrl += `category_id=${categoryId}&`;
    if (minPrice) apiUrl += `min_price=${minPrice}&`;
    if (maxPrice) apiUrl += `max_price=${maxPrice}&`;

    if (sortValue) {
        apiUrl += `ordering=${sortValue}&`;
    }
    loadProducts(apiUrl);
}

function changePage(page) {
    currentPage = page;
    applyFilters(page);
}
let currentPage = 1;

function renderPagination(data) {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;

    pagination.innerHTML = '';
    const totalPages = Math.ceil(data.count / 6);
    if (totalPages <= 1) return;

    let html = '';

    // Nút Previous
    if (currentPage > 1) {
        html += `
            <div class="page-btn" onclick="changePage(${currentPage - 1})">
                <i class="fa-solid fa-angles-left"></i>
            </div>`;
    }

    // Các số trang
    for (let i = 1; i <= totalPages; i++) {
        const activeClass = i === currentPage ? 'active' : '';
        html += `
            <div class="page-btn ${activeClass}" onclick="changePage(${i})">
                ${i}
            </div>`;
    }

    // Nút Next 
    if (currentPage < totalPages) {
        html += `
            <div class="page-btn" onclick="changePage(${currentPage + 1})">
                <i class="fa-solid fa-angles-right"></i>
            </div>`;
    }

    pagination.innerHTML = html;
}