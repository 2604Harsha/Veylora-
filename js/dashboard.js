
document.addEventListener("DOMContentLoaded", async () => {
    if (!Auth.getToken()) {
        window.location.href = "login.html";
        return;
    }

    const logoutButton = document.getElementById("logoutButton");

    if (logoutButton) {
        logoutButton.addEventListener("click", () => {
            Auth.logout();
        });
    }

    try {
        const user = await Auth.request("/auth/me", {
            method: "GET"
        });

        const name = user.name || "User";
        const email = user.email || "";

        const welcomeName = document.getElementById("welcomeName");
        const navUserName = document.getElementById("navUserName");
        const profileName = document.getElementById("profileName");
        const profileEmail = document.getElementById("profileEmail");
        const profileInitial = document.getElementById("profileInitial");

        if (welcomeName) welcomeName.textContent = name;
        if (navUserName) navUserName.textContent = name;
        if (profileName) profileName.textContent = name;
        if (profileEmail) profileEmail.textContent = email;

        if (profileInitial) {
            profileInitial.textContent =
                name.charAt(0).toUpperCase();
        }

        const securityStatus = document.querySelector(
            ".security-status"
        );

        if (securityStatus) {
            securityStatus.textContent = "Account Active";
        }

        const roleElement = document.querySelector(
            ".profile-details .detail-row:last-child strong"
        );

        if (roleElement) {
            roleElement.textContent = user.role || "User";
        }

    } catch (error) {
        console.error("Dashboard authentication failed:", error);

        Auth.clearToken();
        window.location.href = "login.html";
    }
});
