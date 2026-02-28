package com.spelllab.backend.repository;

import com.spelllab.backend.dto.UserSettingsDto;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Repository;

@Repository
public class UserSettingsRepository {
    private final Map<Long, UserSettingsDto> settings = new ConcurrentHashMap<>();

    public UserSettingsDto findByUserId(Long userId) {
        return settings.getOrDefault(userId, new UserSettingsDto(1.0, 1));
    }

    public UserSettingsDto save(Long userId, UserSettingsDto value) {
        settings.put(userId, value);
        return value;
    }

    public void deleteByUserId(Long userId) {
        settings.remove(userId);
    }
}
