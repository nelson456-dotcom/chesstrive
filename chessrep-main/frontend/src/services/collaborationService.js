const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Helper function to make API requests
const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'x-auth-token': token }),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  return await response.json();
};

// Collaboration API
export const collaborationService = {
  // Invite user to study by email or username
  async inviteUser(studyId, email, username, permission = 'view') {
    const body = { studyId, permission };
    if (email && email.trim()) body.email = email.trim();
    if (username && username.trim()) body.username = username.trim();
    
    console.log('Collaboration service sending:', body);
    console.log('Detailed request data:', {
      studyId: studyId,
      studyIdType: typeof studyId,
      email: email,
      emailType: typeof email,
      username: username,
      usernameType: typeof username,
      permission: permission,
      hasEmail: email && email.trim().length > 0,
      hasUsername: username && username.trim().length > 0
    });
    
    return apiRequest('/collaboration/invite', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  // Accept invitation
  async acceptInvitation(studyId) {
    return apiRequest('/collaboration/accept', {
      method: 'POST',
      body: JSON.stringify({ studyId }),
    });
  },

  // Decline invitation
  async declineInvitation(studyId) {
    return apiRequest('/collaboration/decline', {
      method: 'POST',
      body: JSON.stringify({ studyId }),
    });
  },

  // Update collaborator permission
  async updatePermission(studyId, userId, permission) {
    return apiRequest('/collaboration/permission', {
      method: 'PUT',
      body: JSON.stringify({ studyId, userId, permission }),
    });
  },

  // Remove collaborator
  async removeCollaborator(studyId, userId) {
    return apiRequest('/collaboration/remove', {
      method: 'DELETE',
      body: JSON.stringify({ studyId, userId }),
    });
  },

  // Generate share code
  async generateShareCode(studyId) {
    return apiRequest('/collaboration/share', {
      method: 'POST',
      body: JSON.stringify({ studyId }),
    });
  },

  // Join study by share code
  async joinByCode(shareCode, permission = 'view') {
    return apiRequest('/collaboration/join-by-code', {
      method: 'POST',
      body: JSON.stringify({ shareCode, permission }),
    });
  },

  // Get pending invitations
  async getInvitations() {
    return apiRequest('/collaboration/invitations');
  },

  // Get collaborative studies
  async getCollaborativeStudies() {
    return apiRequest('/collaboration/studies');
  },

  // Get study collaborators
  async getCollaborators(studyId) {
    return apiRequest(`/studies/${studyId}/collaborators`);
  },

  // Notification methods
  async getNotifications(page = 1, limit = 20, unreadOnly = false) {
    const params = new URLSearchParams({ page, limit });
    if (unreadOnly) params.append('unreadOnly', 'true');
    return apiRequest(`/collaboration/notifications?${params}`);
  },

  async markNotificationAsRead(notificationId) {
    return apiRequest(`/collaboration/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  },

  async markAllNotificationsAsRead() {
    return apiRequest('/collaboration/notifications/read-all', {
      method: 'PUT',
    });
  },

  async getUnreadNotificationCount() {
    return apiRequest('/collaboration/notifications/unread-count');
  },
};

export default collaborationService;
