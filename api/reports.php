<?php
require 'db.php';

// Example: Fetching purpose distribution for the chart
$sql = "SELECT purpose, COUNT(*) as count FROM visits GROUP BY purpose";
$result = mysqli_query($conn, $sql);

$report_data = [];
while ($row = mysqli_fetch_assoc($result)) {
    $report_data[] = $row;
}

echo json_encode(['status' => 'success', 'chart_data' => $report_data]);
?>