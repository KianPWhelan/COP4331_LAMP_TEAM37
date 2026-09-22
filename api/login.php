<?php

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/helpers.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, ['error' => 'Method not allowed']);
}

// Read the JSON body
$body = getRequestBody();

$login    = clean($body['login'] ?? '');
$password = $body['password'] ?? '';


// Make sure both fields were provided
if (!$login || !$password) {
    respond(400, ['error' => 'Login and password are required']);
}

// Connect to the database
$db = getDB();

// Find the user by login
$stmt = $db->prepare(
    'SELECT ID, FirstName, LastName, Login, Password, Admin
     FROM Users
     WHERE Login = :login
     LIMIT 1'
);

$stmt->execute([
    ':login' => $login
]);

$user = $stmt->fetch();

// Wrong username or password
if (!$user || !password_verify($password, $user['Password'])) {
    respond(401, [
        'error' => 'Invalid login or password'
    ]);
}

// Successful login
respond(200, [
    'id' => (int)$user['ID'],
    'firstName' => $user['FirstName'],
    'lastName' => $user['LastName'],
    'login' => $user['Login'],
    'role' => $user['Admin']
]);
