package com.spelllab.backend.dto;

import java.util.List;

public class WordDto {
    private Long id;
    private String text;
    private String pronunciation;
    private String audioUrl;
    private boolean familiar;
    private List<String> meanings;

    public WordDto(Long id, String text, String pronunciation, String audioUrl, boolean familiar, List<String> meanings) {
        this.id = id;
        this.text = text;
        this.pronunciation = pronunciation;
        this.audioUrl = audioUrl;
        this.familiar = familiar;
        this.meanings = meanings;
    }

    public Long getId() {
        return id;
    }

    public String getText() {
        return text;
    }

    public String getPronunciation() {
        return pronunciation;
    }

    public String getAudioUrl() {
        return audioUrl;
    }

    public boolean isFamiliar() {
        return familiar;
    }

    public List<String> getMeanings() {
        return meanings;
    }
}
