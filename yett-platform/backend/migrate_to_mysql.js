/*
  Migration script: create schema and seed from data.json into MySQL.
  Usage: set DATABASE_URL or DB_HOST/DB_USER/DB_PASS/DB_NAME in env, then
    node migrate_to_mysql.js
*/
const fs = require('fs');
const path = require('path');
const db = require('./db');
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

        console.log('Creating tables...');

        // Create tables (simple schema)
        await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255) UNIQUE,
        password VARCHAR(255),
        role VARCHAR(32),
        progress INT DEFAULT 0,
        completed_modules JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        await db.query(`
      CREATE TABLE IF NOT EXISTS modules (
        id VARCHAR(36) PRIMARY KEY,
        title TEXT,
        description TEXT,
        content_url TEXT,
        duration VARCHAR(64),
        difficulty VARCHAR(32),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        await db.query(`
      CREATE TABLE IF NOT EXISTS opportunities (
        id VARCHAR(36) PRIMARY KEY,
        mentor_id VARCHAR(36),
        title TEXT,
        description TEXT,
        status VARCHAR(32),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        await db.query(`
      CREATE TABLE IF NOT EXISTS mentorship_requests (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36),
        mentor_id VARCHAR(36),
        topic TEXT,
        status VARCHAR(32),
        admin_id VARCHAR(36),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        await db.query(`
      CREATE TABLE IF NOT EXISTS matches (
        id VARCHAR(36) PRIMARY KEY,
        mentor_id VARCHAR(36),
        learner_id VARCHAR(36),
        opportunity_id VARCHAR(36),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        console.log('Inserting data...');

        // Users
        if (Array.isArray(data.users)) {
            for (const u of data.users) {
                await db.query(
                    `INSERT INTO users (id, name, email, password, role, progress, completed_modules) VALUES (?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE name=VALUES(name), email=VALUES(email)`,
                    [u.id || uuidv4(), u.name || null, u.email || null, u.password || null, u.role || null, u.progress || 0, JSON.stringify(u.completedModules || [])]
                );
            }
        }

        // Modules
        if (Array.isArray(data.modules)) {
            for (const m of data.modules) {
                await db.query(
                    `INSERT INTO modules (id, title, description, content_url, duration, difficulty) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE title=VALUES(title)`,
                    [m.id || uuidv4(), m.title || null, m.description || null, m.contentUrl || m.content_url || null, m.duration || null, m.difficulty || null]
                );
            }
        }

        // Opportunities
        if (Array.isArray(data.opportunities)) {
            for (const o of data.opportunities) {
                await db.query(
                    `INSERT INTO opportunities (id, mentor_id, title, description, status) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE title=VALUES(title)`,
                    [o.id || uuidv4(), o.mentorId || o.mentor_id || null, o.title || null, o.description || null, o.status || 'open']
                );
            }
        }

        // Mentorship requests
        if (Array.isArray(data.mentorshipRequests)) {
            for (const r of data.mentorshipRequests) {
                await db.query(
                    `INSERT INTO mentorship_requests (id, user_id, mentor_id, topic, status, admin_id) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE topic=VALUES(topic)`,
                    [r.id || uuidv4(), r.userId || r.user_id || null, r.mentorId || r.mentor_id || null, r.topic || null, r.status || 'pending', r.adminId || null]
                );
            }
        }

        // Matches
        if (Array.isArray(data.matches)) {
            for (const m of data.matches) {
                await db.query(
                    `INSERT INTO matches (id, mentor_id, learner_id, opportunity_id) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE mentor_id=VALUES(mentor_id)`,
                    [m.id || uuidv4(), m.mentorId || m.mentor_id || null, m.learnerId || m.learner_id || null, m.opportunityId || m.opportunity_id || null]
                );
            }
        }

        console.log('Migration complete.');
        process.exit(0);
    } catch (err) {
        console.error('Migration error:', err);
        process.exit(1);
    }
}

run();
