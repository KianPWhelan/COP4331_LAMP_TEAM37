const contactsUrl = "/api/contacts.php";

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
let currentContacts = [];

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

function editContact(id) {
    const contact = currentContacts.find(function (item) {
        return Number(item.id) === Number(id);
    });

    if (!contact) {
        return;
    }

    const editor = document.getElementById("contact-editor-" + id);
    editor.hidden = false;
    editor.querySelector("[name='firstName']").value = contact.firstName;
    editor.querySelector("[name='lastName']").value = contact.lastName;
    editor.querySelector("[name='email']").value = contact.email;
    editor.querySelector("[name='phone']").value = contact.phone;
}

function cancelEdit(id) {
    const editor = document.getElementById("contact-editor-" + id);
    if (editor) {
        editor.hidden = true;
    }
}

function saveContact(id) {
    const editor = document.getElementById("contact-editor-" + id);
    const values = new FormData(editor);
    const payload = {
        firstName: values.get("firstName").trim(),
        lastName: values.get("lastName").trim(),
        email: values.get("email").trim(),
        phone: values.get("phone").trim()
    };

    if (Object.values(payload).some(function (value) { return !value; })) {
        alert("Please fill out all contact fields.");
        return;
    }

    const xhr = new XMLHttpRequest();
    xhr.open("PUT", contactsUrl + "?id=" + encodeURIComponent(id), true);
    xhr.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
    xhr.setRequestHeader("Authorization", "Bearer " + userId);
    xhr.setRequestHeader("X-User-Id", userId);
    xhr.onreadystatechange = function () {
        if (this.readyState === 4) {
            if (this.status === 200) {
                loadContacts();
            } else {
                showContactError(xhr.responseText, "Failed to update contact.");
            }
        }
    };
    xhr.send(JSON.stringify(payload));
}

let reaperAnimationRunning = false;

function deleteContact(id) {
    if (reaperAnimationRunning) {
        return;
    }
    const contact = document.getElementById(`contact-${id}`);
    const reaper = document.getElementById("grimReaper");

    const contactRect = contact.getBoundingClientRect();

    if (!confirm("Delete this contact?")) {
        return;
    }

    reaperAnimationRunning = true;

    reaper.style.top = `${contactRect.top + contactRect.height / 2}px`;

    const xhr = new XMLHttpRequest();
    xhr.open("DELETE", contactsUrl + "?id=" + encodeURIComponent(id), true);
    xhr.setRequestHeader("Authorization", "Bearer " + userId);
    xhr.setRequestHeader("X-User-Id", userId);
    xhr.onreadystatechange = function () {
        if (this.readyState === 4) {
            if (this.status === 200) {
                playReaperDeleteAnimation(contact, reaper);
            } else {
                reaperAnimationRunning = false;
                showContactError(xhr.responseText, "Failed to delete contact.");
            }
        }
    };
    xhr.send();
}

function playReaperDeleteAnimation(contact, reaper) {
    // Prevent scrolling during the animation
    document.body.style.overflow = "hidden";

    // Find the contact's current position
    const contactRect = contact.getBoundingClientRect();

    // Reset Reaper
    reaper.style.display = "block";
    reaper.style.top = `${contactRect.top + contactRect.height / 2}px`;
    reaper.style.left = "calc(100% + 100px)";
    reaper.style.transform = "translateY(-50%)";
    reaper.src = "images/reaper-approach.png";

    // Start walking toward the contact
    setTimeout(() => {
        reaper.style.left = `${contactRect.right - 40}px`;
    }, 50);

    // Alternate walking frames
    let walkFrame = false;

    const walkAnimation = setInterval(() => {
        reaper.src = walkFrame
            ? "images/reaper-approach.png"
            : "images/reaper-walk.png";

        walkFrame = !walkFrame;
    }, 200);

    // Arrives and prepares
    setTimeout(() => {
        clearInterval(walkAnimation);
        reaper.src = "images/reaper-prepare.png";
    }, 3050);

    // Reap pose
    setTimeout(() => {
        reaper.src = "images/reaper-reap.png";
    }, 3550);

    // Disperse the contact
    setTimeout(() => {
        contact.classList.add("reaper-disperse");
    }, 4000);

    // Turn around and walk away
    setTimeout(() => {
        contact.style.visibility = "hidden";

        reaper.style.transform = "translateY(-50%) scaleX(-1)";
        reaper.style.left = "calc(100% + 100px)";

        let returnWalkFrame = false;

        const returnWalkAnimation = setInterval(() => {
            reaper.src = returnWalkFrame
                ? "images/reaper-approach.png"
                : "images/reaper-walk.png";

            returnWalkFrame = !returnWalkFrame;
        }, 200);

        setTimeout(() => {
            clearInterval(returnWalkAnimation);
        }, 3000);

    }, 5000);

    // Animation finished
    setTimeout(() => {
        reaper.style.display = "none";
        document.body.style.overflow = "";

        reaperAnimationRunning = false;

        // Now refresh the real contacts list
        loadContacts();
    }, 8000);
}

