package com.spelllab.backend.service;

import com.spelllab.backend.entity.UserAccount;
import com.spelllab.backend.entity.EmailVerificationCode;
import com.spelllab.backend.dto.AuthLoginRequest;
import com.spelllab.backend.dto.AuthLoginResponse;
import com.spelllab.backend.dto.AuthRegisterRequest;
import com.spelllab.backend.dto.UserProfile;
import com.spelllab.backend.repository.EmailVerificationRepository;
import com.spelllab.backend.repository.UserRepository;
import com.spelllab.backend.security.JwtService;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final EmailVerificationRepository emailVerificationRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final SecureRandom secureRandom = new SecureRandom();

    public AuthService(
            UserRepository userRepository,
            EmailVerificationRepository emailVerificationRepository,
            EmailService emailService,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.emailVerificationRepository = emailVerificationRepository;
        this.emailService = emailService;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public AuthLoginResponse login(AuthLoginRequest request) {
        String email = normalizeEmail(request.getEmail());
        UserAccount user = email == null ? null : userRepository.findByUsername(email);
        if (user == null || !passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("账号或密码错误");
        }
        UserProfile profile = new UserProfile(
                user.getId(),
                user.getNickname(),
                user.getAvatar(),
                user.getBanner()
        );
        String token = jwtService.createToken(profile);
        return new AuthLoginResponse(token, profile);
    }

    public void sendRegisterCode(String email) {
        String normalizedEmail = normalizeEmail(email);
        if (normalizedEmail == null) {
            throw new IllegalArgumentException("邮箱不能为空");
        }
        if (userRepository.existsByUsername(normalizedEmail)) {
            throw new IllegalArgumentException("账号已存在");
        }
        String code = generateCode();
        Instant expiresAt = Instant.now().plus(10, ChronoUnit.MINUTES);
        emailVerificationRepository.save(normalizedEmail, code, expiresAt);
        emailService.sendRegisterCode(normalizedEmail, code);
    }

    public AuthLoginResponse register(AuthRegisterRequest request) {
        String email = normalizeEmail(request.getEmail());
        if (email == null || request.getPassword() == null || request.getPassword().isBlank()) {
            throw new IllegalArgumentException("账号或密码错误");
        }
        if (userRepository.existsByUsername(email)) {
            throw new IllegalArgumentException("账号已存在");
        }
        validateRegisterCode(email, request.getCode());
        String nickname = request.getNickname() == null || request.getNickname().isBlank()
                ? "SpellLab 用户"
                : request.getNickname();
        UserAccount user = new UserAccount();
        user.setUsername(email);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setNickname(nickname);
        user.setAvatar("");
        user.setBanner("");
        user.setStatus(1);
        user = userRepository.save(user);
        UserProfile profile = new UserProfile(
                user.getId(),
                user.getNickname(),
                user.getAvatar(),
                user.getBanner()
        );
        String token = jwtService.createToken(profile);
        return new AuthLoginResponse(token, profile);
    }

    public UserProfile profile(UserProfile profile) {
        UserAccount user = userRepository.findById(profile.getId()).orElse(null);
        if (user == null) {
            throw new IllegalArgumentException("账号不存在");
        }
        return new UserProfile(user.getId(), user.getNickname(), user.getAvatar(), user.getBanner());
    }

    private String normalizeEmail(String email) {
        if (email == null) {
            return null;
        }
        String value = email.trim().toLowerCase();
        return value.isBlank() ? null : value;
    }

    private void validateRegisterCode(String email, String code) {
        if (code == null || code.isBlank()) {
            throw new IllegalArgumentException("验证码错误");
        }
        EmailVerificationCode stored = emailVerificationRepository.findByEmail(email);
        if (stored == null || Instant.now().isAfter(stored.getExpiresAt())) {
            throw new IllegalArgumentException("验证码已过期");
        }
        if (!stored.getCode().equals(code)) {
            throw new IllegalArgumentException("验证码错误");
        }
        emailVerificationRepository.deleteByEmail(email);
    }

    private String generateCode() {
        int value = secureRandom.nextInt(1_000_000);
        return String.format("%06d", value);
    }
}
