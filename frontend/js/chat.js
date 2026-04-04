const chatCircle = document.getElementById('chat-circle');
const chatBox = document.getElementById('chat-box');
const chatWrapper = document.querySelector('.chat-wrapper');
const chatToggle = document.getElementById('chat-box-toggle');

if (chatCircle && chatBox && chatWrapper && chatToggle) {
    // Mở khung chat khi ấn vào nút tròn
    chatCircle.onclick = (e) => {
        e.stopPropagation(); // Ngăn sự kiện nổi bọt lên window
        chatBox.classList.remove('d-none');
    };

    // Ẩn khung chat khi ấn vào nút đóng (dấu X)
    chatToggle.onclick = (e) => {
        e.stopPropagation();
        chatBox.classList.add('d-none');
    };

    // --- TÍNH NĂNG CHÍNH: Ấn ra ngoài là tự ẩn ---
    window.addEventListener("click", (event) => {
        // Nếu khung chat đang mở VÀ vị trí click KHÔNG nằm trong chatWrapper
        if (!chatBox.classList.contains('d-none') && !chatWrapper.contains(event.target)) {
            chatBox.classList.add('d-none');
        }
    });

    // Ngăn sự kiện click bên trong khung chat làm nó bị đóng
    chatBox.onclick = (e) => {
        e.stopPropagation();
    };
}
