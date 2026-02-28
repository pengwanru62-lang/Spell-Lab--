package com.spelllab.backend.dto;

public class UserSettingsDto {
    private double speed;
    private int repeat;

    public UserSettingsDto(double speed, int repeat) {
        this.speed = speed;
        this.repeat = repeat;
    }

    public double getSpeed() {
        return speed;
    }

    public int getRepeat() {
        return repeat;
    }
}
