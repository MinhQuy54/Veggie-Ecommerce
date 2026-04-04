const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;
        let hideLoading = () => { };

        try {
            hideLoading = showLoading('Đang xử lý đăng nhập...');
            const response = await fetch(buildApiUrl('/api/auth/login/'), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });

            const data = await response.json();
            hideLoading();

            if (!response.ok) {
                showMessage("error", getErrorMessage(data, "Đăng nhập thất bại! Hãy kiểm tra lại thông tin"));
                return;
            }

            localStorage.setItem("access_token", data.access);
            localStorage.setItem("refresh_token", data.refresh);
            localStorage.setItem("username", data.username);
            localStorage.setItem("email", data.email);

            showNotification("success", {
                message: 'Đăng nhập thành công ',
                description: 'Chào mừng bạn đến với Veggie!',
                placement: 'topRight',
                duration: 4
            });

            setTimeout(() => {
                window.location.href = "index.html";
            }, 2000);

        } catch (error) {
            console.error(error);
            hideLoading();
            showMessage("error", "Lỗi kết nối server!");
        }
    });
}

window.addEventListener("load", function () {
    const urlParams = new URLSearchParams(window.location.search);
    const activatedStatus = urlParams.get('activated');

    if (activatedStatus === 'success') {
        showNotification("success", {
            message: 'Kích hoạt thành công!',
            description: 'Tài khoản của bạn đã sẵn sàng. Hãy đăng nhập ngay!',
            placement: 'topRight'
        });
    } else if (activatedStatus === 'error') {
        showMessage("error", 'Link kích hoạt không hợp lệ hoặc đã hết hạn.');
    }
});
