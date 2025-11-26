import React from 'react';

function About() {
  return (
    <div className="section">
      <div className="container">
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ marginBottom: '1rem' }}>About YETT</h1>
          <p style={{ fontSize: '1.25rem', color: 'var(--text-light)', marginBottom: '3rem' }}>
            Youth Empowerment through Tech
          </p>

          <div className="card" style={{ marginBottom: '2rem' }}>
            <h2>Our Mission</h2>
            <p style={{ lineHeight: '1.8', color: 'var(--text-light)' }}>
              YETT aims to leverage technology to empower and uplift communities, especially the youth in Africa. 
              We provide opportunities for those with limited means but limitless potential, fostering a supportive 
              environment where they can innovate without fear of failure.
            </p>
          </div>

          <div className="card" style={{ marginBottom: '2rem' }}>
            <h2>The Challenge</h2>
            <p style={{ lineHeight: '1.8', color: 'var(--text-light)' }}>
              African youth, particularly in rural areas and underserved communities, face limited access to digital 
              skills, affordable technology, and career guidance in the growing digital economy. Traditional education 
              systems are struggling to keep up with the changing landscape of work. As digitalization moves forward, 
              there is an increasing need for new skills, mindsets, and digital literacy.
            </p>
          </div>

          <div className="card" style={{ marginBottom: '2rem' }}>
            <h2>Our Solution</h2>
            <p style={{ lineHeight: '1.8', color: 'var(--text-light)', marginBottom: '1rem' }}>
              YETT provides a comprehensive mobile-first platform that offers:
            </p>
            <ul style={{ lineHeight: '1.8', color: 'var(--text-light)', paddingLeft: '1.5rem' }}>
              <li><strong>Digital Literacy Modules:</strong> Structured training content covering essential digital skills</li>
              <li><strong>Mentorship Opportunities:</strong> Connect with experienced mentors for guidance and support</li>
              <li><strong>Safe Technology Awareness:</strong> Learn how to protect yourself online and combat misinformation</li>
            </ul>
          </div>

          <div className="card" style={{ marginBottom: '2rem' }}>
            <h2>Our Impact</h2>
            <p style={{ lineHeight: '1.8', color: 'var(--text-light)' }}>
              We aim to help at least 65% of participating youth complete 3 learning modules and engage in one 
              mentorship program within 12 months, improving their digital literacy, skills, and career readiness. 
              With the African e-learning market projected to reach $19.75 billion by 2034, there's tremendous 
              potential for growth and impact.
            </p>
          </div>

          <div className="card" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #5A3DC9 100%)', color: 'white' }}>
            <h2 style={{ color: 'white' }}>Get Involved</h2>
            <p style={{ opacity: 0.9, lineHeight: '1.8' }}>
              Whether you're a learner looking to grow, a mentor ready to guide, or an organization wanting to 
              support youth empowerment, we'd love to have you join us in bridging the digital divide.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default About;