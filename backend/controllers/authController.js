const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Validate all fields present
  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please fill in all fields (name, email, password)');
  }

  // Check for existing user
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('Email already registered');
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
  });

  if (user) {
    res.status(201).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        preferences: user.preferences,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide email and password');
  }

  // Find user and explicitly load password field
  const user = await User.findOne({ email }).select('+password');

  if (user && (await user.matchPassword(password))) {
    const userData = user.toJSON(); // automatically strips password
    res.status(200).json({
      user: userData,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    user: req.user,
  });
});

/**
 * @desc    Update user preferences
 * @route   PUT /api/auth/preferences
 * @access  Private
 */
const updatePreferences = asyncHandler(async (req, res) => {
  const { workHoursPerDay, aiTone, reminderEnabled } = req.body;

  // Build key paths for dot-notation updates to save nested object settings
  const updateData = {};
  if (workHoursPerDay !== undefined) {
    updateData['preferences.workHoursPerDay'] = workHoursPerDay;
  }
  if (aiTone !== undefined) {
    updateData['preferences.aiTone'] = aiTone;
  }
  if (reminderEnabled !== undefined) {
    updateData['preferences.reminderEnabled'] = reminderEnabled;
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (!updatedUser) {
    res.status(404);
    throw new Error('User not found');
  }

  res.status(200).json({
    user: updatedUser,
  });
});

/**
 * @desc    Update user career profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const {
    skills,
    experience,
    resumeText,
    githubUrl,
    linkedinUrl,
    currentProjects,
    careerGoals,
  } = req.body;

  const updateData = {};
  if (skills !== undefined) updateData['careerProfile.skills'] = skills;
  if (experience !== undefined) updateData['careerProfile.experience'] = experience;
  if (resumeText !== undefined) updateData['careerProfile.resumeText'] = resumeText;
  if (githubUrl !== undefined) updateData['careerProfile.githubUrl'] = githubUrl;
  if (linkedinUrl !== undefined) updateData['careerProfile.linkedinUrl'] = linkedinUrl;
  if (currentProjects !== undefined) updateData['careerProfile.currentProjects'] = currentProjects;
  if (careerGoals !== undefined) updateData['careerProfile.careerGoals'] = careerGoals;

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (!updatedUser) {
    res.status(404);
    throw new Error('User not found');
  }

  res.status(200).json({
    user: updatedUser,
  });
});

module.exports = {
  register,
  login,
  getMe,
  updatePreferences,
  updateProfile,
};

