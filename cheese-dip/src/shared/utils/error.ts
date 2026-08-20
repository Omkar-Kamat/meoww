import axios from "axios";

export interface AppErrorResponse {
  message: string;
  code?: string;
  meta?: {
    issues?: Array<{ path: string; message: string }>;
    [key: string]: unknown;
  };
}

export const getApiError = (err: unknown): AppErrorResponse | null => {
  if (axios.isAxiosError<AppErrorResponse>(err) && err.response?.data) {
    return err.response.data;
  }
  return null;
};

export const getErrorMessage = (err: unknown, fallback: string): string => {
  const apiError = getApiError(err);
  return apiError?.message || fallback;
};
