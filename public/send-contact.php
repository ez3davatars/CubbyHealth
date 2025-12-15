<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'vendor/autoload.php';

$input = file_get_contents('php://input');
$data = json_decode($input, true);

// Honeypot check
if (!empty($data['_gotcha'])) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Spam detected']);
    exit;
}

// Verify anti-spam answer
$correctAnswer = $data['a'] + $data['b'];
if ($data['answer'] != $correctAnswer) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Incorrect anti-spam answer']);
    exit;
}

// Validate required fields
if (empty($data['name']) || empty($data['email']) || empty($data['message'])) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Missing required fields']);
    exit;
}

$mail = new PHPMailer(true);

try {
    // Server settings
    $mail->isSMTP();
    $mail->Host       = 'smtp.gmail.com'; // Change this to your SMTP server
    $mail->SMTPAuth   = true;
    $mail->Username   = 'your-email@gmail.com'; // Change this to your email
    $mail->Password   = 'your-app-password'; // Change this to your app password
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = 587;

    // Recipients
    $mail->setFrom('your-email@gmail.com', 'Cubby Health Contact Form');
    $mail->addAddress('care@cubbyhealth.com', 'Cubby Health');
    $mail->addReplyTo($data['email'], $data['name']);

    // Content
    $mail->isHTML(true);
    $mail->Subject = 'New Contact Form - ' . $data['name'];

    $emailBody = "
    <h2>New Contact Form Submission</h2>
    <p><strong>Name:</strong> " . htmlspecialchars($data['name']) . "</p>
    <p><strong>Email:</strong> " . htmlspecialchars($data['email']) . "</p>
    <p><strong>Phone:</strong> " . htmlspecialchars($data['phone'] ?? 'Not provided') . "</p>
    <p><strong>Practice:</strong> " . htmlspecialchars($data['practice'] ?? 'Not provided') . "</p>
    <p><strong>Message:</strong></p>
    <p>" . nl2br(htmlspecialchars($data['message'])) . "</p>
    ";

    $mail->Body = $emailBody;
    $mail->AltBody = strip_tags(str_replace(['<br>', '<br/>', '<br />'], "\n", $emailBody));

    $mail->send();
    echo json_encode(['ok' => true, 'message' => 'Email sent successfully']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Failed to send email: ' . $mail->ErrorInfo]);
}
