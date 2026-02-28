package com.spelllab.backend.security;

import com.spelllab.backend.dto.UserProfile;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;

@Service
public class JwtService {
    private final SecretKey key;
    private final long expirationMinutes;

    public JwtService(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.expiration-minutes:1440}") long expirationMinutes
    ) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMinutes = expirationMinutes;
    }

    public String createToken(UserProfile profile) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(String.valueOf(profile.getId()))
                .claim("nickname", profile.getNickname())
                .claim("avatar", profile.getAvatar())
                .claim("banner", profile.getBanner())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(expirationMinutes, ChronoUnit.MINUTES)))
                .signWith(key)
                .compact();
    }

    public UserProfile parseToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
        Long id = Long.parseLong(claims.getSubject());
        String nickname = claims.get("nickname", String.class);
        String avatar = claims.get("avatar", String.class);
        String banner = claims.get("banner", String.class);
        return new UserProfile(
                id,
                nickname == null ? "" : nickname,
                avatar == null ? "" : avatar,
                banner == null ? "" : banner
        );
    }
}
