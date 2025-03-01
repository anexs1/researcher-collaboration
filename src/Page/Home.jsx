import React from "react";
const Home = () => {
  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <h1 className="hero-title">
          Welcome to the Researcher Collaboration Portal
        </h1>
        <p className="hero-description">
          Connect, collaborate, and innovate with researchers worldwide.
        </p>
        <button className="cta-button hover-effect">Get Started</button>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2 className="section-title">Key Features</h2>
        <div className="features-grid">
          <div className="feature-item hover-effect">
            <h3>Find Collaborators</h3>
            <p>
              Search for researchers based on their expertise and interests.
            </p>
          </div>
          <div className="feature-item hover-effect">
            <h3>Post Opportunities</h3>
            <p>Create collaboration requests for specific research topics.</p>
          </div>
          <div className="feature-item hover-effect">
            <h3>Chat & Messaging</h3>
            <p>Communicate in real-time with potential collaborators.</p>
          </div>
          <div className="feature-item hover-effect">
            <h3>Secure Networking</h3>
            <p>Connect with verified researchers and maintain data privacy.</p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <h2 className="section-title">How It Works</h2>
        <div className="steps-grid">
          <div className="step-item hover-effect">
            <h3>1. Create a Profile</h3>
            <p>Sign up and showcase your research expertise.</p>
          </div>
          <div className="step-item hover-effect">
            <h3>2. Find Opportunities</h3>
            <p>Search for collaboration projects and apply easily.</p>
          </div>
          <div className="step-item hover-effect">
            <h3>3. Connect & Collaborate</h3>
            <p>Chat with researchers and start working on projects together.</p>
          </div>
        </div>
      </section>

      {/* Research Categories Section */}
      <section className="research-categories-section">
        <h2 className="section-title">Explore Research Categories</h2>
        <div className="categories-grid">
          <div className="category-item hover-effect">
            Artificial Intelligence
          </div>
          <div className="category-item hover-effect">Data Science</div>
          <div className="category-item hover-effect">Cybersecurity</div>
          <div className="category-item hover-effect">Biomedical Research</div>
          <div className="category-item hover-effect">Climate Science</div>
          <div className="category-item hover-effect">Social Sciences</div>
        </div>
      </section>

      {/* About Section */}
      <section className="about-section">
        <h2 className="section-title">About Us</h2>
        <p>
          The Researcher Collaboration Portal is designed to help academics and
          professionals connect effortlessly. Our platform enables seamless
          networking and collaboration for research projects.
        </p>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <h2 className="section-title">What Our Users Say</h2>
        <div className="testimonials-grid">
          <div className="testimonial-item">
            <img src="C:\Users\Anuwar\Desktop\what\src\assets\IMG_3959.PNG" />
            <div className="testimonial-content">
              <p>
                "This platform helped me find the perfect research partner!"
              </p>
              <h4>- Dr. Amanuel T.</h4>
            </div>
          </div>

          <div className="testimonial-item">
            <img src="C:\Users\Anuwar\Desktop\what\src\assets\IMG_3959.PNG" />
            <div className="testimonial-content">
              <p>"Collaborating has never been easier. Great experience!"</p>
              <h4>- Prof. Mulu A.</h4>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section">
        <h2 className="section-title">Frequently Asked Questions</h2>

        <div className="faq-item hover-effect">
          <h3>How can I find a research partner?</h3>
          <p>
            You can browse collaboration opportunities or search for researchers
            by expertise, field, or location. The platform also allows you to
            filter researchers by their qualifications and previous projects to
            ensure the best fit.
          </p>
        </div>

        <div className="faq-item hover-effect">
          <h3>Is my data secure?</h3>
          <p>
            Yes! We ensure end-to-end encryption for all communications. We
            follow industry best practices to secure your personal and project
            data, using secure protocols and regular security audits to protect
            your information.
          </p>
        </div>

        <div className="faq-item hover-effect">
          <h3>Can I send direct messages to researchers?</h3>
          <p>
            Absolutely! Our platform provides real-time messaging functionality,
            allowing you to connect with researchers directly. You can send
            inquiries or project proposals through private chats.
          </p>
        </div>

        <div className="faq-item hover-effect">
          <h3>What happens after I send a collaboration request?</h3>
          <p>
            Once you send a request, the researcher will be notified and can
            either approve or deny your request. If approved, you will be able
            to start collaborating and sharing relevant materials securely.
          </p>
        </div>

        <div className="faq-item hover-effect">
          <h3>How can I update my profile?</h3>
          <p>
            You can easily update your profile by accessing the "My Profile"
            section from your dashboard. There, you can update your
            qualifications, research interests, and contact details at any time.
          </p>
        </div>

        <div className="faq-item hover-effect">
          <h3>Do I need to pay to use the platform?</h3>
          <p>
            No, the platform is completely free for all registered users. We
            provide access to all research tools and collaboration features at
            no cost to help foster academic collaboration.
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="contact-section">
        <h2>Contact Us</h2>
        <p>Have any questions? Reach out to us!</p>
        <form className="contact-form">
          <input type="text" placeholder="Your Name" required />
          <input type="email" placeholder="Your Email" required />
          <textarea placeholder="Your Message" rows="4" required></textarea>
          <button type="submit">Send Message</button>
        </form>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>© 2025 Researcher Collaboration Portal. All Rights Reserved.</p>
      </footer>
    </div>
  );
};

export default Home;
