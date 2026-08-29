import { api } from "../../../shared/api/httpClient";

export const accountApi = {
    updateProfile: async (data: { name?: string; username?: string }) => {
        const res = await api.patch("/api/users/me", data);
        return res.data;
    },
    updateAvatar: async (formData: FormData) => {
        const res = await api.post("/api/users/me/avatar", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return res.data;
    },
    deleteAccount: async () => {
        const res = await api.delete("/api/users/me");
        return res.data;
    },
};
