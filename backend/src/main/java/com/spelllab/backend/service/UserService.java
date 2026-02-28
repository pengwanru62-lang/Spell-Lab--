package com.spelllab.backend.service;

import com.spelllab.backend.entity.UserAccount;
import com.spelllab.backend.dto.UserProfile;
import com.spelllab.backend.dto.UserSettingsDto;
import com.spelllab.backend.dto.UserSettingsRequest;
import com.spelllab.backend.repository.UserRepository;
import com.spelllab.backend.repository.UserSettingsRepository;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class UserService {
    private static final List<Double> ALLOWED_SPEEDS = List.of(0.5, 0.75, 1.0, 1.5, 2.0);
    private static final List<Integer> ALLOWED_REPEATS = List.of(1, 2, 3);
    private final UserRepository userRepository;
    private final UserSettingsRepository settingsRepository;

    public UserService(UserRepository userRepository, UserSettingsRepository settingsRepository) {
        this.userRepository = userRepository;
        this.settingsRepository = settingsRepository;
    }

    public UserSettingsDto getSettings(Long userId) {
        return settingsRepository.findByUserId(userId);
    }

    public UserSettingsDto updateSettings(Long userId, UserSettingsRequest request) {
        double speed = request.getSpeed() == null ? 1.0 : request.getSpeed();
        int repeat = request.getRepeat() == null ? 1 : request.getRepeat();
        if (!ALLOWED_SPEEDS.contains(speed)) {
            throw new IllegalArgumentException("倍速参数错误");
        }
        if (!ALLOWED_REPEATS.contains(repeat)) {
            throw new IllegalArgumentException("遍数参数错误");
        }
        return settingsRepository.save(userId, new UserSettingsDto(speed, repeat));
    }

    public void deactivate(Long userId) {
        UserAccount user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            throw new IllegalArgumentException("账号不存在");
        }
        settingsRepository.deleteByUserId(userId);
        userRepository.deleteById(userId);
    }

    public UserProfile updateAvatar(Long userId, String dataUrl) {
        String value = normalizeImageData(dataUrl);
        UserAccount user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            throw new IllegalArgumentException("账号不存在");
        }
        user.setAvatar(value);
        UserAccount updated = userRepository.save(user);
        return new UserProfile(updated.getId(), updated.getNickname(), updated.getAvatar(), updated.getBanner());
    }

    public UserProfile updateBanner(Long userId, String dataUrl) {
        String value = normalizeImageData(dataUrl);
        UserAccount user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            throw new IllegalArgumentException("账号不存在");
        }
        user.setBanner(value);
        UserAccount updated = userRepository.save(user);
        return new UserProfile(updated.getId(), updated.getNickname(), updated.getAvatar(), updated.getBanner());
    }

    public UserProfile updateNickname(Long userId, String nickname) {
        String value = normalizeNickname(nickname);
        UserAccount user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            throw new IllegalArgumentException("账号不存在");
        }
        user.setNickname(value);
        UserAccount updated = userRepository.save(user);
        return new UserProfile(updated.getId(), updated.getNickname(), updated.getAvatar(), updated.getBanner());
    }

    private String normalizeImageData(String dataUrl) {
        if (dataUrl == null || dataUrl.isBlank()) {
            throw new IllegalArgumentException("图片不能为空");
        }
        String value = dataUrl.trim();
        if (!value.startsWith("data:image/")) {
            throw new IllegalArgumentException("图片格式错误");
        }
        return value;
    }

    private String normalizeNickname(String nickname) {
        if (nickname == null) {
            throw new IllegalArgumentException("昵称不能为空");
        }
        String value = nickname.trim();
        if (value.isBlank()) {
            throw new IllegalArgumentException("昵称不能为空");
        }
        if (value.length() > 20) {
            throw new IllegalArgumentException("昵称长度超过限制");
        }
        return value;
    }
}
