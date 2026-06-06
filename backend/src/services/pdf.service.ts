import PDFDocument from 'pdfkit';

export const generateInvoicePDF = (invoice: any): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end',  ()    => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc.fontSize(22).font('Helvetica-Bold').text('VendorBridge', 50, 50);
    doc.fontSize(10).font('Helvetica').text('Tax Invoice', 50, 80);

    // Invoice meta
    doc.fontSize(11).text(`Invoice #: ${invoice.invoiceNumber}`, 400, 50, { align: 'right' });
    doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, 400, 65, { align: 'right' });
    doc.text(`Due:  ${new Date(invoice.dueDate).toLocaleDateString()}`, 400, 80, { align: 'right' });

    // Vendor info
    doc.moveDown(2);
    doc.font('Helvetica-Bold').text('Vendor:');
    doc.font('Helvetica').text(invoice.vendor.companyName);

    // Line items table header
    doc.moveDown();
    doc.font('Helvetica-Bold');
    doc.text('Description', 50, doc.y, { width: 250, continued: false });
    doc.text('Qty',    300, doc.y - 14, { width: 60, align: 'right' });
    doc.text('Rate',   360, doc.y - 14, { width: 80, align: 'right' });
    doc.text('Amount', 440, doc.y - 14, { width: 100, align: 'right' });

    // Line items
    doc.font('Helvetica');
    invoice.items.forEach((item: any) => {
      doc.text(item.description, 50,  doc.y + 5, { width: 250 });
      doc.text(String(item.quantity),  300, doc.y - 14, { width: 60,  align: 'right' });
      doc.text(`₹${item.unitPrice.toFixed(2)}`, 360, doc.y - 14, { width: 80, align: 'right' });
      doc.text(`₹${item.totalPrice.toFixed(2)}`, 440, doc.y - 14, { width: 100, align: 'right' });
    });

    // Totals
    doc.moveDown();
    doc.text(`Subtotal: ₹${invoice.subtotal.toFixed(2)}`,  { align: 'right' });
    if (invoice.cgst)  doc.text(`CGST (${invoice.gstRate / 2}%): ₹${invoice.cgst.toFixed(2)}`,  { align: 'right' });
    if (invoice.sgst)  doc.text(`SGST (${invoice.gstRate / 2}%): ₹${invoice.sgst.toFixed(2)}`,  { align: 'right' });
    if (invoice.igst)  doc.text(`IGST (${invoice.gstRate}%): ₹${invoice.igst.toFixed(2)}`,      { align: 'right' });
    doc.font('Helvetica-Bold').text(`Grand Total: ₹${invoice.grandTotal.toFixed(2)}`, { align: 'right' });

    doc.end();
  });
};
