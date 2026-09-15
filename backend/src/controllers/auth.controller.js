const jwt = require('jsonwebtoken');
const config = require('../config');
const UserModel = require('../models/user.model');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
};

const register = async (req, res, next) => {
  try {
    const { name, email, password, role, organization, vesselName, preferredSector } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required fields'
      });
    }

    const normalizedEmail = (email || '').toLowerCase().trim();

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters in length'
      });
    }

    if (password.length > 72) {
      return res.status(400).json({
        success: false,
        message: 'Password must not exceed 72 characters'
      });
    }

    const existingUser = await UserModel.findByEmail(normalizedEmail);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists'
      });
    }

    // Security Hardening: Whitelist permitted self-registration roles to prevent privilege escalation (Mass Assignment)
    const ALLOWED_ROLES = ['fisherman', 'vessel_operator'];
    let safeRole = 'fisherman';
    if (role) {
      const requestedRole = role.toLowerCase().trim();
      if (!ALLOWED_ROLES.includes(requestedRole)) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized role specified. Self-registration is restricted to fisherman and vessel_operator.'
        });
      }
      safeRole = requestedRole;
    }

    const newUser = await UserModel.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: safeRole,
      organization: (organization || '').trim(),
      vesselName: (vesselName || '').trim(),
      preferredSector: preferredSector || 'Arabian Sea / Mumbai Coast'
    });

    const token = generateToken(newUser);
    const sanitizedUser = UserModel.sanitizeUser(newUser);

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      token,
      user: sanitizedUser
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const user = await UserModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email address or password'
      });
    }

    const isMatch = await UserModel.comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email address or password'
      });
    }

    const token = generateToken(user);
    const sanitizedUser = UserModel.sanitizeUser(user);

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: sanitizedUser
    });
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getProfile,
  logout
};
