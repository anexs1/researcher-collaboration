import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;

export const getMessages = async (projectId) => {
  const response = await axios.get(`${API_URL}/chat/${projectId}/messages`);
  return response.data;
};

export const sendMessage = async (projectId, content) => {
  const response = await axios.post(`${API_URL}/chat/${projectId}/messages`, {
    content,
  });
  return response.data;
};
