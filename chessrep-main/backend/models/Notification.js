const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['study_invitation', 'study_joined', 'study_updated', 'collaborator_added', 'collaborator_removed', 'coach_added', 'student_added'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

// Method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Static method to create study invitation notification
notificationSchema.statics.createStudyInvitation = async function(userId, studyId, studyName, inviterName) {
  return this.create({
    user: userId,
    type: 'study_invitation',
    title: 'Study Invitation',
    message: `${inviterName} has invited you to collaborate on the study "${studyName}"`,
    data: {
      studyId,
      studyName,
      inviterName
    }
  });
};

// Static method to create study joined notification
notificationSchema.statics.createStudyJoined = async function(userId, studyId, studyName, joinerName) {
  return this.create({
    user: userId,
    type: 'study_joined',
    title: 'New Collaborator',
    message: `${joinerName} has joined the study "${studyName}"`,
    data: {
      studyId,
      studyName,
      joinerName
    }
  });
};

// Static method to create coach added notification (for students)
notificationSchema.statics.createCoachAdded = async function(userId, coachId, coachName) {
  return this.create({
    user: userId,
    type: 'coach_added',
    title: 'New Coach',
    message: `${coachName} has added you as a student. They can now track your progress.`,
    data: {
      coachId,
      coachName
    }
  });
};

// Static method to create student added notification (for coaches)
notificationSchema.statics.createStudentAdded = async function(userId, studentId, studentName) {
  return this.create({
    user: userId,
    type: 'student_added',
    title: 'New Student',
    message: `${studentName} has been added as your student. You can now track their progress.`,
    data: {
      studentId,
      studentName
    }
  });
};

module.exports = mongoose.model('Notification', notificationSchema);

