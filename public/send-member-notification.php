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

if (empty($data['type'])) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Missing notification type']);
    exit;
}

$type = $data['type'];
$validTypes = ['registration_user', 'registration_admin', 'approval'];

if (!in_array($type, $validTypes)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid notification type']);
    exit;
}

if (empty($data['email']) || empty($data['fullName'])) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Missing required fields']);
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

    $mail->isHTML(true);

    switch ($type) {
        case 'registration_user':
            $mail->setFrom('your-email@gmail.com', 'Cubby Health');
            $mail->addAddress($data['email'], $data['fullName']);
            $mail->Subject = 'Welcome to Cubby Health - Registration Received';

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
                                    <td style='background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); padding: 32px 40px; text-align: center;'>
                                        <h1 style='margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;'>Welcome to Cubby Health</h1>
                                    </td>
                                </tr>
                                <tr>
                                    <td style='padding: 40px;'>
                                        <p style='margin: 0 0 20px; color: #334155; font-size: 16px; line-height: 1.6;'>
                                            Dear " . htmlspecialchars($data['fullName']) . ",
                                        </p>
                                        <p style='margin: 0 0 20px; color: #334155; font-size: 16px; line-height: 1.6;'>
                                            Thank you for registering for the Cubby Health Member Portal! We're excited to have you join our community of healthcare practices.
                                        </p>
                                        <div style='background-color: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 20px; margin: 24px 0; border-radius: 0 8px 8px 0;'>
                                            <p style='margin: 0; color: #0369a1; font-size: 15px; font-weight: 600;'>What happens next?</p>
                                            <p style='margin: 10px 0 0; color: #334155; font-size: 14px; line-height: 1.6;'>
                                                Our team will review your registration and verify your information. Once approved, you'll receive another email with instructions to access our exclusive vendor portal and special member pricing.
                                            </p>
                                        </div>
                                        <p style='margin: 0 0 20px; color: #334155; font-size: 16px; line-height: 1.6;'>
                                            The approval process typically takes 1-2 business days. If you have any questions in the meantime, please don't hesitate to reach out to us.
                                        </p>
                                        <p style='margin: 24px 0 0; color: #334155; font-size: 16px; line-height: 1.6;'>
                                            Best regards,<br>
                                            <strong>The Cubby Health Team</strong>
                                        </p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style='background-color: #f8fafc; padding: 24px 40px; text-align: center; border-top: 1px solid #e2e8f0;'>
                                        <p style='margin: 0; color: #64748b; font-size: 13px;'>
                                            Questions? Contact us at <a href='mailto:care@cubbyhealth.com' style='color: #0ea5e9; text-decoration: none;'>care@cubbyhealth.com</a>
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
            break;

        case 'registration_admin':
            $mail->setFrom('your-email@gmail.com', 'Cubby Health System');
            $mail->addAddress('care@cubbyhealth.com', 'Cubby Health Admin');
            $mail->Subject = 'New Member Registration - ' . $data['fullName'];

            $companyInfo = !empty($data['companyName']) ? htmlspecialchars($data['companyName']) : 'Not provided';
            $phoneInfo = !empty($data['phone']) ? htmlspecialchars($data['phone']) : 'Not provided';

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
                                    <td style='background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 32px 40px; text-align: center;'>
                                        <h1 style='margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;'>New Member Registration</h1>
                                    </td>
                                </tr>
                                <tr>
                                    <td style='padding: 40px;'>
                                        <p style='margin: 0 0 24px; color: #334155; font-size: 16px; line-height: 1.6;'>
                                            A new member has registered and is awaiting approval:
                                        </p>
                                        <table role='presentation' style='width: 100%; border-collapse: collapse; background-color: #f8fafc; border-radius: 8px; overflow: hidden;'>
                                            <tr>
                                                <td style='padding: 16px 20px; border-bottom: 1px solid #e2e8f0;'>
                                                    <span style='color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;'>Full Name</span><br>
                                                    <span style='color: #1e293b; font-size: 16px; font-weight: 600;'>" . htmlspecialchars($data['fullName']) . "</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style='padding: 16px 20px; border-bottom: 1px solid #e2e8f0;'>
                                                    <span style='color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;'>Email</span><br>
                                                    <span style='color: #1e293b; font-size: 16px; font-weight: 600;'>" . htmlspecialchars($data['email']) . "</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style='padding: 16px 20px; border-bottom: 1px solid #e2e8f0;'>
                                                    <span style='color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;'>Company</span><br>
                                                    <span style='color: #1e293b; font-size: 16px; font-weight: 600;'>" . $companyInfo . "</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style='padding: 16px 20px;'>
                                                    <span style='color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;'>Phone</span><br>
                                                    <span style='color: #1e293b; font-size: 16px; font-weight: 600;'>" . $phoneInfo . "</span>
                                                </td>
                                            </tr>
                                        </table>
                                        <div style='text-align: center; margin-top: 32px;'>
                                            <a href='https://cubbyhealth.com/admin' style='display: inline-block; background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px;'>
                                                Review in Admin Panel
                                            </a>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td style='background-color: #f8fafc; padding: 24px 40px; text-align: center; border-top: 1px solid #e2e8f0;'>
                                        <p style='margin: 0; color: #94a3b8; font-size: 12px;'>
                                            This is an automated notification from Cubby Health
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
            break;

        case 'approval':
            $mail->setFrom('your-email@gmail.com', 'Cubby Health');
            $mail->addAddress($data['email'], $data['fullName']);
            $mail->Subject = 'Your Cubby Health Account Has Been Approved!';

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
            break;
    }

    $mail->Body = $emailBody;
    $mail->AltBody = strip_tags(str_replace(['<br>', '<br/>', '<br />', '</p>', '</li>', '</td>'], "\n", $emailBody));

    $mail->send();
    echo json_encode(['ok' => true, 'message' => 'Notification sent successfully']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Failed to send notification: ' . $mail->ErrorInfo]);
}
