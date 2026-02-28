package com.spelllab.backend.repository;

import com.spelllab.backend.entity.EmailVerificationCode;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Repository;

@Repository
public class EmailVerificationRepository {
    private final Map<String, EmailVerificationCode> codes = new ConcurrentHashMap<>();

    public void save(String email, String code, Instant expiresAt) {
        codes.put(email, new EmailVerificationCode(email, code, expiresAt));
    }

    public EmailVerificationCode findByEmail(String email) {
        return codes.get(email);
    }

    public void deleteByEmail(String email) {
        codes.remove(email);
    }
}
