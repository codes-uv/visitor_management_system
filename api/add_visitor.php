<?php
require 'db.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $name = clean_input($_POST['name']);
    $mobile = clean_input($_POST['mobile']);
    $address = clean_input($_POST['address']);
    $purpose = clean_input($_POST['purpose']);
    $person = clean_input($_POST['person']);
    $duration = (int)$_POST['duration'];

    // 1. Check Blacklist
    $stmt = mysqli_prepare($conn, "SELECT id FROM blacklist WHERE mobile = ?");
    mysqli_stmt_bind_param($stmt, "s", $mobile);
    mysqli_stmt_execute($stmt);
    if (mysqli_stmt_get_result($stmt)->num_rows > 0) die(json_encode(['status' => 'error', 'message' => 'Visitor is blacklisted!']));

    // 2. Check existing visitor or create new ID
    $stmt = mysqli_prepare($conn, "SELECT visitor_id FROM visitors WHERE mobile = ?");
    mysqli_stmt_bind_param($stmt, "s", $mobile);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);

    if ($row = mysqli_fetch_assoc($result)) {
        $visitor_id = $row['visitor_id'];
    } else {
        $prefix = "VIS" . date("Y");
        $res = mysqli_query($conn, "SELECT visitor_id FROM visitors WHERE visitor_id LIKE '$prefix%' ORDER BY id DESC LIMIT 1");
        $number = ($res->num_rows > 0) ? (int)substr(mysqli_fetch_assoc($res)['visitor_id'], -3) + 1 : 1;
        $visitor_id = $prefix . str_pad($number, 3, "0", STR_PAD_LEFT);

        $stmt = mysqli_prepare($conn, "INSERT INTO visitors (visitor_id, name, mobile, address) VALUES (?, ?, ?, ?)");
        mysqli_stmt_bind_param($stmt, "ssss", $visitor_id, $name, $mobile, $address);
        mysqli_stmt_execute($stmt);
    }

    // 3. Log Visit
    $stmt = mysqli_prepare($conn, "INSERT INTO visits (visitor_id, purpose, person_to_meet, expected_duration, status) VALUES (?, ?, ?, ?, 'active')");
    mysqli_stmt_bind_param($stmt, "sssi", $visitor_id, $purpose, $person, $duration);

    if (mysqli_stmt_execute($stmt)) {
        echo json_encode(['status' => 'success', 'visitor_id' => $visitor_id]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to log visit']);
    }
}
