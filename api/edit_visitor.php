<?php
// 1. Clear all previous buffers to ensure pure JSON output
if (ob_get_length()) ob_clean();

header('Content-Type: application/json');

try {
    // 2. Validate db.php exists first
    if (!file_exists('db.php')) {
        throw new Exception("Database file (db.php) missing.");
    }

    // 3. Include database
    require_once 'db.php';

    $action = isset($_POST['action']) ? trim($_POST['action']) : '';
    $id = isset($_POST['visit_id']) ? (int)$_POST['visit_id'] : (isset($_POST['id']) ? (int)$_POST['id'] : 0);

    // ---------------------------------------------------------
    // ACTION: EDIT (Updates BOTH tables)
    // ---------------------------------------------------------
    if ($action === 'edit') {
        $name     = isset($_POST['name']) ? trim($_POST['name']) : '';
        $mobile   = isset($_POST['mobile']) ? trim($_POST['mobile']) : '';
        $purpose  = isset($_POST['purpose']) ? trim($_POST['purpose']) : '';
        $person   = isset($_POST['person']) ? trim($_POST['person']) : '';
        $duration = isset($_POST['duration']) ? (int)$_POST['duration'] : 60;
        $status   = isset($_POST['status']) ? trim($_POST['status']) : 'active';

        // STEP 1: Get the visitor_id from the visits table
        $sql_find = "SELECT visitor_id FROM visits WHERE id = ?";
        $stmt_find = mysqli_prepare($conn, $sql_find);
        mysqli_stmt_bind_param($stmt_find, "i", $id);
        mysqli_stmt_execute($stmt_find);
        $result = mysqli_stmt_get_result($stmt_find);
        $row = mysqli_fetch_assoc($result);

        if (!$row) {
            throw new Exception("Could not find a visit with ID: " . $id);
        }
        $visitor_id = $row['visitor_id'];

        // STEP 2: Update the 'visitors' table (Name and Mobile)
        $sql_visitor = "UPDATE visitors SET name=?, mobile=? WHERE id=?";
        $stmt_visitor = mysqli_prepare($conn, $sql_visitor);
        if (!$stmt_visitor) throw new Exception("Visitor prepare failed: " . mysqli_error($conn));

        mysqli_stmt_bind_param($stmt_visitor, "ssi", $name, $mobile, $visitor_id);
        if (!mysqli_stmt_execute($stmt_visitor)) throw new Exception("Failed to update visitor details.");

        // STEP 3: Update the 'visits' table (Trip details)
        $sql_visit = "UPDATE visits SET purpose=?, person_to_meet=?, expected_duration=?, status=? WHERE id=?";
        $stmt_visit = mysqli_prepare($conn, $sql_visit);
        if (!$stmt_visit) throw new Exception("Visit prepare failed: " . mysqli_error($conn));

        mysqli_stmt_bind_param($stmt_visit, "ssisi", $purpose, $person, $duration, $status, $id);
        if (!mysqli_stmt_execute($stmt_visit)) throw new Exception("Failed to update visit details.");

        // If both succeed, send success!
        echo json_encode(['status' => 'success', 'message' => 'Visitor updated!']);
    }
    // ---------------------------------------------------------
    // ACTION: DELETE
    // ---------------------------------------------------------
    elseif ($action === 'delete') {
        $sql = "DELETE FROM visits WHERE id = ?";
        $stmt = mysqli_prepare($conn, $sql);

        if (!$stmt) throw new Exception("Prepare failed: " . mysqli_error($conn));
        mysqli_stmt_bind_param($stmt, "i", $id);

        if (mysqli_stmt_execute($stmt)) {
            echo json_encode(['status' => 'success']);
        } else {
            throw new Exception("Execute failed: " . mysqli_stmt_error($stmt));
        }
    }
    // ---------------------------------------------------------
    // ACTION: CHECKOUT
    // ---------------------------------------------------------
    elseif ($action === 'checkout') {
        $sql = "UPDATE visits SET status='completed', check_out=CURRENT_TIMESTAMP WHERE id = ?";
        $stmt = mysqli_prepare($conn, $sql);

        if (!$stmt) throw new Exception("Prepare failed: " . mysqli_error($conn));
        mysqli_stmt_bind_param($stmt, "i", $id);

        if (mysqli_stmt_execute($stmt)) {
            echo json_encode(['status' => 'success']);
        } else {
            throw new Exception("Execute failed: " . mysqli_stmt_error($stmt));
        }
    } else {
        throw new Exception("Invalid or missing action: '" . $action . "'");
    }
} catch (Throwable $e) {
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
    exit;
}
