
async function loadProduct(categoryId = null) {
    const productContainer = document.getElementById('product-list');
    const template = document.getElementById('product-template');

    productContainer.innerHTML =
        '<div class="text-center w-100"><p>Đang tải sản phẩm...</p></div>';

    let url = CONFIG.API_BASE_URL + '/api/product/';
    if (categoryId && categoryId !== 'all') {
        url += `?category_id=${categoryId}`;
    }

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Không có sản phẩm");
        }

        const data = await response.json();

        productContainer.innerHTML = '';

        data.results.forEach(product => {

            const clone = template.content.cloneNode(true);
            const price = parseFloat(product.price);
            let imageUrl = 'img/bag-filled.png';
            if (product.images && product.images.length > 0) {
                imageUrl = CONFIG.API_BASE_URL + product.images[0].image;
            }

            const quickViewBtn = clone.querySelector(".quick-view-btn");
            quickViewBtn.setAttribute("data-id", product.id);
            clone.querySelector('#product-img').src = imageUrl;
            clone.querySelector('#product-price').textContent = price.toLocaleString('vi-VN') + "đ";
            clone.querySelector('#category-name').textContent = product.category_name;
            clone.querySelector('#product-name').textContent = product.name;
            clone.querySelector('#product-link-detail').href = `product-details.html?id=${product.id}`;
            clone.querySelector(".add-cart-btn").setAttribute("data-id", product.id);
            clone.querySelector(".add-wish-btn").setAttribute("data-id", product.id);

            productContainer.appendChild(clone);
        });
        await loadUserWishlist();

    } catch (error) {
        console.error(error);
        productContainer.innerHTML =
            "<p class='text-danger text-center'>Không thể tải sản phẩm</p>";
    }
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
