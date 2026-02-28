import { apiGet, apiPost } from "./client";
import type { UserProfile, UserSettings } from "./types";

export type AuthLoginRequest = {
  email: string;
  password: string;
};

export type AuthRegisterRequest = {
  email: string;
  password: string;
  nickname?: string;
  code: string;
};

export type AuthRegisterCodeRequest = {
  email: string;
};

export type UserSettingsRequest = {
  speed: number;
  repeat: number;
};

export type FeedbackRequest = {
  content: string;
};

export type ImageUploadRequest = {
  dataUrl: string;
};

export type NicknameUpdateRequest = {
  nickname: string;
};

export type AuthLoginResponse = {
  token: string;
  user: UserProfile;
};

export const authApi = {
  login(payload: AuthLoginRequest) {
    return apiPost<AuthLoginResponse, AuthLoginRequest>("/api/auth/login", payload);
  },
  register(payload: AuthRegisterRequest) {
    return apiPost<AuthLoginResponse, AuthRegisterRequest>(
      "/api/auth/register",
      payload
    );
  },
  sendRegisterCode(payload: AuthRegisterCodeRequest) {
    return apiPost<string, AuthRegisterCodeRequest>(
      "/api/auth/register/code",
      payload
    );
  },
  profile(token?: string) {
    return apiGet<UserProfile>("/api/user/profile", token);
  },
  settings(token?: string) {
    return apiGet<UserSettings>("/api/user/settings", token);
  },
  updateSettings(payload: UserSettingsRequest, token?: string) {
    return apiPost<UserSettings, UserSettingsRequest>(
      "/api/user/settings",
      payload,
      token
    );
  },
  logout(token?: string) {
    return apiPost<boolean, undefined>("/api/auth/logout", undefined, token);
  },
  deactivate(token?: string) {
    return apiPost<boolean, undefined>("/api/user/deactivate", undefined, token);
  },
  updateAvatar(payload: ImageUploadRequest, token?: string) {
    return apiPost<UserProfile, ImageUploadRequest>(
      "/api/user/avatar",
      payload,
      token
    );
  },
  updateBanner(payload: ImageUploadRequest, token?: string) {
    return apiPost<UserProfile, ImageUploadRequest>(
      "/api/user/banner",
      payload,
      token
    );
  },
  updateNickname(payload: NicknameUpdateRequest, token?: string) {
    return apiPost<UserProfile, NicknameUpdateRequest>(
      "/api/user/nickname",
      payload,
      token
    );
  },
  submitFeedback(payload: FeedbackRequest, token?: string) {
    return apiPost<boolean, FeedbackRequest>("/api/feedback", payload, token);
  },
};
