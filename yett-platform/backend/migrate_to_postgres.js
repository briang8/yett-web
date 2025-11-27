/*
  Migration script: create Postgres schema and seed from data.json.
  Usage: set DATABASE_URL (postgres) in env, then:
    node migrate_to_postgres.js
*/
const fs = require('fs');
const path = require('path');
const db = require('./db_pg');
const { v4: uuidv4 } = require('uuid');

async function run() {
    try {
        const dataPath = path.join(__dirname, 'data.json');
        if (!fs.existsSync(dataPath)) {
            console.error('data.json not found in backend/');
            process.exit(1);
        }

        const raw = fs.readFileSync(dataPath, 'utf8');
        const data = JSON.parse(raw);

        console.log('Creating tables (Postgres)...');

        await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT,
        email TEXT UNIQUE,
        password TEXT,
        role TEXT,
        progress INT DEFAULT 0,
        completed_modules JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ DEFAULT now()
      )
    `);

        await db.query(`
      CREATE TABLE IF NOT EXISTS modules (
        id TEXT PRIMARY KEY,
        title TEXT,
        description TEXT,
        content_url TEXT,
        duration TEXT,
        difficulty TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
      )
    `);

        await db.query(`
      CREATE TABLE IF NOT EXISTS opportunities (
        id TEXT PRIMARY KEY,
        mentor_id TEXT,
        title TEXT,
        description TEXT,
        learner_id TEXT,
        status TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
      )
    `);

        await db.query(`
      CREATE TABLE IF NOT EXISTS mentorship_requests (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        mentor_id TEXT,
        topic TEXT,
        status TEXT,
        admin_id TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
      )
    `);

        await db.query(`
      CREATE TABLE IF NOT EXISTS matches (
        id TEXT PRIMARY KEY,
        mentor_id TEXT,
        learner_id TEXT,
        opportunity_id TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
      )
    `);

        console.log('Inserting data...');

        // Users
        if (Array.isArray(data.users)) {
            for (const u of data.users) {
                const id = u.id || uuidv4();
                const completed = JSON.stringify(u.completedModules || []);
                await db.query(
                    `INSERT INTO users (id, name, email, password, role, progress, completed_modules) VALUES ($1,$2,$3,$4,$5,$6,$7)
           ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email`,
                    [id, u.name || null, u.email || null, u.password || null, u.role || null, u.progress || 0, completed]
                );
            }
        }

        // Modules
        if (Array.isArray(data.modules)) {
            for (const m of data.modules) {
                const id = m.id || uuidv4();
                await db.query(
                    `INSERT INTO modules (id, title, description, content_url, duration, difficulty) VALUES ($1,$2,$3,$4,$5,$6)
           ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title`,
                    [id, m.title || null, m.description || null, m.contentUrl || m.content_url || null, m.duration || null, m.difficulty || null]
                );
            }
        }

        // Opportunities
        if (Array.isArray(data.opportunities)) {
            for (const o of data.opportunities) {
                const id = o.id || uuidv4();
                await db.query(
                    `INSERT INTO opportunities (id, mentor_id, title, description, status) VALUES ($1,$2,$3,$4,$5)
           ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title`,
                    [id, o.mentorId || o.mentor_id || null, o.title || null, o.description || null, o.status || 'open']
                );
            }
        }

        // Mentorship requests
        if (Array.isArray(data.mentorshipRequests)) {
            for (const r of data.mentorshipRequests) {
                const id = r.id || uuidv4();
                await db.query(
                    `INSERT INTO mentorship_requests (id, user_id, mentor_id, topic, status, admin_id) VALUES ($1,$2,$3,$4,$5,$6)
           ON CONFLICT (id) DO UPDATE SET topic = EXCLUDED.topic`,
                    [id, r.userId || r.user_id || null, r.mentorId || r.mentor_id || null, r.topic || null, r.status || 'pending', r.adminId || null]
                );
            }
        }

        // Matches
        if (Array.isArray(data.matches)) {
            for (const m of data.matches) {
                const id = m.id || uuidv4();
                await db.query(
                    `INSERT INTO matches (id, mentor_id, learner_id, opportunity_id) VALUES ($1,$2,$3,$4)
           ON CONFLICT (id) DO UPDATE SET mentor_id = EXCLUDED.mentor_id`,
                    [id, m.mentorId || m.mentor_id || null, m.learnerId || m.learner_id || null, m.opportunityId || m.opportunity_id || null]
                );
            }
        }

        console.log('Postgres migration complete.');
        process.exit(0);
    } catch (err) {
        console.error('Migration error:', err);
        process.exit(1);
    }
}

run();
