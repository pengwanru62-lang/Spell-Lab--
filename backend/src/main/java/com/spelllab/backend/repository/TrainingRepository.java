package com.spelllab.backend.repository;

import com.spelllab.backend.dto.TrainingResultResponse;
import com.spelllab.backend.dto.WordDto;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.stereotype.Repository;

@Repository
public class TrainingRepository {
    private final AtomicLong unitIdGenerator = new AtomicLong(1);
    private final Map<Long, UnitState> units = new ConcurrentHashMap<>();
    private final Map<Long, TrainingResultResponse> results = new ConcurrentHashMap<>();
    private final Map<Long, ChapterStat> chapterStats = new ConcurrentHashMap<>();
    private final Map<Long, Boolean> familiarWords = new ConcurrentHashMap<>();
    private final Map<Long, Integer> chapterProgressIndex = new ConcurrentHashMap<>();

    public Long createUnit(Long wordbookId, Long chapterId, List<WordDto> words) {
        long id = unitIdGenerator.getAndIncrement();
        units.put(id, new UnitState(wordbookId, chapterId, words, LocalDateTime.now()));
        return id;
    }

    public List<WordDto> getUnitWords(Long unitId) {
        UnitState state = units.get(unitId);
        return state == null ? List.of() : state.getWords();
    }

    public void saveResult(Long unitId, TrainingResultResponse result) {
        results.put(unitId, result);
    }

    public TrainingResultResponse getResult(Long unitId) {
        return results.get(unitId);
    }

    public UnitState getUnit(Long unitId) {
        return units.get(unitId);
    }

    public Long getUnitChapterId(Long unitId) {
        UnitState state = units.get(unitId);
        return state == null ? null : state.getChapterId();
    }

    public Long getUnitWordbookId(Long unitId) {
        UnitState state = units.get(unitId);
        return state == null ? null : state.getWordbookId();
    }

    public void saveAnswer(Long unitId, Long wordId, boolean correct, String inputText) {
        UnitState state = units.get(unitId);
        if (state == null) {
            return;
        }
        Boolean previous = state.getAnswers().get(wordId);
        state.getAnswers().put(wordId, correct);
        state.getInputs().put(wordId, inputText);
        Long chapterId = state.getChapterId();
        if (chapterId == null) {
            return;
        }
        int wordIndex = findWordIndex(state.getWords(), wordId);
        if (wordIndex >= 0) {
            int nextIndex = wordIndex + 1;
            chapterProgressIndex.compute(chapterId, (key, existing) -> {
                if (existing == null) {
                    return nextIndex;
                }
                return Math.max(existing, nextIndex);
            });
        }
        if (previous == null) {
            updateChapterStat(chapterId, 1, correct ? 1 : 0);
        } else if (previous != correct) {
            updateChapterStat(chapterId, 0, correct ? 1 : -1);
        }
    }

    public Map<Long, Boolean> getAnswers(Long unitId) {
        UnitState state = units.get(unitId);
        return state == null ? Map.of() : Map.copyOf(state.getAnswers());
    }

    public ChapterStat getChapterStat(Long chapterId) {
        ChapterStat stat = chapterStats.get(chapterId);
        return stat == null ? new ChapterStat(0, 0) : stat;
    }

    public int getChapterProgressIndex(Long chapterId) {
        return chapterProgressIndex.getOrDefault(chapterId, 0);
    }

    public void setChapterProgressIndex(Long chapterId, int index) {
        chapterProgressIndex.put(chapterId, Math.max(0, index));
    }

    public boolean isFamiliar(Long wordId) {
        return Boolean.TRUE.equals(familiarWords.get(wordId));
    }

    public void setFamiliar(Long wordId, boolean familiar) {
        if (familiar) {
            familiarWords.put(wordId, true);
        } else {
            familiarWords.remove(wordId);
        }
    }

    private void updateChapterStat(Long chapterId, int answeredDelta, int correctDelta) {
        chapterStats.compute(chapterId, (key, existing) -> {
            ChapterStat current = existing == null ? new ChapterStat(0, 0) : existing;
            int answered = Math.max(0, current.getAnsweredCount() + answeredDelta);
            int correct = Math.max(0, current.getCorrectCount() + correctDelta);
            return new ChapterStat(answered, correct);
        });
    }

    public static class ChapterStat {
        private final int answeredCount;
        private final int correctCount;

        public ChapterStat(int answeredCount, int correctCount) {
            this.answeredCount = answeredCount;
            this.correctCount = correctCount;
        }

        public int getAnsweredCount() {
            return answeredCount;
        }

        public int getCorrectCount() {
            return correctCount;
        }
    }

    public LocalDateTime getUnitStartAt(Long unitId) {
        UnitState state = units.get(unitId);
        return state == null ? null : state.getStartAt();
    }

    public void markUnitEnd(Long unitId) {
        UnitState state = units.get(unitId);
        if (state != null) {
            state.setEndAt(LocalDateTime.now());
        }
    }

    public LocalDateTime getUnitEndAt(Long unitId) {
        UnitState state = units.get(unitId);
        return state == null ? null : state.getEndAt();
    }

    public static class UnitState {
        private final Long wordbookId;
        private final Long chapterId;
        private final List<WordDto> words;
        private final Map<Long, Boolean> answers;
        private final Map<Long, String> inputs;
        private final LocalDateTime startAt;
        private LocalDateTime endAt;

        public UnitState(Long wordbookId, Long chapterId, List<WordDto> words, LocalDateTime startAt) {
            this.wordbookId = wordbookId;
            this.chapterId = chapterId;
            this.words = words;
            this.startAt = startAt;
            this.answers = new ConcurrentHashMap<>();
            this.inputs = new ConcurrentHashMap<>();
        }

        public Long getWordbookId() {
            return wordbookId;
        }

        public Long getChapterId() {
            return chapterId;
        }

        public List<WordDto> getWords() {
            return words;
        }

        public Map<Long, Boolean> getAnswers() {
            return answers;
        }

        public Map<Long, String> getInputs() {
            return inputs;
        }

        public LocalDateTime getStartAt() {
            return startAt;
        }

        public LocalDateTime getEndAt() {
            return endAt;
        }

        public void setEndAt(LocalDateTime endAt) {
            this.endAt = endAt;
        }
    }

    private int findWordIndex(List<WordDto> words, Long wordId) {
        if (words == null || wordId == null) {
            return -1;
        }
        for (int i = 0; i < words.size(); i++) {
            WordDto word = words.get(i);
            if (wordId.equals(word.getId())) {
                return i;
            }
        }
        return -1;
    }
}
