import swaggerJsdoc from "swagger-jsdoc";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Meoww API",
            version: "1.0.0",
            description:
                "API documentation for Meoww - a 1v1 random video chat application",
        },
        servers: [
            {
                url: process.env.BASE_URL || "http://localhost:5000",
                description: "Server",
            },
        ],
        components: {
            securitySchemes: {
                cookieAuth: {
                    type: "apiKey",
                    in: "cookie",
                    name: "access_token",
                },
            },
        },
    },
    apis: [path.join(__dirname, "../modules/**/*.js")],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
