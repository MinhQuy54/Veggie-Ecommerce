document.getElementById('registerForm').addEventListener("submit", async (e) => {
    e.preventDefault();

    const payload = {
        fname: document.getElementById("fname").value,
        lname: document.getElementById("lname").value,
        email: document.getElementById("email").value,
        password: document.getElementById("password").value,
    };

    try {
        const res = await fetch(`${CONFIG.API_BASE_URL}/api/auth/register/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.error || "Đăng ký thất bại");
            return;
        }

        alert("Đăng ký thành công! Vui lòng kiểm tra email để kích hoạt.");
        window.location.href = "login.html";

    } catch (err) {
        alert("Lỗi kết nối server");
    }
});
