document.addEventListener("DOMContentLoaded", function () {

    function initSearch() {

        const form = document.getElementById("search-form");
        const input = document.getElementById("search-input");

        function getQueryParam(name) {
            const params = new URLSearchParams(window.location.search);
            return params.get(name);
        }

        const keyword = getQueryParam("q");

        if (form && input) {
            form.addEventListener("submit", function (e) {

                e.preventDefault();

                const keyword = input.value.trim();

                if (!keyword) return;

                window.location.href = `search.html?q=${encodeURIComponent(keyword)}`;
            });
        }

        async function searchProducts() {

            if (!keyword) return;

            try {
                const res = await fetch(buildApiUrl(`/api/search/?q=${encodeURIComponent(keyword)}`));
                const data = await res.json();

                renderProducts(data);
            } catch (error) {
                console.error("Search error:", error);
            }
        }

        if (keyword) {
            searchProducts();
        }
    }

    // chờ header load xong
    setTimeout(initSearch, 300);

});


function renderProducts(products) {

    const list = document.getElementById("product-list");
    const template = document.getElementById("product-template");

    if (!list || !template) return;

    list.innerHTML = "";

    const results = Array.isArray(products?.results) ? products.results : [];

    if (results.length === 0) {
        list.innerHTML = `
            <div class="col-12 text-center py-5">
                <h5 class="text-muted">Không tìm thấy sản phẩm phù hợp.</h5>
            </div>
        `;
        return;
    }

    results.forEach(product => {
        const clone = template.content.cloneNode(true);
        const price = parseFloat(product.price);
        let imageUrl = 'img/bag-filled.png';
        if (product.images && product.images.length > 0) {
            imageUrl = buildAssetUrl(product.images[0].image);
        }
        const quickViewBtn = clone.querySelector(".quick-view-btn");
        quickViewBtn.setAttribute("data-id", product.id);

        clone.querySelector('#product-img').src = imageUrl;
        clone.querySelector('#product-price').textContent = price.toLocaleString('vn-VN') + "đ";
        clone.querySelector('#category-name').textContent = product.category_name;
        clone.querySelector('#product-name').textContent = product.name;
        clone.querySelector('#product-link-detail').href = `product-details.html?id=${product.id}`;
        clone.querySelector(".add-cart-btn").setAttribute("data-id", product.id);
        clone.querySelector(".add-wish-btn").setAttribute("data-id", product.id);
        list.appendChild(clone);
    });

    renderPagination(products);

}
