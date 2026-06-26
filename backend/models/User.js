const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    avatar: {
      type: String,
      default: '',
    },
    preferences: {
      workHoursPerDay: {
        type: Number,
        default: 8,
        min: [1, 'Work hours must be at least 1'],
        max: [24, 'Work hours cannot exceed 24'],
      },
      aiTone: {
        type: String,
        enum: ['motivational', 'strict', 'balanced'],
        default: 'balanced',
      },
      reminderEnabled: {
        type: Boolean,
        default: true,
      },
    },
    careerProfile: {
      skills: {
        type: [String],
        default: [],
      },
      experience: {
        type: String,
        default: '',
      },
      resumeText: {
        type: String,
        default: '',
      },
      githubUrl: {
        type: String,
        default: '',
      },
      linkedinUrl: {
        type: String,
        default: '',
      },
      currentProjects: {
        type: String,
        default: '',
      },
      careerGoals: {
        type: String,
        default: '',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to hash password
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Instance method to compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  // If password field is unselected by default, check if we need to retrieve it manually
  // or assume the caller has selected it before calling matchPassword.
  // Standard implementation is a direct comparison.
  return await bcrypt.compare(enteredPassword, this.password);
};

// toJSON override to remove password field from all JSON responses
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    return ret;
  },
});

const User = mongoose.model('User', userSchema);
module.exports = User;
