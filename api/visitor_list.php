<?php
require 'db.php';

$search = isset($_GET['search']) ? clean_input($_GET['search']) : '';
$status = isset($_GET['status']) ? clean_input($_GET['status']) : 'all';

$sql = "SELECT v.name, v.mobile, v.visitor_id, vi.id as visit_id, vi.purpose, vi.person_to_meet, vi.check_in, vi.check_out, vi.status 
        FROM visitors v JOIN visits vi ON v.visitor_id = vi.visitor_id WHERE 1=1";

if (!empty($search)) $sql .= " AND (v.name LIKE '%$search%' OR v.mobile LIKE '%$search%' OR v.visitor_id LIKE '%$search%')";
if ($status !== 'all') $sql .= " AND vi.status = '$status'";
$sql .= " ORDER BY vi.check_in DESC";

$result = mysqli_query($conn, $sql);
$data = [];
while ($row = mysqli_fetch_assoc($result)) $data[] = $row;

echo json_encode(['status' => 'success', 'data' => $data]);
