# COP4331 LAMP Contacts App Overview

## Project Status

This repository is a PHP/MySQL LAMP application that started as a Colors demo and is being adapted into a Contacts application. Both versions currently exist:

- The legacy Colors flow is still present in `color.html`, `js/code.js`, and `api/index.php`.
- The newer Contacts page is present in `contacts.html`, `js/contacts.js`, and `api/contacts.php`.
- Login and registration endpoints have been added as separate files: `api/login.php` and `api/register.php`.

The project is therefore a working foundation with a partially completed Contacts conversion, rather than a fully unified Contacts application.

## Directory Overview

### Frontend pages

- `index.html` is the login page. It collects a username and password and calls `doLogin()` from `js/code.js`.
- `register.html` is the account creation page. It collects first name, last name, username, password, and password confirmation.
- `contacts.html` is the new Contacts dashboard. It contains contact search, a form for first name, last name, phone, and email, and a contact list.
- `color.html` is the original Colors dashboard. It is still connected to the legacy Colors API and should be treated as old application code unless the project intentionally keeps both features.

### JavaScript

- `js/code.js` contains the original login and Colors CRUD logic. It sends login requests, stores user information in cookies, reads the cookie on the Colors page, and supports adding, searching, and deleting colors.
- `js/contacts.js` contains the Contacts page logic. It loads contacts, searches contacts, submits new contacts, renders the contact list, and uses a temporary hardcoded test user ID.
- `js/register.js` validates matching passwords and sends registration data to `api/register.php`.
- `js/md5.js` is legacy client-side MD5 code from the original Colors project. The current login endpoint uses PHP password verification instead.

### Styling and assets

- `css/styles.css` contains the shared visual design, including the dark glass-card layout, colors, responsive behavior, Halloween decorations, and contact-page styling.
- `images/` contains the pumpkin, ghost, and other visual assets used by the login and registration pages.
- `favicon.ico` is the browser tab icon.

### Backend API

- `api/login.php` accepts a JSON `POST` containing `login` and `password`. It looks up the user in `Users`, verifies the stored password with `password_verify()`, and returns the user ID, name, login, and role.
- `api/register.php` accepts a JSON `POST` containing `firstName`, `lastName`, `login`, and `password`. It hashes the password with `password_hash()` and inserts a new `Users` row.
- `api/contacts.php` is intended to serve the Contacts page. It authenticates using `requireAuth()`, filters contacts by `UserID`, supports listing, searching, and retrieving one contact, and returns contact fields using frontend-friendly names.
- `api/index.php` is the legacy unified Colors API. It contains the old login and Colors list/search/add/update/delete behavior and is not the main endpoint for the new Contacts page.
- `api/index.php.save` and `api/.index.php.swo` are editor or backup artifacts and are not part of the intended application flow.

### Configuration and database files

- `api/config/db.php` creates a PDO MySQL connection. It reads database settings from environment variables or a `.env` file and falls back to `ContactsAppDB`, `ContactsAppUser`, and local host defaults.
- `api/config/helpers.php` provides JSON responses, request-body parsing, input cleanup, CORS headers, environment loading, and the `requireAuth()` user-ID lookup.
- `api/config/resetdb.sql` is still the old Colors database reset script. It creates `ColorsAppDB`, `Users`, and `Colors`, seeds demo users, and creates the old `ColorsAppUser` database account.
- `.env` is intentionally excluded from Git and should contain deployment-specific database settings. Do not commit or share its credentials.

## How the Current Flow Works

### Login

1. The user enters credentials in `index.html`.
2. `js/code.js` sends them as JSON to `/api/login.php`.
3. `api/login.php` queries `Users` by `Login`.
4. The password is checked with `password_verify()`.
5. On success, the browser stores user information in a cookie.
6. The current JavaScript redirects to `color.html`, which is still the legacy destination.

### Registration

1. The user submits the form in `register.html`.
2. `js/register.js` checks that the passwords match.
3. It sends the user data as JSON to `/api/register.php`.
4. `api/register.php` hashes the password and inserts a new user.
5. The page displays the returned success or error message.

### Contacts

1. `contacts.html` loads `js/contacts.js`.
2. The script currently uses a hardcoded test user ID of `1` and sends it in `Authorization` and `X-User-Id` headers.
3. `api/contacts.php` calls `requireAuth()` to obtain the user ID.
4. Contact queries use `WHERE UserID = :uid`, so the intended design is to isolate each user's contacts.
5. The API maps database columns such as `Email Address` and `Phone Number` to `email` and `phone` for the browser.

## Intended Database Model

The newer PHP code expects a Contacts-oriented database with at least:

### Users

- `ID`
- `FirstName`
- `LastName`
- `Login`
- `Password`
- `Admin`

### Contacts

- `ID`
- `FirstName`
- `LastName`
- `Email Address`
- `Phone Number`
- `UserID`

Every contact should point to its owner through `UserID`. The actual deployed database schema must be treated as authoritative; the checked-in `resetdb.sql` still documents the older Colors schema and does not yet match this model.

## Known Incomplete or Conflicting Areas

- Login currently redirects to `color.html` instead of `contacts.html`.
- `js/contacts.js` searches for an element named `searchText`, while `contacts.html` defines `searchInput`.
- `js/contacts.js` sends a `POST` request when adding a contact, but `api/contacts.php` currently rejects every method other than `GET`.
- The Contacts API URL is hardcoded to the deployed webhop address, while login and registration use relative `/api/...` paths. Local and remote testing can therefore behave differently.
- The Contacts page uses a hardcoded user ID for testing rather than the successful login cookie or a real session.
- The login endpoint expects `password_hash()` output and a `Admin` column, while the legacy SQL reset script stores plain-text or MD5 sample passwords and does not define `Admin`.
- `api/config/helpers.php` accepts a numeric user ID from client-controlled headers, cookies, query parameters, or request bodies. This is useful for the course prototype but is not a secure production authentication mechanism.
- Error handling and success messages on the Contacts page are incomplete. Some failures are only written to the browser console or shown through `alert()`.
- The legacy Colors files and new Contacts files use different API routes and data models, so the application should eventually choose one consistent flow.

## What Already Exists

- A styled login and registration interface.
- A registration endpoint with password hashing.
- A login endpoint with password verification.
- Shared PDO and JSON helper code.
- A Contacts dashboard layout.
- User-scoped contact listing and searching on the backend.
- A frontend contact form and contact list renderer.
- A legacy reference implementation for user-scoped Colors CRUD operations.

## Remaining Work

The remaining work is primarily integration and verification:

1. Confirm the real deployed database schema and credentials without exposing them in the repository.
2. Make the login destination and Contacts page the single intended application flow.
3. Align the Contacts frontend field IDs, API URL, HTTP methods, request payloads, and response shapes.
4. Add the missing Contacts create, update, and delete behavior to the backend or remove those controls from the UI.
5. Replace hardcoded test authentication with a consistent authenticated session or token strategy.
6. Replace or clearly label the outdated `resetdb.sql` file so it does not imply that the old Colors schema is current.
7. Test registration, login, contact listing, search, add, update, delete, logout, authorization, and error cases against the actual deployment.
8. Decide whether the legacy Colors application should be removed, retained as a reference, or fully converted.
