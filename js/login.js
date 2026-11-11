
document.addEventListener("DOMContentLoaded", () => {

    // PASSWORD SHOW / HIDE
    const passwordInput = document.getElementById("password");
    const togglePassword = document.getElementById("togglePassword");

    if (passwordInput && togglePassword) {

        togglePassword.addEventListener("click", (event) => {

            event.preventDefault();

            const isPassword = passwordInput.type === "password";

            passwordInput.type = isPassword ? "text" : "password";

            togglePassword.textContent = isPassword ? "Hide" : "Show";

            togglePassword.setAttribute(
                "aria-label",
                isPassword ? "Hide password" : "Show password"
            );

        });

    }

    // LOGIN FORM
    const loginForm = document.getElementById("loginForm");

    if (!loginForm) return;

    loginForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        Auth.clearMessage("loginMessage");

        const email = document.getElementById("email").value.trim();
        const password = passwordInput.value;

        if (!email || !password) {

            Auth.showMessage(
                "loginMessage",
                "Please enter your email and password.",
                "error"
            );

            return;
        }

        const submitButton = loginForm.querySelector(
            'button[type="submit"]'
        );

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = "Logging in...";
        }

        try {

            const response = await Auth.request("/auth/login", {
                method: "POST",
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            if (!response.access_token) {
                throw new Error("Access token not received.");
            }

            Auth.saveToken(response.access_token);

            Auth.showMessage(
                "loginMessage",
                "Login successful! Redirecting...",
                "success"
            );

            setTimeout(() => {
                window.location.href = "dashboard.html";
            }, 700);

        } catch (error) {

            Auth.showMessage(
                "loginMessage",
                error.message,
                "error"
            );

        } finally {

            if (submitButton) {
                submitButton.disabled = false;
                submitButton.innerHTML = 'Sign In <span>→</span>';
            }

        }

    });

});
