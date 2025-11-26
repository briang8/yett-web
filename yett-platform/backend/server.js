require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'demo-secret-key-change-in-production';
const DATA_FILE = path.join(__dirname, 'data.json');

// Middleware
app.use(cors());
app.use(express.json());

// Initialize data file with seed data
function initializeData() {
    const seedData = {
        users: [
            {
                id: 'admin-001',
                name: 'Admin User',
                email: 'admin@yett.com',
                role: 'admin',
                completedModules: [],
                createdAt: new Date().toISOString()
            },
            {
                id: 'mentor-001',
                name: 'Sarah Mentor',
                email: 'mentor@yett.com',
                role: 'mentor',
                completedModules: [],
                createdAt: new Date().toISOString()
            },
            {
                id: 'learner-001',
                name: 'John Learner',
                email: 'learner@yett.com',
                role: 'learner',
                completedModules: [],
                createdAt: new Date().toISOString()
            }
        ],
        modules: [
            {
                id: 'mod-001',
                title: 'Basic Computer Skills',
                description: 'Learn fundamental computer operations, file management, and basic troubleshooting.',
                contentUrl: 'https://www.youtube.com/watch?v=xxwT5YJb7yE',
                duration: '45 minutes',
                difficulty: 'Beginner'
            },
            {
                id: 'mod-002',
                title: 'Internet & Online Safety',
                description: 'Understand how to navigate the internet safely, protect your privacy, and identify scams.',
                contentUrl: 'https://www.youtube.com/watch?v=U3W2v7LN-88',
                duration: '30 minutes',
                difficulty: 'Beginner'
            },
            {
                id: 'mod-003',
                title: 'Introduction to Coding',
                description: 'Start your coding journey with block-based programming and basic concepts.',
                contentUrl: 'https://www.youtube.com/watch?v=nKIu9yen5nc',
                duration: '60 minutes',
                difficulty: 'Beginner'
            },
            {
                id: 'mod-004',
                title: 'Productivity Tools',
                description: 'Master essential tools like Google Docs, Sheets, and professional email communication.',
                contentUrl: 'https://www.youtube.com/watch?v=YQoryp8TjMw',
                duration: '50 minutes',
                difficulty: 'Intermediate'
            },
            {
                id: 'mod-005',
                title: 'Career Readiness',
                description: 'Learn how to write a CV, prepare for interviews, and present yourself professionally.',
                contentUrl: 'https://www.youtube.com/watch?v=ji5_MqicxSo',
                duration: '40 minutes',
                difficulty: 'Intermediate'
            },
            {
                id: 'mod-006',
                title: 'Build Your First Webpage',
                description: 'Create a simple personal webpage using HTML and CSS. Hands-on project.',
                contentUrl: 'https://www.youtube.com/watch?v=PlxWf493en4',
                duration: '90 minutes',
                difficulty: 'Intermediate'
            }
        ],
        mentorshipRequests: [],
        opportunities: [],
        matches: []
    };

    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, JSON.stringify(seedData, null, 2));
        console.log('✅ Data file initialized with seed data');
    }
}

// Read data from file
function readData() {
    const rawData = fs.readFileSync(DATA_FILE);
    return JSON.parse(rawData);
}

// Write data to file
function writeData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Auth middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
}

// Admin middleware
function requireAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
}

// ===== AUTH ROUTES =====

