require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
// Legacy file-backed storage removed. Postgres is required; file I/O imports removed.
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'demo-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());

// Legacy file-backed storage removed. Postgres is required; file I/O and
// the data.json initialization logic have been removed.

// Postgres helper (used when DATABASE_URL is provided)
const dbPg = require('./db_pg');
const USE_PG = !!process.env.DATABASE_URL;

// Enforce Postgres-only mode. Previously the server fell back to a file-backed
// `data.json`. After migrating to Postgres we require `DATABASE_URL` to be set
// so all reads/writes go to the database. Exit early with a clear message if
// the environment is not configured.
if (!USE_PG) {
    console.error('ERROR: DATABASE_URL not set. This server requires Postgres. Set DATABASE_URL and restart.');
    process.exit(1);
}

// Provide clear stubs for the legacy file-backed helpers. These should never
// be called because the server enforces Postgres-only mode above. If any
// leftover code paths attempt to use them, they will throw with a helpful
// message so the issue is obvious during debugging.
// File-backed helpers removed — server requires Postgres via DATABASE_URL.

async function findUserByEmail(email) {
    if (USE_PG) {
        const rows = await dbPg.query('SELECT * FROM users WHERE email = $1', [email]);
        return rows[0] || null;
    }
    const data = readData();
    return data.users.find(u => u.email === email) || null;
}

async function createUserInDb(userObj) {
    if (USE_PG) {
        const sql = `INSERT INTO users (id, name, email, password, role, progress, completed_modules, created_at)
                     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`;
        await dbPg.query(sql, [userObj.id, userObj.name, userObj.email, userObj.password, userObj.role, userObj.progress || 0, JSON.stringify(userObj.completedModules || []), userObj.createdAt]);
        return userObj;
    }
    const data = readData();
    data.users.push(userObj);
    writeData(data);
    return userObj;
}

async function getUserById(id) {
    if (USE_PG) {
        const rows = await dbPg.query('SELECT * FROM users WHERE id = $1', [id]);
        return rows[0] || null;
    }
    const data = readData();
    return data.users.find(u => u.id === id) || null;
}

