let addressList = [];

document.addEventListener("DOMContentLoaded", () => {
    loadAddress();
    loadCartCheckout();

    const placeOrderBtn = document.getElementById("btn-place-order");
    const saveAddressBtn = document.getElementById("save-address-btn");
    const addressSelect = document.getElementById("address");

    if (placeOrderBtn) {
        placeOrderBtn.addEventListener("click", placeOrder);
    }

    if (saveAddressBtn) {
        saveAddressBtn.addEventListener("click", addAddress);
    }

    if (addressSelect) {
        addressSelect.addEventListener("change", function () {
            const selectedId = this.value;

            const selectedAddress = addressList.find(
                item => item.id == selectedId
            );

            if (selectedAddress) {
                fillAddressForm(selectedAddress);
            }
        });
    }
});

async function loadAddress() {

    const token = localStorage.getItem("access_token");
    const addressSelect = document.getElementById("address");

    if (!token || !addressSelect) return;

    try {

        const response = await fetchWithStoredAuth(buildApiUrl('/api/address/'), {
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
        showNotification("error", {
            message: "Lỗi",
            description: "Không thể tải danh sách địa chỉ"
        });
    }
}

function fillAddressForm(address) {
    const fullnameInput = document.getElementById("fullname");
    const phoneInput = document.getElementById("phone");
    const addressDetailInput = document.getElementById("address-detail");
    const cityInput = document.getElementById("city");

    if (fullnameInput) fullnameInput.value = address.full_name;
    if (phoneInput) phoneInput.value = address.phone;
    if (addressDetailInput) addressDetailInput.value = address.address;
    if (cityInput) cityInput.value = address.city;

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
        showNotification("warning", {
            message: "Thiếu thông tin",
            description: "Vui lòng nhập đầy đủ thông tin!"
        });
        return;
    }
    try {

        const response = await fetchWithStoredAuth(buildApiUrl('/api/address/'), {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            showNotification("error", {
                message: "Lỗi",
                description: getErrorMessage(data, "Thêm địa chỉ thất bại")
            });
            return;
        }

        showNotification("success", {
            message: "Thành công",
            description: "Thêm địa chỉ thành công"
        });

        loadAddress();

        const modal = bootstrap.Modal.getInstance(document.getElementById('addressModal'));
        if (modal) {
            modal.hide();
        }

        const addressForm = document.getElementById("address-form");
        if (addressForm) {
            addressForm.reset();
        }

    } catch (error) {
        console.error("Add address error:", error);
        showNotification("error", {
            message: "Lỗi hệ thống",
            description: "Không thể thêm địa chỉ lúc này"
        });
    }
}

async function loadCartCheckout() {
    const template = document.getElementById("template-checkout");
    const checkoutContainer = document.getElementById("summary-checkout");
    const token = localStorage.getItem("access_token");
    let totalPrice = 15000;
    if (!token || !template || !checkoutContainer) {
        return;
    }
    try {

        const response = await fetchWithStoredAuth(buildApiUrl('/api/cart/'));

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


    } catch (error) {
        console.error("Checkout summary error:", error);
    }
}

async function placeOrder() {

    const token = localStorage.getItem("access_token");
    const addressSelect = document.getElementById("address");
    const addressId = addressSelect ? addressSelect.value : "";

    if (!token) {
        showMessage("warning", "Bạn cần đăng nhập");
        return;
    }

    if (!addressId) {
        showMessage("warning", "Vui lòng chọn địa chỉ");
        return;
    }

    let paymentMethod = "";

    if (document.getElementById("cod").checked) {
        paymentMethod = "COD";
    }

    if (document.getElementById("momo").checked) {
        paymentMethod = "momo";
    }

    if (!paymentMethod) {
        showMessage("warning", "Vui lòng chọn phương thức thanh toán");
        return;
    }

    try {

        const response = await fetchWithStoredAuth(buildApiUrl('/api/checkout/'), {
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
            showNotification("error", {
                message: "Lỗi",
                description: getErrorMessage(data, "Checkout thất bại")
            });
            return;
        }
        if (data.payment_method === "momo") {
            window.location.href = data.payUrl;
            return;
        }


        showNotification("success", {
            message: "Thành công",
            description: "Đặt hàng thành công"
        });

        window.location.href = "index.html";

    } catch (error) {
        console.error("Checkout error:", error);
        showNotification("error", {
            message: "Lỗi hệ thống",
            description: "Không thể đặt hàng lúc này"
        });
    }
}
