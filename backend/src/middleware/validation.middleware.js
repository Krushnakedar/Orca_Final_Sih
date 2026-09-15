/**
 * Input sanitization and validation middleware
 * Prevents injection, payload bloat, and algorithmic complexity attacks.
 */

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

// Strips null-bytes and trims strings recursively
function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      obj[key] = obj[key].replace(/\0/g, '').trim();
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeObject(obj[key]);
    }
  }
  return obj;
}

const sanitizeInputs = (req, res, next) => {
  if (req.body) sanitizeObject(req.body);
  if (req.query) sanitizeObject(req.query);
  if (req.params) sanitizeObject(req.params);
  next();
};

const validateAuthRegistration = (req, res, next) => {
  const { name, email, password } = req.body;

  if (!name || typeof name !== 'string' || name.length > 100) {
    return res.status(400).json({
      success: false,
      message: 'Name is required and must not exceed 100 characters'
    });
  }

  if (!email || !EMAIL_REGEX.test(email) || email.length > 254) {
    return res.status(400).json({
      success: false,
      message: 'A valid email address is required'
    });
  }

  if (!password || typeof password !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Password is required'
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters in length'
    });
  }

  // Bcrypt truncates passwords after 72 bytes; enforce upper boundary to prevent CPU-exhaustion DoS
  if (password.length > 72) {
    return res.status(400).json({
      success: false,
      message: 'Password must not exceed 72 characters'
    });
  }

  next();
};

const validateAuthLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !EMAIL_REGEX.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'A valid email address is required'
    });
  }

  if (!password || typeof password !== 'string' || password.length > 72) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email address or password'
    });
  }

  next();
};

const validateChatMessage = (req, res, next) => {
  const { message } = req.body;

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Message content is required'
    });
  }

  if (message.length > 2000) {
    return res.status(400).json({
      success: false,
      message: 'Message is too long (maximum 2,000 characters)'
    });
  }

  next();
};

const validateCoordinates = (req, res, next) => {
  const lat = parseFloat(req.query.lat ?? req.body.lat);
  const lon = parseFloat(req.query.lon ?? req.body.lon);

  if (req.query.lat !== undefined || req.body.lat !== undefined) {
    if (isNaN(lat) || lat < -90 || lat > 90) {
      return res.status(400).json({
        success: false,
        message: 'Latitude must be a valid number between -90 and 90'
      });
    }
  }

  if (req.query.lon !== undefined || req.body.lon !== undefined) {
    if (isNaN(lon) || lon < -180 || lon > 180) {
      return res.status(400).json({
        success: false,
        message: 'Longitude must be a valid number between -180 and 180'
      });
    }
  }

  next();
};

module.exports = {
  sanitizeInputs,
  validateAuthRegistration,
  validateAuthLogin,
  validateChatMessage,
  validateCoordinates
};
