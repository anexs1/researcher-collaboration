import React, { useEffect, useState } from "react";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [updatedUser, setUpdatedUser] = useState({});
  const [newProfileImage, setNewProfileImage] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setUpdatedUser(JSON.parse(storedUser));
    }
  }, []);

  const handleEditToggle = () => {
    setEditing(!editing);
  };

  const handleChange = (e) => {
    setUpdatedUser({ ...updatedUser, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    localStorage.setItem("user", JSON.stringify(updatedUser));
    setUser(updatedUser);
    setEditing(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProfileImage(reader.result);
        setUpdatedUser({ ...updatedUser, profileImage: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg grid grid-cols-3 gap-6">
      <div className="col-span-1 bg-blue-100 p-4 relative">
        <div className="absolute -top-16 right-6 border-4 border-white rounded-lg">
          <img
            src={
              newProfileImage ||
              user?.profileImage ||
              "https://via.placeholder.com/150"
            }
            alt="Profile"
            className="w-48 h-56 object-cover rounded-lg"
          />
          <input
            type="file"
            className="hidden"
            id="fileUpload"
            onChange={handleImageChange}
          />
          <label
            htmlFor="fileUpload"
            className="absolute bottom-2 right-2 bg-blue-500 text-white p-1 rounded-full cursor-pointer"
          >
            📷
          </label>
        </div>
        <h2 className="text-3xl font-semibold mt-40 mb-2">
          {user?.username || "ROHIT KOHLI"}
        </h2>
        <h3 className="text-xl font-medium mb-6">Web Developer</h3>
      </div>

      <div className="col-span-2 p-4">
        <h2 className="text-2xl font-semibold mb-4">Profile</h2>
        <p className="mb-6">
          {user?.bio ||
            "Write an enticing performance summary that impresses the recruiter. Showcase your uniqueness through your skills and accomplishments."}
        </p>

        <h3 className="text-xl font-semibold mb-4">Education</h3>
        <div className="mb-4">
          <h4 className="text-lg font-bold">Masters of Arts</h4>
          <p>University of ABC (2013-2015)</p>
          <p>Lorem ipsum is simply dummy text of the printing industry.</p>
        </div>
        <div className="mb-4">
          <h4 className="text-lg font-bold">Bachelors of Arts</h4>
          <p>ABC State University (2010-2013)</p>
          <p>Lorem ipsum is simply dummy text of the printing industry.</p>
        </div>

        <h3 className="text-xl font-semibold mt-6 mb-4">Contact</h3>
        <p>📞 +123456789</p>
        <p>📧 emailaddress@gmail.com</p>
        <p>📍 #Street number, city, state</p>
        <p>🔗 www.yourwebsite.com</p>

        {editing ? (
          <div className="mt-6">
            <input
              type="text"
              name="username"
              value={updatedUser.username || ""}
              onChange={handleChange}
              className="w-full p-2 mb-2 border rounded"
              placeholder="Username"
            />
            <input
              type="text"
              name="expertise"
              value={updatedUser.expertise || ""}
              onChange={handleChange}
              className="w-full p-2 mb-2 border rounded"
              placeholder="Expertise"
            />
            <input
              type="text"
              name="bio"
              value={updatedUser.bio || ""}
              onChange={handleChange}
              className="w-full p-2 mb-2 border rounded"
              placeholder="Bio"
            />
            <button
              onClick={handleSave}
              className="bg-green-500 text-white px-4 py-2 rounded"
            >
              Save
            </button>
          </div>
        ) : (
          <button
            onClick={handleEditToggle}
            className="mt-6 bg-blue-500 text-white px-4 py-2 rounded"
          >
            Edit
          </button>
        )}
      </div>
    </div>
  );
}
