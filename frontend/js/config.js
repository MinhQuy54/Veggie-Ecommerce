const CONFIG = {
    // API_BASE_URL: 'http://127.0.0.1:8080',
    API_BASE_URL: 'http://127.0.0.1:8000',
    // API_BASE_URL: 'https://veggie-ecommerce-1.onrender.com',
    PAGE_SIZE: 6
};

Object.freeze(CONFIG);

function buildApiUrl(path = "") {
    if (!path) {
        return CONFIG.API_BASE_URL;
    }

    if (/^https?:\/\//i.test(path)) {
        return path;
    }

    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${CONFIG.API_BASE_URL}${normalizedPath}`;
}

function buildAssetUrl(path = "") {
    if (!path) {
        return "";
    }

    if (/^https?:\/\//i.test(path)) {
        return path;
    }

    return `${CONFIG.API_BASE_URL}${path}`;
}

function getErrorMessage(data, fallback = "Có lỗi xảy ra") {
    if (!data) {
        return fallback;
    }

    if (typeof data === "string") {
        return data;
    }

    if (Array.isArray(data)) {
        return data.filter(Boolean).join(", ") || fallback;
    }

    if (typeof data === "object") {
        if (typeof data.error === "string") {
            return data.error;
        }

        if (typeof data.detail === "string") {
            return data.detail;
        }

        if (typeof data.message === "string") {
            return data.message;
        }

        const values = Object.values(data).flat(Infinity).filter(Boolean);
        const firstText = values.find((value) => typeof value === "string");
        if (firstText) {
            return firstText;
        }
    }

    return fallback;
}

function showMessage(type, content, duration = 3) {
    if (window.antd?.message && typeof antd.message[type] === "function") {
        return antd.message[type](content, duration);
    }

    if (content) {
        console[type === "error" ? "error" : "log"](content);
    }

    return () => { };
}

function showLoading(content) {
    if (window.antd?.message?.loading) {
        return antd.message.loading(content, 0);
    }

    return () => { };
}

function showNotification(type, options) {
    if (window.antd?.notification && typeof antd.notification[type] === "function") {
        antd.notification[type](options);
        return;
    }

    const title = options?.message || "";
    const description = options?.description ? `: ${options.description}` : "";
    console[type === "error" ? "error" : "log"](`${title}${description}`);
}

async function fetchWithStoredAuth(url, options = {}) {
    if (typeof window.fetchWithAuth === "function") {
        return window.fetchWithAuth(url, options);
    }

    const token = localStorage.getItem("access_token");
    const headers = {
        ...(options.headers || {})
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    if (options.body && !headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
    }

    return fetch(url, {
        ...options,
        headers
    });
}
