document.addEventListener("DOMContentLoaded", loadAddress);
document.addEventListener("DOMContentLoaded", loadCartCheckout);
document.getElementById("btn-place-order").addEventListener("click", placeOrder);
document.getElementById("save-address-btn").addEventListener("click", addAddress);
let addressList = [];

async function loadAddress() {

    const token = localStorage.getItem("access_token");
    const addressSelect = document.getElementById("address");

    if (!token) return;

    try {

        const response = await fetchWithAuth(`${CONFIG.API_BASE_URL}/api/address/`, {
            headers: {
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            console.error("Failed to load address");
            return;
        }

        const data = await response.json();
        addressList = data;

        addressSelect.innerHTML = '';

        data.forEach(item => {
            const option = document.createElement("option");
            option.value = item.id;
            option.textContent = `${item.full_name} - ${item.address}`;
            addressSelect.appendChild(option);
        });

        const defaultAddress = data.find(item => item.default === true);

        if (defaultAddress) {
            addressSelect.value = defaultAddress.id;
            fillAddressForm(defaultAddress);
        }

    } catch (error) {
        console.error("Error loading address:", error);
    }
}

document.getElementById("address").addEventListener("change", function () {

    const selectedId = this.value;

    const selectedAddress = addressList.find(
        item => item.id == selectedId
    );

    if (selectedAddress) {
        fillAddressForm(selectedAddress);
    }

});

function fillAddressForm(address) {

    document.getElementById("fullname").value = address.full_name;
    document.getElementById("phone").value = address.phone;
    document.getElementById("address-detail").value = address.address;
    document.getElementById("city").value = address.city;

}


async function addAddress() {

    const payload = {
        full_name: document.getElementById('addr-name').value.trim(),
        phone: document.getElementById('addr-phone').value.trim(),
        city: document.getElementById('addr-city').value.trim(),
        address: document.getElementById('addr-detail').value.trim(),
        default: document.getElementById('addr-default').checked
    };

    if (!payload.full_name || !payload.phone || !payload.address) {
        alert("Vui lòng nhập đầy đủ thông tin!");
        return;
    }
    try {

        const response = await fetchWithAuth(`${CONFIG.API_BASE_URL}/api/address/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            alert("Thêm địa chỉ thất bại");
            console.log(data);
            return;
        }

        alert("Thêm địa chỉ thành công");

        loadAddress();

        const modal = bootstrap.Modal.getInstance(document.getElementById('addressModal'));
        modal.hide();

        document.getElementById("address-form").reset();

    } catch (error) {
        console.error("Add address error:", error);
    }
}

async function loadCartCheckout() {
    const template = document.getElementById("template-checkout");
    const checkoutContainer = document.getElementById("summary-checkout");
    const token = localStorage.getItem("access_token");
    let totalPrice = 15000;
    if (!token) {
        return;
    }
    try {

        const response = await fetchWithAuth(`${CONFIG.API_BASE_URL}/api/cart/`);

        if (!response.ok) {
            throw new Error("Khong tim thay san pham");
        }

        const data = await response.json();
        checkoutContainer.innerHTML = '';
        data.forEach(item => {

            const clone = template.content.cloneNode(true);
            const product = item.product;

            const price = parseFloat(product.price);
            clone.querySelector('.name-checkout').innerText = product.name;
            clone.querySelector('.quantity-checkout').innerText = `x${item.quantity}`;
            const totalPriceItem = price * item.quantity;
            totalPrice += totalPriceItem;
            clone.querySelector('.total-price-item-checkout').innerText = totalPriceItem.toLocaleString('vi-VN') + "đ";
            checkoutContainer.appendChild(clone);

            document.querySelectorAll(".total-checkout").forEach(e => {
                e.innerText = totalPrice.toLocaleString('vi-VN') + "đ";
            })
        })


    } catch { }
}

async function placeOrder() {

    const token = localStorage.getItem("access_token");
    const addressId = document.getElementById("address").value;

    if (!token) {
        alert("Bạn cần đăng nhập");
        return;
    }

    if (!addressId) {
        alert("Vui lòng chọn địa chỉ");
        return;
    }

    let paymentMethod = "";

    if (document.getElementById("cod").checked) {
        paymentMethod = "COD";
    }

    if (document.getElementById("momo").checked) {
        paymentMethod = "momo";
    }

    try {

        const response = await fetchWithAuth(`${CONFIG.API_BASE_URL}/api/checkout/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                shipping_address: addressId,
                payment_method: paymentMethod
            })
        });

        const data = await response.json();

        if (!response.ok) {
            alert("Checkout thất bại");
            console.log(data);
            return;
        }
        if (data.payment_method === "momo") {
            window.location.href = data.payUrl;
            return;
        }


        alert("Đặt hàng thành công");

        window.location.href = "index.html";

    } catch (error) {
        console.error("Checkout error:", error);
    }
}