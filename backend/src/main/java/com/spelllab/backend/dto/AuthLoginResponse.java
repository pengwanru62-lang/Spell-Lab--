package com.spelllab.backend.dto;

public class AuthLoginResponse {
    private String token;
    private UserProfile user;

    public AuthLoginResponse(String token, UserProfile user) {
        this.token = token;
        this.user = user;
    }

    public String getToken() {
        return token;
    }

    public UserProfile getUser() {
        return user;
    }
}
