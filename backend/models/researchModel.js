import Research from "../models/researchModel.js";

// GET all research
const getAllResearch = async (req, res) => {
  try {
    const researchList = await Research.find();
    res.status(200).json(researchList);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch research entries", error });
  }
};

// GET single research by ID
const getResearchById = async (req, res) => {
  try {
    const research = await Research.findById(req.params.id);
    if (!research) {
      return res.status(404).json({ message: "Research not found" });
    }
    res.status(200).json(research);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch research", error });
  }
};

// GET search and filter research
const searchAndFilterResearch = async (req, res) => {
  try {
    const { field, keyword } = req.query;
    const query = {};

    if (field) query.field = field;
    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: "i" } },
        { abstract: { $regex: keyword, $options: "i" } },
        { keywords: { $regex: keyword, $options: "i" } },
      ];
    }

    const results = await Research.find(query);
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ message: "Failed to search research", error });
  }
};

// Default export
const researchController = {
  getAllResearch,
  getResearchById,
  searchAndFilterResearch,
};

export default researchController;
