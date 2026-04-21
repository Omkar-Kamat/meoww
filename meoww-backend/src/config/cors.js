export const allowedOrigins = [
    "https://meoww.online",
    "https://www.meoww.online",
    "https://meoww-frontend.onrender.com",
    "http://localhost:5173",
].filter(Boolean);

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
};

export default corsOptions;