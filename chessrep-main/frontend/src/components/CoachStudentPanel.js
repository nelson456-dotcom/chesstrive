import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getApiUrl, getAuthHeaders, API_BASE_URL } from '../config/api';
import {
  Users,
  GraduationCap,
  UserPlus,
  UserCheck,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Mail,
  BarChart3,
  RefreshCw
} from 'lucide-react';

const moduleLabels = {
  tactics: 'Tactics',
  blunderPreventer: 'Blunder Preventer',
  intuitionTrainer: 'Intuition Trainer',
  defender: 'Defender',
  endgame: 'Endgame',
  visualization: 'Visualization'
};

const formatModuleName = (key) => {
  if (!key) return '';
  return moduleLabels[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
};

const StatChip = ({ label, value }) => (
  <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
    <div className="text-xs text-gray-500">{label}</div>
    <div className="text-sm font-semibold text-gray-800">{value}</div>
  </div>
);

const FeedbackBanner = ({ feedback }) => {
  if (!feedback) {
    return null;
  }

  const isError = feedback.type === 'error';
  const Icon = isError ? AlertCircle : CheckCircle2;

  return (
    <div
      className={`flex items-center gap-2 px-4 py-3 rounded-lg border text-sm ${
        isError
          ? 'bg-red-50 border-red-200 text-red-700'
          : 'bg-green-50 border-green-200 text-green-700'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span>{feedback.message}</span>
    </div>
  );
};

const EmptyState = ({ icon: Icon, title, description }) => (
  <div className="border border-dashed border-gray-300 rounded-xl p-6 text-center text-gray-500 bg-gray-50">
    <div className="flex flex-col items-center gap-2">
      <Icon className="w-8 h-8 text-gray-400" />
      <div className="font-semibold text-gray-700">{title}</div>
      <div className="text-sm text-gray-500">{description}</div>
    </div>
  </div>
);

const CoachStudentPanel = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [students, setStudents] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [studentIdentifier, setStudentIdentifier] = useState('');
  const [coachIdentifier, setCoachIdentifier] = useState('');
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingCoaches, setLoadingCoaches] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [addingStudent, setAddingStudent] = useState(false);
  const [addingCoach, setAddingCoach] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [retryableError, setRetryableError] = useState(null);
  const feedbackTimeoutRef = useRef(null);

  const token = useMemo(() => localStorage.getItem('token'), [user]);

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }
    feedbackTimeoutRef.current = setTimeout(() => {
      setFeedback(null);
      feedbackTimeoutRef.current = null;
    }, 4000);
  };

  const fetchStudents = async () => {
    if (!token || !user?.isCoach) {
      setStudents([]);
      return;
    }

    setLoadingStudents(true);
    try {
      const response = await fetch(getApiUrl('coach/students'), {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorMessage = 'Failed to load students';
        if (contentType && contentType.includes('application/json')) {
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch (e) {
            // If JSON parsing fails, use default message
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setStudents(data.students || []);
    } catch (error) {
      console.error('Error loading students:', error);
      showFeedback('error', error.message || 'Failed to load students');
    } finally {
      setLoadingStudents(false);
    }
  };

  const fetchCoaches = async () => {
    if (!token) {
      setCoaches([]);
      return;
    }

    setLoadingCoaches(true);
    try {
      const response = await fetch(getApiUrl('coach/coaches'), {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorMessage = 'Failed to load coaches';
        if (contentType && contentType.includes('application/json')) {
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch (e) {
            // If JSON parsing fails, use default message
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setCoaches(data.coaches || []);
    } catch (error) {
      console.error('Error loading coaches:', error);
      showFeedback('error', error.message || 'Failed to load coaches');
    } finally {
      setLoadingCoaches(false);
    }
  };

  useEffect(() => {
    if (user?.isCoach) {
      fetchStudents();
    }
  }, [user?.isCoach]);

  useEffect(() => {
    // Only fetch coaches if user is NOT a coach
    // Coaches don't need to see their own coach list
    if (token && !user?.isCoach) {
      fetchCoaches();
    } else if (user?.isCoach) {
      // Clear coaches list if user becomes a coach
      setCoaches([]);
    }
  }, [token, user?.isCoach]);

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

  const updateCoachStatus = async (isCoach, retryCount = 0) => {
    if (!token) {
      showFeedback('error', 'You must be logged in to update coach status');
      navigate('/login');
      return;
    }

    setUpdatingStatus(true);
    setRetryableError(null);
    
    // Log request for telemetry
    const requestId = `coach-status-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const userId = user?.id || 'unknown';
    const hashedUserId = btoa(userId).substring(0, 8); // Simple hash for logging
    
    console.log('[Coach Status] Request:', {
      requestId,
      userId: hashedUserId,
      method: 'PUT',
      route: '/api/coach/status',
      isCoach,
      retryCount
    });

    try {
      const startTime = Date.now();
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const apiUrl = getApiUrl('coach/status');
      console.log('[Coach Status] API_BASE_URL:', API_BASE_URL);
      console.log('[Coach Status] Making request to:', apiUrl);
      console.log('[Coach Status] Request headers:', getAuthHeaders());
      
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ isCoach }),
        signal: controller.signal
      });
      
      console.log('[Coach Status] Response received:', {
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers.get('content-type'),
        url: response.url
      });
      
      clearTimeout(timeoutId);

      const duration = Date.now() - startTime;
      const responseStatus = response.status;

      console.log('[Coach Status] Response:', {
        requestId,
        userId: hashedUserId,
        status: responseStatus,
        duration: `${duration}ms`,
        ok: response.ok
      });

      // Handle different status codes
      if (response.status === 401) {
        console.warn('[Coach Status] Unauthorized - redirecting to login');
        showFeedback('error', 'Your session has expired. Please log in again.');
        setUpdatingStatus(false);
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      if (response.status === 403) {
        const errorData = await response.json().catch(() => ({}));
        showFeedback('error', errorData.message || 'You do not have permission to perform this action.');
        setUpdatingStatus(false);
        return;
      }

      if (!response.ok) {
        const contentType = response.headers.get('content-type') || '';
        let errorMessage = 'Failed to update coach status';
        let errorData = {};
        
        // Check if response is HTML (error page) instead of JSON
        if (contentType.includes('text/html')) {
          try {
            const text = await response.text();
            // If we get HTML, the backend is likely not running or proxy failed
            console.error('[Coach Status] Received HTML error page instead of JSON:', {
              requestId,
              userId: hashedUserId,
              status: responseStatus,
              preview: text.substring(0, 200)
            });
            
            errorMessage = 'Backend server is not responding. Please ensure the backend server is running on port 3001.';
            setRetryableError({
              message: errorMessage,
              retry: () => updateCoachStatus(isCoach, 0)
            });
            showFeedback('error', errorMessage);
            setUpdatingStatus(false);
            return;
          } catch (textError) {
            errorMessage = 'Backend server error. Please check if the server is running.';
          }
        } else if (contentType.includes('application/json')) {
          try {
            errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch (e) {
            console.error('[Coach Status] Failed to parse error JSON:', e);
          }
        } else {
          try {
            const text = await response.text();
            // Truncate long error messages
            const preview = text.length > 100 ? text.substring(0, 100) + '...' : text;
            errorMessage = `Server error: ${preview}`;
          } catch (textError) {
            errorMessage = `Server error (${response.status}): ${response.statusText}`;
          }
        }

        // Log error
        console.error('[Coach Status] Error:', {
          requestId,
          userId: hashedUserId,
          status: responseStatus,
          message: errorMessage,
          error: errorData
        });

        // Determine if retryable (5xx errors or network issues)
        const isRetryable = responseStatus >= 500 || responseStatus === 0;
        
        if (isRetryable && retryCount < 2) {
          setRetryableError({
            message: errorMessage,
            retry: () => updateCoachStatus(isCoach, retryCount + 1)
          });
          showFeedback('error', `${errorMessage} Retrying...`);
          setUpdatingStatus(false);
          return;
        }

        if (isRetryable) {
          setRetryableError({
            message: errorMessage,
            retry: () => updateCoachStatus(isCoach, 0)
          });
        }

        throw new Error(errorMessage);
      }

      // Parse successful response
      const data = await response.json();
      
      // Handle idempotent response (already in requested state)
      if (data.idempotent) {
        console.log('[Coach Status] Already in requested state (idempotent):', data);
        await refreshUser();
        if (isCoach) {
          showFeedback('success', 'You are already registered as a coach.');
          fetchStudents();
          setCoaches([]);
        } else {
          showFeedback('success', 'You are already not registered as a coach.');
          fetchCoaches();
        }
        setUpdatingStatus(false);
        return;
      }
      
      console.log('[Coach Status] Success:', {
        requestId,
        userId: hashedUserId,
        status: responseStatus,
        isCoach: data.isCoach
      });
      
      await refreshUser();
      
      if (isCoach) {
        showFeedback('success', 'You are now registered as a coach! You can start adding students.');
        fetchStudents();
        setCoaches([]);
        // Could navigate to onboarding here if needed
        // navigate('/coach/onboarding');
      } else {
        showFeedback('success', 'You are no longer registered as a coach.');
        setStudents([]);
        fetchCoaches();
      }
    } catch (error) {
      const isNetworkError = error.name === 'AbortError' || 
                            error.name === 'TimeoutError' ||
                            error.message.includes('Failed to fetch') || 
                            error.message.includes('NetworkError') ||
                            error.message.includes('aborted') ||
                            error.message.includes('ECONNREFUSED') ||
                            error.message.includes('ERR_CONNECTION_REFUSED');
      
      console.error('[Coach Status] Exception:', {
        requestId,
        userId: hashedUserId,
        error: error.message,
        stack: error.stack,
        isNetworkError
      });

      let errorMessage = error.message || 'Could not update coach status';
      
      // Check if error message contains HTML (backend not running)
      if (errorMessage.includes('<!DOCTYPE') || errorMessage.includes('<html')) {
        errorMessage = 'Backend server is not responding. Please ensure the backend server is running on port 3001.';
        setRetryableError({
          message: errorMessage,
          retry: () => updateCoachStatus(isCoach, 0)
        });
        showFeedback('error', errorMessage);
        setUpdatingStatus(false);
        return;
      }
      
      if (isNetworkError) {
        errorMessage = 'Network error: Could not connect to server. Please check your connection and try again.';
        if (retryCount < 2) {
          setRetryableError({
            message: errorMessage,
            retry: () => updateCoachStatus(isCoach, retryCount + 1)
          });
          showFeedback('error', `${errorMessage} Retrying...`);
          setUpdatingStatus(false);
          return;
        } else {
          setRetryableError({
            message: errorMessage,
            retry: () => updateCoachStatus(isCoach, 0)
          });
        }
      } else if (error.message.includes('404')) {
        errorMessage = 'Endpoint not found. The backend may need to be restarted. Please contact support if this persists.';
      }
      
      showFeedback('error', errorMessage);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAddStudent = async (event) => {
    event.preventDefault();
    if (!token || !studentIdentifier.trim()) {
      return;
    }

    setAddingStudent(true);
    try {
      const response = await fetch(getApiUrl('coach/students'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ identifier: studentIdentifier.trim() })
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorMessage = 'Failed to add student';
        if (contentType && contentType.includes('application/json')) {
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch (e) {
            // If JSON parsing fails, use default message
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setStudents((prev) => {
        const existingIndex = prev.findIndex((s) => s.id === data.student.id);
        if (existingIndex !== -1) {
          const updated = [...prev];
          updated[existingIndex] = data.student;
          return updated;
        }
        return [...prev, data.student];
      });

      setStudentIdentifier('');
      await refreshUser();
      showFeedback('success', `Linked with ${data.student.username || 'student'} successfully.`);
    } catch (error) {
      console.error('Error adding student:', error);
      showFeedback('error', error.message || 'Could not add student');
    } finally {
      setAddingStudent(false);
    }
  };

  const handleAddCoach = async (event) => {
    event.preventDefault();
    if (!token || !coachIdentifier.trim()) {
      return;
    }

    setAddingCoach(true);
    try {
      const response = await fetch(getApiUrl('coach/coaches'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ identifier: coachIdentifier.trim() })
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorMessage = 'Failed to add coach';
        if (contentType && contentType.includes('application/json')) {
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch (e) {
            // If JSON parsing fails, use default message
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setCoaches((prev) => {
        const existingIndex = prev.findIndex((coach) => coach.id === data.coach.id);
        if (existingIndex !== -1) {
          const updated = [...prev];
          updated[existingIndex] = data.coach;
          return updated;
        }
        return [...prev, data.coach];
      });

      setCoachIdentifier('');
      await refreshUser();
      showFeedback('success', `Linked with coach ${data.coach.username || ''}.`);
    } catch (error) {
      console.error('Error adding coach:', error);
      showFeedback('error', error.message || 'Could not add coach');
    } finally {
      setAddingCoach(false);
    }
  };

  const renderModules = (modules) => {
    if (!modules || modules.length === 0) {
      return <span className="text-sm text-gray-500">No modules completed yet</span>;
    }

    return (
      <div className="flex flex-wrap gap-2">
        {modules.map((module) => (
          <div
            key={module.module}
            className="flex items-center gap-2 bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-xs font-medium"
          >
            <BarChart3 className="w-3 h-3" />
            <span>
              {formatModuleName(module.module)} ({module.completed}/{module.total})
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {feedback && <FeedbackBanner feedback={feedback} />}
      {retryableError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-yellow-700">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{retryableError.message}</span>
          </div>
          <button
            onClick={retryableError.retry}
            disabled={updatingStatus}
            className="flex items-center gap-2 px-3 py-1.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-all text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${updatingStatus ? 'animate-spin' : ''}`} />
            Retry
          </button>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white flex-shrink-0">
              <Users className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Coaching Hub</h3>
              <p className="text-xs sm:text-sm text-gray-500">
                Connect coaches with students and track improvement together.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            {user?.isCoach ? (
              <button
                onClick={() => updateCoachStatus(false)}
                disabled={updatingStatus}
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-all text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {updatingStatus ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating...
                  </span>
                ) : (
                  'Stop Coaching'
                )}
              </button>
            ) : (
              <button
                onClick={() => updateCoachStatus(true)}
                disabled={updatingStatus}
                className="w-full sm:w-auto px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {updatingStatus ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <GraduationCap className="w-4 h-4" />
                )}
                {updatingStatus ? 'Updating...' : 'Become a Coach'}
              </button>
            )}
          </div>
        </div>

        {user?.isCoach ? (
          <div className="space-y-6">
            <form onSubmit={handleAddStudent} className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-3">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Add a student by email or username
                </label>
                <div className="mt-2 flex gap-3">
                  <div className="relative flex-1">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={studentIdentifier}
                      onChange={(e) => setStudentIdentifier(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      placeholder="student@example.com or username"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={addingStudent}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {addingStudent ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Linking...
                      </span>
                    ) : (
                      'Add Student'
                    )}
                  </button>
                </div>
              </div>
            </form>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  Linked Students
                </h4>
                {loadingStudents && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading students...
                  </div>
                )}
              </div>

              {students.length === 0 && !loadingStudents ? (
                <EmptyState
                  icon={UserPlus}
                  title="No students linked yet"
                  description="Add your first student to start tracking their progress."
                />
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {students.map((student) => (
                    <div key={student.id} className="border border-gray-200 rounded-xl p-5 bg-white hover:shadow-md transition-all">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold">
                              {student.username ? student.username[0]?.toUpperCase() : 'S'}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-800">{student.username || 'Student'}</div>
                              <div className="text-xs text-gray-500">{student.email}</div>
                            </div>
                          </div>
                          <div className="text-xs text-gray-400">
                            Joined {student.createdAt ? new Date(student.createdAt).toLocaleDateString() : 'N/A'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">Puzzles Solved</div>
                          <div className="text-xl font-bold text-purple-600">
                            {student.progress?.puzzlesSolved ?? 0}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <StatChip
                          label="Attempts"
                          value={student.progress?.puzzlesAttempted ?? 0}
                        />
                        <StatChip
                          label="Accuracy"
                          value={`${student.progress?.puzzleAccuracy ?? 0}%`}
                        />
                        <StatChip
                          label="Current Streak"
                          value={student.progress?.puzzleStreak ?? 0}
                        />
                        <StatChip
                          label="Repertoire Size"
                          value={student.progress?.repertoireCount ?? 0}
                        />
                        <StatChip
                          label="Bot Games"
                          value={student.progress?.botGames?.totalPlayed ?? 0}
                        />
                        <StatChip
                          label="Bot Wins"
                          value={student.progress?.botGames?.wins ?? 0}
                        />
                      </div>

                      <div className="mt-4">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                          Modules Played
                        </div>
                        {renderModules(student.progress?.modulesPlayed)}
                      </div>

                      <div className="mt-4 border-t border-gray-100 pt-4">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                          Ratings
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                          <div>Standard: <span className="font-medium text-gray-800">{student.progress?.ratings?.standard ?? 0}</span></div>
                          <div>Blunder: <span className="font-medium text-gray-800">{student.progress?.ratings?.blunder ?? 0}</span></div>
                          <div>Visualization: <span className="font-medium text-gray-800">{student.progress?.ratings?.visualisation ?? 0}</span></div>
                          <div>Endgame: <span className="font-medium text-gray-800">{student.progress?.ratings?.endgame ?? 0}</span></div>
                          <div>Positional: <span className="font-medium text-gray-800">{student.progress?.ratings?.positional ?? 0}</span></div>
                          <div>Advantage: <span className="font-medium text-gray-800">{student.progress?.ratings?.advantage ?? 0}</span></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <EmptyState
            icon={GraduationCap}
            title="Become a coach to manage students"
            description="Turn on coach mode to connect with students and follow their progress."
          />
        )}
      </div>

      {/* Only show "My Coaches" section if user is NOT a coach */}
      {!user?.isCoach && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800">My Coaches</h3>
                <p className="text-sm text-gray-500">
                  Link with a coach so they can review your journey and support your goals.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleAddCoach} className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                Add a coach by email or username
              </label>
              <div className="mt-2 flex gap-3">
                <div className="relative flex-1">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={coachIdentifier}
                    onChange={(e) => setCoachIdentifier(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                    placeholder="coach@example.com or username"
                  />
                </div>
                <button
                  type="submit"
                  disabled={addingCoach}
                  className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-all text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {addingCoach ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Linking...
                    </span>
                  ) : (
                    'Add Coach'
                  )}
                </button>
              </div>
            </div>
          </form>

          <div className="mt-6">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-amber-500" />
                Linked Coaches
              </h4>
              {loadingCoaches && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading coaches...
                </div>
              )}
            </div>

            {coaches.length === 0 && !loadingCoaches ? (
              <EmptyState
                icon={GraduationCap}
                title="No coaches linked yet"
                description="Add a coach to share your progress and get personalised feedback."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {coaches.map((coach) => (
                  <div key={coach.id} className="border border-gray-200 rounded-xl p-5 bg-white">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-semibold">
                        {coach.username ? coach.username[0]?.toUpperCase() : 'C'}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">{coach.username || 'Coach'}</div>
                        <div className="text-xs text-gray-500">{coach.email}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                      <div>Puzzles Solved: <span className="font-medium text-gray-800">{coach.progress?.puzzlesSolved ?? 0}</span></div>
                      <div>Puzzle Accuracy: <span className="font-medium text-gray-800">{coach.progress?.puzzleAccuracy ?? 0}%</span></div>
                      <div>Standard Rating: <span className="font-medium text-gray-800">{coach.progress?.ratings?.standard ?? 0}</span></div>
                      <div>Advantage Rating: <span className="font-medium text-gray-800">{coach.progress?.ratings?.advantage ?? 0}</span></div>
                    </div>

                    <div className="mt-3 text-xs text-gray-400">
                      Coaching since {coach.createdAt ? new Date(coach.createdAt).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CoachStudentPanel;

