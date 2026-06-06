export const apiResponse = {
  success: <T>(data: T, message?: string) => ({
    success: true,
    data,
    message,
  }),
  error: (message: string, code?: string) => ({
    success: false,
    message,
    code,
  }),
  paginated: <T>(
    data: T[],
    pagination: { page: number; limit: number; total: number }
  ) => ({
    success: true,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.limit),
    },
  }),
};
