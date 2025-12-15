<?php
/**
 * Cubby Health contact form handler — spam-resistant + on-brand emails with clickable logo
 */
declare(strict_types=1);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require __DIR__ . '/PHPMailer/src/PHPMailer.php';
require __DIR__ . '/PHPMailer/src/SMTP.php';
require __DIR__ . '/PHPMailer/src/Exception.php';

function h(string $s): string {
    return htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(200);
    echo json_encode(['ok' => false, 'error' => 'POST only']);
    exit;
}

/* 1) Read input (JSON first, then normal POST) */
$raw  = file_get_contents('php://input') ?: '';
$data = json_decode($raw, true);

if (is_array($data)) {
    $name     = trim($data['name'] ?? '');
    $email    = trim($data['email'] ?? '');
    $phone    = trim($data['phone'] ?? '');
    $iam      = trim($data['visitorType'] ?? '');
    $practice = trim($data['practice_name'] ?? $data['practiceName'] ?? $data['practice'] ?? $data['company'] ?? '');
    $spamA    = isset($data['a']) ? (int)$data['a'] : null;
    $spamB    = isset($data['b']) ? (int)$data['b'] : null;
    $spamAns  = isset($data['answer']) ? (int)$data['answer'] : null;
    $gotcha   = trim($data['_gotcha'] ?? '');
    $message  = trim($data['message'] ?? '');
    $hasSpamField = isset($data['a']) && isset($data['b']) && isset($data['answer']);
} else {
    $name     = trim($_POST['name'] ?? '');
    $email    = trim($_POST['email'] ?? '');
    $phone    = trim($_POST['phone'] ?? '');
    $iam      = trim($_POST['visitorType'] ?? '');
    $practice = trim($_POST['practice_name'] ?? $_POST['practiceName'] ?? $_POST['practice'] ?? $_POST['company'] ?? '');
    $spamA    = isset($_POST['a']) ? (int)$_POST['a'] : null;
    $spamB    = isset($_POST['b']) ? (int)$_POST['b'] : null;
    $spamAns  = isset($_POST['answer']) ? (int)$_POST['answer'] : null;
    $gotcha   = trim($_POST['_gotcha'] ?? '');
    $message  = trim($_POST['message'] ?? '');
    $hasSpamField = isset($_POST['a']) && isset($_POST['b']) && isset($_POST['answer']);
}

/* 2) Silent spam protection */
if ($gotcha !== '') {
    echo json_encode(['ok' => true, 'ticketId' => 'CH-HONEY']);
    exit;
}
if ($hasSpamField && ($spamA + $spamB) !== $spamAns) {
    echo json_encode(['ok' => true, 'ticketId' => 'CH-SPAM']);
    exit;
}

/* 3) Meta + brand theme */
date_default_timezone_set('America/New_York');
$when = date('F j, Y • g:i A T');

$ip   = $_SERVER['REMOTE_ADDR'] ?? '';
$ref  = $_SERVER['HTTP_REFERER'] ?? '';
$ticketId = 'CH-' . date('ymd') . '-' . strtoupper(bin2hex(random_bytes(2)));

$brand = [
  'bg'       => '#F3F8FF',
  'card'     => '#FFFFFF',
  'border'   => '#E6EEF8',
  'text'     => '#0F2747',
  'muted'    => '#5E728C',
  'primary'  => '#2A7FD1',
  'primary2' => '#61B5FF',
  'accent'   => '#F6B800',
];

/* 4) Build emails (logo + text side-by-side, centered) */
$siteUrl = 'https://cubbyhealth.com';
$logoUrl = 'https://cubbyhealth.com/CubbyHealthWhite.png';

$cardTableStyle = 'max-width:680px;margin:0 auto;background:'.$brand['card'].';border-radius:16px;overflow:hidden;border:1px solid '.$brand['border'].';box-shadow:0 6px 24px rgba(20,60,120,0.08)';

$headerBar = '
  background:linear-gradient(90deg, '.$brand['primary'].' 0%, '.$brand['primary2'].' 100%);
  padding:16px 24px;
  color:#fff;
  font-weight:700;
  letter-spacing:.5px;
  font-size:18px;
  text-align:center;
