package com.spelllab.backend.dto;

public class AiTrainingRecordSummaryDto {
    private Long sessionId;
    private String date;
    private String startedAt;
    private String finishedAt;
    private double correctRate;
    private int wordCount;

    public AiTrainingRecordSummaryDto(
            Long sessionId,
            String date,
            String startedAt,
            String finishedAt,
            double correctRate,
            int wordCount
    ) {
        this.sessionId = sessionId;
        this.date = date;
        this.startedAt = startedAt;
        this.finishedAt = finishedAt;
        this.correctRate = correctRate;
        this.wordCount = wordCount;
    }

    public Long getSessionId() {
        return sessionId;
    }

    public String getDate() {
        return date;
    }

    public String getStartedAt() {
        return startedAt;
    }

    public String getFinishedAt() {
        return finishedAt;
    }

    public double getCorrectRate() {
        return correctRate;
    }

    public int getWordCount() {
        return wordCount;
    }
}
