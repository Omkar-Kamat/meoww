// src/config/swagger.ts
import swaggerJsdoc, { type Options } from "swagger-jsdoc";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const options: Options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "fried-chicken",
            version: "1.0.0",
            description: "API documentation for fried-chicken",
        },
        servers: [
            {
                url: process.env.BASE_URL ?? "http://localhost:5000",
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
    apis: [path.join(__dirname, "../modules/**/*.{js,ts}")],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