// Register (public) — password required, admin creation disallowed
app.post('/api/register', (req, res) => {
    try {
        const { name, email, role, password } = req.body;

        if (!name || !email || !role || !password) {
            return res.status(400).json({ error: 'Name, email, role and password are required' });
        }

        if (!['learner', 'mentor'].includes(role)) {
            return res.status(403).json({ error: 'Cannot register as admin. Ask an existing admin to create admin accounts.' });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters long' });
        }

        const data = readData();

        // Check if user already exists
        if (data.users.find(u => u.email === email)) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }

        const hashed = bcrypt.hashSync(password, 10);

        const newUser = {
            id: uuidv4(),
            name,
            email,
            role,
            password: hashed,
            completedModules: [],
            createdAt: new Date().toISOString()
        };

        data.users.push(newUser);
        writeData(data);

        const token = jwt.sign(
            { id: newUser.id, email: newUser.email, role: newUser.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role },
            token
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login with password
app.post('/api/login', (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const data = readData();
        const user = data.users.find(u => u.email === email);

        if (!user || !user.password) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const ok = bcrypt.compareSync(password, user.password);
        if (!ok) return res.status(401).json({ error: 'Invalid email or password' });

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Admin-only: create an admin account (requires existing admin)
app.post('/api/admin/create-admin', authenticateToken, requireAdmin, (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password required' });
        if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

        const data = readData();
        if (data.users.find(u => u.email === email)) return res.status(400).json({ error: 'User exists' });

        const hashed = bcrypt.hashSync(password, 10);
        const newUser = { id: uuidv4(), name, email, role: 'admin', password: hashed, completedModules: [], createdAt: new Date().toISOString() };
        data.users.push(newUser);
        writeData(data);
        res.status(201).json({ message: 'Admin created', user: { id: newUser.id, name: newUser.name, email: newUser.email } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create admin' });
    }
});

// ===== MODULES ROUTES =====

// Get all modules
app.get('/api/modules', (req, res) => {
    try {
        const data = readData();
        res.json(data.modules);
    } catch (error) {
        console.error('Get modules error:', error);
        res.status(500).json({ error: 'Failed to fetch modules' });
    }
});

// Get single module
app.get('/api/modules/:id', (req, res) => {
    try {
        const data = readData();
        const module = data.modules.find(m => m.id === req.params.id);

        if (!module) {
            return res.status(404).json({ error: 'Module not found' });
        }

        res.json(module);
    } catch (error) {
        console.error('Get module error:', error);
        res.status(500).json({ error: 'Failed to fetch module' });
    }
});

// Mark module as complete
app.post('/api/modules/:id/complete', authenticateToken, (req, res) => {
    try {
        const moduleId = req.params.id;
        const userId = req.user.id;

        const data = readData();
        const user = data.users.find(u => u.id === userId);
        const module = data.modules.find(m => m.id === moduleId);

        if (!module) {
            return res.status(404).json({ error: 'Module not found' });
        }

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Add module to completed list if not already there
        if (!user.completedModules.includes(moduleId)) {
            user.completedModules.push(moduleId);
            writeData(data);
        }

        const progress = Math.round((user.completedModules.length / data.modules.length) * 100);

        res.json({
            message: 'Module marked as complete',
            completedModules: user.completedModules,
            progress,
            totalModules: data.modules.length
        });
    } catch (error) {
        console.error('Complete module error:', error);
        res.status(500).json({ error: 'Failed to mark module as complete' });
    }
});

// ===== QUIZ ENDPOINTS =====

function generateDeterministicQuiz(module, data) {
    const modules = data.modules;
    const idx = modules.findIndex(m => m.id === module.id);
    const n = modules.length;

    const pickTitleDistractors = () => {
        const distractors = [];
        for (let i = 1; distractors.length < 3 && i < n; i++) {
            const m = modules[(idx + i) % n];
            if (m && m.title !== module.title) distractors.push(m.title);
        }
        return distractors;
    };

    const parseDuration = (d) => {
        const match = (d || '').match(/(\d+)/);
        return match ? parseInt(match[1], 10) : null;
    };

    const durationVal = parseDuration(module.duration);

    const questions = [];

    // Q1: module title
    const titleDistractors = pickTitleDistractors();
    const titleOptions = [module.title, ...titleDistractors].slice(0, 4);
    questions.push({ question: 'Which of the following is the title of this module?', options: titleOptions, answerIndex: 0 });

    // Q2: duration
    if (durationVal) {
        const opts = [durationVal, durationVal + 10, Math.max(10, durationVal - 5), durationVal + 20].map(v => `${v} minutes`);
        questions.push({ question: 'What is the reported duration of this module?', options: opts, answerIndex: 0 });
    }

    // Q3: difficulty
    const levels = ['Beginner', 'Intermediate', 'Advanced'];
    const diff = module.difficulty && levels.includes(module.difficulty) ? module.difficulty : levels[0];
    const diffOptions = [diff, ...levels.filter(l => l !== diff)].slice(0, 4);
    questions.push({ question: 'What difficulty level is this module categorized as?', options: diffOptions, answerIndex: 0 });

    // Q4: topic keyword
    const desc = (module.description || '').toLowerCase();
    const topics = [];
    if (desc.includes('internet')) topics.push('Internet & Online Safety');
    if (desc.includes('coding') || desc.includes('code')) topics.push('Coding / Programming');
    if (desc.includes('product') || desc.includes('docs')) topics.push('Productivity Tools');
    if (desc.includes('career') || desc.includes('cv') || desc.includes('interview')) topics.push('Career Readiness');
    if (topics.length === 0) topics.push('General Digital Skills');
    const topic = topics[0];
    const otherTopics = ['Internet & Online Safety', 'Coding / Programming', 'Productivity Tools', 'Career Readiness', 'General Digital Skills'].filter(t => t !== topic).slice(0, 3);
    questions.push({ question: 'Which of these topics does this module primarily cover?', options: [topic, ...otherTopics], answerIndex: 0 });

    // Q5: source type
    const url = (module.contentUrl || '').toLowerCase();
    const source = url.includes('youtube') ? 'YouTube Video' : url ? 'External Resource' : 'No external resource';
    const otherSources = ['YouTube Video', 'External Resource', 'No external resource'].filter(s => s !== source).slice(0, 3);
    questions.push({ question: 'What type of resource is linked for this module?', options: [source, ...otherSources], answerIndex: 0 });

    // Ensure each question has 4 options
    for (const q of questions) {
        while (q.options.length < 4) {
            q.options.push('None of the above');
        }
    }

    return { title: module.title, questions };
}

app.get('/api/modules/:id/quiz', authenticateToken, (req, res) => {
    try {
        const data = readData();
        const module = data.modules.find(m => m.id === req.params.id);
        if (!module) return res.status(404).json({ error: 'Module not found' });

        const quiz = generateDeterministicQuiz(module, data);
        // Return quiz without answers
        const publicQuiz = { title: quiz.title, questions: quiz.questions.map(q => ({ question: q.question, options: q.options })) };
        res.json(publicQuiz);
    } catch (err) {
        console.error('Get quiz error:', err);
        res.status(500).json({ error: 'Failed to generate quiz' });
    }
});

app.post('/api/modules/:id/quiz/submit', authenticateToken, (req, res) => {
    try {
        const data = readData();
        const module = data.modules.find(m => m.id === req.params.id);
        if (!module) return res.status(404).json({ error: 'Module not found' });

        const quiz = generateDeterministicQuiz(module, data);
        const answers = req.body.answers || {};

        const results = quiz.questions.map((q, i) => {
            const a = typeof answers[i] !== 'undefined' ? Number(answers[i]) : null;
            const correct = a !== null && a === q.answerIndex;
            return {
                question: q.question,
                selectedIndex: a,
                correctIndex: q.answerIndex,
                correct
            };
        });

        const score = results.reduce((s, r) => s + (r.correct ? 1 : 0), 0);
        const total = results.length;

        res.json({ score, total, passed: score >= Math.ceil(total * 0.6), results });
    } catch (err) {
        console.error('Submit quiz error:', err);
        res.status(500).json({ error: 'Failed to submit quiz' });
    }
});

// ===== OPPORTUNITIES / MATCHES =====

// Create opportunity (mentor only)
app.post('/api/opportunities', authenticateToken, (req, res) => {
    try {
        if (req.user.role !== 'mentor') return res.status(403).json({ error: 'Only mentors can create opportunities' });
        const { title, description, learnerId } = req.body;
        if (!title || !description) return res.status(400).json({ error: 'Title and description are required' });

        const data = readData();
        data.opportunities = data.opportunities || [];

        const opp = {
            id: uuidv4(),
            mentorId: req.user.id,
            title,
            description,
            learnerId: learnerId || null,
            status: 'open',
            createdAt: new Date().toISOString()
        };

        data.opportunities.push(opp);
        writeData(data);

        res.status(201).json({ message: 'Opportunity created', opportunity: opp });
    } catch (err) {
        console.error('Create opportunity error:', err);
        res.status(500).json({ error: 'Failed to create opportunity' });
    }
});

// List opportunities (filtered)
app.get('/api/opportunities', authenticateToken, (req, res) => {
    try {
        const data = readData();
        data.opportunities = data.opportunities || [];
        let list = data.opportunities;
        if (req.user.role === 'mentor') list = list.filter(o => o.mentorId === req.user.id);
        else if (req.user.role === 'learner') list = list.filter(o => !o.learnerId || o.learnerId === req.user.id);
        res.json(list);
    } catch (err) {
        console.error('Get opportunities error:', err);
        res.status(500).json({ error: 'Failed to fetch opportunities' });
    }
});

// Respond to opportunity (learner accepts/declines)
app.post('/api/opportunities/:id/respond', authenticateToken, (req, res) => {
    try {
        if (req.user.role !== 'learner') return res.status(403).json({ error: 'Only learners can respond to opportunities' });
        const { status } = req.body;
        if (!['accepted', 'declined'].includes(status)) return res.status(400).json({ error: 'Invalid status' });

        const data = readData();
        const opp = data.opportunities.find(o => o.id === req.params.id);
        if (!opp) return res.status(404).json({ error: 'Opportunity not found' });

        // If opportunity targeted to a specific learner, ensure it's their offer
        if (opp.learnerId && opp.learnerId !== req.user.id) return res.status(403).json({ error: 'Not authorized for this opportunity' });

        opp.status = status;

        // Create match record if accepted
        data.matches = data.matches || [];
        if (status === 'accepted') {
            const match = { id: uuidv4(), mentorId: opp.mentorId, learnerId: req.user.id, opportunityId: opp.id, createdAt: new Date().toISOString() };
            data.matches.push(match);
        }

        writeData(data);
        res.json({ message: 'Response recorded', opportunity: opp });
    } catch (err) {
        console.error('Respond opportunity error:', err);
        res.status(500).json({ error: 'Failed to respond to opportunity' });
    }
});

// Get matches
app.get('/api/matches', authenticateToken, (req, res) => {
    try {
        const data = readData();
        data.matches = data.matches || [];
        let list = data.matches;
        if (req.user.role === 'mentor') list = list.filter(m => m.mentorId === req.user.id);
        else if (req.user.role === 'learner') list = list.filter(m => m.learnerId === req.user.id);
        res.json(list);
    } catch (err) {
        console.error('Get matches error:', err);
        res.status(500).json({ error: 'Failed to fetch matches' });
    }
});

// Mentor: view high-performing learners
app.get('/api/mentors/top-learners', authenticateToken, (req, res) => {
    try {
        if (req.user.role !== 'mentor') return res.status(403).json({ error: 'Mentor access required' });
        const data = readData();
        const totalModules = data.modules.length || 1;
        const learners = data.users.filter(u => u.role === 'learner').map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            completedCount: u.completedModules.length,
            progress: Math.round((u.completedModules.length / totalModules) * 100)
        }));
        learners.sort((a, b) => b.progress - a.progress);
        res.json(learners.slice(0, 10));
    } catch (err) {
        console.error('Get top learners error:', err);
        res.status(500).json({ error: 'Failed to fetch top learners' });
    }
});

// ===== MENTORSHIP ROUTES =====

// Get all mentors
app.get('/api/mentors', (req, res) => {
    try {
        const data = readData();
        const mentors = data.users.filter(u => u.role === 'mentor');
        res.json(mentors);
    } catch (error) {
        console.error('Get mentors error:', error);
        res.status(500).json({ error: 'Failed to fetch mentors' });
    }
});

// Create mentorship request
app.post('/api/mentorship/request', authenticateToken, (req, res) => {
    try {
        const { mentorId, topic } = req.body;
        const userId = req.user.id;

        if (!mentorId || !topic) {
            return res.status(400).json({ error: 'Mentor ID and topic are required' });
        }

        const data = readData();
        const mentor = data.users.find(u => u.id === mentorId && u.role === 'mentor');

        if (!mentor) {
            return res.status(404).json({ error: 'Mentor not found' });
        }

        const newRequest = {
            id: uuidv4(),
            userId,
            mentorId,
            topic,
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        data.mentorshipRequests.push(newRequest);
        writeData(data);

        res.status(201).json({
            message: 'Mentorship request created',
            request: newRequest
        });
    } catch (error) {
        console.error('Create mentorship request error:', error);
        res.status(500).json({ error: 'Failed to create mentorship request' });
    }
});

// Get mentorship requests (for learner or mentor)
app.get('/api/mentorship/requests', authenticateToken, (req, res) => {
    try {
        const data = readData();
        const userId = req.user.id;
        const userRole = req.user.role;

        let requests;
        if (userRole === 'learner') {
            requests = data.mentorshipRequests.filter(r => r.userId === userId);
        } else if (userRole === 'mentor') {
            requests = data.mentorshipRequests.filter(r => r.mentorId === userId);
        } else {
            requests = data.mentorshipRequests;
        }

        // Enrich with user data
        const enrichedRequests = requests.map(req => {
            const learner = data.users.find(u => u.id === req.userId);
            const mentor = data.users.find(u => u.id === req.mentorId);
            return {
                ...req,
                learnerName: learner?.name,
                mentorName: mentor?.name
            };
        });

        res.json(enrichedRequests);
    } catch (error) {
        console.error('Get mentorship requests error:', error);
        res.status(500).json({ error: 'Failed to fetch mentorship requests' });
    }
});

// Update mentorship request status
app.put('/api/mentorship/requests/:id', authenticateToken, (req, res) => {
    try {
        const { status } = req.body;
        const requestId = req.params.id;

        if (!['pending', 'accepted', 'declined'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const data = readData();
        const request = data.mentorshipRequests.find(r => r.id === requestId);

        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }

        // Only mentor can update their requests
        if (req.user.role === 'mentor' && request.mentorId !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized to update this request' });
        }

        request.status = status;
        writeData(data);

        res.json({
            message: 'Request updated successfully',
            request
        });
    } catch (error) {
        console.error('Update mentorship request error:', error);
        res.status(500).json({ error: 'Failed to update request' });
    }
});

// ===== USER ROUTES =====

// Get user profile
app.get('/api/users/:id', authenticateToken, (req, res) => {
    try {
        const data = readData();
        const user = data.users.find(u => u.id === req.params.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const progress = Math.round((user.completedModules.length / data.modules.length) * 100);

        res.json({
            ...user,
            progress,
            totalModules: data.modules.length,
            completedCount: user.completedModules.length
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// Reset user progress
app.post('/api/users/:id/reset-progress', authenticateToken, (req, res) => {
    try {
        const userId = req.params.id;

        // Users can only reset their own progress (or admin can reset anyone's)
        if (req.user.id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized to reset this user\'s progress' });
        }

        const data = readData();
        const user = data.users.find(u => u.id === userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.completedModules = [];
        writeData(data);

        res.json({
            message: 'Progress reset successfully',
            user
        });
    } catch (error) {
        console.error('Reset progress error:', error);
        res.status(500).json({ error: 'Failed to reset progress' });
    }
});

// ===== ADMIN ROUTES =====

// Get all users with progress
app.get('/api/admin/users', authenticateToken, requireAdmin, (req, res) => {
    try {
        const data = readData();
        const totalModules = data.modules.length;

        const usersWithProgress = data.users.map(user => ({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            completedCount: user.completedModules.length,
            totalModules,
            progress: Math.round((user.completedModules.length / totalModules) * 100),
            createdAt: user.createdAt
        }));

        res.json(usersWithProgress);
    } catch (error) {
        console.error('Get admin users error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Create new module (admin only)
app.post('/api/admin/modules', authenticateToken, requireAdmin, (req, res) => {
    try {
        const { title, description, contentUrl, duration, difficulty } = req.body;

        if (!title || !description) {
            return res.status(400).json({ error: 'Title and description are required' });
        }

        const data = readData();

        const newModule = {
            id: uuidv4(),
            title,
            description,
            contentUrl: contentUrl || '',
            duration: duration || '30 minutes',
            difficulty: difficulty || 'Beginner'
        };

        data.modules.push(newModule);
        writeData(data);

        res.status(201).json({
            message: 'Module created successfully',
            module: newModule
        });
    } catch (error) {
        console.error('Create module error:', error);
        res.status(500).json({ error: 'Failed to create module' });
    }
});

// Admin: recommend a learner to a mentor (creates a mentorship request with status 'recommended')
app.post('/api/admin/recommend', authenticateToken, requireAdmin, (req, res) => {
    try {
        const { learnerId, mentorId, message } = req.body;
        if (!learnerId || !mentorId) return res.status(400).json({ error: 'learnerId and mentorId are required' });

        const data = readData();
        const learner = data.users.find(u => u.id === learnerId && u.role === 'learner');
        const mentor = data.users.find(u => u.id === mentorId && u.role === 'mentor');

        if (!learner) return res.status(404).json({ error: 'Learner not found' });
        if (!mentor) return res.status(404).json({ error: 'Mentor not found' });

        const reqObj = {
            id: uuidv4(),
            userId: learnerId,
            mentorId,
            topic: message || `Recommended by admin ${req.user.email}`,
            status: 'recommended',
            adminId: req.user.id,
            createdAt: new Date().toISOString()
        };

        data.mentorshipRequests = data.mentorshipRequests || [];
        data.mentorshipRequests.push(reqObj);
        writeData(data);

        res.status(201).json({ message: 'Learner recommended to mentor', request: reqObj });
    } catch (err) {
        console.error('Admin recommend error:', err);
        res.status(500).json({ error: 'Failed to recommend learner' });
    }
});

// Admin: list recommendations (mentorship requests created by admin)
app.get('/api/admin/recommendations', authenticateToken, requireAdmin, (req, res) => {
    try {
        const data = readData();
        const recs = (data.mentorshipRequests || []).filter(r => r.adminId);
        res.json(recs);
    } catch (err) {
        console.error('Get recommendations error:', err);
        res.status(500).json({ error: 'Failed to fetch recommendations' });
    }
});

// Delete module (admin only)
app.delete('/api/admin/modules/:id', authenticateToken, requireAdmin, (req, res) => {
    try {
        const moduleId = req.params.id;
        const data = readData();

        const moduleIndex = data.modules.findIndex(m => m.id === moduleId);

        if (moduleIndex === -1) {
            return res.status(404).json({ error: 'Module not found' });
        }

        data.modules.splice(moduleIndex, 1);

        // Remove from all users' completed modules
        data.users.forEach(user => {
            user.completedModules = user.completedModules.filter(id => id !== moduleId);
        });

        writeData(data);

        res.json({ message: 'Module deleted successfully' });
    } catch (error) {
        console.error('Delete module error:', error);
        res.status(500).json({ error: 'Failed to delete module' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Initialize and start server
initializeData();

app.listen(PORT, () => {
    console.log(`🚀 YETT Backend running on http://localhost:${PORT}`);
    console.log(`📊 Data file: ${DATA_FILE}`);
    console.log(`🔑 JWT Secret configured: ${JWT_SECRET !== 'demo-secret-key-change-in-production' ? 'Yes' : 'No (using demo key)'}`);
});
