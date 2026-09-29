import axios from "axios";

// Axios client dùng chung — gắn vào các service khi backend hoàn thành (base URL: /api/v1)
export const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("accessToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});