// src/api/apiClient.ts
import axios from "axios";

// Adjust these as needed:
export const PYTHON_BASE_URL = "http://localhost:8001";
export const SCALA_BASE_URL = "http://localhost:8080";

export const pythonClient = axios.create({
  baseURL: PYTHON_BASE_URL,
});

export const scalaClient = axios.create({
  baseURL: SCALA_BASE_URL,
});