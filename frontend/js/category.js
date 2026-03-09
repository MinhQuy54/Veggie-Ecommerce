
document.addEventListener("DOMContentLoaded", function () {
    const navContainer = document.getElementById('product-categories-nav');

    fetch(`${CONFIG.API_BASE_URL}/api/category/`)
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


async function loadCategory() {
    const container = document.getElementById("category-list");
    const template = document.getElementById("category-template");

    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/category/`);

        if (!response.ok) {
            throw new Error("Không tìm thấy danh mục");
        }

        const data = await response.json();

        container.innerHTML = "";

        data.forEach(category => {

            const clone = template.content.cloneNode(true);

            clone.querySelector(".category-link").href =
                `detail.html?id=${category.id}`;

            clone.querySelector(".category-img").src =
                `${CONFIG.API_BASE_URL}${category.image}`;

            clone.querySelector(".category-img").alt =
                category.name;

            clone.querySelector(".category-name").innerText =
                category.name;

            clone.querySelector(".category-desc").innerText =
                category.description
                    ? category.description.substring(0, 50) + "..."
                    : "";

            container.appendChild(clone);
        });

    } catch (error) {
        console.error(error);
        container.innerHTML =
            "<p class='text-danger text-center'>Không thể tải danh mục</p>";
    }
}

document.addEventListener("DOMContentLoaded", loadCategory);