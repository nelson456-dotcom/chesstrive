import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  BookOpen, 
  Play, 
  Download, 
  Upload, 
  Eye, 
  Users, 
  Share2, 
  Crown,
  UserPlus,
  Bell
} from 'lucide-react';
import { studyService, chapterService } from '../services/studyService';
import { collaborationService } from '../services/collaborationService';
import CollaborationManager from './CollaborationManager';
import JoinStudyModal from './JoinStudyModal';

const StudiesManager = () => {
  const navigate = useNavigate();
  const [studies, setStudies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingStudy, setEditingStudy] = useState(null);
  const [editStudyName, setEditStudyName] = useState('');
  const [showCollaborationManager, setShowCollaborationManager] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedStudy, setSelectedStudy] = useState(null);
  const [invitations, setInvitations] = useState([]);
  const [showInvitations, setShowInvitations] = useState(false);

  // Load studies from database
  const loadStudies = useCallback(async () => {
    setLoading(true);
    try {
      const response = await studyService.getStudies();
      if (response.success) {
        // Convert date strings back to Date objects
        const studiesWithDates = response.studies.map((study) => ({
          ...study,
          createdAt: new Date(study.createdAt),
          updatedAt: new Date(study.updatedAt),
          chapters: (study.chapters || []).map((chapter) => ({
            ...chapter,
            createdAt: new Date(chapter.createdAt),
            updatedAt: new Date(chapter.updatedAt)
          }))
        }));
        setStudies(studiesWithDates);
      } else {
        setStudies([]);
      }
    } catch (error) {
      console.error('Error loading studies:', error);
      setStudies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load invitations
  const loadInvitations = useCallback(async () => {
    try {
      const response = await collaborationService.getInvitations();
      if (response.success) {
        setInvitations(response.invitations);
      }
    } catch (error) {
      console.error('Error loading invitations:', error);
    }
  }, []);

  // Update studies state
  const updateStudies = useCallback((updatedStudies) => {
    setStudies(updatedStudies);
  }, []);

  // Load studies and invitations on component mount
  useEffect(() => {
    loadStudies();
    loadInvitations();
  }, [loadStudies, loadInvitations]);

  // Create new study
  const createNewStudy = useCallback(async () => {
    const studyName = prompt('Enter study name:');
    if (!studyName || !studyName.trim()) return;

    try {
      const response = await studyService.createStudy({
        name: studyName.trim(),
        description: '',
        notes: '',
        tags: []
      });

      if (response.success) {
        const newStudy = {
          ...response.study,
          createdAt: new Date(response.study.createdAt),
          updatedAt: new Date(response.study.updatedAt),
          chapters: [],
          chapterCount: 0,
          userAccess: { hasAccess: true, permission: 'admin' },
          isOwner: true
        };
        setStudies(prev => [newStudy, ...prev]);
        navigate(`/enhanced-chess-study?study=${response.study._id}`);
      }
    } catch (error) {
      console.error('Error creating study:', error);
      alert('Failed to create study');
    }
  }, [navigate]);

  // Delete study
  const deleteStudy = useCallback(async (studyId) => {
    if (!window.confirm('Are you sure you want to delete this study? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await studyService.deleteStudy(studyId);
      if (response.success) {
        setStudies(prev => prev.filter(study => study._id !== studyId));
      }
    } catch (error) {
      console.error('Error deleting study:', error);
      alert('Failed to delete study');
    }
  }, []);

  // Start editing study name
  const startEditingStudy = useCallback((study) => {
    setEditingStudy(study._id);
    setEditStudyName(study.name);
  }, []);

  // Save study name
  const saveStudyName = useCallback(async (studyId) => {
    if (!editStudyName.trim()) {
      setEditingStudy(null);
      return;
    }

    try {
      const response = await studyService.updateStudy(studyId, {
        name: editStudyName.trim()
      });

      if (response.success) {
        setStudies(prev => prev.map(study => 
          study._id === studyId 
            ? { ...study, name: editStudyName.trim() }
            : study
        ));
        setEditingStudy(null);
      }
    } catch (error) {
      console.error('Error updating study:', error);
      alert('Failed to update study name');
    }
  }, [editStudyName]);

  // Cancel editing
  const cancelEditing = useCallback(() => {
    setEditingStudy(null);
    setEditStudyName('');
  }, []);

  // Open collaboration manager
  const openCollaborationManager = useCallback((study) => {
    setSelectedStudy(study);
    setShowCollaborationManager(true);
  }, []);

  // Handle study join
  const handleStudyJoin = useCallback((joinedStudy) => {
    loadStudies();
    setShowJoinModal(false);
  }, [loadStudies]);

  // Get permission icon
  const getPermissionIcon = (permission) => {
    switch (permission) {
      case 'admin':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'edit':
        return <Edit3 className="w-4 h-4 text-blue-500" />;
      case 'view':
        return <Eye className="w-4 h-4 text-gray-500" />;
      default:
        return <Eye className="w-4 h-4 text-gray-400" />;
    }
  };

  // Get permission label
  const getPermissionLabel = (permission) => {
    switch (permission) {
      case 'admin':
        return 'Admin';
      case 'edit':
        return 'Edit';
      case 'view':
        return 'View';
      default:
        return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading studies...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Chess Studies</h1>
          <p className="text-gray-600 mt-2">Manage your chess studies and collaborate with others</p>
        </div>
        
        <div className="flex space-x-3">
          {/* Invitations Button */}
          {invitations.length > 0 && (
            <button
              onClick={() => setShowInvitations(!showInvitations)}
              className="relative px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center space-x-2"
            >
              <Bell className="w-4 h-4" />
              <span>Invitations ({invitations.length})</span>
            </button>
          )}
          
          {/* Join Study Button */}
          <button
            onClick={() => setShowJoinModal(true)}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center space-x-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Join Study</span>
          </button>
          
          {/* Create Study Button */}
          <button
            onClick={createNewStudy}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Study</span>
          </button>
        </div>
      </div>

      {/* Invitations Panel */}
      {showInvitations && invitations.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-orange-800 mb-3">Pending Invitations</h3>
          <div className="space-y-2">
            {invitations.map((invitation) => (
              <div key={invitation.studyId} className="flex items-center justify-between p-3 bg-white rounded border">
                <div>
                  <div className="font-medium">{invitation.studyName}</div>
                  <div className="text-sm text-gray-500">
                    Invited by {invitation.owner.username}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      collaborationService.acceptInvitation(invitation.studyId)
                        .then(() => {
                          loadInvitations();
                          loadStudies();
                          alert('Invitation accepted!');
                        })
                        .catch(error => alert('Failed to accept invitation'));
                    }}
                    className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => {
                      collaborationService.declineInvitation(invitation.studyId)
                        .then(() => {
                          loadInvitations();
                          alert('Invitation declined');
                        })
                        .catch(error => alert('Failed to decline invitation'));
                    }}
                    className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Studies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {studies.map((study) => (
          <div key={study._id} className="bg-white rounded-lg shadow-md border hover:shadow-lg transition-shadow">
            <div className="p-6">
              {/* Study Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  {editingStudy === study._id ? (
                    <input
                      type="text"
                      value={editStudyName}
                      onChange={(e) => setEditStudyName(e.target.value)}
                      onBlur={() => saveStudyName(study._id)}
                      onKeyPress={(e) => e.key === 'Enter' && saveStudyName(study._id)}
                      className="w-full text-lg font-semibold border-none outline-none bg-transparent"
                      autoFocus
                    />
                  ) : (
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">
                      {study.name}
                    </h3>
                  )}
                  
                  {/* Study Info */}
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span>{study.chapterCount || 0} chapters</span>
                    <span>•</span>
                    <span>{study.userAccess?.permission ? getPermissionLabel(study.userAccess.permission) : 'Unknown'}</span>
                    {study.isOwner && <span>• Owner</span>}
                  </div>
                </div>
                
                {/* Permission Icon */}
                <div className="flex items-center space-x-1">
                  {getPermissionIcon(study.userAccess?.permission)}
                </div>
              </div>

              {/* Study Description */}
              {study.description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {study.description}
                </p>
              )}

              {/* Study Actions */}
              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  <button
                    onClick={() => navigate(`/enhanced-chess-study?study=${study._id}`)}
                    className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 flex items-center space-x-1"
                  >
                    <Play className="w-3 h-3" />
                    <span>Open</span>
                  </button>
                  
                  {study.userAccess?.permission === 'admin' && (
                    <button
                      onClick={() => openCollaborationManager(study)}
                      className="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600 flex items-center space-x-1"
                    >
                      <Users className="w-3 h-3" />
                      <span>Collaborate</span>
                    </button>
                  )}
                </div>
                
                {/* Study Menu */}
                <div className="flex space-x-1">
                  {study.userAccess?.permission === 'admin' && (
                    <>
                      <button
                        onClick={() => startEditingStudy(study)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="Edit name"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteStudy(study._id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                        title="Delete study"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {studies.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-500 mb-2">No studies yet</h3>
          <p className="text-gray-400 mb-6">Create your first study or join an existing one</p>
          <div className="flex justify-center space-x-3">
            <button
              onClick={createNewStudy}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Create Study
            </button>
            <button
              onClick={() => setShowJoinModal(true)}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              Join Study
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showCollaborationManager && (
        <CollaborationManager
          study={selectedStudy}
          onUpdate={loadStudies}
          onClose={() => {
            setShowCollaborationManager(false);
            setSelectedStudy(null);
          }}
        />
      )}

      {showJoinModal && (
        <JoinStudyModal
          onJoin={handleStudyJoin}
          onClose={() => setShowJoinModal(false)}
        />
      )}
    </div>
  );
};

export default StudiesManager;