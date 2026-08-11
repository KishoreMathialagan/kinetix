export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
}

export interface ApiErrorPayload {
  success: boolean;
  code: string;
  message: string;
  errors: unknown[];
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface PaginatedResponse<T> extends ApiResponse<Paginated<T>> {}

export interface ListParams {
  page?: number;
  size?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  search?: string;
  [key: string]: unknown;
}
