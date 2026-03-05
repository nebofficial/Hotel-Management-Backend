const nodemailer = require('nodemailer');

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: 'mail.codecraftnepal.com',
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: 'credential@codecraftnepal.com',
    pass: 'credential@JK',
  },
});

/**
 * Send user credentials email
 * @param {string} to - Recipient email address
 * @param {string} name - User's name
 * @param {string} email - User's email (login email)
 * @param {string} password - Generated password
 * @param {string} hotelName - Hotel name
 * @returns {Promise} - Promise that resolves when email is sent
 */
const sendCredentialsEmail = async (to, name, email, password, hotelName) => {
  try {
    const mailOptions = {
      from: '"Hotel Management System" <credential@codecraftnepal.com>',
      to: to,
      subject: 'Your Hotel Management System Account Credentials',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              border: 1px solid #ddd;
              border-radius: 5px;
            }
            .header {
              background-color: #2563eb;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 5px 5px 0 0;
            }
            .content {
              padding: 20px;
              background-color: #f9fafb;
            }
            .credentials {
              background-color: white;
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
              border-left: 4px solid #2563eb;
            }
            .credential-item {
              margin: 10px 0;
            }
            .label {
              font-weight: bold;
              color: #666;
            }
            .value {
              color: #2563eb;
              font-size: 16px;
              font-family: monospace;
            }
            .footer {
              text-align: center;
              padding: 20px;
              color: #666;
              font-size: 12px;
            }
            .warning {
              background-color: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 15px;
              margin: 20px 0;
              border-radius: 5px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Hotel Management System</h1>
            </div>
            <div class="content">
              <p>Dear ${name},</p>
              <p>Your account has been created for <strong>${hotelName}</strong>. Please find your login credentials below:</p>
              
              <div class="credentials">
                <div class="credential-item">
                  <span class="label">Email:</span>
                  <div class="value">${email}</div>
                </div>
                <div class="credential-item">
                  <span class="label">Password:</span>
                  <div class="value">${password}</div>
                </div>
              </div>
              
              <div class="warning">
                <strong>⚠️ Important:</strong> Please change your password after your first login for security purposes.
              </div>
              
              <p>You can now log in to the Hotel Management System using these credentials.</p>
              
              <p>If you have any questions or need assistance, please contact your system administrator.</p>
              
              <p>Best regards,<br>Hotel Management System</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Welcome to Hotel Management System
        
        Dear ${name},
        
        Your account has been created for ${hotelName}. Please find your login credentials below:
        
        Email: ${email}
        Password: ${password}
        
        Important: Please change your password after your first login for security purposes.
        
        You can now log in to the Hotel Management System using these credentials.
        
        If you have any questions or need assistance, please contact your system administrator.
        
        Best regards,
        Hotel Management System
        
        ---
        This is an automated email. Please do not reply to this message.
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

module.exports = {
  sendCredentialsEmail,
};
