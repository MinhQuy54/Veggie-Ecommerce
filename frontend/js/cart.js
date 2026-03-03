
document.addEventListener("show.bs.offcanvas", function (event) {
    if (event.target.id === "miniCart") {
        loadMiniCart();
    }
});
document.addEventListener("click", function (e) {

    const removeBtn = e.target.closest(".remove-item-btn");
    if (!removeBtn) return;

    const id = removeBtn.getAttribute("data-id");
    removeItemCart(id);

});


async function updateCartBadge() {

    const badge = document.querySelector(".cart-badge");
    const token = localStorage.getItem("access_token");

    if (!badge) {
        if (!badge) {
            setTimeout(updateCartBadge, 200);
            return;
        }
    }

    if (!token) {
        badge.innerText = 0;
        return;
    }

    try {

        const response = await fetch(`${CONFIG.API_BASE_URL}/api/cart/`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            badge.innerText = 0;
            return;
        }

        const cartItems = await response.json();

        let totalQuantity = 0;

        cartItems.forEach(item => {
            totalQuantity += item.quantity;
        });

        badge.innerText = totalQuantity;

    } catch (error) {
        console.error(error);
        badge.innerText = 0;
    }
}
async function loadMiniCart() {

    const miniCartContainer = document.getElementById("mini-cart-list");
    const template = document.getElementById("mini-cart-template");
    const subtotalEl = document.getElementById("mini-cart-subtotal");

    const token = localStorage.getItem("access_token");

    if (!token) return;

    try {

        const response = await fetch(`${CONFIG.API_BASE_URL}/api/cart/`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error("Không tìm thấy giỏ hàng");
        }

        const cartItems = await response.json();

        miniCartContainer.innerHTML = "";
        let subtotal = 0;

        if (cartItems.length === 0) {
            miniCartContainer.innerHTML = "<p class='text-center fw-bold'>Giỏ hàng trống</p>";
            subtotalEl.innerText = "0đ";
            return;
        }
        cartItems.forEach(cart => {

            const clone = template.content.cloneNode(true);
            const product = cart.product;
            const price = parseFloat(product.price);

            let imageUrl = "img/bag-filled.png";
            if (product.images && product.images.length > 0) {
                imageUrl = CONFIG.API_BASE_URL + product.images[0].image;
            }
            const removeBtn = clone.querySelector(".remove-item-btn");
            removeBtn.setAttribute("data-id", cart.id);
            clone.querySelector(".mini-cart-img").src = imageUrl;
            clone.querySelector(".mini-cart-name").innerText = product.name;
            clone.querySelector(".mini-cart-quantity").innerText = cart.quantity;
            clone.querySelector(".mini-cart-price").innerText = price.toLocaleString("vi-VN") + "đ";

            subtotal += parseFloat(product.price) * cart.quantity;

            miniCartContainer.appendChild(clone);
        });

        subtotalEl.innerText = subtotal.toLocaleString("vi-VN") + "đ";

    } catch (error) {

        console.error(error);
        miniCartContainer.innerHTML =
            "<p class='text-danger text-center'>Không thể tải giỏ hàng</p>";
    }
}

async function removeItemCart(id) {

    const token = localStorage.getItem("access_token");
    if (!token) {
        alert("Vui lòng đăng nhập");
        return;
    }

    try {

        const response = await fetch(`${CONFIG.API_BASE_URL}/api/cart/${id}/`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (response.ok) {
            loadMiniCart();
            updateCartBadge();
        }

    } catch (error) {
        console.error(error);
    }
}




document.addEventListener("DOMContentLoaded", function () {
    updateCartBadge();
});