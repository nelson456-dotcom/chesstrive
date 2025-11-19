const mongoose = require('mongoose');

const studySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  chapters: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chapter'
  }],
  collaborators: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['viewer', 'editor', 'admin'],
      default: 'viewer'
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending'
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    acceptedAt: {
      type: Date
    }
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
studySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to check if user has access to study
studySchema.methods.hasAccess = function(userId) {
  // Owner has admin access - handle both ObjectId and populated object
  const authorId = this.authorId._id ? this.authorId._id : this.authorId;
  if (authorId.toString() === userId.toString()) {
    return { hasAccess: true, permission: 'admin' };
  }
  
  // Check collaborators
  const collaborator = this.collaborators.find(c => c.userId.toString() === userId.toString());
  if (collaborator) {
    return { hasAccess: true, permission: collaborator.role };
  }
  
  return { hasAccess: false, permission: null };
};

// Method to add collaborator
studySchema.methods.addCollaborator = async function(userId, role = 'viewer', invitedBy) {
  // Check if user is already a collaborator
  const existingCollaborator = this.collaborators.find(c => c.userId.toString() === userId.toString());
  if (existingCollaborator) {
    throw new Error('User is already a collaborator on this study');
  }
  
  this.collaborators.push({
    userId: userId,
    role: role,
    addedAt: new Date(),
    invitedBy: invitedBy,
    status: 'pending'
  });
  
  return this.save();
};

// Method to accept invitation
studySchema.methods.acceptInvitation = async function(userId) {
  const collaborator = this.collaborators.find(c => c.userId.toString() === userId.toString());
  if (!collaborator) {
    throw new Error('No invitation found for this user');
  }
  
  if (collaborator.status === 'accepted') {
    throw new Error('Invitation already accepted');
  }
  
  collaborator.status = 'accepted';
  collaborator.acceptedAt = new Date();
  
  return this.save();
};

// Method to update collaborator permission
studySchema.methods.updateCollaboratorPermission = async function(userId, newPermission) {
  const collaborator = this.collaborators.find(c => c.userId.toString() === userId.toString());
  if (!collaborator) {
    throw new Error('User is not a collaborator on this study');
  }
  
  collaborator.role = newPermission;
  return this.save();
};

// Method to remove collaborator
studySchema.methods.removeCollaborator = async function(userId) {
  this.collaborators = this.collaborators.filter(c => c.userId.toString() !== userId.toString());
  return this.save();
};

module.exports = mongoose.model('Study', studySchema);