import bcrypt from 'bcryptjs';
import { config } from '../config/env.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { clearAuthCookie, setAuthCookie } from '../utils/authCookie.js';

// Compared against when the email is unknown so response time does not reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync('linkly-timing-equaliser', config.bcryptRounds);

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.validated.body;

  if (await User.exists({ email })) {
    throw new ApiError(409, 'An account with this email already exists.', { code: 'EMAIL_TAKEN' });
  }

  const passwordHash = await bcrypt.hash(password, config.bcryptRounds);
  let user;
  try {
    user = await User.create({ name, email, passwordHash });
  } catch (error) {
    // Two simultaneous registrations: the unique index wins.
    if (error?.code === 11000) {
      throw new ApiError(409, 'An account with this email already exists.', { code: 'EMAIL_TAKEN' });
    }
    throw error;
  }

  setAuthCookie(res, user._id);
  res.status(201).json({ success: true, data: { user } });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.validated.body;

  const user = await User.findOne({ email }).select('+passwordHash');
  const passwordMatches = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);

  // One generic message for unknown email and wrong password.
  if (!user || !passwordMatches) {
    throw new ApiError(401, 'Invalid email or password.', { code: 'INVALID_CREDENTIALS' });
  }

  setAuthCookie(res, user._id);
  res.json({ success: true, data: { user } });
});

export const logout = (_req, res) => {
  clearAuthCookie(res);
  res.json({ success: true, data: { message: 'Logged out.' } });
};

export const me = (req, res) => {
  res.json({ success: true, data: { user: req.user } });
};
