
const resetForm = document.getElementById("resetForm");
if (resetForm) {
    resetForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const email = document.getElementById("email").value;

        fetch("http://127.0.0.1:8000/api/auth/reset-password/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
        })
            .then(res => res.json())
            .then(data => alert(data.message || data.error));
    });
}

// ====== CONFIRM RESET PASSWORD ======
const loginForm = document.getElementById("loginForm");
if (loginForm) {
    const token = new URLSearchParams(window.location.search).get("token");

    loginForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const password = document.getElementById("password").value;
        const confirm = document.getElementById("cofirmpassword").value;

        fetch("http://127.0.0.1:8000/api/auth/reset-password-confirm/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                token: token,
                password: password,
                confirm_password: confirm
            })
        })
            .then(res => res.json())
            .then(data => alert(data.message || data.error));
        window.location.href = "login.html";
    });
}
