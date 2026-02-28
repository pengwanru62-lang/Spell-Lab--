package com.spelllab.backend.entity;

import lombok.Data;

import java.time.Instant;

@Data
public class EmailVerificationCode {
    private final String email;
    private final String code;
    private final Instant expiresAt;
}
