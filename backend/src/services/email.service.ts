import nodemailer from 'nodemailer';
import { env } from '../config/env';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
});

export const sendInvoiceEmail = async ({ to, invoice, pdfBuffer }: any) => {
  await transporter.sendMail({
    from: env.FROM_EMAIL,
    to,
    subject: `Invoice ${invoice.invoiceNumber} from VendorBridge`,
    html: `<p>Dear ${invoice.vendor.companyName},</p>
           <p>Please find your invoice <strong>${invoice.invoiceNumber}</strong> attached.</p>
           <p>Amount Due: <strong>₹${invoice.grandTotal.toFixed(2)}</strong></p>
           <p>Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}</p>`,
    attachments: [{ filename: `${invoice.invoiceNumber}.pdf`, content: pdfBuffer, contentType: 'application/pdf' }],
  });
};

export const sendResetPasswordEmail = async (to: string, resetUrl: string) => {
  await transporter.sendMail({
    from: env.FROM_EMAIL,
    to,
    subject: 'Reset your password - VendorBridge',
    html: `<p>You requested a password reset from VendorBridge.</p>
           <p>Please click the link below to reset your password. The link is valid for 15 minutes:</p>
           <p><a href="${resetUrl}">${resetUrl}</a></p>
           <p>If you did not request this, please ignore this email.</p>`,
  });
};
