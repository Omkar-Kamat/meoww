export const getErrorMessage = (err: unknown, fallback: string): string => {
  const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
  return message || fallback;
};
