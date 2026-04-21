import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.string().regex(/^\d+$/, "PORT must be a number").default("5000"),

  MONGO_URI: z.string().min(1, "MONGO_URI is required"),

  JWT_ACCESS_SECRET: z
    .string()
    .min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
  ACCESS_TOKEN_EXPIRY: z.string().default("15m"),
  REFRESH_TOKEN_EXPIRY: z.string().default("7d"),

  BREVO_API_KEY: z.string().min(1, "BREVO_API_KEY is required"),
  EMAIL_FROM: z.email("EMAIL_FROM must be a valid email address"),

  CLOUDINARY_CLOUD_NAME: z.string().min(1, "CLOUDINARY_CLOUD_NAME is required"),
  CLOUDINARY_API_KEY: z.string().min(1, "CLOUDINARY_API_KEY is required"),
  CLOUDINARY_API_SECRET: z.string().min(1, "CLOUDINARY_API_SECRET is required"),

  METERED_DOMAIN: z.string().min(1, "METERED_DOMAIN is required").optional(),
  METERED_API_KEY: z.string().min(1, "METERED_API_KEY is required").optional(),

  FRONTEND_URL: z.url("FRONTEND_URL must be a valid URL").optional(),
  BASE_URL: z.url("BASE_URL must be a valid URL").optional(),

  CROSS_SITE: z.enum(["true", "false"]).default("false"),

  REDIS_HOST: z.string().min(1, "REDIS_HOST is required"),
  REDIS_PORT: z.string().regex(/^\d+$/, "REDIS_PORT must be a number"),
  REDIS_PASSWORD: z.string().min(1, "REDIS_PASSWORD is required"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const errors = parsed.error.issues
    .map((issue) => `  ✗ ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");

  console.error("\n❌ Invalid environment variables:\n");
  console.error(errors);
  console.error(
    "\nFix the above variables in your .env file and restart the server.\n",
  );

  process.exit(1);
}

export const env = parsed.data;
