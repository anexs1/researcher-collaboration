const handleUpload = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await axios.post(
      "http://localhost:5000/api/publications/upload",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    console.log("Upload successful:", response.data);
  } catch (error) {
    console.error("Error uploading file:", error);
  }
};
