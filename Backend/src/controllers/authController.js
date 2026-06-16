import User from "../models/User.js";
import jwt from "jsonwebtoken";

// Token generator helper
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// 3. GOOGLE AUTH
export const googleAuth = async (req, res) => {
  try {
    const { credential, role } = req.body;
    if (!credential) return res.status(400).json({ message: "Google credential required" });

    // Decode Google JWT payload (base64url decode)
    const base64Payload = credential.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(Buffer.from(base64Payload, "base64").toString());

    const { email, name, email_verified } = payload;
    if (!email_verified) return res.status(400).json({ message: "Google email not verified" });

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name: name || email.split("@")[0],
        email,
        password: `GoogleAuth@${Date.now()}${Math.random().toString(36).slice(2)}`,
        role: role || "influencer",
      });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 1. REGISTER FUNCTION
export const register = async (req, res) => {
  try {
    const { name, email, password, role, influencerDetails, brandDetails } = req.body;
    
    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "User already exists" });

    // Create user with additional details
    const user = await User.create({ 
      name, 
      email, 
      password, 
      role,
      influencerDetails,
      brandDetails 
    });
    
    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. LOGIN FUNCTION
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Explicitly select password agar schema mein select: false hai
    const user = await User.findOne({ email }).select("+password");

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};