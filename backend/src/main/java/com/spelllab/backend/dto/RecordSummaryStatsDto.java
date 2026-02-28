package com.spelllab.backend.dto;

public class RecordSummaryStatsDto {
    private String date;
    private int todayWords;
    private int todayMinutes;
    private int totalMinutes;
    private int totalWords;

    public RecordSummaryStatsDto(String date, int todayWords, int todayMinutes, int totalMinutes, int totalWords) {
        this.date = date;
        this.todayWords = todayWords;
        this.todayMinutes = todayMinutes;
        this.totalMinutes = totalMinutes;
        this.totalWords = totalWords;
    }

    public String getDate() {
        return date;
    }

    public int getTodayWords() {
        return todayWords;
    }

    public int getTodayMinutes() {
        return todayMinutes;
    }

    public int getTotalMinutes() {
        return totalMinutes;
    }

    public int getTotalWords() {
        return totalWords;
    }
}
