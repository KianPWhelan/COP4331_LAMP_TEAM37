function validateRegistration() {

    const firstName = document.getElementById("firstName").value.trim();
    const lastName = document.getElementById("lastName").value.trim();
    const login = document.getElementById("registerUsername").value.trim();
    const password = document.getElementById("registerPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    // Find message area on registration page
    const result = document.getElementById("registerResult");

    // Check if they match
    if (password !== confirmPassword) {
        result.textContent = "Passwords do not match. Please re-enter.";
        result.style.color = "#ff6b6b";
        return;
    }

    const registrationData = {
        firstName: firstName,
        lastName: lastName,
        login: login,
        password: password
    };

    fetch("/api/register.php", {
        method: "POST",
        headers: {
                "Content-Type": "application/json"
        },
        body: JSON.stringify(registrationData)
    })

    .then(async response => {
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Registration failed");
        }

        return data;
    })
    
    .then(data => {
        result.textContent = data.message;
        result.style.color = "#51cf66";
    })
    .catch(error => {
        result.textContent = error.message;
        result.style.color = "#ff6b6b";
    });
}