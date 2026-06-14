<?php
// Start output buffering to prevent any accidental HTML output
ob_start();
error_reporting(E_ALL);
ini_set('display_errors', 0);

header('Content-Type: application/json');

try {
    require 'db.php';

    $response = ['status' => 'success'];

    // 1. Fetch Purpose Distribution (from visits table)
    $sql = "SELECT purpose, COUNT(*) as count FROM visits GROUP BY purpose";
    $result = mysqli_query($conn, $sql);
    $chart_data = [];
    if ($result) {
        while ($row = mysqli_fetch_assoc($result)) {
            $chart_data[] = $row;
        }
    }
    $response['chart_data'] = $chart_data;

    // 2. Fetch Total Visitors (Total Visits)
    $res = mysqli_query($conn, "SELECT COUNT(*) as total FROM visits");
    $response['total_visitors'] = $res ? (int)mysqli_fetch_assoc($res)['total'] : 0;

    // 3. Fetch Active Visits (Using status 'active' based on schema)
    $res = mysqli_query($conn, "SELECT COUNT(*) as active FROM visits WHERE status='active'");
    $response['active_visits'] = $res ? (int)mysqli_fetch_assoc($res)['active'] : 0;

    // 4. Fetch Average Duration
    $res = mysqli_query($conn, "SELECT AVG(expected_duration) as avg_dur FROM visits");
    $response['avg_duration'] = $res ? round((float)mysqli_fetch_assoc($res)['avg_dur']) : 0;

    // 5. Fetch Blacklisted Count
    $res = mysqli_query($conn, "SELECT COUNT(*) as bl FROM blacklist");
    $response['blacklisted'] = $res ? (int)mysqli_fetch_assoc($res)['bl'] : 0;

    // 6. Fetch Daily Trend (Last 7 Days)
    // FIX: Using 'check_in' instead of 'created_at' as per dvms_db.sql
    $sql_trend = "SELECT DATE(check_in) as visit_date, COUNT(*) as count 
                  FROM visits 
                  WHERE check_in >= DATE(NOW()) - INTERVAL 7 DAY 
                  GROUP BY DATE(check_in) 
                  ORDER BY visit_date ASC";

    $res_trend = mysqli_query($conn, $sql_trend);

    $trend_labels = [];
    $trend_values = [];

    if ($res_trend && mysqli_num_rows($res_trend) > 0) {
        while ($row = mysqli_fetch_assoc($res_trend)) {
            $trend_labels[] = date('D', strtotime($row['visit_date']));
            $trend_values[] = (int)$row['count'];
        }
    } else {
        // Default fallback if no data found
        $trend_labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        $trend_values = [0, 0, 0, 0, 0, 0, 0];
    }

    $response['trend_labels'] = $trend_labels;
    $response['trend_values'] = $trend_values;

    echo json_encode($response);
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
ob_end_flush();
