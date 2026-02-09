document.addEventListener("DOMContentLoaded", function () {
    const categoryContainer = document.getElementById('category-list');
    const API_BASE = 'http://localhost:8000/api';

    fetch(`${API_BASE}/category/`)
        .then(response => response.json())
        .then(data => {
            categoryContainer.innerHTML = '';

            data.forEach(category => {
                const categoryNameEncoded = encodeURIComponent(category.name);

                const categoryHtml = `
            <div class="col-6 col-md-3">
               <a href="./detail.html?id=${category.id}&name=${categoryNameEncoded}" style="text-decoration:none;"> 
                    <div class="category-card">
                        <div class="category-icon-bg">
                            <img src="http://localhost:8000${category.image}" alt="${category.name}">
                        </div>
                        <h5 class="fw-bold mt-3 mb-1 text-dark">${category.name}</h5>
                        <p class="text-muted small">${category.description.substring(0, 50)}...</p>
                    </div>
                </a>
            </div>
        `;
                categoryContainer.innerHTML += categoryHtml;
            });
        })
        .catch(error => {
            console.error('Lỗi khi load category:', error);
            categoryContainer.innerHTML = '<p class="text-center text-danger">Không thể tải danh mục sản phẩm.</p>';
        });
})
document.addEventListener("DOMContentLoaded", function () {
    const navContainer = document.getElementById('product-categories-nav');

    fetch('http://127.0.0.1:8000/api/category/')
        .then(res => res.json())
        .then(data => {
            data.slice(0, 4).forEach((category, index) => {
                const isVegetables = category.name.toLowerCase() === 'vegetables';

                const navItem = `
                    <li class="nav-item">
                        <a class="nav-link fw-bold text-uppercase border-0 ${isVegetables ? 'active text-success' : 'text-dark'}" 
                           href="detail.html" 
                           id="cat-${category.id}"
                           onclick="filterProducts(${category.id}, this)">
                            ${category.name} 
                        </a>
                    </li>
                `;
                navContainer.insertAdjacentHTML('beforeend', navItem);
                if (isVegetables) {
                    loadProduct(category.id);
                }
            });
        });
});
