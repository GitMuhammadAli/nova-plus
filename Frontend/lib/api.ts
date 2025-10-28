import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5500", 
  withCredentials: true, 
});

export default api;
