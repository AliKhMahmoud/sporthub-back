const isProduction = process.env.NODE_ENV === "production";

const cookieConfig = {
    httpOnly: true, 
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/"
};

class CookieService {
    setAccessToken(res, token) {
        res.cookie("accessToken", token, {
            ...cookieConfig,
            // maxAge: 15 * 60 * 1000 
            maxAge: 200 * 60 * 1000 
        });
    }

    setRefreshToken(res, token) {
        res.cookie("refreshToken", token, {
            ...cookieConfig,
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 أيام
        });
    }

    clearTokens(res) {
        res.clearCookie("accessToken", cookieConfig);
        res.clearCookie("refreshToken", cookieConfig);
    }

    getAccessToken(req) {
        return req.cookies?.accessToken;
    }

    getRefreshToken(req) {
        return req.cookies?.refreshToken;
    }
}

module.exports = new CookieService();