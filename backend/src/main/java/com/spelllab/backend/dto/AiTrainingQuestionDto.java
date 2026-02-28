package com.spelllab.backend.dto;

import java.util.List;

public class AiTrainingQuestionDto {
    private int index;
    private String type;
    private String prompt;
    private String passageText;
    private String audioText;
    private List<String> options;

    public AiTrainingQuestionDto(
            int index,
            String type,
            String prompt,
            String passageText,
            String audioText,
            List<String> options
    ) {
        this.index = index;
        this.type = type;
        this.prompt = prompt;
        this.passageText = passageText;
        this.audioText = audioText;
        this.options = options;
    }

    public int getIndex() {
        return index;
    }

    public String getType() {
        return type;
    }

    public String getPrompt() {
        return prompt;
    }

    public String getPassageText() {
        return passageText;
    }

    public String getAudioText() {
        return audioText;
    }

    public List<String> getOptions() {
        return options;
    }
}
