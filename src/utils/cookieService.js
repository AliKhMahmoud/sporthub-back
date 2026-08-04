const isProduction = process.env.NODE_ENV === "production";

const cookieConfig = {
    httpOnly: true, 
    secure: isProduction, // بتكون true على Render وتلقائياً false على الـ localhost
    sameSite: isProduction ? "none" : "lax", // بتكون "none" على الكلاود لتسمح بالعبور بين Vercel و Render، و "lax" محلياً
    path: "/"
}

class CookieService {
    setAccessToken(res, token) {
        res.cookie("accessToken", token, {
            ...cookieConfig,
            maxAge: 200 * 60 * 1000 // 200m
        });
    }

    setRefreshToken(res, token) {
        res.cookie("refreshToken", token, {
            ...cookieConfig,
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7d
        });
    }

    clearTokens(res) {
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
    }

    getAccessToken(req) {
        return req.cookies.accessToken;
    }

    getRefreshToken(req) {
        return req.cookies.refreshToken;
    }
}

module.exports = new CookieService();