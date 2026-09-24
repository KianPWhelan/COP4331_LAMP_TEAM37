const contactsUrl = "https://kianwcop4331.webhop.me/api/contacts.php";

function getUserId() {
    const userCookie = document.cookie
        .split(";")
        .find(function (cookie) {
            return cookie.trim().startsWith("userId=");
        });

    if (!userCookie) {
        return 0;
    }

    const userId = Number(userCookie.split("=")[1]);
    return Number.isInteger(userId) && userId > 0 ? userId : 0;
}

const userId = getUserId();

if (!userId) {
    window.location.href = "index.html";
}


// Load all contacts for the current user
function loadContacts() {
    const xhr = new XMLHttpRequest();

    xhr.open("GET", contactsUrl, true);

    xhr.setRequestHeader("Authorization", "Bearer " + userId);
    xhr.setRequestHeader("X-User-Id", userId);

    xhr.onreadystatechange = function () {
        if (this.readyState === 4) {
            if (this.status === 200) {
                const response = JSON.parse(xhr.responseText);
                displayContacts(response.contacts || []);
            } else {
                console.error("Failed to load contacts:", xhr.responseText);
            }
        }
    };

    xhr.send();
}


// Add a new contact
function addContact() {
    const firstName = document.getElementById("firstName").value.trim();
    const lastName = document.getElementById("lastName").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const email = document.getElementById("email").value.trim();

    if (!firstName || !lastName || !phone || !email) {
        alert("Please fill out all fields.");
        return;
    }

    const payload = JSON.stringify({
        firstName: firstName,
        lastName: lastName,
        phone: phone,
        email: email
    });

    const xhr = new XMLHttpRequest();

    xhr.open("POST", contactsUrl, true);

    xhr.setRequestHeader(
        "Content-Type",
        "application/json; charset=UTF-8"
    );

    xhr.setRequestHeader("Authorization", "Bearer " + userId);
    xhr.setRequestHeader("X-User-Id", userId);

    xhr.onreadystatechange = function () {
        if (this.readyState === 4) {
            if (this.status === 200 || this.status === 201) {
                document.getElementById("firstName").value = "";
                document.getElementById("lastName").value = "";
                document.getElementById("phone").value = "";
                document.getElementById("email").value = "";

                loadContacts();
            } else {
                console.error("Failed to add contact:", xhr.responseText);

                try {
                    const response = JSON.parse(xhr.responseText);
                    alert(response.error || "Failed to add contact.");
                } catch (e) {
                    alert("Failed to add contact.");
                }
            }
        }
    };

    xhr.send(payload);
}


// Search contacts
function searchContacts() {
    const searchInput = document.getElementById("searchText");

    const search = searchInput
        ? searchInput.value.trim()
        : "";

    let url = contactsUrl;

    if (search) {
        url += "?q=" + encodeURIComponent(search);
    }

    const xhr = new XMLHttpRequest();

    xhr.open("GET", url, true);

    xhr.setRequestHeader("Authorization", "Bearer " + userId);
    xhr.setRequestHeader("X-User-Id", userId);

    xhr.onreadystatechange = function () {
        if (this.readyState === 4) {
            if (this.status === 200) {
                const response = JSON.parse(xhr.responseText);
                displayContacts(response.contacts || []);
            } else {
                console.error("Failed to search contacts:", xhr.responseText);
            }
        }
    };

    xhr.send();
}


// Render contacts on the page
function displayContacts(contacts) {
    const contactList = document.getElementById("contactList");

    if (!contactList) {
        return;
    }

    contactList.innerHTML = "";

    if (contacts.length === 0) {
        contactList.innerHTML = `
            <div class="text-secondary-contrast small">
                No contacts found.
            </div>
        `;
        return;
    }

    contacts.forEach(function (contact) {
        contactList.innerHTML += `
            <div class="border rounded-3 p-3 mb-2">
                <strong>
                    ${contact.firstName} ${contact.lastName}
                </strong>

                <div class="small text-secondary-contrast">
                    ${contact.phone}
                </div>

                <div class="small text-secondary-contrast">
                    ${contact.email}
                </div>
            </div>
        `;
    });
}


// Automatically load contacts when the page opens
document.addEventListener("DOMContentLoaded", function () {
    loadContacts();
});