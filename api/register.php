<?php

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, ['error' => 'Method not allowed']);
}

$body = getRequestBody();

$firstName = clean($body['firstName'] ?? '');
$lastName  = clean($body['lastName'] ?? '');
$login     = clean($body['login'] ?? '');
$password  = $body['password'] ?? '';

if (!$firstName || !$lastName || !$login || !$password) {
    respond(400, ['error' => 'All fields are required']);
}

$db = getDB();

$passwordHash = password_hash($password, PASSWORD_DEFAULT);

$stmt = $db->prepare(
    'INSERT INTO Users (FirstName, LastName, Login, Password, Admin)
     VALUES (:firstName, :lastName, :login, :password, :admin)'
);

$stmt->execute([
    ':firstName' => $firstName,
    ':lastName'  => $lastName,
    ':login'     => $login,
    ':password'  => $passwordHash,
    ':admin'     => 'Standard User'
]);

respond(201, [
    'message' => 'User registered successfully'
]);
