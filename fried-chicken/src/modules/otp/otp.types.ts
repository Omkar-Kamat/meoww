export interface OtpRequestInput {
    identifier: string;
}

export interface OtpVerifyInput {
    identifier: string;
    code: string;
}
