<?php
/**
 * Unified Visitor CRUD Controller
 * 
 * Performance & Design Optimization:
 * This single controller handles all operations related to visitors and visits.
 * It integrates CREATE, READ, UPDATE, and DELETE (CRUD) capabilities:
 * - GET: Read listings (replaces visitor_list.php)
 * - POST action=create: Create check-in (replaces add_visitor.php)
 * - POST action=edit: Update details (replaces edit_visitor.php)
 * - POST action=checkout: Update visit status (replaces edit_visitor.php)
 * - POST action=delete: Remove visit (replaces edit_visitor.php)
 * 
 * @package DVMS
 */
require 'db.php';

header('Content-Type: application/json');

try {
    $method = $_SERVER['REQUEST_METHOD'];

    // =========================================================
    // 1. GET REQUEST: READ LISTING
    // =========================================================
    if ($method === 'GET') {
        $search = isset($_GET['search']) ? trim($_GET['search']) : '';
        $status = isset($_GET['status']) ? trim($_GET['status']) : 'all';

        // Base query joining visitors and visits
        $sql = "
            SELECT 
                v.name, v.mobile, v.visitor_id, 
                vi.id as visit_id, vi.purpose, vi.person_to_meet, 
                vi.expected_duration, vi.check_in, vi.check_out, vi.status 
            FROM visitors v 
            JOIN visits vi ON v.visitor_id = vi.visitor_id 
            WHERE 1=1
        ";

        $params = [];
        $types = "";

        if (!empty($search)) {
            $sql .= " AND (v.name LIKE ? OR v.mobile LIKE ? OR v.visitor_id LIKE ?)";
            $likeSearch = "%" . $search . "%";
            $params[] = $likeSearch;
            $params[] = $likeSearch;
            $params[] = $likeSearch;
            $types .= "sss";
        }

        if ($status !== 'all') {
            $sql .= " AND vi.status = ?";
            $params[] = $status;
            $types .= "s";
        }

        $sql .= " ORDER BY vi.check_in DESC";

        $stmt = mysqli_prepare($conn, $sql);
        if (!$stmt) {
            throw new Exception("Query preparation failed.");
        }

        if (!empty($params)) {
            mysqli_stmt_bind_param($stmt, $types, ...$params);
        }

        mysqli_stmt_execute($stmt);
        $result = mysqli_stmt_get_result($stmt);
        
        $data = [];
        while ($row = mysqli_fetch_assoc($result)) {
            $data[] = $row;
        }

        echo json_encode(['status' => 'success', 'data' => $data]);
        exit;
    }

    // =========================================================
    // 2. POST REQUEST: CREATE / UPDATE / DELETE
    // =========================================================
    if ($method === 'POST') {
        $action = isset($_POST['action']) ? trim($_POST['action']) : '';

        // ---------------------------------------------------------
        // 2.1 CREATE (Visitor Check-In)
        // ---------------------------------------------------------
        if ($action === 'create' || empty($action)) {
            $name     = clean_input($_POST['name'] ?? '');
            $mobile   = clean_input($_POST['mobile'] ?? '');
            $address  = clean_input($_POST['address'] ?? '');
            $purpose  = clean_input($_POST['purpose'] ?? '');
            $person   = clean_input($_POST['person'] ?? '');
            $duration = isset($_POST['duration']) ? (int)$_POST['duration'] : 60;

            if (empty($name) || empty($mobile) || empty($purpose) || empty($person)) {
                throw new Exception("Required fields are missing.");
            }

            // 1. Verify not blacklisted
            $stmt = mysqli_prepare($conn, "SELECT id FROM blacklist WHERE mobile = ?");
            if (!$stmt) throw new Exception("Database prepare error.");
            mysqli_stmt_bind_param($stmt, "s", $mobile);
            mysqli_stmt_execute($stmt);
            if (mysqli_num_rows(mysqli_stmt_get_result($stmt)) > 0) {
                throw new Exception("Visitor is blacklisted and cannot check in!");
            }

            // 1.2 Verify visitor does not already have an active check-in
            $active_stmt = mysqli_prepare($conn, "
                SELECT vi.id 
                FROM visits vi 
                JOIN visitors v ON vi.visitor_id = v.visitor_id 
                WHERE v.mobile = ? AND vi.status = 'active'
            ");
            if (!$active_stmt) throw new Exception("Database query build failed.");
            mysqli_stmt_bind_param($active_stmt, "s", $mobile);
            mysqli_stmt_execute($active_stmt);
            $active_res = mysqli_stmt_get_result($active_stmt);
            if (mysqli_num_rows($active_res) > 0) {
                throw new Exception("This visitor is already checked in and has an active visit! Please check out first.");
            }

            // 2. Get existing visitor_id or create a new Pass ID
            $stmt = mysqli_prepare($conn, "SELECT visitor_id FROM visitors WHERE mobile = ?");
            mysqli_stmt_bind_param($stmt, "s", $mobile);
            mysqli_stmt_execute($stmt);
            $result = mysqli_stmt_get_result($stmt);

            if ($row = mysqli_fetch_assoc($result)) {
                $visitor_id = $row['visitor_id'];
            } else {
                $prefix = "VIS" . date("Y");
                $res = mysqli_query($conn, "SELECT visitor_id FROM visitors WHERE visitor_id LIKE '$prefix%' ORDER BY id DESC LIMIT 1");
                $number = 1;
                if ($res && mysqli_num_rows($res) > 0) {
                    $last_id = mysqli_fetch_assoc($res)['visitor_id'];
                    $number = (int)substr($last_id, -3) + 1;
                }
                $visitor_id = $prefix . str_pad($number, 3, "0", STR_PAD_LEFT);

                $stmt = mysqli_prepare($conn, "INSERT INTO visitors (visitor_id, name, mobile, address) VALUES (?, ?, ?, ?)");
                mysqli_stmt_bind_param($stmt, "ssss", $visitor_id, $name, $mobile, $address);
                if (!mysqli_stmt_execute($stmt)) {
                    throw new Exception("Failed to create visitor profile.");
                }
            }

            // 3. Log visit record
            $stmt = mysqli_prepare($conn, "INSERT INTO visits (visitor_id, purpose, person_to_meet, expected_duration, status) VALUES (?, ?, ?, ?, 'active')");
            mysqli_stmt_bind_param($stmt, "sssi", $visitor_id, $purpose, $person, $duration);

            if (mysqli_stmt_execute($stmt)) {
                echo json_encode(['status' => 'success', 'visitor_id' => $visitor_id]);
            } else {
                throw new Exception("Failed to log visit record.");
            }
            exit;
        }

        // ---------------------------------------------------------
        // 2.2 UPDATE: EDIT DETAILS
        // ---------------------------------------------------------
        elseif ($action === 'edit') {
            $id       = isset($_POST['visit_id']) ? (int)$_POST['visit_id'] : 0;
            $name     = isset($_POST['name']) ? trim($_POST['name']) : '';
            $mobile   = isset($_POST['mobile']) ? trim($_POST['mobile']) : '';
            $purpose  = isset($_POST['purpose']) ? trim($_POST['purpose']) : '';
            $person   = isset($_POST['person']) ? trim($_POST['person']) : '';
            $duration = isset($_POST['duration']) ? (int)$_POST['duration'] : 60;
            $status   = isset($_POST['status']) ? trim($_POST['status']) : 'active';

            // 1. Verify new mobile isn't blacklisted
            $stmt_bl = mysqli_prepare($conn, "SELECT id FROM blacklist WHERE mobile = ?");
            mysqli_stmt_bind_param($stmt_bl, "s", $mobile);
            mysqli_stmt_execute($stmt_bl);
            if (mysqli_num_rows(mysqli_stmt_get_result($stmt_bl)) > 0) {
                throw new Exception("This phone number is blacklisted and cannot be saved.");
            }

            // 2. Retrieve visitor ID and checkout details
            $stmt_find = mysqli_prepare($conn, "SELECT visitor_id, status, check_out FROM visits WHERE id = ?");
            mysqli_stmt_bind_param($stmt_find, "i", $id);
            mysqli_stmt_execute($stmt_find);
            $row = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt_find));
            if (!$row) {
                throw new Exception("Visit record not found.");
            }
            $visitor_id = $row['visitor_id'];
            $current_status = $row['status'];
            $current_checkout = $row['check_out'];
 
            // 3. Update visitors profile table
            $stmt_visitor = mysqli_prepare($conn, "UPDATE visitors SET name=?, mobile=? WHERE visitor_id=?");
            mysqli_stmt_bind_param($stmt_visitor, "sss", $name, $mobile, $visitor_id);
            if (!mysqli_stmt_execute($stmt_visitor)) {
                throw new Exception("Failed to update visitor details.");
            }
 
            // 4. Update visits details table (setting checkout time conditionally)
            if ($status === 'completed' && empty($current_checkout)) {
                $stmt_visit = mysqli_prepare($conn, "UPDATE visits SET purpose=?, person_to_meet=?, expected_duration=?, status=?, check_out=CURRENT_TIMESTAMP WHERE id=?");
                mysqli_stmt_bind_param($stmt_visit, "ssisi", $purpose, $person, $duration, $status, $id);
            } else if ($status === 'active' && !empty($current_checkout)) {
                $stmt_visit = mysqli_prepare($conn, "UPDATE visits SET purpose=?, person_to_meet=?, expected_duration=?, status=?, check_out=NULL WHERE id=?");
                mysqli_stmt_bind_param($stmt_visit, "ssisi", $purpose, $person, $duration, $status, $id);
            } else {
                $stmt_visit = mysqli_prepare($conn, "UPDATE visits SET purpose=?, person_to_meet=?, expected_duration=?, status=? WHERE id=?");
                mysqli_stmt_bind_param($stmt_visit, "ssisi", $purpose, $person, $duration, $status, $id);
            }
            if (!mysqli_stmt_execute($stmt_visit)) {
                throw new Exception("Failed to update visit details.");
            }

            echo json_encode(['status' => 'success', 'message' => 'Visitor updated!']);
            exit;
        }

        // ---------------------------------------------------------
        // 2.3 UPDATE: CHECKOUT
        // ---------------------------------------------------------
        elseif ($action === 'checkout') {
            $id = isset($_POST['visit_id']) ? (int)$_POST['visit_id'] : 0;
            $stmt = mysqli_prepare($conn, "UPDATE visits SET status='completed', check_out=CURRENT_TIMESTAMP WHERE id = ?");
            mysqli_stmt_bind_param($stmt, "i", $id);
            if (mysqli_stmt_execute($stmt)) {
                echo json_encode(['status' => 'success']);
            } else {
                throw new Exception("Failed to check out visitor.");
            }
            exit;
        }

        // ---------------------------------------------------------
        // 2.4 DELETE VISIT RECORD
        // ---------------------------------------------------------
        elseif ($action === 'delete') {
            $id = isset($_POST['visit_id']) ? (int)$_POST['visit_id'] : 0;
            if ($id <= 0) throw new Exception("Invalid visit ID.");

            // 1. Get visitor pass ID before deleting the visit
            $stmt_find = mysqli_prepare($conn, "SELECT visitor_id FROM visits WHERE id = ?");
            mysqli_stmt_bind_param($stmt_find, "i", $id);
            mysqli_stmt_execute($stmt_find);
            $row = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt_find));
            if (!$row) throw new Exception("Visit record not found.");
            $visitor_id = $row['visitor_id'];

            // 2. Delete the visit
            $stmt = mysqli_prepare($conn, "DELETE FROM visits WHERE id = ?");
            mysqli_stmt_bind_param($stmt, "i", $id);
            if (!mysqli_stmt_execute($stmt)) throw new Exception("Failed to delete visit.");

            // 3. Cleanup visitor profile if no other visits exist
            $stmt_count = mysqli_prepare($conn, "SELECT COUNT(*) AS total FROM visits WHERE visitor_id = ?");
            mysqli_stmt_bind_param($stmt_count, "s", $visitor_id);
            mysqli_stmt_execute($stmt_count);
            $count_row = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt_count));

            if ((int)$count_row['total'] === 0) {
                $stmt_visitor = mysqli_prepare($conn, "DELETE FROM visitors WHERE visitor_id = ?");
                mysqli_stmt_bind_param($stmt_visitor, "s", $visitor_id);
                mysqli_stmt_execute($stmt_visitor);
            }

            echo json_encode(['status' => 'success']);
            exit;
        }
    }

    throw new Exception("Invalid action or method request.");

} catch (Throwable $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
