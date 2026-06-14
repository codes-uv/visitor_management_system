<?php
require 'db.php';

$today = date('Y-m-d');
$stats = [
    'today' => mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) as c FROM visits WHERE DATE(check_in) = '$today'"))['c'],
    'active' => mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) as c FROM visits WHERE status = 'active'"))['c'],
    'completed' => mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) as c FROM visits WHERE status = 'completed' AND DATE(check_in) = '$today'"))['c'],
    'blacklisted' => mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) as c FROM blacklist"))['c']
];

echo json_encode(['status' => 'success', 'stats' => $stats]);
