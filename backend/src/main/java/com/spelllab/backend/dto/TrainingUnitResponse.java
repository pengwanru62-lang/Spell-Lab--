package com.spelllab.backend.dto;

import java.util.List;

public class TrainingUnitResponse {
    private Long unitId;
    private List<WordDto> words;
    private int startIndex;

    public TrainingUnitResponse(Long unitId, List<WordDto> words, int startIndex) {
        this.unitId = unitId;
        this.words = words;
        this.startIndex = startIndex;
    }

    public Long getUnitId() {
        return unitId;
    }

    public List<WordDto> getWords() {
        return words;
    }

    public int getStartIndex() {
        return startIndex;
    }
}
