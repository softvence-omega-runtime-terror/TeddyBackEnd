import nodemailer from 'nodemailer';
import config from '../config';

export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true for port 465, false for other ports
      auth: {
        user: `${config.company_gmail}`,
        pass: `${config.gmail_app_password}`,
      },
    });

    const info = await transporter.sendMail({
      from: `${config.company_gmail}`,
      to,
      subject,
      text: 'This E-mail is from APP NAME',
      html,
    });

    console.log('Message sent: %s', info.messageId, 'info is', info);

    return {
      success: true,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
    };
  } catch (err) {
    console.error('❌ Email sending failed:', err);
    return {
      success: false,
      error: 'Failed to send email',
    };
  }
};



// import sgMail from '@sendgrid/mail';
// import config from '../config';

// // Set SendGrid API key
// sgMail.setApiKey(config.sendgrid_api_key);

// export const sendEmail = async (to: string, subject: string, html: string) => {
//   try {
//     const msg = {
//       to,
//       from: {
//         email: config.company_email,
//         name: config.company_name || 'Your App Name'
//       },
//       subject,
//       html,
//       text: 'This E-mail is from APP NAME', // Optional: you can remove this or make it dynamic
//     };

//     const response = await sgMail.send(msg);
    
//     console.log('✅ Email sent successfully:', response[0].statusCode);

//     return {
//       success: true,
//       statusCode: response[0].statusCode,
//       messageId: response[0].headers['x-message-id'],
//       accepted: [to],
//       rejected: [],
//     };
//   } catch (err: any) {
//     console.error('❌ SendGrid email sending failed:', err.response?.body || err.message);
    
//     return {
//       success: false,
//       error: 'Failed to send email',
//       details: err.response?.body?.errors || err.message,
//     };
//   }
// };