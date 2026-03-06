let currentProductId = null;

document.addEventListener("click", function (e) {

    const wishBtn = e.target.closest(".add-wish-btn");
    if (!wishBtn) return;

    const productId = wishBtn.getAttribute("data-id");
    toggleWish(productId, wishBtn);
});

async function toggleWish(productId, buttonElement) {

    const token = localStorage.getItem("access_token");
    if (!token) {
        alert("Bạn cần đăng nhập");
        window.location.href = "./login.html";
        return;
    }

    const icon = buttonElement.querySelector("i");

    const response = await fetchWithAuth(
        `${CONFIG.API_BASE_URL}/api/wish/toggle/`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ product: productId })
        }
    );

    const data = await response.json();

    if (data.status === "added") {

        icon.classList.remove("fa-regular");
        icon.classList.add("fa-solid");

        await updateSuccessWishModal(productId);
        showSuccessWishModal();

    } else {

        icon.classList.remove("fa-solid");
        icon.classList.add("fa-regular");
    }
}

async function updateSuccessWishModal(productId) {

    const response = await fetch(`${CONFIG.API_BASE_URL}/api/product/${productId}/`);
    const product = await response.json();

    document.getElementById("success-wish-product-name").innerText = product.name;

    if (product.images && product.images.length > 0) {
        document.getElementById("success-wish-product-img").src =
            CONFIG.API_BASE_URL + product.images[0].image;
    }
}

function showSuccessWishModal() {

    const quickModalEl = document.getElementById('quickViewDetailModal');
    const quickModal = bootstrap.Modal.getInstance(quickModalEl);
    if (quickModal) quickModal.hide();

    const wishModal = new bootstrap.Modal(
        document.getElementById('successModalWishList')
    );
    wishModal.show();
}

async function loadUserWishlist() {

    const token = localStorage.getItem("access_token");

    if (!token) {
        document.querySelectorAll(".add-wish-btn i").forEach(icon => {
            icon.classList.remove("fa-solid");
            icon.classList.add("fa-regular");
        });
        return;
    }

    try {
        const response = await fetchWithAuth(
            `${CONFIG.API_BASE_URL}/api/wish/`
        );

        if (!response.ok) {
            throw new Error("Unauthorized");
        }

        const productIds = await response.json();

        document.querySelectorAll(".add-wish-btn").forEach(btn => {

            const id = parseInt(btn.getAttribute("data-id"));
            const icon = btn.querySelector("i");

            if (productIds.includes(id)) {
                icon.classList.remove("fa-regular");
                icon.classList.add("fa-solid");
            } else {
                icon.classList.remove("fa-solid");
                icon.classList.add("fa-regular");
            }
        });

    } catch (error) {
        console.log("Không load được wishlist:", error);

        document.querySelectorAll(".add-wish-btn i").forEach(icon => {
            icon.classList.remove("fa-solid");
            icon.classList.add("fa-regular");
        });
    }
}

window.addEventListener("DOMContentLoaded", function () {
    loadUserWishlist();
});