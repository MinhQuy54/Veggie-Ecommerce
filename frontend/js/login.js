document.getElementById("loginForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/auth/login/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username: email,
                password: password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.non_field_error?.[0] || data.detail || "Đăng nhập thất bại");
            return;
        }

        localStorage.setItem("access_token", data.access);
        localStorage.setItem("refresh_token", data.refresh);
        localStorage.setItem("username", data.username);
        localStorage.setItem("email", data.email);

        alert("Đăng nhập thành công 🎉");

        window.location.href = "index.html";

    } catch (error) {
        console.error(error);
        alert("Lỗi kết nối server");
    }
});


document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);

    if (params.get("activated") === "success") {
        const toast = document.getElementById("toast-success");

        if (toast) {
            toast.style.display = "block";

            setTimeout(() => {
                toast.style.display = "none";
                window.history.replaceState({}, document.title, window.location.pathname);
            }, 3000);
        }
    }
});
