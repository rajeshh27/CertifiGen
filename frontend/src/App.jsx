import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import {
    FiUploadCloud, FiFileText, FiImage, FiDownload,
    FiCheckCircle, FiAlertCircle, FiRefreshCw, FiZap
} from 'react-icons/fi';
import './index.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function App() {
    const [eventName, setEventName] = useState('');
    const [templateFile, setTemplateFile] = useState(null);
    const [excelFile, setExcelFile] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState(null);
    const [downloadName, setDownloadName] = useState('');
    const [error, setError] = useState('');

    // --- Template Dropzone ---
    const onDropTemplate = useCallback(acceptedFiles => {
        if (acceptedFiles.length > 0) {
            setTemplateFile(acceptedFiles[0]);
            setError('');
            setDownloadUrl(null);
        }
    }, []);

    // --- Excel Dropzone ---
    const onDropExcel = useCallback(acceptedFiles => {
        if (acceptedFiles.length > 0) {
            setExcelFile(acceptedFiles[0]);
            setError('');
            setDownloadUrl(null);
        }
    }, []);

    const {
        getRootProps: getTemplateProps,
        getInputProps: getTemplateInputProps,
        isDragActive: isTemplateActive
    } = useDropzone({
        onDrop: onDropTemplate,
        accept: { 'image/png': ['.png'], 'image/jpeg': ['.jpg', '.jpeg'] },
        maxFiles: 1,
        maxSize: 5 * 1024 * 1024,
        onDropRejected: () => setError('Template file must be PNG/JPG and under 5MB.')
    });

    const {
        getRootProps: getExcelProps,
        getInputProps: getExcelInputProps,
        isDragActive: isExcelActive
    } = useDropzone({
        onDrop: onDropExcel,
        accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
        },
        maxFiles: 1,
        maxSize: 5 * 1024 * 1024,
        onDropRejected: () => setError('Excel file must be .xlsx format and under 5MB.')
    });

    // --- Generate Handler ---
    const handleGenerate = async () => {
        if (!eventName.trim()) {
            setError('Please enter an Event Name first.');
            return;
        }
        if (!templateFile) {
            setError('Please upload a certificate template image.');
            return;
        }
        if (!excelFile) {
            setError('Please upload an Excel file with student names.');
            return;
        }

        setIsGenerating(true);
        setError('');
        setDownloadUrl(null);

        const formData = new FormData();
        formData.append('eventName', eventName.trim());
        formData.append('template', templateFile);
        formData.append('excel', excelFile);

        try {
            const response = await axios.post(`${API_BASE}/api/certificates/generate`, formData, {
                responseType: 'blob',
                timeout: 120000 // 2 min timeout for large batches
            });

            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/zip' }));
            const safeName = eventName.trim().replace(/[^a-zA-Z0-9\s]/g, '_').replace(/\s+/g, '_');
            setDownloadName(`${safeName}_Certificates.zip`);
            setDownloadUrl(url);
        } catch (err) {
            console.error('Generation error:', err);
            if (err.response) {
                // Server responded with error
                try {
                    const text = await err.response.data.text();
                    const parsed = JSON.parse(text);
                    setError(parsed.error || 'Server error. Please try again.');
                } catch {
                    setError('Certificate generation failed. Check that your Excel has a "Name" column.');
                }
            } else if (err.code === 'ERR_NETWORK' || err.message?.toLowerCase().includes('network')) {
                setError(`Cannot reach the server at ${API_BASE}. If using the live site, the server may be waking up — wait 30 seconds and try again.`);
            } else {
                setError('An unexpected error occurred. Please try again.');
            }
        } finally {
            setIsGenerating(false);
        }
    };

    // --- Download Handler ---
    const handleDownload = () => {
        if (!downloadUrl) return;
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.setAttribute('download', downloadName);
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    // --- Reset ---
    const handleReset = () => {
        setEventName('');
        setTemplateFile(null);
        setExcelFile(null);
        setDownloadUrl(null);
        setDownloadName('');
        setError('');
    };

    const isReady = eventName.trim() && templateFile && excelFile;

    return (
        <div className="app-wrapper">
            {/* Navbar */}
            <nav className="navbar">
                <div className="navbar-logo">
                    <div className="logo-icon">🎓</div>
                    CertifiGen
                </div>
                <span className="navbar-badge">⚡ Free & No Login</span>
            </nav>

            <main className="app-container">
                {/* Hero */}
                <div className="hero">
                    <div className="hero-badge">
                        <span className="hero-badge-dot"></span>
                        Bulk Certificate Generator
                    </div>
                    <h1>
                        Generate <span>Bulk Certificates</span><br />
                        in Seconds
                    </h1>
                    <p>
                        Upload your template and Excel file. We'll generate a PDF certificate
                        for every name and package them into a ZIP — instantly.
                    </p>
                    <div className="stats-row">
                        <div className="stat-item">
                            <div className="stat-value">100%</div>
                            <div className="stat-label">Free</div>
                        </div>
                        <div className="stat-divider"></div>
                        <div className="stat-item">
                            <div className="stat-value">0</div>
                            <div className="stat-label">Sign-ups</div>
                        </div>
                        <div className="stat-divider"></div>
                        <div className="stat-item">
                            <div className="stat-value">∞</div>
                            <div className="stat-label">Names</div>
                        </div>
                    </div>
                </div>

                {/* Main Card */}
                <div className="card">
                    {/* Error */}
                    {error && (
                        <div className="error-block animate-scale">
                            <FiAlertCircle className="error-icon" />
                            <p>{error}</p>
                        </div>
                    )}

                    {/* Event Name */}
                    <div className="input-group">
                        <div className="section-label">Step 1 — Event Details</div>
                        <label htmlFor="eventName">Event Name</label>
                        <input
                            type="text"
                            id="eventName"
                            className="input-field"
                            placeholder="e.g. Annual Tech Symposium 2026"
                            value={eventName}
                            onChange={e => { setEventName(e.target.value); setError(''); }}
                            disabled={isGenerating}
                        />
                    </div>

                    {/* Upload Zone */}
                    <div className="upload-grid">
                        {/* Template */}
                        <div className="input-group">
                            <label>Certificate Template</label>
                            <div
                                {...getTemplateProps()}
                                className={`dropzone ${isTemplateActive ? 'active' : ''} ${templateFile ? 'has-file' : ''}`}
                            >
                                <input {...getTemplateInputProps()} disabled={isGenerating} />
                                {templateFile ? (
                                    <>
                                        <div className="drop-icon-wrap success">
                                            <FiCheckCircle />
                                        </div>
                                        <span className="drop-filename">{templateFile.name}</span>
                                        <span className="drop-subtext">Click to replace</span>
                                    </>
                                ) : (
                                    <>
                                        <div className="drop-icon-wrap default">
                                            <FiImage />
                                        </div>
                                        <span className="drop-text">Drop Template Here</span>
                                        <span className="drop-subtext">or click to browse</span>
                                        <span className="drop-hint">PNG / JPG · Max 5MB</span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Excel */}
                        <div className="input-group">
                            <label>Student Names (Excel)</label>
                            <div
                                {...getExcelProps()}
                                className={`dropzone ${isExcelActive ? 'active' : ''} ${excelFile ? 'has-file' : ''}`}
                            >
                                <input {...getExcelInputProps()} disabled={isGenerating} />
                                {excelFile ? (
                                    <>
                                        <div className="drop-icon-wrap success">
                                            <FiCheckCircle />
                                        </div>
                                        <span className="drop-filename">{excelFile.name}</span>
                                        <span className="drop-subtext">Click to replace</span>
                                    </>
                                ) : (
                                    <>
                                        <div className="drop-icon-wrap default">
                                            <FiFileText />
                                        </div>
                                        <span className="drop-text">Drop Excel File Here</span>
                                        <span className="drop-subtext">or click to browse</span>
                                        <span className="drop-hint">.xlsx · Needs "Name" column</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="divider"></div>

                    {/* Action Area */}
                    {isGenerating ? (
                        <div className="progress-container">
                            <div className="spinner-wrap">
                                <div className="spinner"></div>
                                <div className="spinner-inner"></div>
                            </div>
                            <div className="status-text">Generating Certificates…</div>
                            <div className="status-subtext">Please wait, this may take a moment for large lists</div>
                        </div>
                    ) : downloadUrl ? (
                        <div className="btn-group animate-scale">
                            <div className="success-block">
                                <div className="success-icon-wrap">✅</div>
                                <div className="success-info">
                                    <strong>Certificates Ready!</strong>
                                    <span>Your ZIP archive is ready to download</span>
                                </div>
                            </div>
                            <button className="action-btn download-btn" onClick={handleDownload} id="download-btn">
                                <FiDownload size={20} /> Download ZIP Archive
                            </button>
                            <button className="reset-btn" onClick={handleReset} id="reset-btn">
                                <FiRefreshCw size={16} /> Start Over
                            </button>
                        </div>
                    ) : (
                        <button
                            className="action-btn"
                            onClick={handleGenerate}
                            disabled={!isReady}
                            id="generate-btn"
                        >
                            <FiZap size={20} />
                            Generate Certificates
                        </button>
                    )}
                </div>

                {/* How It Works */}
                <div className="how-it-works">
                    <div className="how-title">How It Works</div>
                    <div className="steps-row">
                        {[
                            { n: '1', label: 'Enter Event Name' },
                            { n: '2', label: 'Upload Template' },
                            { n: '3', label: 'Upload Excel (.xlsx)' },
                            { n: '4', label: 'Click Generate' },
                            { n: '5', label: 'Download ZIP' },
                        ].map((step, i) => (
                            <div className="step-item" key={i}>
                                <div className="step-num">{step.n}</div>
                                <div className="step-label">{step.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="footer">
                CertifiGen · Free, open &amp; no login required · Files auto-deleted after download
            </footer>
        </div>
    );
}

export default App;
