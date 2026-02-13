export interface RegisterUserCredentialsDTO {
  email: string;
  password: string;
}

export interface RegisterUserGoogleDTO {
  name?: string;
  email: string;
  googleId: string;
  photo?: string;
}

export interface LoginUserDTO {
  email: string;
  password: string;
}

export interface ForgotPasswordDTO {
  email: string;
}
