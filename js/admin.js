const adminUrl = "https://kianwcop4331.webhop.me/api/admin.php";

function getUserId() {
    const cookies = document.cookie.split(";");

    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();

        if (cookie.startsWith("userId=")) {
            const id = parseInt(cookie.substring("userId=".length));

            if (!isNaN(id) && id > 0) {
                return id;
            }
        }
    }

    return 0;
}

const userId = getUserId();

if (!userId) {
    window.location.href = "index.html";
}


function loadUsers() {
    const xhr = new XMLHttpRequest();

    xhr.open("GET", adminUrl, true);

    xhr.setRequestHeader("Authorization", "Bearer " + userId);
    xhr.setRequestHeader("X-User-Id", userId);

    xhr.onreadystatechange = function () {
        if (this.readyState === 4) {

            if (this.status === 200) {
                const response = JSON.parse(xhr.responseText);
                displayUsers(response.users || []);
            } else {
                const result = document.getElementById("adminResult");

                try {
                    const response = JSON.parse(xhr.responseText);
                    result.textContent = response.error || "Failed to load users.";
                } catch {
                    result.textContent = "Failed to load users.";
                }
            }
        }
    };

    xhr.send();
}


function displayUsers(users) {
    const userList = document.getElementById("userList");

    userList.innerHTML = "";

    users.forEach(function (user) {
        let deleteButton = "";

        if (user.id !== userId && user.role !== "Admin") {
            deleteButton = `
                <button
                    class="btn btn-outline-danger btn-sm"
                    onclick="deleteUser(${user.id})"
                >
                    <i class="bi bi-trash"></i>
                    Delete
                </button>
            `;
        }

        userList.innerHTML += `
            <tr>
                <td>${user.id}</td>

                <td>
                    ${user.firstName} ${user.lastName}
                </td>

                <td>
                    ${user.login}
                </td>

                <td>
                    ${user.role}
                </td>

                <td class="text-end">
                    ${deleteButton}
                </td>
            </tr>
        `;
    });
}


function deleteUser(id) {
    if (!confirm("Are you sure you want to delete this user?")) {
        return;
    }

    const xhr = new XMLHttpRequest();

    xhr.open("DELETE", adminUrl + "?id=" + id, true);

    xhr.setRequestHeader("Authorization", "Bearer " + userId);
    xhr.setRequestHeader("X-User-Id", userId);

    xhr.onreadystatechange = function () {
        if (this.readyState === 4) {

            if (this.status === 200) {
                loadUsers();
            } else {
                try {
                    const response = JSON.parse(xhr.responseText);
                    alert(response.error || "Failed to delete user.");
                } catch {
                    alert("Failed to delete user.");
                }
            }
        }
    };

    xhr.send();
}


document.addEventListener("DOMContentLoaded", function () {
    loadUsers();
});