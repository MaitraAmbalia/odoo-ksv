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
