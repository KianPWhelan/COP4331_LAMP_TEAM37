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

$stmt = $db->prepare('SELECT 1 FROM Users WHERE Login = :login LIMIT 1');
$stmt->execute([':login' => $login]);

if ($stmt->fetchColumn() !== false) {
    respond(409, ['error' => 'Login already exists']);
}

$passwordHash = password_hash($password, PASSWORD_DEFAULT);

try {
    $stmt = $db->prepare(
        'INSERT INTO Users (FirstName, LastName, Login, Password, Admin, Disabled)
         VALUES (:firstName, :lastName, :login, :password, :admin, 0)'
    );

    $stmt->execute([
        ':firstName' => $firstName,
        ':lastName'  => $lastName,
        ':login'     => $login,
        ':password'  => $passwordHash,
        ':admin'     => 'Standard User'
    ]);
} catch (PDOException $e) {

    if ((int) ($e->errorInfo[1] ?? 0) === 1062) {
        respond(409, ['error' => 'Login already exists']);
    }

    throw $e;
}

respond(201, [
    'message' => 'User registered successfully'
]);
