<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
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

if (empty($data['email']) || empty($data['fullName'])) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Missing required fields: email and fullName']);
    exit;
}

$mail = new PHPMailer(true);

try {
    $mail->isSMTP();
    $mail->Host       = 'smtp.gmail.com';
    $mail->SMTPAuth   = true;
    $mail->Username   = 'your-email@gmail.com';
    $mail->Password   = 'your-app-password';
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = 587;

    $mail->setFrom('your-email@gmail.com', 'Cubby Health');
    $mail->addAddress($data['email'], $data['fullName']);
    $mail->Subject = 'Your Cubby Health Account Has Been Approved!';

    $mail->isHTML(true);

    $emailBody = "
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset='UTF-8'>
        <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    </head>
    <body style='margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif; background-color: #f8fafc;'>
        <table role='presentation' style='width: 100%; border-collapse: collapse;'>
            <tr>
                <td style='padding: 40px 20px;'>
                    <table role='presentation' style='max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); overflow: hidden;'>
                        <tr>
                            <td style='background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px 40px; text-align: center;'>
                                <div style='font-size: 48px; margin-bottom: 8px;'>&#10003;</div>
                                <h1 style='margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;'>Account Approved!</h1>
                            </td>
                        </tr>
                        <tr>
                            <td style='padding: 40px;'>
                                <p style='margin: 0 0 20px; color: #334155; font-size: 16px; line-height: 1.6;'>
                                    Dear " . htmlspecialchars($data['fullName']) . ",
                                </p>
                                <p style='margin: 0 0 20px; color: #334155; font-size: 16px; line-height: 1.6;'>
                                    Great news! Your Cubby Health member account has been approved. You now have full access to our exclusive vendor portal and special member pricing.
                                </p>
                                <div style='background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 24px; margin: 24px 0; border-radius: 12px; text-align: center;'>
                                    <p style='margin: 0 0 16px; color: #166534; font-size: 15px; font-weight: 600;'>Ready to get started?</p>
                                    <a href='https://cubbyhealth.com/member-login' style='display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px;'>
                                        Access Member Portal
                                    </a>
                                </div>
                                <p style='margin: 0 0 16px; color: #334155; font-size: 16px; line-height: 1.6;'>
                                    <strong>What you can do now:</strong>
                                </p>
                                <ul style='margin: 0 0 24px; padding-left: 24px; color: #334155; font-size: 15px; line-height: 1.8;'>
                                    <li>Browse our curated list of preferred vendors</li>
                                    <li>Access exclusive member discounts and pricing</li>
                                    <li>Connect directly with trusted healthcare partners</li>
                                </ul>
                                <p style='margin: 24px 0 0; color: #334155; font-size: 16px; line-height: 1.6;'>
                                    Welcome to the Cubby Health family!<br>
                                    <strong>The Cubby Health Team</strong>
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <td style='background-color: #f8fafc; padding: 24px 40px; text-align: center; border-top: 1px solid #e2e8f0;'>
                                <p style='margin: 0; color: #64748b; font-size: 13px;'>
                                    Need help? Contact us at <a href='mailto:care@cubbyhealth.com' style='color: #0ea5e9; text-decoration: none;'>care@cubbyhealth.com</a>
                                </p>
                                <p style='margin: 12px 0 0; color: #94a3b8; font-size: 12px;'>
                                    &copy; " . date('Y') . " Cubby Health. All rights reserved.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    ";

    $mail->Body = $emailBody;
    $mail->AltBody = strip_tags(str_replace(['<br>', '<br/>', '<br />', '</p>', '</li>', '</td>'], "\n", $emailBody));

    $mail->send();
    echo json_encode(['ok' => true, 'message' => 'Approval email sent successfully']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Failed to send approval email: ' . $mail->ErrorInfo]);
}
