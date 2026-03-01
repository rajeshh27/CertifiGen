require('dotenv').config();

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const certificateRoutes = require('./routes/certificateRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Create required directories if they don't exist
const dirs = ['uploads', 'generated'];
dirs.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
});

// Middlewares
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
        FRONTEND_URL  // ← loaded from .env (your Vercel URL in production)
    ],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Routes
app.use('/api/certificates', certificateRoutes);

// Health check
app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'CertifiGen API is running!' });
});

app.listen(PORT, () => {
    console.log(`✅ CertifiGen server running on http://localhost:${PORT}`);
    console.log(`🌐 Allowed frontend origin: ${FRONTEND_URL}`);
});
