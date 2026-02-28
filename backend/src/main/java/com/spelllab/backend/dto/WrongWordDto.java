package com.spelllab.backend.dto;

import java.util.List;

public class WrongWordDto {
    private Long id;
    private String text;
    private int wrongCount;
    private String pronunciation;
    private String audioUrl;
    private List<String> meanings;
    private String lastWrongAt;

    public WrongWordDto(Long id, String text, int wrongCount) {
        this.id = id;
        this.text = text;
        this.wrongCount = wrongCount;
        this.pronunciation = "";
        this.audioUrl = "";
        this.meanings = List.of();
        this.lastWrongAt = "";
    }

    public WrongWordDto(
            Long id,
            String text,
            int wrongCount,
            String pronunciation,
            String audioUrl,
            List<String> meanings,
            String lastWrongAt
    ) {
        this.id = id;
        this.text = text;
        this.wrongCount = wrongCount;
        this.pronunciation = pronunciation == null ? "" : pronunciation;
        this.audioUrl = audioUrl == null ? "" : audioUrl;
        this.meanings = meanings == null ? List.of() : meanings;
        this.lastWrongAt = lastWrongAt == null ? "" : lastWrongAt;
    }

    public Long getId() {
        return id;
    }

    public String getText() {
        return text;
    }

    public int getWrongCount() {
        return wrongCount;
    }

    public String getPronunciation() {
        return pronunciation;
    }

    public String getAudioUrl() {
        return audioUrl;
    }

    public List<String> getMeanings() {
        return meanings;
    }

    public String getLastWrongAt() {
        return lastWrongAt;
    }
}
