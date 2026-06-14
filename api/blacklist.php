<?php
require 'db.php';

// HANDLE ACTIONS
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    // 1. DELETE ACTION
    if (isset($_POST['action']) && $_POST['action'] === 'delete') {
        $id = (int)$_POST['id'];
        $stmt = mysqli_prepare($conn, "DELETE FROM blacklist WHERE id = ?");
        mysqli_stmt_bind_param($stmt, "i", $id);
        if (mysqli_stmt_execute($stmt)) echo json_encode(['status' => 'success']);
        else echo json_encode(['status' => 'error', 'message' => 'Delete failed']);
        exit;
    }

    // 2. ADD ACTION
    $name = clean_input($_POST['name']);
    $mobile = clean_input($_POST['mobile']);
    $reason = clean_input($_POST['reason']);

    // Check if mobile already exists in blacklist
    $check_stmt = mysqli_prepare($conn, "SELECT id FROM blacklist WHERE mobile = ?");
    mysqli_stmt_bind_param($check_stmt, "s", $mobile);
    mysqli_stmt_execute($check_stmt);
    if (mysqli_stmt_get_result($check_stmt)->num_rows > 0) {
        echo json_encode(['status' => 'error', 'message' => 'This mobile number is already blacklisted!']);
        exit;
    }

    $stmt = mysqli_prepare($conn, "INSERT INTO blacklist (name, mobile, reason) VALUES (?, ?, ?)");
    mysqli_stmt_bind_param($stmt, "sss", $name, $mobile, $reason);
    if (mysqli_stmt_execute($stmt)) echo json_encode(['status' => 'success']);
    else echo json_encode(['status' => 'error', 'message' => 'Failed to add to blacklist']);
    exit;
}

// FETCH (Existing code)
$res = mysqli_query($conn, "SELECT * FROM blacklist ORDER BY added_on DESC");
$data = [];
while ($row = mysqli_fetch_assoc($res)) $data[] = $row;
echo json_encode(['status' => 'success', 'data' => $data]);
