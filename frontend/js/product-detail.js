let currentProductId = null;

async function loadProductDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    if (!productId) {
        console.error("Không tìm thấy ID sản phẩm");
        return;
    }
    currentProductId = productId;
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/product/${productId}/`);

        if (!response.ok) {
            throw new Error("Không tìm thấy sản phẩm");
        }

        const product = await response.json();

        document.getElementById("product-name").innerText = product.name;
        document.getElementById("product-price").innerText =
            new Intl.NumberFormat("vi-VN").format(product.price) + "đ";
        document.getElementById("product-desc").innerText =
            product.description || "Chưa có mô tả";

        if (product.images && product.images.length > 0) {
            document.getElementById("product-img").src =
                CONFIG.API_BASE_URL + product.images[0].image;
        }

        document.getElementById("breadcrumb-category").innerText = product.name;
        document.getElementById("category").innerHTML =
            `<span class="fw-bold">Categories:</span> ${product.category_name}`;
        document.getElementById("category-title").innerText = product.name;

    } catch (error) {
        console.error("Lỗi khi lấy chi tiết sản phẩm:", error);
        document.querySelector(".product-details").innerHTML =
            "<div class='text-center text-danger py-5'>Không tìm thấy sản phẩm</div>";
    }
}

function changeQty(amount) {
    const qtyInput = document.getElementById("qty-input");
    let currentQty = parseInt(qtyInput.value);
    currentQty += amount;
    if (currentQty < 1) currentQty = 1;
    qtyInput.value = currentQty;

}


document.addEventListener("click", async function (e) {
    if (e.target.closest(".quick-view-btn")) {

        const button = e.target.closest(".quick-view-btn");
        const productId = button.getAttribute("data-id");

        currentProductId = productId;
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/product/${productId}/`);

            if (!response.ok) {
                throw new Error("Không tìm thấy sản phẩm");
            }

            const product = await response.json();

            document.getElementById("qty-input").value = 1;
            document.getElementById("modal-product-name").innerText = product.name;

            document.getElementById("modal-product-price").innerText =
                new Intl.NumberFormat("vi-VN").format(product.price) + "đ";

            document.getElementById("modal-product-desc").innerText =
                product.description || "Chưa có mô tả";

            document.getElementById("modal-category-name").innerText =
                product.category_name;

            if (product.images && product.images.length > 0) {
                document.getElementById("modal-product-img").src =
                    CONFIG.API_BASE_URL + product.images[0].image;
            }

        } catch (error) {
            console.error("Lỗi khi load sản phẩm:", error);
        }
    }
});


function showSuccessModal() {

    const quickModalEl = document.getElementById('quickViewDetailModal');
    const quickModal = bootstrap.Modal.getInstance(quickModalEl);
    if (quickModal) quickModal.hide();

    // mở success
    const successModal = new bootstrap.Modal(
        document.getElementById('successModal')
    );
    successModal.show();
}

async function updateSuccessModalFromCard(productId) {

    const response = await fetch(`${CONFIG.API_BASE_URL}/api/product/${productId}/`);
    const product = await response.json();

    document.getElementById("success-product-name").innerText = product.name;

    if (product.images && product.images.length > 0) {
        document.getElementById("success-product-img").src =
            CONFIG.API_BASE_URL + product.images[0].image;
    }
}

document.addEventListener("click", function (e) {

    const cartBtn = e.target.closest(".add-cart-btn");
    if (!cartBtn) return;

    const productId = cartBtn.getAttribute("data-id");
    addToCart(productId);

});

async function addToCart(productId = null) {

    // nếu không truyền id → dùng id đang mở trong quickview
    if (!productId) {
        productId = currentProductId;
    }

    if (!productId) {
        console.error("Không có productId");
        return;
    }

    // Lấy số lượng nếu đang ở quickview
    let quantity = 1;
    const qtyInput = document.getElementById("qty-input");
    if (qtyInput) {
        quantity = parseInt(qtyInput.value) || 1;
    }

    const token = localStorage.getItem("access_token");

    if (!token) {

        let cart = JSON.parse(localStorage.getItem("cart")) || [];

        const existingItem = cart.find(item =>
            item.product == productId
        );

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.push({
                product: productId,
                quantity: quantity
            });
        }

        localStorage.setItem("cart", JSON.stringify(cart));

        updateSuccessModalFromCard(productId);
        showSuccessModal();
        return;
    }

    try {

        const response = await fetch(`${CONFIG.API_BASE_URL}/api/cart/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({
                product: productId,
                quantity: quantity
            })
        });

        if (response.ok) {
            updateSuccessModalFromCard(productId);
            showSuccessModal();
        }

    } catch (error) {
        console.error(error);
    }
}
window.addEventListener("DOMContentLoaded", loadProductDetail);

