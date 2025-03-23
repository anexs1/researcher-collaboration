// controllers/publicationController.js
import Publication from "../models/publication.js";

// controllers/publicationController.js

// Create a new publication
export const createPublication = async (req, res) => {
  try {
    const { title, abstract, author, document_link } = req.body;
    const newPublication = await Publication.create({
      title,
      abstract,
      author,
      document_link,
    });
    res.status(201).json(newPublication);
  } catch (error) {
    console.error("Error creating publication:", error);
    res.status(500).json({
      message: "Failed to create publication",
      error: error.message,
    });
  }
};

// Get all publications
export const getAllPublications = async (req, res) => {
  try {
    const publications = await Publication.findAll();
    res.status(200).json(publications);
  } catch (error) {
    console.error("Error fetching publications:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch publications", error: error.message });
  }
};

// Get a single publication by ID
export const getPublicationById = async (req, res) => {
  const { id } = req.params;
  try {
    const publication = await Publication.findByPk(id);
    if (publication) {
      res.status(200).json(publication);
    } else {
      res.status(404).json({ message: "Publication not found" });
    }
  } catch (error) {
    console.error("Error fetching publication:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch publication", error: error.message });
  }
};

// Update a publication by ID
export const updatePublication = async (req, res) => {
  const { id } = req.params;
  try {
    const [updated] = await Publication.update(req.body, {
      where: { id: id },
    });
    if (updated) {
      const updatedPublication = await Publication.findByPk(id);
      res.status(200).json(updatedPublication);
    } else {
      res.status(404).json({ message: "Publication not found" });
    }
  } catch (error) {
    console.error("Error updating publication:", error);
    res
      .status(500)
      .json({ message: "Failed to update publication", error: error.message });
  }
};

// Delete a publication by ID
export const deletePublication = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await Publication.destroy({
      where: { id: id },
    });
    if (deleted) {
      res.status(204).send();
    } else {
      res.status(404).json({ message: "Publication not found" });
    }
  } catch (error) {
    console.error("Error deleting publication:", error);
    res
      .status(500)
      .json({ message: "Failed to delete publication", error: error.message });
  }
};
