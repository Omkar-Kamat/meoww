import jwt from "jsonwebtoken";

export const verifyAccessToken = (req, res, next) => {
    const token = req.cookies.access_token;

    if (!token) {
        return res
            .status(401)
            .json({ error: "Access denied. No token provided." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ error: "Access token expired" });
        }
        return res.status(401).json({ error: "Invalid token" });
    }
};
