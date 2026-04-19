// server.js – No wildcard routes, works with Express 4 or 5
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_me';
const OTP_STORE = new Map();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Multer config
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, unique + path.extname(file.originalname));
    }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// MongoDB Schemas
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    createdAt: { type: Date, default: Date.now }
});

const jobSchema = new mongoose.Schema({
    company: { type: String, required: true },
    role: { type: String, required: true },
    description: { type: String, required: true },
    location: { type: String, required: true },
    salary: { type: String, default: 'Negotiable' },
    type: { type: String, enum: ['Full-time', 'Part-time', 'Contract', 'Internship'], default: 'Full-time' },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
});

const applicationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    resumeUrl: { type: String },
    status: { type: String, default: 'pending' },
    appliedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Job = mongoose.model('Job', jobSchema);
const Application = mongoose.model('Application', applicationSchema);

// Helper: verify JWT
const verifyToken = (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ success: false, message: 'No token' });
    const token = auth.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ success: false, message: 'Invalid token' });
    }
};

// Admin only
const isAdmin = async (req, res, next) => {
    const user = await User.findById(req.user.id);
    if (user && user.role === 'admin') return next();
    res.status(403).json({ success: false, message: 'Admin only' });
};

// ========== AUTH ROUTES ==========
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password || password.length < 6)
            return res.status(400).json({ success: false, message: 'Invalid data' });
        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ success: false, message: 'Email already exists' });
        const hashed = await bcrypt.hash(password, 10);
        const user = new User({ name, email, password: hashed });
        await user.save();
        const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ success: false, message: 'Invalid credentials' });
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(400).json({ success: false, message: 'Invalid credentials' });
        const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Forgot password - OTP
app.post('/api/forgot-password', async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'Email not found' });
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    OTP_STORE.set(email, { otp, expires: Date.now() + 10 * 60 * 1000 });
    console.log(`\n=== OTP for ${email}: ${otp} ===\n`);
    res.json({ success: true, message: 'OTP sent (check console)' });
});

app.post('/api/reset-password', async (req, res) => {
    const { email, otp, newPassword } = req.body;
    const record = OTP_STORE.get(email);
    if (!record) return res.status(400).json({ success: false, message: 'No OTP request' });
    if (record.otp !== otp) return res.status(400).json({ success: false, message: 'Invalid OTP' });
    if (record.expires < Date.now()) return res.status(400).json({ success: false, message: 'OTP expired' });
    if (newPassword.length < 6) return res.status(400).json({ success: false, message: 'Password too short' });
    const hashed = await bcrypt.hash(newPassword, 10);
    await User.updateOne({ email }, { password: hashed });
    OTP_STORE.delete(email);
    res.json({ success: true, message: 'Password reset successful' });
});

// ========== USER PROFILE ==========
app.put('/api/users/profile', verifyToken, async (req, res) => {
    try {
        const { name, email } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        if (email !== user.email) {
            const existing = await User.findOne({ email });
            if (existing) return res.status(400).json({ success: false, message: 'Email already taken' });
        }
        user.name = name || user.name;
        user.email = email || user.email;
        await user.save();
        res.json({ success: true, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/users/change-password', verifyToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id);
        const match = await bcrypt.compare(currentPassword, user.password);
        if (!match) return res.status(400).json({ success: false, message: 'Current password incorrect' });
        if (newPassword.length < 6) return res.status(400).json({ success: false, message: 'Password too short' });
        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();
        res.json({ success: true, message: 'Password changed' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ========== JOB ROUTES ==========
app.get('/api/jobs', async (req, res) => {
    try {
        const { search, location, type } = req.query;
        let filter = {};
        if (search) filter.$or = [{ company: { $regex: search, $options: 'i' } }, { role: { $regex: search, $options: 'i' } }];
        if (location) filter.location = { $regex: location, $options: 'i' };
        if (type && type !== '') filter.type = type;
        const jobs = await Job.find(filter).sort({ createdAt: -1 });
        res.json({ success: true, jobs });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/jobs', verifyToken, isAdmin, async (req, res) => {
    try {
        const { company, role, description, location, salary, type } = req.body;
        if (!company || !role || !description) return res.status(400).json({ success: false, message: 'Missing fields' });
        const job = new Job({ company, role, description, location, salary, type, postedBy: req.user.id });
        await job.save();
        res.json({ success: true, job });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.delete('/api/jobs/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        await Job.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ========== APPLICATION ROUTES ==========
app.post('/api/apply', verifyToken, upload.single('resume'), async (req, res) => {
    try {
        const { jobId } = req.body;
        if (!jobId) return res.status(400).json({ success: false, message: 'Job ID missing' });
        const existing = await Application.findOne({ userId: req.user.id, jobId });
        if (existing) return res.status(400).json({ success: false, message: 'Already applied' });
        let resumeUrl = null;
        if (req.file) resumeUrl = `/uploads/${req.file.filename}`;
        const application = new Application({ userId: req.user.id, jobId, resumeUrl });
        await application.save();
        res.json({ success: true, message: 'Application submitted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/api/check-application/:userId/:jobId', verifyToken, async (req, res) => {
    try {
        const app = await Application.findOne({ userId: req.params.userId, jobId: req.params.jobId });
        res.json({ applied: !!app });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/api/my-applications/:userId', verifyToken, async (req, res) => {
    try {
        if (req.params.userId !== req.user.id && req.user.role !== 'admin')
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        const apps = await Application.find({ userId: req.params.userId }).populate('jobId');
        res.json(apps);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ========== ADMIN STATS ==========
app.get('/api/admin/stats', verifyToken, isAdmin, async (req, res) => {
    try {
        const totalJobs = await Job.countDocuments();
        const totalUsers = await User.countDocuments();
        const totalApplications = await Application.countDocuments();
        res.json({ totalJobs, totalUsers, totalApplications });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Create default admin
const createDefaultAdmin = async () => {
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
        const hashed = await bcrypt.hash('admin123', 10);
        await User.create({ name: 'Admin', email: 'admin@jobportal.com', password: hashed, role: 'admin' });
        console.log('Default admin created: admin@jobportal.com / admin123');
    }
};

// ========== SERVE FRONTEND - NO WILDCARD ROUTES ==========
// Serve static files (CSS, JS, images, etc.)
app.use(express.static(__dirname));

// ✅ IMPORTANT: This middleware serves index.html for any GET request that is NOT API or upload
// It completely replaces app.get('/*', ...) and works with Express 4 and 5
app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
        res.sendFile(path.join(__dirname, 'index.html'));
    } else {
        next();
    }
});

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/jobportal';
mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log('✅ MongoDB connected');
        await createDefaultAdmin();
        app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
    })
    .catch(err => console.error('❌ MongoDB error:', err));