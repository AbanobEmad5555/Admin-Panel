export const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (!error || typeof error !== "object") {
    return fallback;
  }

  const maybeAxios = error as {
    response?: {
      data?: {
        message?: string;
      };
    };
    message?: string;
  };

  return (
    maybeAxios.response?.data?.message ??
    maybeAxios.message ??
    fallback
  );
};

