const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Use a synchronous image-size approach for CommonJS compatibility
// image-size v1.x supports CJS
let sizeOf;
try {
    sizeOf = require('image-size');
    // image-size v1 exports default function directly
    if (typeof sizeOf !== 'function') {
        sizeOf = sizeOf.imageSize || sizeOf.default;
    }
} catch (e) {
    console.error('image-size not available:', e.message);
}

const generateCertificate = (name, templatePath, outputPath) => {
    return new Promise((resolve, reject) => {
        try {
            // Fallback dimensions if image-size fails
            let imgWidth = 2480;
            let imgHeight = 1748;

            if (sizeOf) {
                try {
                    const dimensions = sizeOf(templatePath);
                    imgWidth = dimensions.width;
                    imgHeight = dimensions.height;
                } catch (e) {
                    console.warn('Could not read image dimensions, using defaults:', e.message);
                }
            }

            // PDFKit works in points (1 inch = 72 points)
            // For high-res images (300 DPI), scale down for PDF
            // Use A4 landscape size in points: 841.89 x 595.28 is A4 portrait
            // We'll use the image pixel dimensions as the PDF size
            const doc = new PDFDocument({
                size: [imgWidth, imgHeight],
                margin: 0,
                autoFirstPage: true
            });

            const stream = fs.createWriteStream(outputPath);
            doc.pipe(stream);

            // Draw background image to fill the entire page
            doc.image(templatePath, 0, 0, {
                width: imgWidth,
                height: imgHeight
            });

            // Hardcoded text settings (elegant serif)
            doc.font('Times-Roman');
            doc.fontSize(60);
            doc.fillColor('#222222');

            // Center the name horizontally
            // X: starting at 0, width: full page (centered alignment handled by PDFKit)
            doc.text(name, 0, imgHeight * 0.52, {  // 52% from top
                align: 'center',
                width: imgWidth
            });

            doc.end();

            stream.on('finish', () => resolve(outputPath));
            stream.on('error', reject);
        } catch (error) {
            reject(error);
        }
    });
};

module.exports = { generateCertificate };
