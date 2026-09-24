<?php

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/helpers.php';

setCORSHeaders();

$db = getDB();
$userId = requireAuth();
$method = $_SERVER['REQUEST_METHOD'];


// GET - list/search contacts
if ($method === 'GET') {

    $search = isset($_GET['q']) ? trim($_GET['q']) : '';

    if ($search !== '') {

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
}


// POST - add contact
if ($method === 'POST') {

    $body = getRequestBody();

    $firstName = clean($body['firstName'] ?? '');
    $lastName  = clean($body['lastName'] ?? '');
    $email     = clean($body['email'] ?? '');
    $phone     = clean($body['phone'] ?? '');

    if (!$firstName || !$lastName || !$email || !$phone) {
        respond(400, [
            'error' => 'All fields are required'
        ]);
    }

    $stmt = $db->prepare(
        'INSERT INTO Contacts
            (FirstName, LastName, `Email Address`, `Phone Number`, UserID)
         VALUES
            (:firstName, :lastName, :email, :phone, :uid)'
    );

    $stmt->execute([
        ':firstName' => $firstName,
        ':lastName' => $lastName,
        ':email' => $email,
        ':phone' => $phone,
        ':uid' => $userId
    ]);

    respond(201, [
        'message' => 'Contact created',
        'id' => (int) $db->lastInsertId(),
        'error' => ''
    ]);
}


// Anything else
respond(405, [
    'error' => 'Method not allowed'
]);