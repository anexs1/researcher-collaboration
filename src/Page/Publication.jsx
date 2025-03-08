import { useState } from "react";
import "./Publication.css";

const Publication = () => {
  const [currentUserId, setCurrentUserId] = useState("User123"); // Simulating a logged-in user
  const [publications, setPublications] = useState([
    {
      id: 1,
      userId: "User123",
      title: "Research on AI in Agriculture",
      abstract:
        "This publication explores the use of AI in improving agricultural yields.",
      keywords: "AI, Agriculture, Sustainability",
      methodology: "Machine learning algorithms for data analysis",
      conclusion: "AI can help optimize resource usage in agriculture.",
      publicationLink: "http://example.com/research-article",
      createdAt: new Date(),
    },
  ]);

  const [newPublication, setNewPublication] = useState({
    title: "",
    abstract: "",
    keywords: "",
    methodology: "",
    conclusion: "",
    publicationLink: "",
  });

  const [error, setError] = useState("");

  // Function to Add a New Publication
  const handleAddPublication = () => {
    if (
      !newPublication.title ||
      !newPublication.abstract ||
      !newPublication.keywords
    ) {
      setError("Title, Abstract, and Keywords are required.");
      return;
    }

    const newPub = {
      id: publications.length + 1,
      userId: currentUserId, // Assigning the logged-in user as the owner
      title: newPublication.title,
      abstract: newPublication.abstract,
      keywords: newPublication.keywords,
      methodology: newPublication.methodology,
      conclusion: newPublication.conclusion,
      publicationLink: newPublication.publicationLink,
      createdAt: new Date(),
    };

    setPublications([...publications, newPub]);

    // Reset form fields
    setNewPublication({
      title: "",
      abstract: "",
      keywords: "",
      methodology: "",
      conclusion: "",
      publicationLink: "",
    });

    setError("");
  };

  return (
    <div className="publication-container">
      <h1>Publications</h1>
      {error && <p className="error-message">{error}</p>}

      {/* Add New Publication Form */}
      <div className="add-form">
        <h2>Post a New Publication</h2>
        <input
          type="text"
          placeholder="Title"
          value={newPublication.title}
          onChange={(e) =>
            setNewPublication({ ...newPublication, title: e.target.value })
          }
        />
        <textarea
          placeholder="Abstract"
          value={newPublication.abstract}
          onChange={(e) =>
            setNewPublication({ ...newPublication, abstract: e.target.value })
          }
        />
        <input
          type="text"
          placeholder="Keywords"
          value={newPublication.keywords}
          onChange={(e) =>
            setNewPublication({ ...newPublication, keywords: e.target.value })
          }
        />
        <textarea
          placeholder="Methodology"
          value={newPublication.methodology}
          onChange={(e) =>
            setNewPublication({
              ...newPublication,
              methodology: e.target.value,
            })
          }
        />
        <textarea
          placeholder="Conclusion"
          value={newPublication.conclusion}
          onChange={(e) =>
            setNewPublication({ ...newPublication, conclusion: e.target.value })
          }
        />
        <input
          type="url"
          placeholder="Publication Link"
          value={newPublication.publicationLink}
          onChange={(e) =>
            setNewPublication({
              ...newPublication,
              publicationLink: e.target.value,
            })
          }
        />
        <button onClick={handleAddPublication}>Post Publication</button>
      </div>

      {/* List of Publications */}
      <ul>
        {publications.map((pub) => (
          <li key={pub.id}>
            <h3>{pub.title}</h3>
            <p>
              <strong>Abstract:</strong> {pub.abstract}
            </p>
            <p>
              <strong>Keywords:</strong> {pub.keywords}
            </p>
            <p>
              <strong>Methodology:</strong> {pub.methodology}
            </p>
            <p>
              <strong>Conclusion:</strong> {pub.conclusion}
            </p>
            <p>
              <strong>Link:</strong>{" "}
              <a
                href={pub.publicationLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                {pub.publicationLink}
              </a>
            </p>
            <small>
              Created at: {new Date(pub.createdAt).toLocaleString()}
            </small>

            {/* Only allow edit/delete for the logged-in user */}
            {pub.userId === currentUserId && (
              <>
                <button className="edit-btn">Edit</button>
                <button className="delete-btn">Delete</button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Publication;
