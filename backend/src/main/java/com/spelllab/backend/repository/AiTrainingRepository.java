package com.spelllab.backend.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.stereotype.Repository;

@Repository
public class AiTrainingRepository {
    private final AtomicLong sessionIdGenerator = new AtomicLong(System.currentTimeMillis());
    private final Map<Long, AiTrainingSession> sessions = new ConcurrentHashMap<>();

    public AiTrainingSession createSession(List<AiTrainingQuestion> questions, int wordCount) {
        long id = sessionIdGenerator.getAndIncrement();
        AiTrainingSession session = new AiTrainingSession(id, "in_progress", LocalDateTime.now(), null, 0, wordCount, questions);
        sessions.put(id, session);
        return session;
    }

    public AiTrainingSession getSession(Long sessionId) {
        return sessions.get(sessionId);
    }

    public void saveSession(AiTrainingSession session) {
        if (session != null) {
            sessions.put(session.getSessionId(), session);
        }
    }

    public void abandonSession(Long sessionId) {
        sessions.remove(sessionId);
    }

    public static class AiTrainingSession {
        private final Long sessionId;
        private String status;
        private final LocalDateTime startedAt;
        private LocalDateTime finishedAt;
        private int currentIndex;
        private final int wordCount;
        private final List<AiTrainingQuestion> questions;
        private final Map<Integer, String> answers;

        public AiTrainingSession(
                Long sessionId,
                String status,
                LocalDateTime startedAt,
                LocalDateTime finishedAt,
                int currentIndex,
                int wordCount,
                List<AiTrainingQuestion> questions
        ) {
            this.sessionId = sessionId;
            this.status = status;
            this.startedAt = startedAt;
            this.finishedAt = finishedAt;
            this.currentIndex = currentIndex;
            this.wordCount = wordCount;
            this.questions = questions;
            this.answers = new ConcurrentHashMap<>();
        }

        public Long getSessionId() {
            return sessionId;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public LocalDateTime getStartedAt() {
            return startedAt;
        }

        public LocalDateTime getFinishedAt() {
            return finishedAt;
        }

        public void setFinishedAt(LocalDateTime finishedAt) {
            this.finishedAt = finishedAt;
        }

        public int getCurrentIndex() {
            return currentIndex;
        }

        public void setCurrentIndex(int currentIndex) {
            this.currentIndex = currentIndex;
        }

        public int getWordCount() {
            return wordCount;
        }

        public List<AiTrainingQuestion> getQuestions() {
            return questions;
        }

        public Map<Integer, String> getAnswers() {
            return answers;
        }
    }

    public static class AiTrainingQuestion {
        private final int index;
        private final String type;
        private final String prompt;
        private final String passageText;
        private final String audioText;
        private final String passageTranslation;
        private final List<String> options;
        private final String correctAnswer;
        private final String answerExplanation;
        private final List<String> wrongWords;

        public AiTrainingQuestion(
                int index,
                String type,
                String prompt,
                String passageText,
                String audioText,
                String passageTranslation,
                List<String> options,
                String correctAnswer,
                String answerExplanation,
                List<String> wrongWords
        ) {
            this.index = index;
            this.type = type;
            this.prompt = prompt;
            this.passageText = passageText;
            this.audioText = audioText;
            this.passageTranslation = passageTranslation;
            this.options = options;
            this.correctAnswer = correctAnswer;
            this.answerExplanation = answerExplanation;
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

        public String getCorrectAnswer() {
            return correctAnswer;
        }

        public String getAnswerExplanation() {
            return answerExplanation;
        }

        public List<String> getWrongWords() {
            return wrongWords;
        }
    }

}
