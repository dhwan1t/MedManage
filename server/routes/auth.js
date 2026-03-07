const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { JWT_SECRET, verifyToken, verifyRole } = require("../middleware/auth");

// Roles that anyone can self-register as
const PUBLIC_ROLES = ["public"];

// Roles that require an existing admin to assign
const PRIVILEGED_ROLES = ["ambulance", "hospital", "admin"];

// POST /api/auth/register — Public self-registration (public role only)
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ msg: "Please provide name, email, and password" });
    }

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      name,
      email,
      password: hashedPassword,
      role: "public",
      phone,
    });

    await user.save();

    const payload = {
      userId: user.id,
      role: user.role,
      hospitalId: user.hospitalId || null,
      ambulanceId: user.ambulanceId || null,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        hospitalId: user.hospitalId || null,
        ambulanceId: user.ambulanceId || null,
      },
    });
  } catch (err) {
    console.error("Register error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// POST /api/auth/admin/create-user — Admin-only: create users with any role
router.post(
  "/admin/create-user",
  verifyToken,
  verifyRole("admin"),
  async (req, res) => {
    try {
      const { name, email, password, role, phone, hospitalId, ambulanceId } =
        req.body;

      if (!name || !email || !password || !role) {
        return res
          .status(400)
          .json({ msg: "Please provide name, email, password, and role" });
      }

      const allowedRoles = [...PUBLIC_ROLES, ...PRIVILEGED_ROLES];
      if (!allowedRoles.includes(role)) {
        return res.status(400).json({ msg: `Invalid role: ${role}` });
      }

      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ msg: "User already exists" });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      user = new User({
        name,
        email,
        password: hashedPassword,
        role,
        phone,
        hospitalId: hospitalId || undefined,
        ambulanceId: ambulanceId || undefined,
      });

      await user.save();

      res.status(201).json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          hospitalId: user.hospitalId || null,
          ambulanceId: user.ambulanceId || null,
        },
      });
    } catch (err) {
      console.error("Admin create-user error:", err.message);
      res.status(500).json({ msg: "Server error" });
    }
  },
);

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ msg: "Please provide email and password" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ msg: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ msg: "Invalid credentials" });
    }

    const payload = {
      userId: user.id,
      role: user.role,
      hospitalId: user.hospitalId || null,
      ambulanceId: user.ambulanceId || null,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        hospitalId: user.hospitalId || null,
        ambulanceId: user.ambulanceId || null,
      },
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