';

function cubby_header(string $title, string $siteUrl, string $logoUrl, string $headerBar): string {
  return '
    <div style="'.$headerBar.'">
      <a href="'.h($siteUrl).'" style="display:inline-flex;align-items:center;gap:10px;color:#fff;text-decoration:none;">
        <img src="'.h($logoUrl).'" alt="Cubby Health" style="height:40px;width:auto;border:none;outline:none;">
        <span style="font-size:20px;font-weight:600;">'.h($title).'</span>
      </a>
    </div>
  ';
}

$adminSubject   = 'Cubby Health — New Inquiry #' . $ticketId;
$confirmSubject = 'Cubby Health — Confirmation #' . $ticketId;

$adminHtml = '
  <div style="margin:0;padding:24px;background:'.$brand['bg'].';font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;color:'.$brand['text'].'">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="'.$cardTableStyle.'">
      <tr><td style="padding:0">'.cubby_header('New Inquiry', $siteUrl, $logoUrl, $headerBar).'</td></tr>
      <tr><td style="padding:24px">
        <div style="text-align:right; padding-top:8px; color:'.$brand['muted'].'; font-size:12px">
          Ticket ID: <strong style="color:'.$brand['text'].'">'.h($ticketId).'</strong>
        </div>
        <h2 style="margin:8px 0 12px 0;font-size:20px;color:'.$brand['text'].'">Contact Details</h2>
        <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px 0;width:220px;color:'.$brand['muted'].'"><strong style="color:'.$brand['text'].'">Full Name:</strong></td><td style="padding:8px 0">'.h($name).'</td></tr>
          <tr><td style="padding:8px 0;color:'.$brand['muted'].'"><strong style="color:'.$brand['text'].'">Email Address:</strong></td><td style="padding:8px 0"><a href="mailto:'.h($email).'" style="color:'.$brand['primary'].';text-decoration:underline">'.h($email).'</a></td></tr>'.
          ($phone !== '' ? '<tr><td style="padding:8px 0;color:'.$brand['muted'].'"><strong style="color:'.$brand['text'].'">Phone Number:</strong></td><td style="padding:8px 0">'.h($phone).'</td></tr>' : '').'
          <tr><td style="padding:8px 0;color:'.$brand['muted'].'"><strong style="color:'.$brand['text'].'">I am a:</strong></td><td style="padding:8px 0">'.h($iam).'</td></tr>
          <tr><td style="padding:8px 0;color:'.$brand['muted'].'"><strong style="color:'.$brand['text'].'">Practice/Company Name:</strong></td><td style="padding:8px 0">'.h($practice).'</td></tr>
          <tr>
            <td style="padding:8px 0;color:'.$brand['muted'].';vertical-align:top"><strong style="color:'.$brand['text'].'">Message:</strong></td>
            <td style="padding:8px 0">'.nl2br(h($message)).'</td>
          </tr>
        </table>
        <div style="height:1px;background:linear-gradient(90deg,transparent,'.$brand['border'].',transparent);margin:18px 0"></div>
        <p style="margin:0;color:'.$brand['muted'].';font-size:12px">
          <strong style="color:'.$brand['text'].'">Submitted:</strong> '.h($when).' •
          <strong style="color:'.$brand['text'].'">IP:</strong> '.h($ip).($ref ? ' • <strong style="color:'.$brand['text'].'">From:</strong> '.h($ref) : '').'
        </p>
      </td></tr>
      <tr><td style="padding:14px 24px;background:#F7FAFF;border-top:1px solid '.$brand['border'].';color:'.$brand['muted'].';font-size:12px">
        © '.date('Y').' Cubby Health • Form submission
      </td></tr>
    </table>
  </div>
';

