
document.addEventListener("DOMContentLoaded", () => {
    const forgotForm = document.getElementById("forgotForm");

    if (!forgotForm) return;

    forgotForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        Auth.clearMessage("forgotMessage");

        const email = document.getElementById("email").value.trim();

        if (!email) {
            Auth.showMessage(
                "forgotMessage",
                "Please enter your email address.",
                "error"
            );
            return;
        }

        const submitButton = forgotForm.querySelector(
            'button[type="submit"]'
        );

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = "Sending...";
        }

        try {
            const response = await Auth.request(
                "/auth/forgot-password",
                {
                    method: "POST",
                    body: JSON.stringify({ email })
                }
            );

            Auth.showMessage(
                "forgotMessage",
                response.message ||
                    "If an account exists, password reset instructions have been sent.",
                "success"
            );

            forgotForm.reset();

        } catch (error) {
            Auth.showMessage(
                "forgotMessage",
                error.message,
                "error"
            );
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = "Send Reset Link";
            }
        }
    });
});
