import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;

export const listProjects = async () => {
  const response = await axios.get(`${API_URL}/projects`);
  return response.data;
};

export const getProjectDetails = async (id) => {
  const response = await axios.get(`${API_URL}/projects/${id}`);
  return response.data;
};

export const createProject = async (projectData) => {
  const response = await axios.post(`${API_URL}/projects`, projectData);
  return response.data;
};

export const updateProject = async (id, projectData) => {
  const response = await axios.put(`${API_URL}/projects/${id}`, projectData);
  return response.data;
};

export const deleteProject = async (id) => {
  await axios.delete(`${API_URL}/projects/${id}`);
};
