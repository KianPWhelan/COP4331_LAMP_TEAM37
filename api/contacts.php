<?php

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/helpers.php';

setCORSHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    respond(405, ['error' => 'Method not allowed']);
}

$db = getDB();
$userId = requireAuth();

$id = isset($_GET['id']) ? (int) $_GET['id'] : null;
$search = isset($_GET['q']) ? trim($_GET['q']) : null;


// Get one contact by ID
if ($id) {

    $stmt = $db->prepare(
        'SELECT
            ID AS id,
            FirstName AS firstName,
            LastName AS lastName,
            `Email Address` AS email,
            `Phone Number` AS phone
         FROM Contacts
         WHERE ID = :id
         AND UserID = :uid
         LIMIT 1'
    );

    $stmt->execute([
        ':id' => $id,
        ':uid' => $userId
    ]);

    $contact = $stmt->fetch();

    if (!$contact) {
        respond(404, ['error' => 'Contact not found']);
    }

    respond(200, $contact);
}


// Search contacts
if ($search !== null && $search !== '') {

    $like = '%' . $search . '%';

    $stmt = $db->prepare(
        'SELECT
            ID AS id,
            FirstName AS firstName,
            LastName AS lastName,
            `Email Address` AS email,
            `Phone Number` AS phone
         FROM Contacts
         WHERE UserID = :uid
         AND (
            FirstName LIKE :q
            OR LastName LIKE :q
            OR `Email Address` LIKE :q
            OR `Phone Number` LIKE :q
         )
         ORDER BY LastName, FirstName'
    );

    $stmt->execute([
        ':uid' => $userId,
        ':q' => $like
    ]);

    respond(200, [
        'contacts' => $stmt->fetchAll(),
        'error' => ''
    ]);
}


// List all contacts for logged-in user
$stmt = $db->prepare(
    'SELECT
        ID AS id,
        FirstName AS firstName,
        LastName AS lastName,
        `Email Address` AS email,
        `Phone Number` AS phone
     FROM Contacts
     WHERE UserID = :uid
     ORDER BY LastName, FirstName'
);

$stmt->execute([
    ':uid' => $userId
]);

respond(200, [
    'contacts' => $stmt->fetchAll(),
    'error' => ''
]);