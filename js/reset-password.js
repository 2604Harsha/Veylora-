
document.addEventListener("DOMContentLoaded", () => {
    const resetForm = document.getElementById("resetForm");

    if (!resetForm) return;

    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
        Auth.showMessage(
            "resetMessage",
            "Invalid or missing password reset link.",
            "error"
        );

        resetForm.querySelectorAll("input, button").forEach(element => {
            element.disabled = true;
        });

        return;
    }

    resetForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        Auth.clearMessage("resetMessage");

        const password = document.getElementById("password").value;
        const confirmPassword =
            document.getElementById("confirmPassword").value;

        document.getElementById("passwordError").textContent = "";
        document.getElementById("confirmPasswordError").textContent = "";

        let valid = true;

        if (password.length < 8) {
            document.getElementById("passwordError").textContent =
                "Password must contain at least 8 characters.";
            valid = false;
        }

        if (password !== confirmPassword) {
            document.getElementById("confirmPasswordError").textContent =
                "Passwords do not match.";
            valid = false;
        }

        if (!valid) return;

        const submitButton = resetForm.querySelector(
            'button[type="submit"]'
        );

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = "Updating Password...";
        }

        try {
            const response = await Auth.request(
                "/auth/reset-password",
                {
                    method: "POST",
                    body: JSON.stringify({
                        token,
                        new_password: password
                    })
                }
            );

            Auth.showMessage(
                "resetMessage",
                response.message || "Password updated successfully!",
                "success"
            );

            resetForm.reset();

            setTimeout(() => {
                window.location.href = "login.html";
            }, 1500);

        } catch (error) {
            Auth.showMessage(
                "resetMessage",
                error.message,
                "error"
            );
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = "Reset Password";
            }
        }
    });
});
