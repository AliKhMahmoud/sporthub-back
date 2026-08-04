const User = require("../models/User");
const cookieService = require("../utils/cookieService");
const tokenService = require("../utils/generateToken");

// Authentication
const requireAuth = async (req, res, next) => {
    try {
        let token = null;

        // 1. محاولة جلب التوكن من الهيدر أولاً (Bearer Token القادم من الـ Frontend Axios Interceptor)
        if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
            token = req.headers.authorization.split(" ")[1];
        }

        // 2. إذا لم يوجد في الهيدر، حاول جلبه من الكوكيز
        if (!token) {
            token = cookieService.getAccessToken(req);
        }

        if (!token) {
            return res.status(401).json({ message: "Access token missing" });
        }

        const decoded = tokenService.verifyAccessToken(token);

        // استخراج معرف المستخدم بأمان بغض النظر عن طريقة حفظه داخل التوكن
        const userId = decoded?.id || decoded?._id || decoded?.userId;

        if (!userId) {
            return res.status(401).json({ message: "Invalid token payload: missing user ID" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(401).json({ message: "User no longer exists" });
        }
        
        if (!user.isActive) {
            return res.status(403).json({ message: "Account disabled" });
        }

        if (user.isLocked && user.lockedUntil > Date.now()) {
            return res.status(403).json({ message: "Account is locked" });
        }

        if (!user.isVerified) {
            return res.status(403).json({ message: "Email not verified" });
        }

        // تمرير كافة خصائص الدور والمسميات لكي يتم التعرف عليها بسلاسة
        req.user = {
            id: user._id,
            email: user.email,
            role: user.role,
            roleName: user.roleName,
            roleId: user.roleId,
            isAdmin: user.isAdmin,
            sport: user.sport,
            coach: user.coach,
            coachStatus: user.coachStatus
        };

        next();
    } catch (error) {
        next(error);
    }
};

// Authorization (Role-Based) - معدل ليدعم الأدمن والسوبر أدمن بشكل ذكي
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const userRole = req.user.role;
        const roleName = req.user.roleName;
        const roleId = req.user.roleId;

        // التحقق مما إذا كان المستخدم يملك صلاحية الأدمن (سواء كان SuperAdmin أو roleId == 6 أو ضمن الأدوار المسموحة)
        const isSuperAdminOrAdmin =
            roleName === "SuperAdmin" ||
            roleName === "Admin" ||
            roleId === 6 ||
            roleId === "6" ||
            req.user.isAdmin === true ||
            userRole === "admin" ||
            userRole === "SuperAdmin";

        // إذا كانت الصفحة تتطلب 'admin' والمستخدم هو SuperAdmin أو Admin، نسمح له بالمرور مباشرة
        const hasAccess =
            allowedRoles.includes(userRole) ||
            allowedRoles.includes(roleName) ||
            (allowedRoles.includes("admin") && isSuperAdminOrAdmin);

        if (!hasAccess) {
            return res.status(403).json({ message: "Forbidden: invalid role" });
        }

        next();
    };
};

module.exports = {
    requireAuth,
    authorize
};