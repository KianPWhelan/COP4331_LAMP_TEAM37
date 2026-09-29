# COP4331 LAMP Contacts App Overview

## Project Status

This repository is a PHP/MySQL LAMP application that started as a Colors demo and is being adapted into a Contacts application. Both versions currently exist:

- The legacy Colors flow is still present in `color.html`, `js/code.js`, and `api/index.php`.
- The Contacts page is in `contacts.html`, `js/contacts.js`, and `api/contacts.php`.
- The Admin page is in `admin.html`, `js/admin.js`, and `api/admin.php`.
- Login and registration use `api/login.php` and `api/register.php`; dashboard logout returns to `index.html` using the existing frontend behavior.

The project is therefore a working foundation with a partially completed Contacts conversion, rather than a fully unified Contacts application.

## Directory Overview

### Frontend pages

- `index.html` is the login page. It collects a username and password and calls `doLogin()` from `js/code.js`.
- `register.html` is the account creation page. It collects first name, last name, username, password, and password confirmation.
- `contacts.html` is the new Contacts dashboard. It contains contact search, a form for first name, last name, phone, and email, and a contact list.
- `color.html` is the original Colors dashboard. It is still connected to the legacy Colors API and should be treated as old application code unless the project intentionally keeps both features.

### JavaScript

- `js/code.js` sends login requests, stores display information in cookies, and routes Admin users to `admin.html` and Standard Users to `contacts.html`. It also retains legacy Colors CRUD functions.
- `js/contacts.js` loads and SQL-searches contacts, creates contacts, edits all contact fields except ID, deletes contacts, and renders the current user's contacts. API requests pass the user ID in the existing headers.
- `js/admin.js` loads and SQL-searches users, disables/enables accounts, changes passwords, creates Admin accounts, and loads/searches contacts belonging to a selected user.
- `js/register.js` validates matching passwords and sends registration data to `api/register.php`.
- `js/md5.js` is legacy client-side MD5 code from the original Colors project. The current login endpoint uses PHP password verification instead.

### Styling and assets

- `css/styles.css` contains the shared visual design, including the dark glass-card layout, colors, responsive behavior, Halloween decorations, and contact-page styling.
- `images/` contains the pumpkin, ghost, and other visual assets used by the login and registration pages.
- `favicon.ico` is the browser tab icon.

### Backend API

- `api/login.php` accepts JSON credentials, rejects disabled accounts with the same generic failure as invalid credentials, and verifies hashes with `password_verify()`. The frontend stores the returned user ID and role in cookies.
- `api/register.php` accepts JSON registration data, hashes passwords with `password_hash()`, and creates active Standard User accounts.
- `api/contacts.php` authenticates through `requireAuth()`, filters contact queries by the supplied user ID, and supports SQL-backed list/search/create/update/delete operations.
- `api/admin.php` restricts access to active Admins. It supports SQL-backed user search, SQL-backed contact search for any selected user, soft-disable/enable, password changes, and creation of hashed-password Admin accounts. It no longer deletes user rows or contacts.
- `api/index.php` is the legacy unified Colors API. It contains the old login and Colors list/search/add/update/delete behavior and is not the main endpoint for the new Contacts page.
- `api/index.php.save` and `api/.index.php.swo` are editor or backup artifacts and are not part of the intended application flow.

### Configuration and database files

- `api/config/db.php` creates a PDO MySQL connection. It reads database settings from environment variables or a `.env` file and falls back to `ContactsAppDB`, `ContactsAppUser`, and local host defaults.
- `api/config/helpers.php` provides JSON responses, request-body parsing, input cleanup, CORS headers, environment loading, and the `requireAuth()` user-ID lookup.
- `api/config/resetdb.sql` is still the old Colors database reset script. It creates `ColorsAppDB`, `Users`, and `Colors`, seeds demo users, and creates the old `ColorsAppUser` database account. Do not run it against the Contacts deployment.
- `.env` is intentionally excluded from Git and should contain deployment-specific database settings. Do not commit or share its credentials.

## How the Current Flow Works

### Login

1. The user enters credentials in `index.html`.
2. `js/code.js` sends them as JSON to `/api/login.php`.
3. `api/login.php` queries `Users` by `Login`.
4. The password is checked with `password_verify()`.
5. On success, the browser stores user information in a cookie.
6. The frontend stores returned identity details in cookies and redirects Admins to `admin.html` and Standard Users to `contacts.html`.

### Registration

1. The user submits the form in `register.html`.
2. `js/register.js` checks that the passwords match.
3. It sends the user data as JSON to `/api/register.php`.
4. `api/register.php` hashes the password and inserts a new user.
5. The page displays the returned success or error message.

### Contacts

1. `contacts.html` loads `js/contacts.js`.
2. The browser sends its current user ID in the existing authorization and `X-User-Id` headers.
3. `api/contacts.php` obtains the user ID with `requireAuth()` and checks that the account is active.
4. Contact SQL is scoped by `UserID`; search is performed in SQL.
5. The UI can create, edit, and delete contacts, with update/delete constrained to the identified user's rows.
6. The API maps database columns such as `Email Address` and `Phone Number` to `email` and `phone` for the browser.

### Admin management

1. Login routes Admin users to `admin.html`.
2. The Admin UI calls `api/admin.php`; that endpoint checks the identified account for the Admin role and active state.
3. User and contact searches are sent as query parameters and executed by SQL.
4. Admin actions update account disabled state, replace password hashes, or create another Admin account.
5. Disabling preserves both the user row and all their contacts; disabled accounts cannot log in or use authenticated APIs.

## Intended Database Model

The newer PHP code expects a Contacts-oriented database with at least:

### Users

- `ID`
- `FirstName`
- `LastName`
- `Login`
- `Password`
- `Admin`
- `Disabled` (`0` active, `1` disabled)

### Contacts

- `ID`
- `FirstName`
- `LastName`
- `Email Address`
- `Phone Number`
- `UserID`

Every contact should point to its owner through `UserID`. The actual deployed database schema must be treated as authoritative; the checked-in `resetdb.sql` still documents the older Colors schema and does not yet match this model.

## Remaining Deployment and Verification

- Ensure the deployed database has the `Users.Disabled` field, a password column wide enough for PHP password hashes, and the expected `Contacts` schema. The local repo cannot prove the state of the remote database.
- Confirm a default `root` Admin account exists in the seeded/deployed database and change its initial password immediately. The local repo does not currently seed or verify this account.
- Verify the droplet serves the app over the configured domain and HTTPS/TLS. Deployment configuration is not included here.
- Run functional checks against the deployed database for both roles, disabled accounts, contact ownership, contact edit/delete persistence, Admin password changes, Admin creation, and SQL-backed searches.
- The legacy Colors files and `resetdb.sql` remain in the repository for reference and should not be mistaken for the Contacts deployment path.
- `requireAuth()` uses the existing client-provided user ID headers/cookies and checks the account's disabled state on API requests. This preserves the existing app flow, but a client-supplied ID is not robust authentication against a malicious client.

## What Already Exists

- A styled login, registration, contacts, and admin interface.
- Hashed password registration/login with the existing user-ID cookie/header flow.
- Frontend redirect logout and disabled-account checks.
- User-scoped contact list/search/create/update/delete API and UI.
- Admin user/contact SQL search, account disable/enable, password changes, and Admin creation.
- A legacy reference implementation for Colors CRUD operations.

## Remaining Work

Implementation is present locally. Remaining work is to ensure the deployed schema and default root account are in place, rotate the root password, confirm domain/TLS deployment, and run the listed end-to-end tests against the droplet. No deployment database was accessed or modified during this work.
