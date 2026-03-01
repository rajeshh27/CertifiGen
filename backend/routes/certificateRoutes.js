const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs-extra');
const { generateCertificate } = require('../utils/certificateGenerator');
const { generateZip } = require('../utils/zipGenerator');

const router = express.Router();

// Use absolute path for uploads directory
const uploadsDir = path.join(__dirname, '../uploads');
const generatedDir = path.join(__dirname, '../generated');

// Ensure directories exist
fs.ensureDirSync(uploadsDir);
fs.ensureDirSync(generatedDir);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
        cb(null, `${Date.now()}-${safeName}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.fieldname === 'template') {
            if (!file.mimetype.match(/^image\/(png|jpeg|jpg)$/)) {
                return cb(new Error('Template must be PNG or JPG image'));
            }
        }
        if (file.fieldname === 'excel') {
            if (!file.originalname.match(/\.(xlsx)$/i)) {
                return cb(new Error('Data file must be .xlsx format'));
            }
        }
        cb(null, true);
    }
});

router.post('/generate', upload.fields([
    { name: 'template', maxCount: 1 },
    { name: 'excel', maxCount: 1 }
]), async (req, res) => {
    const sessionId = `session_${Date.now()}`;
    const sessionDir = path.join(generatedDir, sessionId);

    try {
        const { eventName } = req.body;

        if (!req.files || !req.files['template'] || !req.files['excel']) {
            return res.status(400).json({ error: 'Both template image and Excel file are required.' });
        }

        const templateFile = req.files['template'][0];
        const excelFile = req.files['excel'][0];

        if (!eventName || !eventName.trim()) {
            return res.status(400).json({ error: 'Event name is required.' });
        }

        // Read Excel
        const workbook = xlsx.readFile(excelFile.path);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);

        if (!data || data.length === 0) {
            return res.status(400).json({ error: 'Excel file is empty or has no valid rows.' });
        }

        // Check if Name column exists
        const firstRow = data[0];
        const nameKey = Object.keys(firstRow).find(k => k.trim().toLowerCase() === 'name');

        if (!nameKey) {
            return res.status(400).json({ error: 'Excel must contain a column named "Name".' });
        }

        const names = data.map(row => (row[nameKey] || '').toString().trim()).filter(Boolean);

        if (names.length === 0) {
            return res.status(400).json({ error: 'No valid names found in the Excel file.' });
        }

        // Prepare session directory
        await fs.ensureDir(sessionDir);

        const pdfFiles = [];

        // Generate certificates for all names
        for (let i = 0; i < names.length; i++) {
            const name = names[i];
            const pdfFileName = `${name.replace(/[^a-zA-Z0-9\s]/g, '_')}_Certificate.pdf`;
            const pdfPath = path.join(sessionDir, pdfFileName);

            await generateCertificate(name, templateFile.path, pdfPath);
            pdfFiles.push(pdfPath);
        }

        // Create ZIP
        const safeEventName = eventName.trim().replace(/[^a-zA-Z0-9\s]/g, '_').replace(/\s+/g, '_');
        const zipFileName = `${safeEventName}_Certificates.zip`;
        const zipPath = path.join(generatedDir, `${sessionId}_${zipFileName}`);

        await generateZip(pdfFiles, zipPath);

        // Send the ZIP as download
        res.download(zipPath, zipFileName, async (err) => {
            if (err) {
                console.error('Error sending ZIP:', err);
            }
            // Cleanup all temp files
            try {
                await fs.remove(sessionDir);
                await fs.remove(zipPath);
                await fs.remove(templateFile.path);
                await fs.remove(excelFile.path);
            } catch (cleanupError) {
                console.error('Cleanup error:', cleanupError);
            }
        });

    } catch (error) {
        console.error('Certificate generation error:', error);

        // Clean up session directory on failure
        try {
            await fs.remove(sessionDir);
        } catch (e) { }

        if (!res.headersSent) {
            res.status(500).json({ error: error.message || 'An unexpected server error occurred.' });
        }
    }
});

module.exports = router;
