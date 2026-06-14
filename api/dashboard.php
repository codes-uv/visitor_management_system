<?php
/**
 * Dashboard Statistics API
 * 
 * Performance Optimization: Instead of performing 4 separate database queries, 
 * this script consolidates them into a single SQL statement with subqueries. 
 * This minimizes database roundtrips and optimizes database connection load.
 */
require 'db.php';

// Format current server date to match database DATE format (YYYY-MM-DD)
$today = date('Y-m-d');

// Consolidated SQL query: fetches 4 different stats count in 1 database roundtrip.
// Uses subqueries in the SELECT clause to fetch independent counters.
$sql = "
    SELECT 
        (SELECT COUNT(*) FROM visits WHERE DATE(check_in) = ?) as today,
        (SELECT COUNT(*) FROM visits WHERE status = 'active') as active,
        (SELECT COUNT(*) FROM visits WHERE status = 'completed' AND DATE(check_in) = ?) as completed,
        (SELECT COUNT(*) FROM blacklist) as blacklisted
";

$stmt = mysqli_prepare($conn, $sql);
if ($stmt) {
    // Safely bind parameters to prevent SQL injection vulnerabilities
    mysqli_stmt_bind_param($stmt, "ss", $today, $today);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
    $row = mysqli_fetch_assoc($result);

    $stats = [
        'today'       => (int)($row['today'] ?? 0),
        'active'      => (int)($row['active'] ?? 0),
        'completed'   => (int)($row['completed'] ?? 0),
        'blacklisted' => (int)($row['blacklisted'] ?? 0)
    ];

    echo json_encode(['status' => 'success', 'stats' => $stats]);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Failed to retrieve stats']);
}
