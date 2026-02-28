package com.spelllab.backend.dto;

public class WordbookDto {
    private Long id;
    private String name;
    private String type;
    private int totalWords;

    public WordbookDto(Long id, String name, String type, int totalWords) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.totalWords = totalWords;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getType() {
        return type;
    }

    public int getTotalWords() {
        return totalWords;
    }
}
