<?php
session_start();
$host = 'localhost';
$user = 'root';
$pass = ''; // Leave blank for XAMPP default
$dbname = 'dvms_db';

$conn = mysqli_connect($host, $user, $pass, $dbname);

if (!$conn) {
    die(json_encode(['status' => 'error', 'message' => 'Database connection failed']));
}

function clean_input($data)
{
    global $conn;
    return mysqli_real_escape_string($conn, htmlspecialchars(stripslashes(trim($data))));
}
