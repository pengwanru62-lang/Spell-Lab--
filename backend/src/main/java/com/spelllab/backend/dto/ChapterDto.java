package com.spelllab.backend.dto;

public class ChapterDto {
    private Long id;
    private String name;
    private int orderNo;
    private int totalWords;
    private String status;
    private int progress;
    private double correctRate;
    private int answeredCount;
    private int correctCount;

    public ChapterDto(
            Long id,
            String name,
            int orderNo,
            int totalWords,
            String status,
            int progress,
            double correctRate,
            int answeredCount,
            int correctCount
    ) {
        this.id = id;
        this.name = name;
        this.orderNo = orderNo;
        this.totalWords = totalWords;
        this.status = status;
        this.progress = progress;
        this.correctRate = correctRate;
        this.answeredCount = answeredCount;
        this.correctCount = correctCount;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public int getOrderNo() {
        return orderNo;
    }

    public int getTotalWords() {
        return totalWords;
    }

    public String getStatus() {
        return status;
    }

    public int getProgress() {
        return progress;
    }

    public double getCorrectRate() {
        return correctRate;
    }

    public int getAnsweredCount() {
        return answeredCount;
    }

    public int getCorrectCount() {
        return correctCount;
    }
}
