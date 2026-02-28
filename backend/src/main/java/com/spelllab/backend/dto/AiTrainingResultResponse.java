package com.spelllab.backend.dto;

import java.util.List;

public class AiTrainingResultResponse {
    private Long sessionId;
    private String startedAt;
    private String finishedAt;
    private int correctCount;
    private int totalQuestions;
    private int wordCount;
    private List<AiTrainingResultItemDto> items;

    public AiTrainingResultResponse(
            Long sessionId,
            String startedAt,
            String finishedAt,
            int correctCount,
            int totalQuestions,
            int wordCount,
            List<AiTrainingResultItemDto> items
    ) {
        this.sessionId = sessionId;
        this.startedAt = startedAt;
        this.finishedAt = finishedAt;
        this.correctCount = correctCount;
        this.totalQuestions = totalQuestions;
        this.wordCount = wordCount;
        this.items = items;
    }

    public Long getSessionId() {
        return sessionId;
    }

    public String getStartedAt() {
        return startedAt;
    }

    public String getFinishedAt() {
        return finishedAt;
    }

    public int getCorrectCount() {
        return correctCount;
    }

    public int getTotalQuestions() {
        return totalQuestions;
    }

    public int getWordCount() {
        return wordCount;
    }

    public List<AiTrainingResultItemDto> getItems() {
        return items;
    }

    public static class AiTrainingResultItemDto {
        private int index;
        private String type;
        private String prompt;
        private String passageText;
        private String audioText;
        private String passageTranslation;
        private List<String> options;
        private String userAnswer;
        private String correctAnswer;
        private String answerExplanation;
        private boolean correct;
        private List<String> wrongWords;

        public AiTrainingResultItemDto(
                int index,
                String type,
                String prompt,
                String passageText,
                String audioText,
                String passageTranslation,
                List<String> options,
                String userAnswer,
                String correctAnswer,
                String answerExplanation,
                boolean correct,
                List<String> wrongWords
        ) {
            this.index = index;
            this.type = type;
            this.prompt = prompt;
            this.passageText = passageText;
            this.audioText = audioText;
            this.passageTranslation = passageTranslation;
            this.options = options;
            this.userAnswer = userAnswer;
            this.correctAnswer = correctAnswer;
            this.answerExplanation = answerExplanation;
            this.correct = correct;
            this.wrongWords = wrongWords;
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

        public String getPassageTranslation() {
            return passageTranslation;
        }

        public List<String> getOptions() {
            return options;
        }

        public String getUserAnswer() {
            return userAnswer;
        }

        public String getCorrectAnswer() {
            return correctAnswer;
        }

        public String getAnswerExplanation() {
            return answerExplanation;
        }

        public boolean isCorrect() {
            return correct;
        }

        public List<String> getWrongWords() {
            return wrongWords;
        }
    }
}
