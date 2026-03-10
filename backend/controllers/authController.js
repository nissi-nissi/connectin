const jwt = require("jsonwebtoken");
const User = require("../models/User");

const createToken = (user) =>
  jwt.sign(
    {
      userId: user._id,
      email: user.email
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );

const register = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists." });
    }

    const user = await User.create({
      email: email.toLowerCase().trim(),
      password
    });

    const token = createToken(user);
    return res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to register user.", error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const token = createToken(user);
    return res.status(200).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to login.", error: error.message });
  }
};

const logout = async (req, res) => {
  return res.status(200).json({ message: "Logged out." });
};

module.exports = { register, login, logout };
