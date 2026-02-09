
function loadProduct(categoryId = null) {
    const productContainer = document.getElementById('product-list');
    const BASE_URL = 'http://127.0.0.1:8000';
    productContainer.innerHTML = '<div class="text-center w-100"><p>Đang tải sản phẩm...</p></div>';

    let url = 'http://127.0.0.1:8000/api/product/';
    if (categoryId && categoryId !== 'all') {
        url += `?category_id=${categoryId}`;
    }

    fetch(url)
        .then(res => res.json())
        .then(data => {
            productContainer.innerHTML = '';

            if (data.length === 0) {
                productContainer.innerHTML = '<p class="text-center w-100">Hiện chưa có sản phẩm nào thuộc danh mục này.</p>';
                return;
            }
            data.forEach(p => {
                const formatPrice = new Intl.NumberFormat('vi-VN').format(p.price);
                let imageUrl = 'img/bag-filled.png';
                if (p.images && p.images.length > 0) {
                    imageUrl = BASE_URL + p.images[0].image;
                }
                const productHtml = `
                    <div class="col-6 col-lg-3">
                        <div class="card h-100 border-0 shadow-sm text-center p-3 product-card">
                            <div class="product-img-bg mb-3">
                                <img src="${imageUrl}" class="img-fluid" alt="${p.name}">
                                <div class="product-action-buttons d-flex justify-content-center gap-2">
                                    <button class="btn-action" title="Xem nhanh"><i class="fa-regular fa-eye"></i></button>
                                    <button class="btn-action" title="Thêm vào giỏ"><i class="fa-solid fa-cart-shopping"></i></button>
                                    <button class="btn-action" title="Yêu thích"><i class="fa-regular fa-heart"></i></button>
                                    <button class="btn-action" title="So sánh"><i class="fa-solid fa-arrows-rotate"></i></button>
                                </div>
                            </div>

                            <h6 class="text-muted small mb-1 text-uppercase" style="font-size: 0.75rem;">${p.category_name}</h6>
                            <a href="#" class="text-decoration-none text-dark fw-bold mb-2 d-block">${p.name}</a>
                            <div class="d-flex justify-content-center gap-2">
                                <span class="text-success fw-bold">${formatPrice}đ</span>
                            </div>
                        </div>
                    </div>
                `;
                productContainer.insertAdjacentHTML('beforeend', productHtml);
            });
        })
        .catch(err => {
            console.error("Lỗi API:", err);
            productContainer.innerHTML = '<p class="text-center text-danger w-100">Không thể kết nối với máy chủ.</p>';
        });
}

function filterProducts(categoryId, element) {
    event.preventDefault();

    document.querySelectorAll('#product-categories-nav .nav-link').forEach(link => {
        link.classList.remove('active', 'text-success');
        link.classList.add('text-dark');
    });

    element.classList.add('active', 'text-success');
    element.classList.remove('text-dark');
    loadProduct(categoryId);
}
