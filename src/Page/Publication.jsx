import { useState } from "react";

const Publication = () => {
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
    {
      id: 2,
      userId: "User456",
      title: "Blockchain in Healthcare",
      abstract:
        "This research investigates the potential of blockchain technology in healthcare systems.",
      keywords: "Blockchain, Healthcare, Security",
      methodology:
        "Case study analysis of blockchain implementation in hospitals",
      conclusion: "Blockchain improves data security and patient privacy.",
      publicationLink: "http://example.com/blockchain-healthcare",
      createdAt: new Date(),
    },
  ]);

  const [newPublication, setNewPublication] = useState({
    userId: "",
    title: "",
    abstract: "",
    keywords: "",
    methodology: "",
    conclusion: "",
    publicationLink: "",
  });

  const [editingPublication, setEditingPublication] = useState(null);
  const [error, setError] = useState("");

  // Add a Publication (mocking backend)
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
      ...newPublication,
      id: publications.length + 1,
      createdAt: new Date(),
    };

    setPublications([...publications, newPub]);
    setNewPublication({
      userId: "",
      title: "",
      abstract: "",
      keywords: "",
      methodology: "",
      conclusion: "",
      publicationLink: "",
    });
    setError("");
  };

  // Edit a Publication
  const handleEditPublication = () => {
    if (
      !editingPublication.title ||
      !editingPublication.abstract ||
      !editingPublication.keywords
    ) {
      setError("Title, Abstract, and Keywords are required.");
      return;
    }

    const updatedPublications = publications.map((pub) =>
      pub.id === editingPublication.id ? { ...pub, ...editingPublication } : pub
    );

    setPublications(updatedPublications);
    setEditingPublication(null);
    setError("");
  };

  // Delete a Publication
  const handleDeletePublication = (id) => {
    const updatedPublications = publications.filter((pub) => pub.id !== id);
    setPublications(updatedPublications);
    setError("");
  };

  return (
    <div className="publication-container">
      <h1>Publications</h1>
      {error && <p className="error-message">{error}</p>}

      {/* Add Form */}
      <div className="add-form">
        <input
          type="text"
          placeholder="User ID"
          value={newPublication.userId}
          onChange={(e) =>
            setNewPublication({ ...newPublication, userId: e.target.value })
          }
        />
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
        <button onClick={handleAddPublication}>Add Publication</button>
      </div>

      {/* Publication List */}
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
            <button
              className="edit-btn"
              onClick={() => setEditingPublication(pub)}
            >
              Edit
            </button>
            <button
              className="delete-btn"
              onClick={() => handleDeletePublication(pub.id)}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>

      {/* Edit Form (if editing) */}
      {editingPublication && (
        <div className="edit-form">
          <h2>Edit Publication</h2>
          <input
            type="text"
            placeholder="Title"
            value={editingPublication.title}
            onChange={(e) =>
              setEditingPublication({
                ...editingPublication,
                title: e.target.value,
              })
            }
          />
          <textarea
            placeholder="Abstract"
            value={editingPublication.abstract}
            onChange={(e) =>
              setEditingPublication({
                ...editingPublication,
                abstract: e.target.value,
              })
            }
          />
          <input
            type="text"
            placeholder="Keywords"
            value={editingPublication.keywords}
            onChange={(e) =>
              setEditingPublication({
                ...editingPublication,
                keywords: e.target.value,
              })
            }
          />
          <textarea
            placeholder="Methodology"
            value={editingPublication.methodology}
            onChange={(e) =>
              setEditingPublication({
                ...editingPublication,
                methodology: e.target.value,
              })
            }
          />
          <textarea
            placeholder="Conclusion"
            value={editingPublication.conclusion}
            onChange={(e) =>
              setEditingPublication({
                ...editingPublication,
                conclusion: e.target.value,
              })
            }
          />
          <input
            type="url"
            placeholder="Publication Link"
            value={editingPublication.publicationLink}
            onChange={(e) =>
              setEditingPublication({
                ...editingPublication,
                publicationLink: e.target.value,
              })
            }
          />
          <button onClick={handleEditPublication}>Update Publication</button>
          <button onClick={() => setEditingPublication(null)}>Cancel</button>
        </div>
      )}
    </div>
  );
};

export default Publication;
