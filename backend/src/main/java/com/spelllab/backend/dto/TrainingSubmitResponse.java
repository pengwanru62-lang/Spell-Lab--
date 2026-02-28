package com.spelllab.backend.dto;

public class TrainingSubmitResponse {
    private boolean correct;
    private String correctText;
    private String meaning;

    public TrainingSubmitResponse(boolean correct, String correctText, String meaning) {
        this.correct = correct;
        this.correctText = correctText;
        this.meaning = meaning;
    }

    public boolean isCorrect() {
        return correct;
    }

    public String getCorrectText() {
        return correctText;
    }

    public String getMeaning() {
        return meaning;
    }
}