function showContactError(responseText, fallback) {
    try {
        const response = JSON.parse(responseText);
        alert(response.error || fallback);
    } catch (error) {
        alert(fallback);
    }
}

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[character];
    });
}


// Render contacts on the page
function displayContacts(contacts) {
    const contactList = document.getElementById("contactList");
    const contactCount = document.getElementById("contactCount");

    if (!contactList) {
        return;
    }

    currentContacts = contacts;

    if (contactCount) {
        contactCount.textContent = contacts.length;
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
        const id = Number(contact.id);
        const firstName = escapeHtml(contact.firstName);
        const lastName = escapeHtml(contact.lastName);
        const email = escapeHtml(contact.email);
        const phone = escapeHtml(contact.phone);

        contactList.innerHTML += `
            <article id="contact-${id}" class="border rounded-3 p-3 mb-2">
                <div class="d-flex justify-content-between align-items-start gap-3">
                    <div>
                        <strong>${firstName} ${lastName}</strong>
                        <div class="small text-secondary-contrast"><span class="fw-semibold">Phone Number:</span> ${phone}</div>
                        <div class="small text-secondary-contrast"><span class="fw-semibold">Email Address:</span> ${email}</div>
                    </div>
                    <div class="d-flex gap-2">
                        <button type="button" class="btn btn-outline-light btn-sm" onclick="editContact(${id})">Edit</button>
                        <button type="button" class="btn btn-outline-danger btn-sm" onclick="deleteContact(${id})">Delete</button>
                    </div>
                </div>
                <form id="contact-editor-${id}" class="row g-2 mt-2" hidden onsubmit="event.preventDefault(); saveContact(${id})">
                    <div class="col-sm-6">
                        <label class="form-label small text-uppercase" for="edit-firstName-${id}">First Name</label>
                        <input id="edit-firstName-${id}" class="form-control" name="firstName" required>
                    </div>
                    <div class="col-sm-6">
                        <label class="form-label small text-uppercase" for="edit-lastName-${id}">Last Name</label>
                        <input id="edit-lastName-${id}" class="form-control" name="lastName" required>
                    </div>
                    <div class="col-sm-6">
                        <label class="form-label small text-uppercase" for="edit-phone-${id}">Phone Number</label>
                        <input id="edit-phone-${id}" class="form-control" name="phone" type="tel" required>
                    </div>
                    <div class="col-sm-6">
                        <label class="form-label small text-uppercase" for="edit-email-${id}">Email Address</label>
                        <input id="edit-email-${id}" class="form-control" name="email" type="email" required>
                    </div>
                    <div class="col-12 d-flex gap-2">
                        <button type="submit" class="btn btn-primary btn-sm">Save</button>
                        <button type="button" class="btn btn-outline-secondary btn-sm" onclick="cancelEdit(${id})">Cancel</button>
                    </div>
                </form>
            </article>
        `;
    });
}


// Automatically load contacts when the page opens
document.addEventListener("DOMContentLoaded", function () {
    loadContacts();
});
