import React from 'react';
import { Link } from 'react-router-dom';

function Home({ user }) {
  return (
    <div>
      <section className="hero">
        <div className="container">
          <h1 className="hero-title">Empowering African Youth Through Technology</h1>
          <p className="hero-subtitle">
            Learn digital skills, connect with mentors, and unlock your potential with YETT
          </p>
          <div className="hero-actions">
            {user ? (
              <Link to="/dashboard" className="btn btn-secondary">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/signup" className="btn btn-secondary">
                  Get Started
                </Link>
                <Link to="/login" className="btn btn-ghost" style={{ color: 'white', borderColor: 'white' }}>
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 style={{ textAlign: 'center', marginBottom: '3rem' }}>What We Offer</h2>
          <div className="grid grid-3">
            <div className="card">
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}></div>
              <h3>Digital Literacy</h3>
              <p className="card-text">
                Access structured learning modules covering computer basics, coding, Internet Safety Campaigns, and more.
              </p>
            </div>
            <div className="card">
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}></div>
              <h3>Mentorship</h3>
              <p className="card-text">
                Connect with experienced mentors who can guide you on your learning journey and career path.
              </p>
            </div>
            <div className="card">
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}></div>
              <h3>Safe Technology Awareness</h3>
              <p className="card-text">
                Learn how to protect yourself online, identify misinformation, and use technology responsibly.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--card-bg)' }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Our Mission</h2>
          <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
            <p style={{ fontSize: '1.125rem', color: 'var(--text-light)', lineHeight: '1.8' }}>
              YETT aims to bridge the digital divide in Africa by providing the underserved youth with the tools,
              knowledge, and support they need to thrive in the digital economy. We believe that with the right
              resources and guidance, every young person has limitless potential.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="card" style={{ textAlign: 'center', background: 'linear-gradient(135deg, var(--primary) 0%, #5A3DC9 100%)', color: 'white', padding: '3rem 2rem' }}>
            <h2 style={{ color: 'white', marginBottom: '1rem' }}>Ready to Start Your Journey?</h2>
            <p style={{ opacity: 0.9, marginBottom: '2rem', fontSize: '1.125rem' }}>
              Join thousands of young Africans already learning and growing with YETT
            </p>
            {!user && (
              <Link to="/signup" className="btn btn-secondary">
                Sign Up Now
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;