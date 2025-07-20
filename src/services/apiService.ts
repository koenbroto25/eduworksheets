// API service for handling HTTP requests
class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // GET request
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  // POST request
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT request
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PATCH request
  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Upload file
  async uploadFile<T>(endpoint: string, file: File): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('auth_token');
    const headers: HeadersInit = {};
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('File upload failed:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
export const apiService = new ApiService();

// Specific API endpoints
export const exerciseApi = {
  getAll: () => apiService.get('/exercises'),
  getById: (id: string) => apiService.get(`/exercises/${id}`),
  create: (data: any) => apiService.post('/exercises', data),
  update: (id: string, data: any) => apiService.put(`/exercises/${id}`, data),
  delete: (id: string) => apiService.delete(`/exercises/${id}`),
  getPublic: () => apiService.get('/exercises/public'),
};

export const classApi = {
  getAll: () => apiService.get('/classes'),
  getById: (id: string) => apiService.get(`/classes/${id}`),
  create: (data: any) => apiService.post('/classes', data),
  update: (id: string, data: any) => apiService.put(`/classes/${id}`, data),
  delete: (id: string) => apiService.delete(`/classes/${id}`),
  addStudent: (classId: string, studentId: string) => 
    apiService.post(`/classes/${classId}/students`, { studentId }),
  removeStudent: (classId: string, studentId: string) => 
    apiService.delete(`/classes/${classId}/students/${studentId}`),
  addExercise: (classId: string, exerciseId: string) => 
    apiService.post(`/classes/${classId}/exercises`, { exerciseId }),
  removeExercise: (classId: string, exerciseId: string) => 
    apiService.delete(`/classes/${classId}/exercises/${exerciseId}`),
};

export const userApi = {
  getProfile: () => apiService.get('/user/profile'),
  updateProfile: (data: any) => apiService.put('/user/profile', data),
  getProgress: () => apiService.get('/user/progress'),
  getClasses: () => apiService.get('/user/classes'),
  getExercises: () => apiService.get('/user/exercises'),
};

export const authApi = {
  login: (email: string, password: string) => 
    apiService.post('/auth/login', { email, password }),
  register: (userData: any) => 
    apiService.post('/auth/register', userData),
  logout: () => apiService.post('/auth/logout'),
  refreshToken: () => apiService.post('/auth/refresh'),
  forgotPassword: (email: string) => 
    apiService.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) => 
    apiService.post('/auth/reset-password', { token, password }),
};