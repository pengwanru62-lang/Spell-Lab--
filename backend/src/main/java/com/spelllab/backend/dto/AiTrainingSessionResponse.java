package com.spelllab.backend.dto;

public class AiTrainingSessionResponse {
    private Long sessionId;
    private String status;
    private int currentIndex;
    private int totalQuestions;
    private int wordCount;
    private AiTrainingQuestionDto question;

    public AiTrainingSessionResponse(
            Long sessionId,
            String status,
            int currentIndex,
            int totalQuestions,
            int wordCount,
            AiTrainingQuestionDto question
    ) {
        this.sessionId = sessionId;
        this.status = status;
        this.currentIndex = currentIndex;
        this.totalQuestions = totalQuestions;
        this.wordCount = wordCount;
        this.question = question;
    }

    public Long getSessionId() {
        return sessionId;
    }

    public String getStatus() {
        return status;
    }

    public int getCurrentIndex() {
        return currentIndex;
    }

    public int getTotalQuestions() {
        return totalQuestions;
    }

    public int getWordCount() {
        return wordCount;
    }

    public AiTrainingQuestionDto getQuestion() {
        return question;
    }
}
