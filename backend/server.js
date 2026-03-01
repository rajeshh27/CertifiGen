require('dotenv').config();

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const certificateRoutes = require('./routes/certificateRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Create required directories if they don't exist
const dirs = ['uploads', 'generated'];
dirs.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
});

// Open CORS — this is a fully public, stateless file-processing API
// (no auth, no database, no sensitive data — safe to allow all origins)
app.use(cors());

app.use(express.json());

// Routes
app.use('/api/certificates', certificateRoutes);

// Health check
app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'CertifiGen API is running!' });
});

app.listen(PORT, () => {
    console.log(`✅ CertifiGen server running on http://localhost:${PORT}`);
});
