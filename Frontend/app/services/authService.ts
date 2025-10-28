import api from "@/lib/api";

export const authService = {
  register: (data: any) => api.post("/auth/register", data).then((res) => res.data),
  login: (data: any) => api.post("/auth/login", data).then((res) => res.data),
  me: () => api.get("/user/me").then((res) => res.data),
  logout: () => api.post("/auth/logout").then((res) => res.data),
};
