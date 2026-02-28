package com.spelllab.backend.dto;

public class UserProfile {
    private Long id;
    private String nickname;
    private String avatar;
    private String banner;

    public UserProfile(Long id, String nickname, String avatar, String banner) {
        this.id = id;
        this.nickname = nickname;
        this.avatar = avatar;
        this.banner = banner;
    }

    public Long getId() {
        return id;
    }

    public String getNickname() {
        return nickname;
    }

    public String getAvatar() {
        return avatar;
    }

    public String getBanner() {
        return banner;
    }
}
