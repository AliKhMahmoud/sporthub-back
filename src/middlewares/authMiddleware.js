const User = require("../models/User");
const cookieService = require("../utils/cookieService");
const tokenService = require("../utils/generateToken");

const requireAuth = async (req, res, next) => {
    try {
        let token = null;

        if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            token = cookieService.getAccessToken(req);
        }

        if (!token) {
            return res.status(401).json({ status: 401, message: "Access token missing" });
        }

        let decoded;
        try {
            decoded = tokenService.verifyAccessToken(token);
        } catch (err) {
            // إرجاع 401 مباشرة عند انتهاء التوكن أو تزويره ليتعامل معها الفرونت إند
            return res.status(401).json({ status: 401, message: err.message || "Unauthorized" });
        }

        const userId = decoded?.id || decoded?._id || decoded?.userId;

        if (!userId) {
            return res.status(401).json({ status: 401, message: "Invalid token payload" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(401).json({ status: 401, message: "User no longer exists" });
        }
        
        if (!user.isActive) {
            return res.status(403).json({ status: 403, message: "Account disabled" });
        }

        if (user.isLocked && user.lockedUntil > Date.now()) {
            return res.status(403).json({ status: 403, message: "Account is locked" });
        }

        if (!user.isVerified) {
            return res.status(403).json({ status: 403, message: "Email not verified" });
        }

        req.user = {
            id: user._id,
            email: user.email,
            role: user.role,
            sport: user.sport,
            coach: user.coach,
            coachStatus: user.coachStatus
        };

        next();
    } catch (error) {
        next(error);
    }
};

const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ status: 401, message: "Authentication required" });
        }

        const userRole = req.user.role;
        const hasAccess = allowedRoles.includes(userRole);

        if (!hasAccess) {
            return res.status(403).json({ status: 403, message: "Forbidden: insufficient permissions" });
        }

        next();
    };
};

module.exports = {
    requireAuth,
    authorize
};