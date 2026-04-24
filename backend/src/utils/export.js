const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');

function generateCSV(data, fields) {
  const parser = new Parser({ fields });
  return parser.parse(data);
}

function generatePDF(data, title, fields) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4', layout: 'landscape' });
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Title
    doc.fontSize(20).font('Helvetica-Bold').text(title, { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').fillColor('#666').text(`Exported on ${new Date().toLocaleDateString()}  |  ${data.length} items`, { align: 'center' });
    doc.moveDown(1);

    // Table header
    const colWidth = (doc.page.width - 100) / Math.min(fields.length, 5);
    const displayFields = fields.slice(0, 5);
    let x = 50;
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#333');
    displayFields.forEach(f => {
      doc.text(f.label || f.value, x, doc.y, { width: colWidth, align: 'left' });
      x += colWidth;
    });
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke('#ddd');
    doc.moveDown(0.3);

    // Table rows
    doc.font('Helvetica').fontSize(8).fillColor('#444');
    data.forEach((row, i) => {
      if (doc.y > doc.page.height - 80) {
        doc.addPage();
        doc.y = 50;
      }
      x = 50;
      displayFields.forEach(f => {
        const val = String(row[f.value] || '').slice(0, 50);
        doc.text(val, x, doc.y, { width: colWidth, align: 'left' });
        x += colWidth;
      });
      doc.moveDown(0.3);
      if (i % 2 === 0) {
        // Light alternating row hint
      }
    });

    doc.end();
  });
}

module.exports = { generateCSV, generatePDF };
