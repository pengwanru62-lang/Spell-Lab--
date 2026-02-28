package com.spelllab.backend.dto;

import java.util.List;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class AiTrainingQuestionSnapshot {
    private int index;
    private String type;
    private String prompt;
    private String passageText;
    private String audioText;
    private String passageTranslation;
    private List<String> options;
    private String correctAnswer;
    private String answerExplanation;
    private List<String> wrongWords;
}
