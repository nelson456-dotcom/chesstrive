const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: false
  },
  googleId: {
    type: String,
    index: true,
    sparse: true
  },
  facebookId: {
    type: String,
    index: true,
    sparse: true
  },
  name: {
    type: String,
    required: false
  },
  repertoire: [{
    openingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Opening'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  purchasedOpenings: [{
    type: String // store opening IDs
  }],
  progress: {
    type: Map,
    of: {
      lastPracticed: Date,
      successRate: Number,
      totalAttempts: Number,
      correctAttempts: Number,
      completedLines: Number,
      totalLines: Number
    },
    default: new Map()
  },
  role: {
    type: String,
    enum: ['standard', 'admin'],
    default: 'standard'
  },
  userType: {
    type: String,
    enum: ['free', 'premium'],
    default: 'free'
  },
  // Stripe subscription fields
  stripeCustomerId: {
    type: String,
    sparse: true,
    index: true
  },
  stripeSubscriptionId: {
    type: String,
    sparse: true
  },
  subscriptionStatus: {
    type: String,
    enum: ['active', 'canceled', 'past_due', 'trialing', 'incomplete', 'incomplete_expired', 'unpaid', null],
    default: null
  },
  subscriptionPlan: {
    type: String,
    enum: ['premium', null],
    default: null
  },
  subscriptionCurrentPeriodEnd: {
    type: Date,
    default: null
  },
  subscriptionCancelAtPeriodEnd: {
    type: Boolean,
    default: false
  },
  subscriptionExtendedPeriodEnd: {
    type: Date,
    default: null
  },
  isCoach: {
    type: Boolean,
    default: false
  },
  coaches: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    default: []
  },
  students: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    default: []
  },
  banned: {
    type: Boolean,
    default: false
  },
  profileIcon: {
    type: String,
    default: 'user' // default icon
  },
  rating: {
    type: Number,
    default: 1200
  },
  blunderRating: {
    type: Number,
    default: 1200
  },
  visualisationRating: {
    type: Number,
    default: 1200
  },
  endgameRating: {
    type: Number,
    default: 1200
  },
  advantageRating: {
    type: Number,
    default: 1200
  },
  advantageWins: {
    type: Number,
    default: 0
  },
  resourcefulnessRating: {
    type: Number,
    default: 1200
  },
  resourcefulnessWins: {
    type: Number,
    default: 0
  },
  defenderRating: {
    type: Number,
    default: 1200
  },
  defenderWins: {
    type: Number,
    default: 0
  },
  openingsPracticed: {
    type: Number,
    default: 0
  },
  positionalRating: {
    type: Number,
    default: 1200
  },
  stats: {
    puzzleStats: {
      totalAttempted: { type: Number, default: 0 },
      totalSolved: { type: Number, default: 0 },
      totalFailed: { type: Number, default: 0 },
      currentStreak: { type: Number, default: 0 },
      bestStreak: { type: Number, default: 0 },
      recentlySolved: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Puzzle' }],
      averageRating: { type: Number, default: 0 },
      byTheme: { type: Map, of: { solved: Number, attempted: Number }, default: new Map() },
      byDifficulty: { type: Map, of: { solved: Number, attempted: Number }, default: new Map() }
    },
    puzzleRushStats: {
      bestStreak: { type: Number, default: 0 },
      currentStreak: { type: Number, default: 0 },
      totalPuzzles: { type: Number, default: 0 },
      totalSolved: { type: Number, default: 0 },
      totalFailed: { type: Number, default: 0 },
      bestTime: { type: Number, default: null }, // best time in seconds
      averageTime: { type: Number, default: 0 }
    },
    openingStats: {
      openings: [{
        name: String,
        totalPlayed: { type: Number, default: 0 },
        wins: { type: Number, default: 0 },
        losses: { type: Number, default: 0 },
        draws: { type: Number, default: 0 }
      }]
    },
    botGamesStats: {
      totalPlayed: { type: Number, default: 0 },
      wins: { type: Number, default: 0 },
      losses: { type: Number, default: 0 },
      draws: { type: Number, default: 0 }
    }
  },
  dailyProgress: {
    date: { type: String, default: () => new Date().toISOString().split('T')[0] },
    tactics: { completed: { type: Number, default: 0 }, total: { type: Number, default: 5 } },
    blunderPreventer: { completed: { type: Number, default: 0 }, total: { type: Number, default: 6 } },
    intuitionTrainer: { completed: { type: Number, default: 0 }, total: { type: Number, default: 1 } },
    defender: { completed: { type: Number, default: 0 }, total: { type: Number, default: 1 } },
    endgame: { completed: { type: Number, default: 0 }, total: { type: Number, default: 1 } },
    visualization: { completed: { type: Number, default: 0 }, total: { type: Number, default: 1 } }
  },
  dailyPuzzleCount: {
    type: Number,
    default: 0
  },
  lastPuzzleDate: {
    type: Date
  },
  usageLimits: {
    openings: {
      variationsSeen: [{
        openingName: String,
        variationName: String,
        seenAt: { type: Date, default: Date.now }
      }],
      lastReset: { type: Date, default: Date.now }
    },
    puzzleRush: {
      sessionsToday: { type: Number, default: 0 },
      lastResetDate: { type: String, default: () => new Date().toISOString().split('T')[0] }
    },
    defender: {
      sessionsToday: { type: Number, default: 0 },
      lastResetDate: { type: String, default: () => new Date().toISOString().split('T')[0] }
    },
    report40: {
      used: { type: Boolean, default: false }
    },
    endgameTrainer: {
      puzzlesToday: { type: Number, default: 0 },
      lastResetDate: { type: String, default: () => new Date().toISOString().split('T')[0] }
    },
    guessTheMove: {
      gamesPlayed: { type: Number, default: 0 }
    },
    puzzleTrainer: {
      puzzlesToday: { type: Number, default: 0 },
      lastResetDate: { type: String, default: () => new Date().toISOString().split('T')[0] }
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Ensure either a password or an OAuth provider id is present
userSchema.pre('validate', function(next) {
  if (!this.password && !this.googleId && !this.facebookId) {
    return next(new Error('User must have a password or an OAuth provider id'));
  }
  next();
});

// Create a unique index for username
userSchema.index({ username: 1 }, { unique: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Method to update progress
userSchema.methods.updateProgress = async function(openingId, isCorrect) {
  const progress = this.progress.get(openingId.toString()) || {
    lastPracticed: new Date(),
    successRate: 0,
    totalAttempts: 0,
    correctAttempts: 0
  };

  progress.lastPracticed = new Date();
  progress.totalAttempts += 1;
  if (isCorrect) {
    progress.correctAttempts += 1;
  }
  progress.successRate = (progress.correctAttempts / progress.totalAttempts) * 100;

  this.progress.set(openingId.toString(), progress);
  return this.save();
};

const User = mongoose.model('User', userSchema);

module.exports = User; 