import { useAuthStore } from "../store/useAuthStore";

export const useAuthSession = () => {
    const { user, isAuthChecked, fetchMe, logout, isRefreshing } = useAuthStore();

    return {
        user,
        isAuthChecked,
        fetchMe,
        logout,
        isRefreshing,
    };
};
