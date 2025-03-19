import db from "../config/db.js";

const Publication = {
  create: (data, callback) => {
    db.query("INSERT INTO publications SET ?", data, callback);
  },

  findAll: (callback) => {
    db.query("SELECT * FROM publications", callback);
  },

  findById: (id, callback) => {
    db.query("SELECT * FROM publications WHERE id = ?", [id], callback);
  },

  search: (keyword, callback) => {
    db.query(
      "SELECT * FROM publications WHERE title LIKE ? OR abstract LIKE ?",
      [`%${keyword}%`, `%${keyword}%`],
      callback
    );
  },
};

export default Publication;
