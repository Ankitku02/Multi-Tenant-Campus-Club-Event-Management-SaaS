const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const browserPath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const htmlPath = path.resolve(__dirname, 'PROJECT_EXPLANATION_GUIDE.html');
const pdfPath = path.resolve(__dirname, 'PROJECT_EXPLANATION_GUIDE.pdf');

try {
  const fileUrl = 'file:///' + htmlPath.replace(/\\/g, '/');
  const command = `"${browserPath}" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="${pdfPath}" "${fileUrl}"`;
  console.log('Generating PDF...');
  execSync(command);
  if (fs.existsSync(pdfPath)) {
    console.log('SUCCESS: PDF generated at', pdfPath, 'Size:', fs.statSync(pdfPath).size, 'bytes');
  } else {
    console.error('FAILED: PDF file not created');
  }
} catch (err) {
  console.error('Error generating PDF:', err.message);
}
