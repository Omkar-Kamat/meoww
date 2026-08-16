// OtpRequestInput, OtpVerifyInput — exported types

// src/modules/otp/otp.types.ts
export interface OtpRequestInput {
    identifier: string;
}

export interface OtpVerifyInput {
    identifier: string;
    code: string;
}
