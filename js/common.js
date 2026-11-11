
const API_BASE_URL = "http://127.0.0.1:8000/api";

const Auth = {
    getToken() {
        return sessionStorage.getItem("access_token");
    },

    saveToken(token) {
        sessionStorage.setItem("access_token", token);
    },

    clearToken() {
        sessionStorage.removeItem("access_token");
    },

    async request(endpoint, options = {}) {
        const token = this.getToken();

        const headers = {
            ...(options.body ? {
                "Content-Type": "application/json"
            } : {}),
            ...(options.headers || {})
        };

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(
            `${API_BASE_URL}${endpoint}`,
            {
                ...options,
                headers
            }
        );

        let data = {};

        try {
            data = await response.json();
        } catch {
            data = {};
        }

        if (!response.ok) {
            let message = data.detail || "Something went wrong.";

            if (Array.isArray(message)) {
                message = message
                    .map(item => item.msg)
                    .join(", ");
            }

            throw new Error(message);
        }

        return data;
    },

    showMessage(elementId, message, type = "success") {
        const element = document.getElementById(elementId);

        if (!element) return;

        element.textContent = message;
        element.className = `message ${type}`;
    },

    clearMessage(elementId) {
        const element = document.getElementById(elementId);

        if (element) {
            element.textContent = "";
            element.className = "message";
        }
    },

    requireLogin() {
        if (!this.getToken()) {
            window.location.href = "login.html";
        }
    },

    logout() {
        this.clearToken();
        window.location.href = "login.html";
    }
};
