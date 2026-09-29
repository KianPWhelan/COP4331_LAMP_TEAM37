<?php

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/helpers.php';

setCORSHeaders();

$db = getDB();
$adminId = requireAuth();
$method = $_SERVER['REQUEST_METHOD'];

$stmt = $db->prepare(
    'SELECT Admin, Disabled
     FROM Users
     WHERE ID = :id
     LIMIT 1'
);
$stmt->execute([':id' => $adminId]);
$currentUser = $stmt->fetch();

if (!$currentUser || $currentUser['Admin'] !== 'Admin' || (int)$currentUser['Disabled'] === 1) {
    respond(403, ['error' => 'Admin access required']);
}

if ($method === 'GET') {
    if (isset($_GET['contactsForUser'])) {
        $targetUserId = filter_var($_GET['contactsForUser'], FILTER_VALIDATE_INT, [
            'options' => ['min_range' => 1]
        ]);
        if ($targetUserId === false) {
            respond(400, ['error' => 'A valid user ID is required']);
        }

        $search = trim($_GET['q'] ?? '');
        $sql = 'SELECT ID AS id,
                       FirstName AS firstName,
                       LastName AS lastName,
                       `Email Address` AS email,
                       `Phone Number` AS phone
                FROM Contacts
                WHERE UserID = :uid';
        $params = [':uid' => $targetUserId];

        if ($search !== '') {
            $sql .= ' AND (FirstName LIKE :q1
                        OR LastName LIKE :q2
                        OR `Email Address` LIKE :q3
                        OR `Phone Number` LIKE :q4)';
            $like = '%' . $search . '%';
            $params[':q1'] = $like;
            $params[':q2'] = $like;
            $params[':q3'] = $like;
            $params[':q4'] = $like;
        }

        $sql .= ' ORDER BY LastName, FirstName';
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        respond(200, ['contacts' => $stmt->fetchAll(), 'error' => '']);
    }

    $search = trim($_GET['q'] ?? '');
    $sql = 'SELECT ID AS id,
                   FirstName AS firstName,
                   LastName AS lastName,
                   Login AS login,
                   Admin AS role,
                   Disabled AS disabled
            FROM Users';
    $params = [];

    if ($search !== '') {
        $sql .= ' WHERE FirstName LIKE :q1
               OR LastName LIKE :q2
               OR Login LIKE :q3';
        $like = '%' . $search . '%';
        $params[':q1'] = $like;
        $params[':q2'] = $like;
        $params[':q3'] = $like;
    }

    $sql .= ' ORDER BY LastName, FirstName';
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    respond(200, ['users' => $stmt->fetchAll(), 'error' => '']);
}

if ($method === 'POST') {
    $body = getRequestBody();
    if (($body['action'] ?? '') !== 'createAdmin') {
        respond(400, ['error' => 'Unsupported admin action']);
    }

    $firstName = clean($body['firstName'] ?? '');
    $lastName = clean($body['lastName'] ?? '');
    $login = clean($body['login'] ?? '');
    $password = $body['password'] ?? '';

    if (!$firstName || !$lastName || !$login || !is_string($password) || $password === '') {
        respond(400, ['error' => 'Names, login, and password are required']);
    }

    $stmt = $db->prepare('SELECT 1 FROM Users WHERE Login = :login LIMIT 1');
    $stmt->execute([':login' => $login]);
    if ($stmt->fetchColumn() !== false) {
        respond(409, ['error' => 'Login already exists']);
    }

    $stmt = $db->prepare(
        'INSERT INTO Users (FirstName, LastName, Login, Password, Admin, Disabled)
         VALUES (:firstName, :lastName, :login, :password, :role, 0)'
    );
    $stmt->execute([
        ':firstName' => $firstName,
        ':lastName' => $lastName,
        ':login' => $login,
        ':password' => password_hash($password, PASSWORD_DEFAULT),
        ':role' => 'Admin'
    ]);

    respond(201, ['message' => 'Admin account created', 'id' => (int)$db->lastInsertId()]);
}

if ($method === 'PUT') {
    $targetUserId = filter_var($_GET['id'] ?? null, FILTER_VALIDATE_INT, [
        'options' => ['min_range' => 1]
    ]);
    if ($targetUserId === false) {
        respond(400, ['error' => 'A valid user ID is required']);
    }

    $body = getRequestBody();
    $action = $body['action'] ?? '';
    $stmt = $db->prepare('SELECT ID FROM Users WHERE ID = :id LIMIT 1');
    $stmt->execute([':id' => $targetUserId]);
    if (!$stmt->fetch()) {
        respond(404, ['error' => 'User not found']);
    }

    if ($action === 'setDisabled') {
        $disabled = filter_var($body['disabled'] ?? null, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
        if ($disabled === null) {
            respond(400, ['error' => 'A valid disabled state is required']);
        }
        if ($disabled && (int)$targetUserId === (int)$adminId) {
            respond(400, ['error' => 'You cannot disable your own account']);
        }

        $stmt = $db->prepare('UPDATE Users SET Disabled = :disabled WHERE ID = :id');
        $stmt->execute([':disabled' => $disabled ? 1 : 0, ':id' => $targetUserId]);
        respond(200, ['message' => $disabled ? 'User disabled' : 'User enabled']);
    }

    if ($action === 'changePassword') {
        $password = $body['password'] ?? '';
        if (!is_string($password) || $password === '') {
            respond(400, ['error' => 'Password is required']);
        }

        $stmt = $db->prepare('UPDATE Users SET Password = :password WHERE ID = :id');
        $stmt->execute([
            ':password' => password_hash($password, PASSWORD_DEFAULT),
            ':id' => $targetUserId
        ]);
        respond(200, ['message' => 'Password updated']);
    }

    respond(400, ['error' => 'Unsupported admin action']);
}

respond(405, ['error' => 'Method not allowed']);