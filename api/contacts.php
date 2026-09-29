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
                FirstName LIKE :q1
                OR LastName LIKE :q2
                OR `Email Address` LIKE :q3
                OR `Phone Number` LIKE :q4
             )
             ORDER BY LastName, FirstName'
        );

        $stmt->execute([
            ':uid' => $userId,
            ':q1' => $like,
            ':q2' => $like,
            ':q3' => $like,
            ':q4' => $like
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


// PUT / DELETE - check that the contact belongs to this user
if ($method === 'PUT' || $method === 'DELETE') {
    $contactId = filter_var($_GET['id'] ?? null, FILTER_VALIDATE_INT, [
        'options' => ['min_range' => 1]
    ]);

    if ($contactId === false) {
        respond(400, ['error' => 'A valid contact ID is required']);
    }

    $stmt = $db->prepare('SELECT ID FROM Contacts WHERE ID = :id AND UserID = :uid');
    $stmt->execute([':id' => $contactId, ':uid' => $userId]);

    if (!$stmt->fetch()) {
        respond(404, ['error' => 'Contact not found']);
    }
}


// PUT - update all contact fields
if ($method === 'PUT') {
    $body = getRequestBody();
    $firstName = clean($body['firstName'] ?? '');
    $lastName  = clean($body['lastName'] ?? '');
    $email     = clean($body['email'] ?? '');
    $phone     = clean($body['phone'] ?? '');

    if (!is_string($firstName) || !is_string($lastName) ||
        !is_string($email) || !is_string($phone)) {
        respond(400, ['error' => 'Contact fields must be strings']);
    }

    if ($firstName === '' || $lastName === '' || $email === '' || $phone === '') {
        respond(400, ['error' => 'All fields are required']);
    }

    $stmt = $db->prepare(
        'UPDATE Contacts
         SET FirstName = :firstName,
             LastName = :lastName,
             `Email Address` = :email,
             `Phone Number` = :phone
         WHERE ID = :id AND UserID = :uid'
    );

    $stmt->execute([
        ':firstName' => $firstName,
        ':lastName' => $lastName,
        ':email' => $email,
        ':phone' => $phone,
        ':id' => $contactId,
        ':uid' => $userId
    ]);

    respond(200, ['message' => 'Contact updated', 'error' => '']);
}


// DELETE - remove only a contact belonging to the current user
if ($method === 'DELETE') {
    $stmt = $db->prepare(
        'DELETE FROM Contacts WHERE ID = :id AND UserID = :uid'
    );
    $stmt->execute([':id' => $contactId, ':uid' => $userId]);

    respond(200, ['message' => 'Contact deleted', 'error' => '']);
}


// Anything else
respond(405, [
    'error' => 'Method not allowed'
]);
