
document.addEventListener("DOMContentLoaded", () => {

    // ==================================
    // PASSWORD SHOW / HIDE
    // ==================================

    function setupPasswordToggle(inputId, buttonId) {

        const passwordInput = document.getElementById(inputId);
        const toggleButton = document.getElementById(buttonId);

        if (!passwordInput || !toggleButton) {
            console.error(`Missing password elements: ${inputId}`);
            return;
        }

        toggleButton.textContent = "Show";

        toggleButton.addEventListener("click", () => {

            const isHidden = passwordInput.type === "password";

            passwordInput.type = isHidden ? "text" : "password";

            toggleButton.textContent = isHidden ? "Hide" : "Show";

            toggleButton.setAttribute(
                "aria-label",
                isHidden ? "Hide password" : "Show password"
            );

        });

    }

    setupPasswordToggle("password", "togglePassword");
    setupPasswordToggle("confirmPassword", "toggleConfirmPassword");


    // ==================================
    // SIGNUP FORM
    // ==================================

    const signupForm = document.getElementById("signupForm");

    if (!signupForm) {
        console.error("Signup form not found.");
        return;
    }

    signupForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        Auth.clearMessage("signupMessage");

        const nameInput = document.getElementById("name");
        const emailInput = document.getElementById("email");
        const passwordInput = document.getElementById("password");
        const confirmPasswordInput =
            document.getElementById("confirmPassword");
        const termsInput = document.getElementById("terms");

        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        const terms = termsInput.checked;

        let valid = true;


        // CLEAR PREVIOUS ERRORS

        const errorFields = [
            "nameError",
            "emailError",
            "passwordError",
            "confirmPasswordError",
            "termsError"
        ];

        errorFields.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.textContent = "";
        });


        // NAME VALIDATION

        if (!name) {

            document.getElementById("nameError").textContent =
                "Please enter your name.";

            valid = false;
        }


        // EMAIL VALIDATION

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {

            document.getElementById("emailError").textContent =
                "Enter a valid email address.";

            valid = false;
        }


        // PASSWORD VALIDATION

        if (password.length < 8) {

            document.getElementById("passwordError").textContent =
                "Password must contain at least 8 characters.";

            valid = false;
        }


        // CONFIRM PASSWORD VALIDATION

        if (!confirmPassword) {

            document.getElementById("confirmPasswordError").textContent =
                "Please confirm your password.";

            valid = false;

        } else if (password !== confirmPassword) {

            document.getElementById("confirmPasswordError").textContent =
                "Passwords do not match.";

            valid = false;
        }


        // TERMS VALIDATION

        if (!terms) {

            document.getElementById("termsError").textContent =
                "Please accept the terms and conditions.";

            valid = false;
        }


        if (!valid) return;


        // SUBMIT BUTTON

        const submitButton = signupForm.querySelector(
            'button[type="submit"]'
        );

        if (submitButton) {

            submitButton.disabled = true;
            submitButton.textContent = "Creating Account...";

        }


        try {

            // BACKEND API REQUEST

            const response = await Auth.request("/auth/signup", {

                method: "POST",

                body: JSON.stringify({
                    name: name,
                    email: email,
                    password: password
                })

            });


            // SUCCESS MESSAGE

            Auth.showMessage(
                "signupMessage",
                response.message ||
                "Account created successfully! Please login.",
                "success"
            );


            // RESET FORM

            signupForm.reset();


            // RESET PASSWORD VISIBILITY

            const passwordToggle =
                document.getElementById("togglePassword");

            const confirmToggle =
                document.getElementById("toggleConfirmPassword");

            passwordInput.type = "password";
            confirmPasswordInput.type = "password";

            if (passwordToggle) {
                passwordToggle.textContent = "Show";
                passwordToggle.setAttribute(
                    "aria-label",
                    "Show password"
                );
            }

            if (confirmToggle) {
                confirmToggle.textContent = "Show";
                confirmToggle.setAttribute(
                    "aria-label",
                    "Show password"
                );
            }


            // REDIRECT TO LOGIN

            setTimeout(() => {
                window.location.href = "login.html";
            }, 1500);


        } catch (error) {

            console.error("Signup error:", error);

            Auth.showMessage(
                "signupMessage",
                error.message || "Registration failed. Please try again.",
                "error"
            );

        } finally {

            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = "Create Account";
            }

        }

    });

});
