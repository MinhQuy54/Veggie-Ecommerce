document.addEventListener("DOMContentLoaded", function () {
    const categoryContainer = document.getElementById('category-list');
    const API_BASE = 'http://localhost:8000/api';

    fetch(`${API_BASE}/category/`)
        .then(response => response.json())
        .then(data => {
            categoryContainer.innerHTML = '';

            data.forEach(category => {
                const categoryHtml = `
                        <div class="col-6 col-md-3">
                            <div class="category-card">
                                <div class="category-icon-bg">
                                    <img src="http://localhost:8000${category.image}" alt="${category.name}">
                                </div>
                                <h5 class="fw-bold mt-3 mb-1">${category.name}</h5>
                                <p class="text-muted small">${category.description.substring(0, 50)}...</p>
                            </div>
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