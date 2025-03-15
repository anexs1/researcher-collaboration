import db from "../config/db.js"; // ✅ Ensure correct import

const Researcher = {
  getAll: (callback) => {
    db.query("SELECT * FROM researchers", callback);
  },
  create: (name, description, callback) => {
    db.query(
      "INSERT INTO researchers (name, description) VALUES (?, ?)",
      [name, description],
      callback
    );
  },
};

export default Researcher; // ✅ Ensure correct export
