export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  statusCode: number;
}

export interface AxiosErrorResponse {
  response?: {
    data?: {
      message?: string;
      error?: string;
      success?: boolean;
      statusCode?: number;
    };
  };
  message?: string;
}

/**
 * Type guard to check if an error is an AxiosErrorResponse
 */
export function isAxiosErrorResponse(error: unknown): error is AxiosErrorResponse {
  return (
    typeof error === "object" &&
    error !== null &&
    ("response" in error || "message" in error)
  );
}

/**
 * Extracts error message from various error types
 */
export function extractErrorMessage(error: unknown): string {
  if (isAxiosErrorResponse(error)) {
    return (
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "An error occurred"
    );
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return "An error occurred";
}
