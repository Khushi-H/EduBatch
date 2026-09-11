const PDFDocument = require('pdfkit');

/**
 * Streams a payment receipt PDF directly to the given response.
 * Kept dependency-free of any external service (pdfkit renders locally,
 * no network calls) so receipt downloads never depend on a third party
 * being reachable or configured.
 */
function streamReceiptPdf(res, { payment, enrollment, student, batch }) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="EduBatch-Receipt-${payment._id}.pdf"`);
  doc.pipe(res);

  const inkColor = '#1b2559';
  const amberColor = '#cc8a3a';
  const grayColor = '#5b6394';

  // Header
  doc.fontSize(22).fillColor(inkColor).font('Helvetica-Bold').text('EduBatch', 50, 50);
  doc.fontSize(10).fillColor(grayColor).font('Helvetica').text('Education Batch Management Platform', 50, 78);

  doc.moveTo(50, 100).lineTo(545, 100).strokeColor('#e6e8f2').lineWidth(1).stroke();

  doc.fontSize(16).fillColor(inkColor).font('Helvetica-Bold').text('Payment Receipt', 50, 120);
  doc.fontSize(9).fillColor(grayColor).font('Helvetica').text(`Receipt #${payment._id}`, 50, 145);
  doc
    .fontSize(9)
    .fillColor(grayColor)
    .text(
      `Issued on ${new Date(payment.paidAt || payment.updatedAt).toLocaleString('en-IN')}`,
      50,
      160
    );

  // Status pill
  doc
    .roundedRect(430, 118, 65, 22, 11)
    .fillColor(payment.status === 'paid' ? '#dcfce7' : '#fee2e2')
    .fill();
  doc
    .fontSize(10)
    .fillColor(payment.status === 'paid' ? '#15803d' : '#b91c1c')
    .font('Helvetica-Bold')
    .text(payment.status.toUpperCase(), 430, 124, { width: 65, align: 'center' });

  let y = 200;
  const row = (label, value) => {
    doc.fontSize(10).fillColor(grayColor).font('Helvetica').text(label, 50, y);
    doc.fontSize(11).fillColor(inkColor).font('Helvetica-Bold').text(String(value), 220, y);
    y += 26;
  };

  doc.fontSize(12).fillColor(amberColor).font('Helvetica-Bold').text('Student Details', 50, y);
  y += 22;
  row('Name', student.name);
  row('Email', student.email);

  y += 10;
  doc.fontSize(12).fillColor(amberColor).font('Helvetica-Bold').text('Batch Details', 50, y);
  y += 22;
  row('Batch', batch.name);
  row('Subject', batch.subject);

  y += 10;
  doc.fontSize(12).fillColor(amberColor).font('Helvetica-Bold').text('Payment Details', 50, y);
  y += 22;
  row('Amount Paid', `Rs. ${(payment.amount / 100).toLocaleString('en-IN')}`);
  row('Currency', payment.currency);
  row('Razorpay Order ID', payment.razorpayOrderId);
  row('Razorpay Payment ID', payment.razorpayPaymentId || '-');
  row('Enrollment ID', enrollment._id.toString());

  y += 20;
  doc.moveTo(50, y).lineTo(545, y).strokeColor('#e6e8f2').lineWidth(1).stroke();
  y += 20;

  doc
    .fontSize(9)
    .fillColor(grayColor)
    .font('Helvetica')
    .text(
      'This is a system-generated receipt from EduBatch and does not require a physical signature. ' +
        'For any billing queries, please contact your institute administrator.',
      50,
      y,
      { width: 495 }
    );

  doc.end();
}

module.exports = { streamReceiptPdf };