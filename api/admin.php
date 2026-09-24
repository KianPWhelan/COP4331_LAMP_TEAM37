<?php

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/helpers.php';

setCORSHeaders();

$db = getDB();
$userId = requireAuth();
$method = $_SERVER['REQUEST_METHOD'];


// Verify logged-in user is an admin
$stmt = $db->prepare(
    'SELECT Admin
     FROM Users
     WHERE ID = :id
     LIMIT 1'
);

$stmt->execute([
    ':id' => $userId
]);

$currentUser = $stmt->fetch();

if (!$currentUser || $currentUser['Admin'] !== 'Admin') {
    respond(403, [
        'error' => 'Admin access required'
    ]);
}


// GET - list all users
if ($method === 'GET') {

    $stmt = $db->prepare(
        'SELECT
            ID AS id,
            FirstName AS firstName,
            LastName AS lastName,
            Login AS login,
            Admin AS role
         FROM Users
         ORDER BY LastName, FirstName'
    );

    $stmt->execute();

    respond(200, [
        'users' => $stmt->fetchAll(),
        'error' => ''
    ]);
}


// DELETE - delete a user
if ($method === 'DELETE') {

    $deleteId = isset($_GET['id'])
        ? (int) $_GET['id']
        : 0;

    if (!$deleteId) {
        respond(400, [
            'error' => 'User ID is required'
        ]);
    }

    if ($deleteId === $userId) {
        respond(400, [
            'error' => 'You cannot delete your own account'
        ]);
    }


    // Check target user
    $stmt = $db->prepare(
        'SELECT Admin
         FROM Users
         WHERE ID = :id
         LIMIT 1'
    );

    $stmt->execute([
        ':id' => $deleteId
    ]);

    $targetUser = $stmt->fetch();

    if (!$targetUser) {
        respond(404, [
            'error' => 'User not found'
        ]);
    }

    if ($targetUser['Admin'] === 'Admin') {
        respond(400, [
            'error' => 'Admin accounts cannot be deleted here'
        ]);
    }


    try {
        $db->beginTransaction();

        // Delete user's contacts first
        $stmt = $db->prepare(
            'DELETE FROM Contacts
             WHERE UserID = :id'
        );

        $stmt->execute([
            ':id' => $deleteId
        ]);


        // Delete user
        $stmt = $db->prepare(
            'DELETE FROM Users
             WHERE ID = :id'
        );

        $stmt->execute([
            ':id' => $deleteId
        ]);

        $db->commit();

    } catch (Exception $e) {
        $db->rollBack();

        respond(500, [
            'error' => 'Failed to delete user'
        ]);
    }


    respond(200, [
        'message' => 'User deleted',
        'error' => ''
    ]);
}


respond(405, [
    'error' => 'Method not allowed'
]);