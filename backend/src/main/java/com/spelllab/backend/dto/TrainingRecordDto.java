package com.spelllab.backend.dto;

public class TrainingRecordDto {
    private Long id;
    private String type;
    private String startAt;
    private String endAt;

    public TrainingRecordDto(Long id, String type, String startAt, String endAt) {
        this.id = id;
        this.type = type;
        this.startAt = startAt;
        this.endAt = endAt;
    }

    public Long getId() {
        return id;
    }

    public String getType() {
        return type;
    }

    public String getStartAt() {
        return startAt;
    }

    public String getEndAt() {
        return endAt;
    }
}
