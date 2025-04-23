import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;

export const sendJoinRequest = async (projectId, message = "") => {
  const response = await axios.post(
    `${API_URL}/projects/${projectId}/requests`,
    { message }
  );
  return response.data;
};

export const getJoinRequests = async (projectId) => {
  const response = await axios.get(`${API_URL}/projects/${projectId}/requests`);
  return response.data;
};

export const approveRequest = async (requestId) => {
  const response = await axios.put(`${API_URL}/requests/${requestId}/approve`);
  return response.data;
};

export const rejectRequest = async (requestId, reason = "") => {
  const response = await axios.put(`${API_URL}/requests/${requestId}/reject`, {
    reason,
  });
  return response.data;
};
