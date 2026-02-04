document.addEventListener("DOMContentLoaded", function () {
    const navContainer = document.getElementById('product-categories-nav');

    fetch('http://127.0.0.1:8000/api/category/')
        .then(res => res.json())
        .then(data => {
            data.slice(0, 4).forEach(category => {
                const navItem = `
                    <li class="nav-item">
                        <a class="nav-link fw-bold text-uppercase border-0 text-dark" 
                           href="#" 
                           data-id="${category.id}" 
                           onclick="filterProducts(${category.id}, this)">
                            ${category.name} 
                        </a>
                    </li>
                `;
                navContainer.insertAdjacentHTML('beforeend', navItem);
            });
        });
});
