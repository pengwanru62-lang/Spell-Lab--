package com.spelllab.backend.dto;

public class DailyStatDto {
    private String date;
    private int studyMinutes;
    private int studyWords;

    public DailyStatDto(String date, int studyMinutes, int studyWords) {
        this.date = date;
        this.studyMinutes = studyMinutes;
        this.studyWords = studyWords;
    }

    public String getDate() {
        return date;
    }

    public int getStudyMinutes() {
        return studyMinutes;
    }

    public int getStudyWords() {
        return studyWords;
    }
}