$confirmHtml = '
  <div style="margin:0;padding:24px;background:'.$brand['bg'].';font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;color:'.$brand['text'].'">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="'.$cardTableStyle.'">
      <tr><td style="padding:0">'.cubby_header('Confirmation', $siteUrl, $logoUrl, $headerBar).'</td></tr>
      <tr><td style="padding:24px">
        <div style="text-align:right; padding-top:8px; color:'.$brand['muted'].'; font-size:12px">
          Ticket ID: <strong style="color:'.$brand['text'].'">'.h($ticketId).'</strong>
        </div>
        <h2 style="margin:8px 0 12px 0;font-size:20px;color:'.$brand['text'].'">Thanks, '.h($name).'</h2>
        <p style="margin:0 0 16px 0; color:'.$brand['muted'].'">We\'ll review it and reply within <strong style="color:'.$brand['text'].'">24–48 hours</strong>.</p>
        <h3 style="margin:16px 0 8px 0;color:'.$brand['text'].';font-size:16px">Summary</h3>
        <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px 0;width:220px;color:'.$brand['muted'].'"><strong style="color:'.$brand['text'].'">Full Name:</strong></td><td style="padding:8px 0;color:'.$brand['text'].'">'.h($name).'</td></tr>
          <tr><td style="padding:8px 0;color:'.$brand['muted'].'"><strong style="color:'.$brand['text'].'">Email Address:</strong></td><td style="padding:8px 0;color:'.$brand['text'].'"><a href="mailto:'.h($email).'" style="color:'.$brand['primary'].';text-decoration:underline">'.h($email).'</a></td></tr>'.
          ($phone !== '' ? '<tr><td style="padding:8px 0;color:'.$brand['muted'].'"><strong style="color:'.$brand['text'].'">Phone Number:</strong></td><td style="padding:8px 0;color:'.$brand['text'].'">'.h($phone).'</td></tr>' : '').'
          <tr><td style="padding:8px 0;color:'.$brand['muted'].'"><strong style="color:'.$brand['text'].'">I am a:</strong></td><td style="padding:8px 0;color:'.$brand['text'].'">'.h($iam).'</td></tr>
          <tr><td style="padding:8px 0;color:'.$brand['muted'].'"><strong style="color:'.$brand['text'].'">Practice/Company Name:</strong></td><td style="padding:8px 0;color:'.$brand['text'].'">'.h($practice).'</td></tr>
          <tr>
            <td style="padding:8px 0;color:'.$brand['muted'].';vertical-align:top"><strong style="color:'.$brand['text'].'">Message:</strong></td>
            <td style="padding:8px 0;color:'.$brand['text'].'">'.nl2br(h($message)).'</td>
          </tr>
        </table>
      </td></tr>
      <tr><td style="padding:14px 24px;background:#F7FAFF;border-top:1px solid '.$brand['border'].';color:'.$brand['muted'].';font-size:12px">
        © '.date('Y').' Cubby Health
      </td></tr>
    </table>
  </div>
';

/* 5) Send */
try {
    // admin mail
    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host       = 'mail.supremecluster.com';
    $mail->Port       = 465;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    $mail->SMTPAuth   = true;
    $mail->Username   = 'customercare@cubbyhealth.com';
    $mail->Password   = '';
    $mail->CharSet    = 'UTF-8';

    $mail->setFrom('customercare@cubbyhealth.com', 'Cubby Health');
    $mail->addAddress('customercare@cubbyhealth.com');
    if ($email !== '') $mail->addReplyTo($email, $name ?: $email);
    $mail->isHTML(true);
    $mail->Subject = $adminSubject;
    $mail->Body    = $adminHtml;
    $mail->send();

    // confirmation to user
    if ($email !== '') {
        $auto = new PHPMailer(true);
        $auto->isSMTP();
        $auto->Host       = 'mail.supremecluster.com';
        $auto->Port       = 465;
        $auto->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
        $auto->SMTPAuth   = true;
        $auto->Username   = 'customercare@cubbyhealth.com';
        $auto->Password   = '';
        $auto->CharSet    = 'UTF-8';

        $auto->setFrom('customercare@cubbyhealth.com', 'Cubby Health');
        $auto->addAddress($email, $name ?: $email);
        $auto->isHTML(true);
        $auto->Subject = $confirmSubject;
        $auto->Body    = $confirmHtml;
        try { $auto->send(); } catch (\Throwable $e) {}
    }

    echo json_encode(['ok' => true, 'ticketId' => $ticketId]);
} catch (\Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}