import api from "./axios";

export const createInviteLink = async () => {
  const res = await api.post("/invite/create"); 
  // ✅ if your axios baseURL already has "/api"
  return res.data as { token: string; link: string };
};
