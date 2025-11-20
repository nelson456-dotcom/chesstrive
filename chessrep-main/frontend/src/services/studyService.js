const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Helper function to make API requests
const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  console.log('Making API request to:', `${API_BASE_URL}${endpoint}`);
  console.log('Auth token present:', !!token);
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'x-auth-token': token }),
      ...options.headers,
    },
    ...options,
  };

  console.log('Request config:', config);

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  console.log('Response status:', response.status);
  console.log('Response ok:', response.ok);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('API Error:', errorData);
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  console.log('API Response data:', data);
  return data;
};

// Studies API
export const studyService = {
  // Get all studies for the current user
  async getStudies() {
    return apiRequest('/studies');
  },

  // Get a specific study with its chapters
  async getStudy(studyId) {
    return apiRequest(`/studies/${studyId}`);
  },

  // Create a new study
  async createStudy(studyData) {
    return apiRequest('/studies', {
      method: 'POST',
      body: JSON.stringify(studyData),
    });
  },

  // Update a study
  async updateStudy(studyId, studyData) {
    return apiRequest(`/studies/${studyId}`, {
      method: 'PUT',
      body: JSON.stringify(studyData),
    });
  },

  // Delete a study
  async deleteStudy(studyId) {
    return apiRequest(`/studies/${studyId}`, {
      method: 'DELETE',
    });
  },
};

// Chapters API
export const chapterService = {
  // Get all chapters for a study
  async getChapters(studyId) {
    return apiRequest(`/chapters/${studyId}`);
  },

  // Get a specific chapter
  async getChapter(studyId, chapterId) {
    return apiRequest(`/chapters/${studyId}/${chapterId}`);
  },

  // Create a new chapter
  async createChapter(chapterData) {
    return apiRequest('/chapters', {
      method: 'POST',
      body: JSON.stringify(chapterData),
    });
  },

  // Update a chapter
  async updateChapter(chapterId, chapterData) {
    return apiRequest(`/chapters/${chapterId}`, {
      method: 'PUT',
      body: JSON.stringify(chapterData),
    });
  },

  // Save moves and game state
  async saveMoves(chapterId, moveData) {
    return apiRequest(`/chapters/${chapterId}/save-moves`, {
      method: 'PUT',
      body: JSON.stringify(moveData),
    });
  },

  // Delete a chapter
  async deleteChapter(chapterId) {
    return apiRequest(`/chapters/${chapterId}`, {
      method: 'DELETE',
    });
  },
};

export default { studyService, chapterService };
