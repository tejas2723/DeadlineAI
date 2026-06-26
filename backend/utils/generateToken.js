const jwt = require('jsonwebtoken');

/**
 * Generates a signed JWT token for the user.
 * @param {string} userId - User's database ObjectId.
 * @returns {string} Signed JWT token.
 */
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
  );
};

module.exports = generateToken;
