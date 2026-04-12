
const chatCircle = document.getElementById("chat-circle");
const chatBox = document.getElementById("chat-box");
const chatWrapper = document.querySelector(".chat-wrapper");
const chatToggle = document.getElementById("chat-box-toggle");
const chatContent = document.getElementById("chat-content");
const chatInput = document.getElementById("chat-input-text");
const chatSubmit = document.getElementById("chat-submit");

const CHAT_ENDPOINT =
    typeof buildChatbotUrl === "function" ? buildChatbotUrl("/chat") : "/api/chat/chat";
const CHAT_HISTORY_KEY = "veggie_chat_history_v1";
const CHAT_BOX_STATE_KEY = "veggie_chat_box_open_v1";
const DEFAULT_BOT_GREETING = "Chào bạn! Veggie có thể giúp gì cho bạn hôm nay?";

let activeController = null;
let isStreaming = false;
let chatHistory = [];

function sanitizeBotText(text = "") {
    return text
        .replace(/\r/g, "")
        .replace(/\*/g, "")
        .replace(/^[ \t]+/gm, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

function normalizeMessage(role, content = "") {
    const rawContent = typeof content === "string" ? content : String(content ?? "");
    return role === "bot" ? sanitizeBotText(rawContent) : rawContent.trim();
}

function saveChatHistory() {
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(chatHistory));
}

function loadChatHistory() {
    try {
        const storedHistory = JSON.parse(localStorage.getItem(CHAT_HISTORY_KEY) || "[]");

        if (!Array.isArray(storedHistory)) {
            return [];
        }

        return storedHistory
            .filter((item) => item && (item.role === "user" || item.role === "bot"))
            .map((item) => ({
                role: item.role,
                content: normalizeMessage(item.role, item.content)
            }))
            .filter((item) => item.content);
    } catch (_) {
        return [];
    }
}

function saveChatBoxState(isOpen) {
    localStorage.setItem(CHAT_BOX_STATE_KEY, JSON.stringify(Boolean(isOpen)));
}

function loadChatBoxState() {
    try {
        return JSON.parse(localStorage.getItem(CHAT_BOX_STATE_KEY) || "false") === true;
    } catch (_) {
        return false;
    }
}

function scrollChatToBottom() {
    if (!chatContent) {
        return;
    }

    chatContent.scrollTop = chatContent.scrollHeight;
}

function createMessageBubble(role, content = "") {
    const message = document.createElement("div");
    message.className = role === "user" ? "msg-user" : "msg-bot";

    const bubble = document.createElement("div");
    bubble.className = "chat-bubble";
    bubble.textContent = normalizeMessage(role, content);

    message.appendChild(bubble);
    chatContent.appendChild(message);
    scrollChatToBottom();

    return bubble;
}

function renderChatHistory() {
    if (!chatContent) {
        return;
    }

    chatContent.innerHTML = "";

    if (!chatHistory.length) {
        chatHistory = [
            {
                role: "bot",
                content: DEFAULT_BOT_GREETING
            }
        ];
        saveChatHistory();
    }

    chatHistory.forEach(({ role, content }) => {
        createMessageBubble(role, content);
    });
}

function appendMessage(role, content = "") {
    const normalizedContent = normalizeMessage(role, content);
    const bubble = createMessageBubble(role, normalizedContent);

    chatHistory.push({
        role,
        content: normalizedContent
    });
    saveChatHistory();

    return {
        bubble,
        index: chatHistory.length - 1
    };
}

function updateHistoryMessage(index, role, content, bubble) {
    const normalizedContent = normalizeMessage(role, content);

    if (bubble) {
        bubble.textContent = normalizedContent;
    }

    if (typeof index === "number" && chatHistory[index]) {
        chatHistory[index].content = normalizedContent;
        saveChatHistory();
    }
}

function setComposerState(disabled) {
    if (!chatInput || !chatSubmit) {
        return;
    }

    chatInput.disabled = disabled;
    chatSubmit.disabled = disabled;
    chatInput.placeholder = disabled
        ? "Veggie đang trả lời..."
        : "Hỏi về sản phẩm hoặc chính sách...";
}

function openChat() {
    if (!chatBox) {
        return;
    }

    chatBox.classList.remove("d-none");
    saveChatBoxState(true);
    scrollChatToBottom();

    if (chatInput && !chatInput.disabled) {
        chatInput.focus();
    }
}

function closeChat() {
    if (!chatBox) {
        return;
    }

    chatBox.classList.add("d-none");
    saveChatBoxState(false);
}

async function readStreamToBubble(response, bubble, historyIndex) {
    if (!response.body) {
        const fallbackText = await response.text();
        updateHistoryMessage(historyIndex, "bot", fallbackText, bubble);
        bubble.classList.remove("is-loading");
        scrollChatToBottom();
        return fallbackText;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = "";

    while (true) {
        const { done, value } = await reader.read();

        if (done) {
            break;
        }

        const chunk = decoder.decode(value, { stream: true });
        if (!chunk) {
            continue;
        }

        fullText += chunk;
        updateHistoryMessage(historyIndex, "bot", fullText, bubble);
        bubble.classList.remove("is-loading");
        scrollChatToBottom();
    }

    const remaining = decoder.decode();
    if (remaining) {
        fullText += remaining;
        updateHistoryMessage(historyIndex, "bot", fullText, bubble);
    }

    scrollChatToBottom();
    return normalizeMessage("bot", fullText);
}

async function readErrorMessage(response) {
    const fallbackMessage = "Veggie đang bận, bạn thử lại sau nhé.";
    const contentType = response.headers.get("content-type") || "";

    try {
        if (contentType.includes("application/json")) {
            const data = await response.json();
            if (typeof getErrorMessage === "function") {
                return getErrorMessage(data, fallbackMessage);
            }

            if (typeof data?.detail === "string") {
                return data.detail;
            }
        } else {
            const text = await response.text();
            if (text.trim()) {
                return text;
            }
        }
    } catch (_) {
        return fallbackMessage;
    }

    return fallbackMessage;
}

async function sendMessage() {
    if (!chatInput || !chatContent || isStreaming) {
        return;
    }

    const message = chatInput.value.trim();
    if (!message) {
        chatInput.focus();
        return;
    }

    openChat();
    appendMessage("user", message);
    chatInput.value = "";

    const botMessage = appendMessage("bot", "...");
    const botBubble = botMessage.bubble;
    botBubble.classList.add("is-loading");

    activeController = new AbortController();
    isStreaming = true;
    setComposerState(true);

    try {
        const response = await fetch(CHAT_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "text/event-stream"
            },
            body: JSON.stringify({ message }),
            signal: activeController.signal
        });

        if (!response.ok) {
            throw new Error(await readErrorMessage(response));
        }

        const streamedText = await readStreamToBubble(response, botBubble, botMessage.index);

        if (!streamedText.trim()) {
            updateHistoryMessage(
                botMessage.index,
                "bot",
                "Mình chưa lấy được câu trả lời. Bạn thử hỏi lại giúp Veggie nhé.",
                botBubble
            );
        }
    } catch (error) {
        if (error.name === "AbortError") {
            updateHistoryMessage(botMessage.index, "bot", "Phiên trả lời đã bị dừng.", botBubble);
        } else {
            console.error("Chatbot error:", error);
            updateHistoryMessage(
                botMessage.index,
                "bot",
                error.message || "Veggie đang bận, bạn thử lại sau nhé.",
                botBubble
            );
        }
    } finally {
        botBubble.classList.remove("is-loading");
        isStreaming = false;
        activeController = null;
        setComposerState(false);
        chatInput.focus();
        scrollChatToBottom();
    }
}

if (chatCircle && chatBox && chatWrapper && chatToggle && chatContent && chatInput && chatSubmit) {
    chatHistory = loadChatHistory();
    renderChatHistory();

    if (loadChatBoxState()) {
        openChat();
    }

    chatCircle.onclick = (event) => {
        event.stopPropagation();
        openChat();
    };

    chatToggle.onclick = (event) => {
        event.stopPropagation();
        closeChat();
    };

    chatSubmit.addEventListener("click", sendMessage);

    chatInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            sendMessage();
        }
    });

    window.addEventListener("click", (event) => {
        if (!chatBox.classList.contains("d-none") && !chatWrapper.contains(event.target)) {
            closeChat();
        }
    });

    chatBox.onclick = (event) => {
        event.stopPropagation();
    };
}
