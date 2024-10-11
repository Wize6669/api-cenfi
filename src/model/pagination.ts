interface PaginationResponse<T> {
  currentPage: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  previousPage: number | null;
  nextPage: number | null;
  total: number;
  data: T[];
}

export { PaginationResponse };
