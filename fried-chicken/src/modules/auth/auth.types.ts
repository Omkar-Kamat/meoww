// SignupInput, LoginInput, AuthTokens, JwtPayload — exported TS interfaces/types

// src/modules/auth/auth.types
export interface SignupInput {
    name: string;
    username: string;
    email: string;
    password: string;
    profileImage?: string;
}

export interface LoginInput {
    email: string;
    password: string;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

export interface JwtPayload {
    userId: string;
    iat?: number;
    exp?: number;
}
