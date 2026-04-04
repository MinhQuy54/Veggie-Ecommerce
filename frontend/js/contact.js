const contactForm = document.getElementById('contact-form');

if (contactForm) {
    contactForm.addEventListener("submit", sendContact);
}

async function sendContact(e) {
    e.preventDefault();
    const payload = {
        full_name: document.getElementById('contact-fullname').value,
        email: document.getElementById('contact-email').value,
        phone_number: document.getElementById('contact-phone').value,
        message: document.getElementById('contact-message').value,
    };

    try {
        const res = await fetch(buildApiUrl('/api/contact/'), {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (res.ok) {
            showNotification("success", {
                message: "Thành công",
                description: "Đã gửi liên hệ"
            });

            contactForm.reset();
        } else {
            showNotification("error", {
                message: "Lỗi",
                description: getErrorMessage(data, "Gửi liên hệ thất bại")
            });
        }
    } catch (error) {
        console.error(error);
        showNotification("error", {
            message: "Lỗi hệ thống",
            description: "Không thể gửi liên hệ lúc này"
        });
    }
}
