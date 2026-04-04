const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const password = document.getElementById("password").value;

        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);

        if (password.length < 6) {
            showMessage("error", "Mật khẩu phải có ít nhất 6 ký tự!");
            return;
        }
        if (!hasUpperCase || !hasLowerCase || !hasNumber) {
            showMessage("warning", "Mật khẩu cần có chữ hoa, chữ thường và số!");
            return;
        }

        const payload = {
            firstname: document.getElementById("firstname").value,
            lastname: document.getElementById("lastname").value,
            username: document.getElementById("username").value,
            email: document.getElementById("email").value,
            password: password
        };

        const hideLoading = showLoading('Đang xử lý đăng ký...');

        try {
            const res = await fetch(buildApiUrl('/api/auth/register/'), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            hideLoading();

            if (!res.ok) {
                showMessage("error", getErrorMessage(data, "Đăng ký thất bại"));
                return;
            }

            // THÔNG BÁO THÀNH CÔNG KIỂU ANT DESIGN
            showNotification("success", {
                message: 'Đăng ký thành công ',
                description: 'Đăng nhập để tận hưởng nhé!',
                placement: 'topRight',
                duration: 6
            });

            setTimeout(() => {
                window.location.href = "login.html";
            }, 2000);

        } catch (err) {
            console.error(err);
            hideLoading();
            showMessage("error", "Lỗi kết nối server!");
        }
    });
}
