<?php
header('Content-Type: application/json');
require_once 'db.php';

$username = $_POST['username'] ?? '';
$password = $_POST['password'] ?? '';

// 1. Fetch user
$sql = "SELECT * FROM users WHERE username = ?";
$stmt = mysqli_prepare($conn, $sql);
mysqli_stmt_bind_param($stmt, "s", $username);
mysqli_stmt_execute($stmt);
$result = mysqli_stmt_get_result($stmt);
$user = mysqli_fetch_assoc($result);

if ($user) {
    // 2. User exists, check password
    // If you decide to hash passwords later, use password_verify() here
    if ($user['password'] === $password) {
        echo json_encode(['status' => 'success']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Incorrect password']);
    }
} else {
    // 3. User does not exist
    echo json_encode(['status' => 'error', 'message' => 'User does not exist']);
}
