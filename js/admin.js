const adminUrl = "/api/admin.php";

function getCookie(name) {
    const entry = document.cookie.split(";").map(cookie => cookie.trim())
        .find(cookie => cookie.startsWith(name + "="));
    return entry ? decodeURIComponent(entry.substring(name.length + 1)) : "";
}

const userId = Number(getCookie("userId"));
let selectedUserId = 0;

if (!Number.isInteger(userId) || userId <= 0 || getCookie("role") !== "Admin") {
    window.location.href = "index.html";
}

function apiRequest(method, url, body, onSuccess) {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
    xhr.setRequestHeader("Authorization", "Bearer " + userId);
    xhr.setRequestHeader("X-User-Id", userId);
    xhr.onreadystatechange = function () {
        if (this.readyState !== 4) return;
        let response = {};
        try {
            response = JSON.parse(xhr.responseText);
        } catch (error) {
            response = {};
        }
        if (xhr.status >= 200 && xhr.status < 300) {
            onSuccess(response);
        } else {
            showAdminMessage(response.error || "Request failed.", true);
        }
    };
    xhr.send(body === undefined ? null : JSON.stringify(body));
}

function showAdminMessage(message, isError) {
    const result = document.getElementById("adminResult");
    result.textContent = message;
    result.className = isError ? "mb-3 small text-danger" : "mb-3 small text-success";
}

function loadUsers() {
    const search = document.getElementById("userSearch").value.trim();
    apiRequest("GET", adminUrl + "?q=" + encodeURIComponent(search), undefined, response => {
        displayUsers(response.users || []);
        showAdminMessage("Showing " + (response.users || []).length + " users.", false);
    });
}

function displayUsers(users) {
    const userList = document.getElementById("userList");
    userList.replaceChildren();

    users.forEach(user => {
        const row = document.createElement("tr");
        const cells = [user.id, user.firstName + " " + user.lastName, user.login, user.role,
            Number(user.disabled) === 1 ? "Disabled" : "Active"];
        cells.forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        });

        const actions = document.createElement("td");
        actions.className = "text-end text-nowrap";
        actions.append(
            createActionButton("Contacts", "btn btn-outline-info btn-sm me-1", () => viewUserContacts(user)),
            createActionButton(Number(user.disabled) === 1 ? "Enable" : "Disable",
                Number(user.disabled) === 1 ? "btn btn-outline-success btn-sm me-1" : "btn btn-outline-warning btn-sm me-1",
                () => setUserDisabled(user.id, Number(user.disabled) !== 1)),
            createActionButton("Password", "btn btn-outline-light btn-sm", () => changeUserPassword(user.id))
        );
        row.appendChild(actions);
        userList.appendChild(row);
    });
}

function createActionButton(label, className, action) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = label;
    button.addEventListener("click", action);
    return button;
}

function setUserDisabled(id, disabled) {
    if (disabled && Number(id) === userId) {
        showAdminMessage("You cannot disable your own account.", true);
        return;
    }
    const message = disabled ? "Disable this account? Its contacts will be retained." : "Enable this account?";
    if (!confirm(message)) return;
    apiRequest("PUT", adminUrl + "?id=" + encodeURIComponent(id),
        { action: "setDisabled", disabled }, loadUsers);
}

function changeUserPassword(id) {
    const password = prompt("Enter a new password:");
    if (password === null) return;
    if (password === "") {
        showAdminMessage("Password is required.", true);
        return;
    }
    apiRequest("PUT", adminUrl + "?id=" + encodeURIComponent(id),
        { action: "changePassword", password }, response => showAdminMessage(response.message, false));
}

function viewUserContacts(user) {
    selectedUserId = Number(user.id);
    document.getElementById("selectedUserLabel").textContent = user.firstName + " " + user.lastName + " (" + user.login + ")";
    document.getElementById("contactSearch").value = "";
    document.getElementById("userContactsSection").hidden = false;
    loadSelectedUserContacts();
}

function loadSelectedUserContacts() {
    if (!selectedUserId) return;
    const search = document.getElementById("contactSearch").value.trim();
    const query = new URLSearchParams({ contactsForUser: selectedUserId, q: search });
    apiRequest("GET", adminUrl + "?" + query.toString(), undefined, response => {
        const target = document.getElementById("adminContactList");
        target.replaceChildren();
        (response.contacts || []).forEach(contact => {
            const row = document.createElement("tr");
            [contact.id, contact.firstName + " " + contact.lastName, contact.email, contact.phone].forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = value;
                row.appendChild(cell);
            });
            target.appendChild(row);
        });
    });
}

function createAdmin(event) {
    event.preventDefault();
    const payload = {
        action: "createAdmin",
        firstName: document.getElementById("adminFirstName").value.trim(),
        lastName: document.getElementById("adminLastName").value.trim(),
        login: document.getElementById("adminLogin").value.trim(),
        password: document.getElementById("adminPassword").value
    };
    apiRequest("POST", adminUrl, payload, response => {
        document.getElementById("createAdminForm").reset();
        showAdminMessage(response.message, false);
        loadUsers();
    });
}

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("createAdminForm").addEventListener("submit", createAdmin);
    document.getElementById("userSearch").addEventListener("keydown", event => {
        if (event.key === "Enter") loadUsers();
    });
    document.getElementById("contactSearch").addEventListener("keydown", event => {
        if (event.key === "Enter") loadSelectedUserContacts();
    });
    loadUsers();
});