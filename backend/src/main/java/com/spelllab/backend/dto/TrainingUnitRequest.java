package com.spelllab.backend.dto;

public class TrainingUnitRequest {
    private Long wordbookId;
    private Long chapterId;
    private double speed;
    private int repeat;
    private boolean resume;

    public Long getWordbookId() {
        return wordbookId;
    }

    public void setWordbookId(Long wordbookId) {
        this.wordbookId = wordbookId;
    }

    public Long getChapterId() {
        return chapterId;
    }

    public void setChapterId(Long chapterId) {
        this.chapterId = chapterId;
    }

    public double getSpeed() {
        return speed;
    }

    public void setSpeed(double speed) {
        this.speed = speed;
    }

    public int getRepeat() {
        return repeat;
    }

    public void setRepeat(int repeat) {
        this.repeat = repeat;
    }

    public boolean isResume() {
        return resume;
    }

    public void setResume(boolean resume) {
        this.resume = resume;
    }
}
