const archiver = require('archiver');
const fs = require('fs');
const path = require('path');

const generateZip = (pdfFiles, zipPath) => {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => resolve(zipPath));
        archive.on('error', (err) => reject(err));

        archive.pipe(output);

        pdfFiles.forEach(pdfFile => {
            const fileName = path.basename(pdfFile);
            archive.file(pdfFile, { name: fileName });
        });

        archive.finalize();
    });
};

module.exports = { generateZip };
