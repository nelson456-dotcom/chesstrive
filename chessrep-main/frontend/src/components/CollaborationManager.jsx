import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Share2, 
  Copy, 
  Check, 
  X, 
  Edit3, 
  Trash2, 
  Crown,
  Eye,
  EyeOff,
  Settings
} from 'lucide-react';
import { collaborationService } from '../services/collaborationService';

const CollaborationManager = ({ study, onUpdate, onClose }) => {
  const [collaborators, setCollaborators] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('collaborators');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePermission, setInvitePermission] = useState('view');
  const [shareCode, setShareCode] = useState('');
  const [showShareCode, setShowShareCode] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load collaborators and invitations
  useEffect(() => {
    if (study) {
      loadCollaborators();
      loadInvitations();
    }
  }, [study]);

  const loadCollaborators = async () => {
    try {
      const studyId = study._id || study.id;
      if (!studyId) {
        console.warn('No study ID available for loading collaborators');
        return;
      }
      const response = await collaborationService.getCollaborators(studyId);
      if (response.success) {
        setCollaborators(response.collaborators);
      }
    } catch (error) {
      console.error('Error loading collaborators:', error);
    }
  };

  const loadInvitations = async () => {
    try {
      const response = await collaborationService.getInvitations();
      if (response.success) {
        setInvitations(response.invitations);
      }
    } catch (error) {
      console.error('Error loading invitations:', error);
    }
  };

  const handleInviteUser = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setLoading(true);
    try {
      const response = await collaborationService.inviteUser(
        study._id, 
        inviteEmail, 
        invitePermission
      );
      
      if (response.success) {
        setInviteEmail('');
        loadCollaborators();
        onUpdate && onUpdate();
        alert('Invitation sent successfully!');
      }
    } catch (error) {
      console.error('Error inviting user:', error);
      alert(error.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async (studyId) => {
    try {
      const response = await collaborationService.acceptInvitation(studyId);
      if (response.success) {
        loadInvitations();
        onUpdate && onUpdate();
        alert('Invitation accepted!');
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      alert(error.message || 'Failed to accept invitation');
    }
  };

  const handleDeclineInvitation = async (studyId) => {
    try {
      const response = await collaborationService.declineInvitation(studyId);
      if (response.success) {
        loadInvitations();
        alert('Invitation declined');
      }
    } catch (error) {
      console.error('Error declining invitation:', error);
      alert(error.message || 'Failed to decline invitation');
    }
  };

  const handleUpdatePermission = async (userId, newPermission) => {
    try {
      const response = await collaborationService.updatePermission(
        study._id, 
        userId, 
        newPermission
      );
      
      if (response.success) {
        loadCollaborators();
        alert('Permission updated successfully!');
      }
    } catch (error) {
      console.error('Error updating permission:', error);
      alert(error.message || 'Failed to update permission');
    }
  };

  const handleRemoveCollaborator = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this collaborator?')) {
      return;
    }

    try {
      const response = await collaborationService.removeCollaborator(
        study._id, 
        userId
      );
      
      if (response.success) {
        loadCollaborators();
        alert('Collaborator removed successfully!');
      }
    } catch (error) {
      console.error('Error removing collaborator:', error);
      alert(error.message || 'Failed to remove collaborator');
    }
  };

  const handleGenerateShareCode = async () => {
    try {
      const response = await collaborationService.generateShareCode(study._id);
      if (response.success) {
        setShareCode(response.shareCode);
        setShowShareCode(true);
      }
    } catch (error) {
      console.error('Error generating share code:', error);
      alert(error.message || 'Failed to generate share code');
    }
  };

  const handleCopyShareCode = () => {
    navigator.clipboard.writeText(shareCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getPermissionIcon = (permission) => {
    switch (permission) {
      case 'admin':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'edit':
        return <Edit3 className="w-4 h-4 text-blue-500" />;
      case 'view':
        return <Eye className="w-4 h-4 text-gray-500" />;
      default:
        return <EyeOff className="w-4 h-4 text-gray-400" />;
    }
  };

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

  if (!study) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            <Users className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-semibold">Collaboration Manager</h2>
            <span className="text-sm text-gray-500">- {study.name}</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('collaborators')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'collaborators'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Collaborators ({collaborators.length})
          </button>
          <button
            onClick={() => setActiveTab('invitations')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'invitations'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Invitations ({invitations.length})
          </button>
          <button
            onClick={() => setActiveTab('share')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'share'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Share Study
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Collaborators Tab */}
          {activeTab === 'collaborators' && (
            <div className="space-y-4">
              {/* Invite Form */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">Invite New Collaborator</h3>
                <form onSubmit={handleInviteUser} className="flex space-x-2">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="Enter email address"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <select
                    value={invitePermission}
                    onChange={(e) => setInvitePermission(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="view">View Only</option>
                    <option value="edit">Can Edit</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 flex items-center space-x-1"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Invite</span>
                  </button>
                </form>
              </div>

              {/* Collaborators List */}
              <div className="space-y-2">
                {collaborators.map((collab) => (
                  <div
                    key={collab.id}
                    className="flex items-center justify-between p-3 bg-white border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {collab.user.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium">{collab.user.username}</div>
                        <div className="text-sm text-gray-500">{collab.user.email}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        {getPermissionIcon(collab.permission)}
                        <span className="text-sm">{getPermissionLabel(collab.permission)}</span>
                      </div>
                      
                      {study.userAccess?.permission === 'admin' && (
                        <div className="flex items-center space-x-1">
                          <select
                            value={collab.permission}
                            onChange={(e) => handleUpdatePermission(collab.user.id, e.target.value)}
                            className="text-sm border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="view">View</option>
                            <option value="edit">Edit</option>
                            <option value="admin">Admin</option>
                          </select>
                          
                          <button
                            onClick={() => handleRemoveCollaborator(collab.user.id)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Invitations Tab */}
          {activeTab === 'invitations' && (
            <div className="space-y-4">
              {invitations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No pending invitations
                </div>
              ) : (
                invitations.map((invitation) => (
                  <div
                    key={invitation.studyId}
                    className="flex items-center justify-between p-4 bg-white border rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{invitation.studyName}</div>
                      <div className="text-sm text-gray-500">
                        Invited by {invitation.owner.username}
                      </div>
                      <div className="text-sm text-gray-400">
                        {invitation.permission} permission
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleAcceptInvitation(invitation.studyId)}
                        className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center space-x-1"
                      >
                        <Check className="w-4 h-4" />
                        <span>Accept</span>
                      </button>
                      <button
                        onClick={() => handleDeclineInvitation(invitation.studyId)}
                        className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center space-x-1"
                      >
                        <X className="w-4 h-4" />
                        <span>Decline</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Share Tab */}
          {activeTab === 'share' && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">Share Study with Code</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Generate a share code that others can use to join this study directly.
                </p>
                
                {!showShareCode ? (
                  <button
                    onClick={handleGenerateShareCode}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center space-x-2"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Generate Share Code</span>
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={shareCode}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-100 font-mono"
                      />
                      <button
                        onClick={handleCopyShareCode}
                        className="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 flex items-center space-x-1"
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        <span>{copied ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>
                    <p className="text-sm text-gray-600">
                      Share this code with others so they can join your study.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CollaborationManager;
