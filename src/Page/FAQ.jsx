import React, { useState } from "react";
import "./FAQ.css";

export default function FAQ() {
  const [activeIndex, setActiveIndex] = useState(null);

  const handleToggle = (index) => {
    if (activeIndex === index) {
      setActiveIndex(null); // Close the item if it's already active
    } else {
      setActiveIndex(index); // Open the clicked item
    }
  };

  return (
    <section className="faq-section">
      <h2 className="section-title">Frequently Asked Questions</h2>

      <div
        className={`faq-item ${activeIndex === 0 ? "active" : ""} hover-effect`}
        onClick={() => handleToggle(0)}
      >
        <h3>How can I find a research partner?</h3>
        <p>
          You can find a research partner by browsing collaboration
          opportunities posted by researchers or by searching for researchers
          based on their expertise, field, or location. You can filter
          researchers by their qualifications, past projects, and research
          interests, making it easier to find the best fit for your needs.
        </p>
      </div>

      <div
        className={`faq-item ${activeIndex === 1 ? "active" : ""} hover-effect`}
        onClick={() => handleToggle(1)}
      >
        <h3>Is my data secure on this platform?</h3>
        <p>
          Yes! We prioritize your privacy and security. The platform uses
          end-to-end encryption for all communications, ensuring that your
          personal and project data is protected. Additionally, we conduct
          regular security audits to maintain industry-standard security
          practices.
        </p>
      </div>

      <div
        className={`faq-item ${activeIndex === 2 ? "active" : ""} hover-effect`}
        onClick={() => handleToggle(2)}
      >
        <h3>How can I send a direct message to another researcher?</h3>
        <p>
          Once you’ve connected with a researcher through a collaboration
          request, you can send direct messages via the platform's real-time
          chat feature. This allows you to discuss potential collaborations, ask
          questions, or send project proposals privately and securely.
        </p>
      </div>

      <div
        className={`faq-item ${activeIndex === 3 ? "active" : ""} hover-effect`}
        onClick={() => handleToggle(3)}
      >
        <h3>What happens after I send a collaboration request?</h3>
        <p>
          After you send a collaboration request, the researcher will receive a
          notification. They can either approve or deny your request. If
          approved, you will have access to collaborate on the project, share
          files, and communicate through private messages within the platform.
        </p>
      </div>

      <div
        className={`faq-item ${activeIndex === 4 ? "active" : ""} hover-effect`}
        onClick={() => handleToggle(4)}
      >
        <h3>How can I update my research profile?</h3>
        <p>
          To update your profile, simply navigate to the "My Profile" section
          from your dashboard. You can update your research interests,
          qualifications, experience, and contact information. This allows other
          users to find you based on your current skills and research interests.
        </p>
      </div>

      <div
        className={`faq-item ${activeIndex === 5 ? "active" : ""} hover-effect`}
        onClick={() => handleToggle(5)}
      >
        <h3>Is the platform free to use?</h3>
        <p>
          Yes, the platform is completely free for all registered users. You can
          access all research tools, collaboration features, and messaging
          functionalities without any cost. Our goal is to foster collaboration
          in the academic community without barriers.
        </p>
      </div>
    </section>
  );
}
