package com.spelllab.backend.dto;

import java.util.List;

public class AiTrainingStartRequest {
    private List<Long> wordIds;

    public List<Long> getWordIds() {
        return wordIds;
    }

    public void setWordIds(List<Long> wordIds) {
        this.wordIds = wordIds;
    }
}
