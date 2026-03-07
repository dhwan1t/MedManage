const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error(
    "FATAL: JWT_SECRET environment variable is not set. Server cannot start.",
  );
  process.exit(1);
}

const verifyToken = (req, res, next) => {
  const authHeader = req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Contains userId and role
    next();
  } catch (err) {
    res.status(401).json({ msg: "Token is not valid" });
  }
};

const verifyRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ msg: "Access denied: insufficient permissions" });
    }
    next();
  };
};

module.exports = {
  verifyToken,
  verifyRole,
  JWT_SECRET,
};
