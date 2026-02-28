package com.spelllab.backend.dto;

public class AiTrainingHistoryItemDto {
    private Long sessionId;
    private String date;
    private int index;
    private String prompt;
    private String userAnswer;
    private String correctAnswer;
    private String audioText;

    public AiTrainingHistoryItemDto(
            Long sessionId,
            String date,
            int index,
            String prompt,
            String userAnswer,
            String correctAnswer,
            String audioText
    ) {
        this.sessionId = sessionId;
        this.date = date;
        this.index = index;
        this.prompt = prompt;
        this.userAnswer = userAnswer;
        this.correctAnswer = correctAnswer;
        this.audioText = audioText;
    }

    public Long getSessionId() {
        return sessionId;
    }

    public String getDate() {
        return date;
    }

    public int getIndex() {
        return index;
    }

    public String getPrompt() {
        return prompt;
    }

    public String getUserAnswer() {
        return userAnswer;
    }

    public String getCorrectAnswer() {
        return correctAnswer;
    }

    public String getAudioText() {
        return audioText;
    }
}