async function listUsersWithProgress() {
    if (USE_PG) {
        const modules = await dbPg.query('SELECT COUNT(*)::int as count FROM modules');
        const totalModules = modules[0] ? modules[0].count : 0;
        const users = await dbPg.query('SELECT id, name, email, role, completed_modules, created_at FROM users ORDER BY created_at DESC');
        return users.map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            completedCount: Array.isArray(u.completed_modules) ? u.completed_modules.length : (u.completed_modules ? JSON.parse(u.completed_modules).length : 0),
            totalModules,
            progress: totalModules ? Math.round(((Array.isArray(u.completed_modules) ? u.completed_modules.length : (u.completed_modules ? JSON.parse(u.completed_modules).length : 0)) / totalModules) * 100) : 0,
            createdAt: u.created_at
        }));
    }
    const data = readData();
    const totalModules = data.modules.length;
    return data.users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        completedCount: user.completedModules.length,
        totalModules,
        progress: Math.round((user.completedModules.length / totalModules) * 100),
        createdAt: user.createdAt
    }));
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
app.post('/api/register', async (req, res) => {
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

        // Check if user already exists (DB or file)
        const existing = await findUserByEmail(email);
        if (existing) return res.status(400).json({ error: 'User with this email already exists' });

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

        await createUserInDb(newUser);

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
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await findUserByEmail(email);

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
app.post('/api/admin/create-admin', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password required' });
        if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

        const existing = await findUserByEmail(email);
        if (existing) return res.status(400).json({ error: 'User exists' });

        const hashed = bcrypt.hashSync(password, 10);
        const newUser = { id: uuidv4(), name, email, role: 'admin', password: hashed, completedModules: [], createdAt: new Date().toISOString() };

        await createUserInDb(newUser);

        res.status(201).json({ message: 'Admin created', user: { id: newUser.id, name: newUser.name, email: newUser.email } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create admin' });
    }
});

// ===== MODULES ROUTES =====

// Get all modules
app.get('/api/modules', async (req, res) => {
    try {
        if (USE_PG) {
            const rows = await dbPg.query('SELECT id, title, description, content_url, duration, difficulty, created_at FROM modules ORDER BY created_at DESC');
            // map content_url -> contentUrl for frontend compatibility
            const mapped = rows.map(r => ({ id: r.id, title: r.title, description: r.description, contentUrl: r.content_url, duration: r.duration, difficulty: r.difficulty, createdAt: r.created_at }));
            return res.json(mapped);
        }

        const data = readData();
        res.json(data.modules);
    } catch (error) {
        console.error('Get modules error:', error);
        res.status(500).json({ error: 'Failed to fetch modules' });
    }
});

// Get single module
app.get('/api/modules/:id', async (req, res) => {
    try {
        if (USE_PG) {
            const rows = await dbPg.query('SELECT id, title, description, content_url, duration, difficulty, created_at FROM modules WHERE id = $1', [req.params.id]);
            const m = rows[0];
            if (!m) return res.status(404).json({ error: 'Module not found' });
            return res.json({ id: m.id, title: m.title, description: m.description, contentUrl: m.content_url, duration: m.duration, difficulty: m.difficulty, createdAt: m.created_at });
        }

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
app.post('/api/modules/:id/complete', authenticateToken, async (req, res) => {
    try {
        const moduleId = req.params.id;
        const userId = req.user.id;

        if (USE_PG) {
            // verify module exists
            const modRows = await dbPg.query('SELECT id FROM modules WHERE id = $1', [moduleId]);
            if (!modRows[0]) return res.status(404).json({ error: 'Module not found' });

            const userRows = await dbPg.query('SELECT id, completed_modules FROM users WHERE id = $1', [userId]);
            const user = userRows[0];
            if (!user) return res.status(404).json({ error: 'User not found' });

            const completed = Array.isArray(user.completed_modules) ? user.completed_modules.slice() : (user.completed_modules ? JSON.parse(user.completed_modules) : []);
            if (!completed.includes(moduleId)) {
                completed.push(moduleId);
                await dbPg.query('UPDATE users SET completed_modules = $1 WHERE id = $2', [JSON.stringify(completed), userId]);
            }

            const modulesCountRows = await dbPg.query('SELECT COUNT(*)::int as count FROM modules');
            const totalModules = modulesCountRows[0] ? modulesCountRows[0].count : 0;
            const progress = totalModules ? Math.round((completed.length / totalModules) * 100) : 0;

            return res.json({ message: 'Module marked as complete', completedModules: completed, progress, totalModules });
        }

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

// Admin: create a module
app.post('/api/modules', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { title, description, contentUrl, duration, difficulty } = req.body;
        if (!title) return res.status(400).json({ error: 'Title required' });

        if (USE_PG) {
            const id = uuidv4();
            await dbPg.query('INSERT INTO modules (id, title, description, content_url, duration, difficulty, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)', [id, title, description || null, contentUrl || null, duration || null, difficulty || null, new Date().toISOString()]);
            const rows = await dbPg.query('SELECT id, title, description, content_url, duration, difficulty, created_at FROM modules WHERE id = $1', [id]);
            const m = rows[0];
            return res.status(201).json({ message: 'Module created', module: { id: m.id, title: m.title, description: m.description, contentUrl: m.content_url, duration: m.duration, difficulty: m.difficulty, createdAt: m.created_at } });
        }

        const data = readData();
        const m = { id: uuidv4(), title, description: description || '', contentUrl: contentUrl || '', duration: duration || '', difficulty: difficulty || '' };
        data.modules.push(m);
        writeData(data);
        res.status(201).json({ message: 'Module created', module: m });
    } catch (err) {
        console.error('Create module error:', err);
        res.status(500).json({ error: 'Failed to create module' });
    }
});

// Admin: delete a module
app.delete('/api/modules/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        if (USE_PG) {
            await dbPg.query('DELETE FROM modules WHERE id = $1', [id]);
            // Optionally remove from users' completed_modules
            const users = await dbPg.query('SELECT id, completed_modules FROM users');
            for (const u of users) {
                const completed = Array.isArray(u.completed_modules) ? u.completed_modules.slice() : (u.completed_modules ? JSON.parse(u.completed_modules) : []);
                const idx = completed.indexOf(id);
                if (idx !== -1) {
                    completed.splice(idx, 1);
                    await dbPg.query('UPDATE users SET completed_modules = $1 WHERE id = $2', [JSON.stringify(completed), u.id]);
                }
            }
            return res.json({ message: 'Module deleted' });
        }

        const data = readData();
        const idx = data.modules.findIndex(m => m.id === id);
        if (idx === -1) return res.status(404).json({ error: 'Module not found' });
        data.modules.splice(idx, 1);
        // remove from users' completedModules
        data.users.forEach(u => {
            const i = u.completedModules.indexOf(id);
            if (i !== -1) u.completedModules.splice(i, 1);
        });
        writeData(data);
        res.json({ message: 'Module deleted' });
    } catch (err) {
        console.error('Delete module error:', err);
        res.status(500).json({ error: 'Failed to delete module' });
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

app.get('/api/modules/:id/quiz', authenticateToken, async (req, res) => {
    try {
        if (USE_PG) {
            const modulesRows = await dbPg.query('SELECT id, title, description, content_url, duration, difficulty FROM modules ORDER BY created_at');
            const modules = modulesRows.map(m => ({ id: m.id, title: m.title, description: m.description, contentUrl: m.content_url, duration: m.duration, difficulty: m.difficulty }));
            const module = modules.find(m => m.id === req.params.id);
            if (!module) return res.status(404).json({ error: 'Module not found' });
            const quiz = generateDeterministicQuiz(module, { modules });
            const publicQuiz = { title: quiz.title, questions: quiz.questions.map(q => ({ question: q.question, options: q.options })) };
            return res.json(publicQuiz);
        }

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

app.post('/api/modules/:id/quiz/submit', authenticateToken, async (req, res) => {
    try {
        let module, dataObj;
        if (USE_PG) {
            const modulesRows = await dbPg.query('SELECT id, title, description, content_url, duration, difficulty FROM modules ORDER BY created_at');
            const modules = modulesRows.map(m => ({ id: m.id, title: m.title, description: m.description, contentUrl: m.content_url, duration: m.duration, difficulty: m.difficulty }));
            module = modules.find(m => m.id === req.params.id);
            dataObj = { modules };
            if (!module) return res.status(404).json({ error: 'Module not found' });
        } else {
            const data = readData();
            module = data.modules.find(m => m.id === req.params.id);
            dataObj = data;
            if (!module) return res.status(404).json({ error: 'Module not found' });
        }

        const quiz = generateDeterministicQuiz(module, dataObj);
        const answers = req.body.answers || {};

        const results = quiz.questions.map((q, i) => {
            const a = typeof answers[i] !== 'undefined' ? Number(answers[i]) : null;
            const correct = a !== null && a === q.answerIndex;
            return { question: q.question, selectedIndex: a, correctIndex: q.answerIndex, correct };
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
app.post('/api/opportunities', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'mentor') return res.status(403).json({ error: 'Only mentors can create opportunities' });
        const { title, description, learnerId } = req.body;
        if (!title || !description) return res.status(400).json({ error: 'Title and description are required' });

        if (USE_PG) {
            const createdAt = new Date().toISOString();
            const rows = await dbPg.query(
                `INSERT INTO opportunities (id, mentor_id, title, description, learner_id, status, created_at)
                 VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
                [uuidv4(), req.user.id, title, description, learnerId || null, 'open', createdAt]
            );
            return res.status(201).json({ message: 'Opportunity created', opportunity: rows[0] });
        }

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
app.get('/api/opportunities', authenticateToken, async (req, res) => {
    try {
        if (USE_PG) {
            let sql = 'SELECT * FROM opportunities';
            const params = [];
            if (req.user.role === 'mentor') {
                sql += ' WHERE mentor_id = $1';
                params.push(req.user.id);
            } else if (req.user.role === 'learner') {
                sql += ' WHERE (learner_id IS NULL OR learner_id = $1)';
                params.push(req.user.id);
            }
            const rows = await dbPg.query(sql, params);
            return res.json(rows);
        }

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
app.post('/api/opportunities/:id/respond', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'learner') return res.status(403).json({ error: 'Only learners can respond to opportunities' });
        const { status } = req.body;
        if (!['accepted', 'declined'].includes(status)) return res.status(400).json({ error: 'Invalid status' });

        if (USE_PG) {
            // Fetch opportunity
            const rows = await dbPg.query('SELECT * FROM opportunities WHERE id = $1', [req.params.id]);
            const opp = rows[0];
            if (!opp) return res.status(404).json({ error: 'Opportunity not found' });
            if (opp.learner_id && opp.learner_id !== req.user.id) return res.status(403).json({ error: 'Not authorized for this opportunity' });

            // Update status and possibly insert match inside a transaction
            const client = await dbPg.pool.connect();
            try {
                await client.query('BEGIN');
                const upd = await client.query('UPDATE opportunities SET status = $1 WHERE id = $2 RETURNING *', [status, req.params.id]);
                if (status === 'accepted') {
                    await client.query('INSERT INTO matches (id, mentor_id, learner_id, opportunity_id, created_at) VALUES ($1,$2,$3,$4,$5)', [uuidv4(), opp.mentor_id, req.user.id, opp.id, new Date().toISOString()]);
                }
                await client.query('COMMIT');
                const updatedOpp = upd.rows[0];
                return res.json({ message: 'Response recorded', opportunity: updatedOpp });
            } catch (e) {
                await client.query('ROLLBACK');
                throw e;
            } finally {
                client.release();
            }
        }

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
app.get('/api/matches', authenticateToken, async (req, res) => {
    try {
        if (USE_PG) {
            let sql = 'SELECT * FROM matches';
            const params = [];
            if (req.user.role === 'mentor') {
                sql += ' WHERE mentor_id = $1';
                params.push(req.user.id);
            } else if (req.user.role === 'learner') {
                sql += ' WHERE learner_id = $1';
                params.push(req.user.id);
            }
            const rows = await dbPg.query(sql, params);
            return res.json(rows);
        }

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
app.get('/api/mentors/top-learners', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'mentor') return res.status(403).json({ error: 'Mentor access required' });
        if (USE_PG) {
            const totalRows = await dbPg.query('SELECT COUNT(*)::int as count FROM modules');
            const totalModules = totalRows[0] ? totalRows[0].count : 1;
            const learners = await dbPg.query("SELECT id, name, email, completed_modules FROM users WHERE role = 'learner'");
            const mapped = learners.map(u => {
                const completed = Array.isArray(u.completed_modules) ? u.completed_modules : (u.completed_modules ? JSON.parse(u.completed_modules) : []);
                const completedCount = completed.length;
                const progress = totalModules ? Math.round((completedCount / totalModules) * 100) : 0;
                return { id: u.id, name: u.name, email: u.email, completedCount, progress };
            });
            mapped.sort((a, b) => b.progress - a.progress);
            return res.json(mapped.slice(0, 10));
        }

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
app.get('/api/mentors', async (req, res) => {
    try {
        if (USE_PG) {
            const rows = await dbPg.query("SELECT id, name, email, role, created_at FROM users WHERE role = 'mentor'");
            return res.json(rows.map(r => ({ id: r.id, name: r.name, email: r.email, role: r.role, createdAt: r.created_at })));
        }
        const data = readData();
        const mentors = data.users.filter(u => u.role === 'mentor');
        res.json(mentors);
    } catch (error) {
        console.error('Get mentors error:', error);
        res.status(500).json({ error: 'Failed to fetch mentors' });
    }
});

// Create mentorship request
app.post('/api/mentorship/request', authenticateToken, async (req, res) => {
    try {
        const { mentorId, topic } = req.body;
        const userId = req.user.id;

        if (!mentorId || !topic) {
            return res.status(400).json({ error: 'Mentor ID and topic are required' });
        }

        if (USE_PG) {
            const mentorRows = await dbPg.query('SELECT id FROM users WHERE id = $1 AND role = $2', [mentorId, 'mentor']);
            if (!mentorRows[0]) return res.status(404).json({ error: 'Mentor not found' });
            const id = uuidv4();
            const createdAt = new Date().toISOString();
            await dbPg.query('INSERT INTO mentorship_requests (id, user_id, mentor_id, topic, status, created_at) VALUES ($1,$2,$3,$4,$5,$6)', [id, userId, mentorId, topic, 'pending', createdAt]);
            const rows = await dbPg.query('SELECT * FROM mentorship_requests WHERE id = $1', [id]);
            return res.status(201).json({ message: 'Mentorship request created', request: rows[0] });
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

        res.status(201).json({ message: 'Mentorship request created', request: newRequest });
    } catch (error) {
        console.error('Create mentorship request error:', error);
        res.status(500).json({ error: 'Failed to create mentorship request' });
    }
});

// Get mentorship requests (for learner or mentor)
app.get('/api/mentorship/requests', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;

        if (USE_PG) {
            let sql = 'SELECT * FROM mentorship_requests';
            const params = [];
            if (userRole === 'learner') {
                sql += ' WHERE user_id = $1';
                params.push(userId);
            } else if (userRole === 'mentor') {
                sql += ' WHERE mentor_id = $1';
                params.push(userId);
            }
            const reqs = await dbPg.query(sql, params);
            const enriched = [];
            for (const r of reqs) {
                const learner = (await dbPg.query('SELECT id, name FROM users WHERE id = $1', [r.user_id]))[0];
                const mentor = (await dbPg.query('SELECT id, name FROM users WHERE id = $1', [r.mentor_id]))[0];
                enriched.push({ ...r, learnerName: learner?.name, mentorName: mentor?.name });
            }
            return res.json(enriched);
        }

        const data = readData();
        const userIdLocal = req.user.id;
        const userRoleLocal = req.user.role;

        let requests;
        if (userRoleLocal === 'learner') {
            requests = data.mentorshipRequests.filter(r => r.userId === userIdLocal);
        } else if (userRoleLocal === 'mentor') {
            requests = data.mentorshipRequests.filter(r => r.mentorId === userIdLocal);
        } else {
            requests = data.mentorshipRequests;
        }

        const enrichedRequests = requests.map(reqObj => {
            const learner = data.users.find(u => u.id === reqObj.userId);
            const mentor = data.users.find(u => u.id === reqObj.mentorId);
            return { ...reqObj, learnerName: learner?.name, mentorName: mentor?.name };
        });

        res.json(enrichedRequests);
    } catch (error) {
        console.error('Get mentorship requests error:', error);
        res.status(500).json({ error: 'Failed to fetch mentorship requests' });
    }
});

// Update mentorship request status
app.put('/api/mentorship/requests/:id', authenticateToken, async (req, res) => {
    try {
        const { status } = req.body;
        const requestId = req.params.id;

        if (!['pending', 'accepted', 'declined'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        if (USE_PG) {
            const rows = await dbPg.query('SELECT * FROM mentorship_requests WHERE id = $1', [requestId]);
            const request = rows[0];
            if (!request) return res.status(404).json({ error: 'Request not found' });
            if (req.user.role === 'mentor' && request.mentor_id !== req.user.id) return res.status(403).json({ error: 'Not authorized to update this request' });
            await dbPg.query('UPDATE mentorship_requests SET status = $1 WHERE id = $2', [status, requestId]);
            const updated = (await dbPg.query('SELECT * FROM mentorship_requests WHERE id = $1', [requestId]))[0];
            return res.json({ message: 'Request updated successfully', request: updated });
        }

        const data = readData();
        const request = data.mentorshipRequests.find(r => r.id === requestId);

        if (!request) return res.status(404).json({ error: 'Request not found' });
        if (req.user.role === 'mentor' && request.mentorId !== req.user.id) return res.status(403).json({ error: 'Not authorized to update this request' });

        request.status = status;
        writeData(data);

        res.json({ message: 'Request updated successfully', request });
    } catch (error) {
        console.error('Update mentorship request error:', error);
        res.status(500).json({ error: 'Failed to update request' });
    }
});

// ===== USER ROUTES =====

// Get user profile
app.get('/api/users/:id', authenticateToken, async (req, res) => {
    try {
        const user = await getUserById(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        // get modules count
        let totalModules = 0;
        if (USE_PG) {
            const m = await dbPg.query('SELECT COUNT(*)::int as count FROM modules');
            totalModules = m[0] ? m[0].count : 0;
        } else {
            const data = readData();
            totalModules = data.modules.length;
        }

        const completed = USE_PG ? (Array.isArray(user.completed_modules) ? user.completed_modules : (user.completed_modules ? JSON.parse(user.completed_modules) : [])) : user.completedModules;
        const progress = totalModules ? Math.round((completed.length / totalModules) * 100) : 0;

        res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            completedModules: completed,
            progress,
            totalModules,
            completedCount: completed.length,
            createdAt: user.createdAt || user.created_at
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// Reset user progress
app.post('/api/users/:id/reset-progress', authenticateToken, async (req, res) => {
    try {
        const userId = req.params.id;

        // Users can only reset their own progress (or admin can reset anyone's)
        if (req.user.id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized to reset this user\'s progress' });
        }

        if (USE_PG) {
            const rows = await dbPg.query('SELECT id FROM users WHERE id = $1', [userId]);
            if (!rows[0]) return res.status(404).json({ error: 'User not found' });
            await dbPg.query('UPDATE users SET completed_modules = $1 WHERE id = $2', [JSON.stringify([]), userId]);
            const updated = (await dbPg.query('SELECT id, name, email, role, completed_modules, created_at FROM users WHERE id = $1', [userId]))[0];
            return res.json({ message: 'Progress reset successfully', user: updated });
        }

        const data = readData();
        const user = data.users.find(u => u.id === userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.completedModules = [];
        writeData(data);

        res.json({ message: 'Progress reset successfully', user });
    } catch (error) {
        console.error('Reset progress error:', error);
        res.status(500).json({ error: 'Failed to reset progress' });
    }
});

// ===== ADMIN ROUTES =====

// Get all users with progress
app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const usersWithProgress = await listUsersWithProgress();
        res.json(usersWithProgress);
    } catch (error) {
        console.error('Get admin users error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Create new module (admin only)
// Create new module (admin only)
app.post('/api/admin/modules', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { title, description, contentUrl, duration, difficulty } = req.body;

        if (!title || !description) {
            return res.status(400).json({ error: 'Title and description are required' });
        }

        if (USE_PG) {
            const id = uuidv4();
            const createdAt = new Date().toISOString();
            await dbPg.query('INSERT INTO modules (id, title, description, content_url, duration, difficulty, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)', [id, title, description || null, contentUrl || null, duration || null, difficulty || null, createdAt]);
            const m = (await dbPg.query('SELECT id, title, description, content_url, duration, difficulty, created_at FROM modules WHERE id = $1', [id]))[0];
            return res.status(201).json({ message: 'Module created successfully', module: { id: m.id, title: m.title, description: m.description, contentUrl: m.content_url, duration: m.duration, difficulty: m.difficulty, createdAt: m.created_at } });
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
app.post('/api/admin/recommend', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { learnerId, mentorId, message } = req.body;
        if (!learnerId || !mentorId) return res.status(400).json({ error: 'learnerId and mentorId are required' });

        if (USE_PG) {
            const learnerRows = await dbPg.query('SELECT id FROM users WHERE id = $1 AND role = $2', [learnerId, 'learner']);
            const mentorRows = await dbPg.query('SELECT id FROM users WHERE id = $1 AND role = $2', [mentorId, 'mentor']);
            if (!learnerRows[0]) return res.status(404).json({ error: 'Learner not found' });
            if (!mentorRows[0]) return res.status(404).json({ error: 'Mentor not found' });
            const id = uuidv4();
            const createdAt = new Date().toISOString();
            const topic = message || `Recommended by admin ${req.user.email}`;
            await dbPg.query('INSERT INTO mentorship_requests (id, user_id, mentor_id, topic, status, admin_id, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)', [id, learnerId, mentorId, topic, 'recommended', req.user.id, createdAt]);
            const rows = await dbPg.query('SELECT * FROM mentorship_requests WHERE id = $1', [id]);
            return res.status(201).json({ message: 'Learner recommended to mentor', request: rows[0] });
        }

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
app.get('/api/admin/recommendations', authenticateToken, requireAdmin, async (req, res) => {
    try {
        if (USE_PG) {
            const rows = await dbPg.query('SELECT * FROM mentorship_requests WHERE admin_id IS NOT NULL');
            return res.json(rows);
        }
        const data = readData();
        const recs = (data.mentorshipRequests || []).filter(r => r.adminId);
        res.json(recs);
    } catch (err) {
        console.error('Get recommendations error:', err);
        res.status(500).json({ error: 'Failed to fetch recommendations' });
    }
});

// (previously: admin platform statistics route - removed)

// Delete module (admin only)
app.delete('/api/admin/modules/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const moduleId = req.params.id;
        if (USE_PG) {
            await dbPg.query('DELETE FROM modules WHERE id = $1', [moduleId]);
            // remove from users' completed_modules
            const users = await dbPg.query('SELECT id, completed_modules FROM users');
            for (const u of users) {
                const completed = Array.isArray(u.completed_modules) ? u.completed_modules.slice() : (u.completed_modules ? JSON.parse(u.completed_modules) : []);
                const idx = completed.indexOf(moduleId);
                if (idx !== -1) {
                    completed.splice(idx, 1);
                    await dbPg.query('UPDATE users SET completed_modules = $1 WHERE id = $2', [JSON.stringify(completed), u.id]);
                }
            }
            return res.json({ message: 'Module deleted successfully' });
        }

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
// initializeData removed; database is seeded via migration scripts.

app.listen(PORT, () => {
    console.log(` YETT Backend running on http://localhost:${PORT}`);
    console.log(' Data storage: PostgreSQL (no local data.json)');
    console.log(` JWT Secret configured: ${JWT_SECRET !== 'demo-secret-key-change-in-production' ? 'Yes' : 'No (using demo key)'}`);
});
