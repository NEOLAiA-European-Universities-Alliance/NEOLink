const nodemailer = require("nodemailer");
module.exports = {
    async send_mail(email, random_string){
        try{
            const transporter = nodemailer.createTransport({
                host: process.env.HOST_MAIL,
                port: 587,
                secure: false,
                auth:{
                    user: process.env.USER_MAIL,
                    pass: process.env.PASS_MAIL,
                },
            });

            await transporter.sendMail({
from: process.env.USER_MAIL,
to: email,
subject: 'NEOLink: Your Access Code',
html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #fafafa;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="padding: 30px 40px; border-bottom: 1px solid #e9ecef;">
                            <div style="text-align: center;">
                                <img src="https://neolink.neolaiacampus.eu/logo.png" alt="NEOLink Logo" style="max-width: 200px; height: auto; display: block; margin: 0 auto;" />
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 40px 30px;">
                            <h2 style="margin: 0 0 20px; font-size: 24px; font-weight: 600; color: #213547;">
                                Your Access Code
                            </h2>
                            <p style="margin: 0 0 25px; font-size: 16px; line-height: 1.6; color: #6c757d;">
                                Use the following code to access the NEOLink platform:
                            </p>
                            
                            <!-- OTP Code Box -->
                            <div style="background: linear-gradient(135deg, #f8f7ff 0%, #f0eeff 100%); border-radius: 8px; padding: 25px; text-align: center; margin: 25px 0;">
                                <div style="font-size: 14px; color: #6c757d; margin-bottom: 8px; font-weight: 500;">
                                    YOUR CODE
                                </div>
                                <div style="font-size: 36px; font-weight: 700; color: #7c6fd6; letter-spacing: 4px; font-family: 'Courier New', monospace;">
                                    ${random_string}
                                </div>
                            </div>
                            
                            <!-- Warning Box -->
                            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 4px; margin: 25px 0;">
                                <p style="margin: 0; font-size: 14px; color: #856404; line-height: 1.5;">
                                    ⏱️ <strong>This code expires in 1 hour</strong>
                                </p>
                            </div>
                            
                            <p style="margin: 20px 0 0; font-size: 14px; line-height: 1.6; color: #6c757d;">
                                If you didn't request this code, please ignore this email or contact support if you have concerns.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; background-color: #f8f9fa; border-top: 1px solid #e9ecef; border-radius: 0 0 12px 12px;">
                            <p style="margin: 0; font-size: 13px; color: #6c757d; text-align: center; line-height: 1.6;">
                                © ${new Date().getFullYear()} NEOLink
                            </p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`,
text: `Your OTP password to access NEOLink is: ${random_string}\n\nThis code expires in 1 hour.\n\nIf you didn't request this code, please ignore this email.`
            });
            console.log('email sent sucessfully');
        } catch (error){
            console.log(error)
            console.log('email not sent')
        }
    }
}