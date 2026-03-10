document.addEventListener("DOMContentLoaded", function () {
    const token = localStorage.getItem("access_token");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    const usernameEl1 = document.getElementById("dashboard-username");
    const usernameEl2 = document.getElementById("dashboard-username-2");
    const fnameInput = document.getElementById('fname');
    const lnameInput = document.getElementById('lname');
    const emailInput = document.getElementById('email');
    const fullNameInput = document.getElementById('fullname');
    const accountForm = document.getElementById('account-details-form');
    const addressTableBody = document.getElementById('address-table-body');
    const saveAddressBtn = document.getElementById('save-address-btn');
    const addressForm = document.getElementById('address-form');
    const modalTitle = document.querySelector('#addressModal .modal-title');

    // Biến trạng thái để biết đang Thêm mới hay Sửa
    let editingAddressId = null;

    function fetchUserProfile() {
        fetchWithAuth(`${CONFIG.API_BASE_URL}/api/user/`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        })
            .then(res => {
                if (!res.ok) throw new Error("Unauthorized");
                return res.json();
            })
            .then(user => {
                if (usernameEl1) usernameEl1.textContent = user.username;
                if (usernameEl2) usernameEl2.textContent = user.username;
                if (fnameInput) fnameInput.value = user.first_name || "";
                if (lnameInput) lnameInput.value = user.last_name || "";
                if (emailInput) emailInput.value = user.email || "";
                if (fullNameInput) fullNameInput.value = `${user.first_name || ""} ${user.last_name || ""}`.trim();
            })
            .catch(err => {
                console.error("Profile Error:", err);
                localStorage.removeItem("access_token");
                window.location.href = "login.html";
            });
    }

    function fetchAddresses() {
        fetchWithAuth(`${CONFIG.API_BASE_URL}/api/address/`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        })
            .then(res => res.json())
            .then(data => {
                addressTableBody.innerHTML = "";
                if (!data || data.length === 0) {
                    addressTableBody.innerHTML = `<tr><td colspan="6" class="py-4 text-muted">Bạn chưa có địa chỉ nào.</td></tr>`;
                    return;
                }
                data.forEach(addr => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                    <td>${addr.full_name}</td>
                    <td>${addr.address}</td>
                    <td>${addr.city}</td>
                    <td>${addr.phone}</td>
                    <td>${addr.default ? '<span class="badge bg-success" style="font-size: 0.7rem;">MẶC ĐỊNH</span>' : ''}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-danger border-0" onclick="deleteAddress(${addr.id})">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-warning border-0" onclick="updateAddress(${addr.id})">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                    </td>
                `;
                    addressTableBody.appendChild(tr);
                });
            })
            .catch(err => console.error("Address Load Error:", err));
    }

    window.updateAddress = function (id) {
        editingAddressId = id;
        modalTitle.innerText = "Cập nhật địa chỉ";

        const modalEl = document.getElementById('addressModal');
        const modalInstance = new bootstrap.Modal(modalEl);
        modalInstance.show();

        fetchWithAuth(`${CONFIG.API_BASE_URL}/api/address/${id}/`)
            .then(res => res.json())
            .then(addr => {
                document.getElementById('addr-name').value = addr.full_name;
                document.getElementById('addr-phone').value = addr.phone;
                document.getElementById('addr-city').value = addr.city;
                document.getElementById('addr-detail').value = addr.address;
                document.getElementById('addr-default').checked = addr.default;
            });
    };

    saveAddressBtn.addEventListener('click', function () {
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

        const method = editingAddressId ? "PUT" : "POST";
        const url = editingAddressId ? `${CONFIG.API_BASE_URL}/api/address/${editingAddressId}/` : `${CONFIG.API_BASE_URL}/api/address/`;

        fetchWithAuth(url, {
            method: method,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        })
            .then(res => {
                if (res.ok) {
                    alert(editingAddressId ? "Cập nhật thành công!" : "Thêm mới thành công!");

                    const modalEl = document.getElementById('addressModal');
                    const modalInstance = bootstrap.Modal.getInstance(modalEl);
                    if (modalInstance) modalInstance.hide();

                    resetAddressForm(); // Reset lại form và biến state
                    fetchAddresses();    // Reload bảng
                } else {
                    alert("Có lỗi xảy ra, vui lòng kiểm tra lại dữ liệu.");
                }
            });
    });

    window.resetAddressForm = function () {
        editingAddressId = null;
        modalTitle.innerText = "Thông tin địa chỉ";
        addressForm.reset();
    };

    document.getElementById('addressModal').addEventListener('hidden.bs.modal', resetAddressForm);

    window.deleteAddress = function (id) {
        if (confirm("Bạn có chắc muốn xóa địa chỉ này?")) {
            fetchWithAuth(`${CONFIG.API_BASE_URL}/api/address/${id}/`, {
                method: "DELETE",
            })
                .then(res => {
                    if (res.ok) fetchAddresses();
                    else alert("Không thể xóa địa chỉ này.");
                });
        }
    };

    accountForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        const updateData = {
            first_name: fnameInput.value,
            last_name: lnameInput.value,
            email: emailInput.value
        };

        // Kiểm tra logic đổi mật khẩu
        if (newPassword || currentPassword || confirmPassword) {
            if (newPassword !== confirmPassword) {
                alert("Mật khẩu xác nhận không khớp!");
                return;
            }
            if (!currentPassword) {
                alert("Vui lòng nhập mật khẩu hiện tại để xác nhận đổi mật khẩu.");
                return;
            }
            // Khớp với Key mà Backend của bạn yêu cầu
            updateData['current_password'] = currentPassword;
            updateData['new_password'] = newPassword;
        }

        fetchWithAuth(`${CONFIG.API_BASE_URL}/api/user/update/`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(updateData)
        })
            .then(async res => {
                const result = await res.json();
                if (res.ok) {
                    alert("Cập nhật thông tin thành công!");
                    document.getElementById('current-password').value = "";
                    document.getElementById('new-password').value = "";
                    document.getElementById('confirm-password').value = "";
                    fetchUserProfile(); // Cập nhật lại giao diện (tên hiển thị, v.v.)
                } else {
                    // Hiển thị lỗi cụ thể từ Backend (ví dụ: mật khẩu cũ sai)
                    alert(result.error || result.detail || "Có lỗi xảy ra khi cập nhật.");
                }
            })
            .catch(err => {
                console.error("Update Error:", err);
                alert("Không thể kết nối đến máy chủ.");
            });
    });

    document.querySelectorAll(".logout-btn, #logout-link").forEach(btn => {
        btn.addEventListener("click", function (e) {
            e.preventDefault();
            if (confirm("Đăng xuất?")) {
                localStorage.removeItem("access_token");
                localStorage.removeItem("refresh_token");
                window.location.href = "login.html";
            }
        });
    });

    fetchUserProfile();
    fetchAddresses();
});