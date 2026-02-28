package com.spelllab.backend.dto;

import java.util.List;

public class TrainingResultResponse {
    private double correctRate;
    private List<WordDto> wrongWords;
    private List<WordDto> rightWords;
    private int totalWords;

    public TrainingResultResponse(double correctRate, List<WordDto> wrongWords, List<WordDto> rightWords, int totalWords) {
        this.correctRate = correctRate;
        this.wrongWords = wrongWords;
        this.rightWords = rightWords;
        this.totalWords = totalWords;
    }

    public double getCorrectRate() {
        return correctRate;
    }

    public List<WordDto> getWrongWords() {
        return wrongWords;
    }

    public List<WordDto> getRightWords() {
        return rightWords;
    }

    public int getTotalWords() {
        return totalWords;
    }
}
