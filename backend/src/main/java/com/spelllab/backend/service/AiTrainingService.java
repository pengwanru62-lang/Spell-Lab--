package com.spelllab.backend.service;

import com.spelllab.backend.entity.AiTrainingRecordEntity;
import com.spelllab.backend.entity.DailyStatEntity;
import com.spelllab.backend.entity.TrainingRecordEntity;
import com.spelllab.backend.entity.Word;
import com.spelllab.backend.dto.AiTrainingHistoryItemDto;
import com.spelllab.backend.dto.AiTrainingQuestionDto;
import com.spelllab.backend.dto.AiTrainingRecordSummaryDto;
import com.spelllab.backend.dto.AiTrainingResultResponse;
import com.spelllab.backend.dto.AiTrainingSessionResponse;
import com.spelllab.backend.dto.AiTrainingStartRequest;
import com.spelllab.backend.dto.AiTrainingSubmitRequest;
import com.spelllab.backend.dto.AiTrainingQuestionSnapshot;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.spelllab.backend.repository.AiTrainingRepository;
import com.spelllab.backend.repository.AiTrainingRepository.AiTrainingQuestion;
import com.spelllab.backend.repository.AiTrainingRepository.AiTrainingSession;
import com.spelllab.backend.repository.AiTrainingRecordRepository;
import com.spelllab.backend.repository.DailyStatRepository;
import com.spelllab.backend.repository.TrainingRecordRepository;
import com.spelllab.backend.repository.WordRepository;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Random;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

@Service
public class AiTrainingService {
    private final WordRepository wordRepository;
    private final AiTrainingRepository aiTrainingRepository;
    private final AiTrainingRecordRepository aiTrainingRecordRepository;
    private final TrainingRecordRepository trainingRecordRepository;
    private final DailyStatRepository dailyStatRepository;
    private final Random random = new Random();
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${ai.bailian.enabled:false}")
    private boolean aiEnabled;

    @Value("${ai.bailian.endpoint:}")
    private String aiEndpoint;

    @Value("${ai.bailian.api-key:}")
    private String aiApiKey;

    @Value("${ai.bailian.model:}")
    private String aiModel;

    @Value("${ai.bailian.app-id:}")
    private String aiAppId;

    public AiTrainingService(
            WordRepository wordRepository,
            AiTrainingRepository aiTrainingRepository,
            AiTrainingRecordRepository aiTrainingRecordRepository,
            TrainingRecordRepository trainingRecordRepository,
            DailyStatRepository dailyStatRepository
    ) {
        this.wordRepository = wordRepository;
        this.aiTrainingRepository = aiTrainingRepository;
        this.aiTrainingRecordRepository = aiTrainingRecordRepository;
        this.trainingRecordRepository = trainingRecordRepository;
        this.dailyStatRepository = dailyStatRepository;
    }

    public AiTrainingSessionResponse start(AiTrainingStartRequest request) {
        List<Long> wordIds = request == null ? List.of() : request.getWordIds();
        if (wordIds == null || wordIds.isEmpty()) {
            throw new IllegalArgumentException("请选择 1 到 20 个错词开始训练");
        }
        if (wordIds.size() > 20) {
            throw new IllegalArgumentException("最多只能选择 20 个错词开始训练");
        }
        List<Word> words = wordRepository.findAllById(wordIds);
        if (words.isEmpty()) {
            throw new IllegalArgumentException("本次训练生成失败，请重试");
        }
        Map<Long, Word> wordMap = words.stream().collect(Collectors.toMap(Word::getId, w -> w));
        List<Word> ordered = wordIds.stream().map(wordMap::get).filter(Objects::nonNull).toList();
        List<AiTrainingQuestion> questions = generateQuestionsWithAi(ordered);
        if (questions.isEmpty()) {
            if (aiEnabled) {
                throw new IllegalArgumentException("百炼接口未返回有效题目");
            }
            questions = generateFallbackQuestions(ordered);
        }
        if (questions.isEmpty()) {
            throw new IllegalArgumentException("本次训练生成失败，请重试");
        }
        AiTrainingSession session = aiTrainingRepository.createSession(questions, ordered.size());
        return toSessionResponse(session);
    }

    public AiTrainingSessionResponse getSession(Long sessionId) {
        AiTrainingSession session = aiTrainingRepository.getSession(sessionId);
        if (session == null) {
            throw new IllegalArgumentException("资源不存在");
        }
        return toSessionResponse(session);
    }

    public AiTrainingSessionResponse submit(Long userId, AiTrainingSubmitRequest request) {
        if (request == null || request.getSessionId() == null) {
            throw new IllegalArgumentException("参数错误");
        }
        if (userId == null) {
            throw new IllegalArgumentException("未登录");
        }
        AiTrainingSession session = aiTrainingRepository.getSession(request.getSessionId());
        if (session == null) {
            throw new IllegalArgumentException("资源不存在");
        }
        if (!"in_progress".equals(session.getStatus())) {
            return toSessionResponse(session);
        }
        int index = request.getIndex();
        if (index != session.getCurrentIndex()) {
            return toSessionResponse(session);
        }
        String answer = request.getAnswer() == null ? "" : request.getAnswer().trim();
        session.getAnswers().put(index, answer);
        int nextIndex = Math.min(session.getQuestions().size(), session.getCurrentIndex() + 1);
        session.setCurrentIndex(nextIndex);
        if (nextIndex >= session.getQuestions().size()) {
            session.setStatus("completed");
            session.setFinishedAt(LocalDateTime.now());
            persistSessionRecordIfNeeded(session, userId);
        }
        aiTrainingRepository.saveSession(session);
        return toSessionResponse(session);
    }

    public void abandon(Long sessionId) {
        aiTrainingRepository.abandonSession(sessionId);
    }

    public List<AiTrainingRecordSummaryDto> history(Long userId) {
        if (userId == null) {
            return List.of();
        }
        return aiTrainingRecordRepository.findAllByUserIdOrderByStartedAtDesc(userId).stream()
                .map(record -> {
                    List<AiTrainingQuestion> questions = readQuestions(record.getQuestionsJson());
                    Map<Integer, String> answers = readAnswers(record.getAnswersJson());
                    int total = questions.size();
                    int correct = countCorrect(questions, answers);
                    double correctRate = total == 0 ? 0 : (correct * 100.0 / total);
                    return new AiTrainingRecordSummaryDto(
                            record.getSessionId(),
                            record.getDate() == null ? "" : record.getDate().toString(),
                            record.getStartedAt() == null ? "" : record.getStartedAt().toString(),
                            record.getFinishedAt() == null ? "" : record.getFinishedAt().toString(),
                            correctRate,
                            record.getWordCount()
                    );
                })
                .collect(Collectors.toList());
    }

    public List<AiTrainingHistoryItemDto> historyItems(Long userId) {
        if (userId == null) {
            return List.of();
        }
        List<AiTrainingRecordEntity> records = aiTrainingRecordRepository.findAllByUserIdOrderByStartedAtDesc(userId);
        List<AiTrainingHistoryItemDto> items = new ArrayList<>();
        for (AiTrainingRecordEntity record : records) {
            List<AiTrainingQuestion> questions = readQuestions(record.getQuestionsJson());
            Map<Integer, String> answers = readAnswers(record.getAnswersJson());
            String date = record.getDate() == null ? "" : record.getDate().toString();
            for (AiTrainingQuestion q : questions) {
                String userAnswer = answers.getOrDefault(q.getIndex(), "");
                items.add(new AiTrainingHistoryItemDto(
                        record.getSessionId(),
                        date,
                        q.getIndex(),
                        q.getPrompt(),
                        userAnswer,
                        q.getCorrectAnswer(),
                        q.getAudioText()
                ));
            }
        }
        return items;
    }

    public AiTrainingResultResponse result(Long userId, Long sessionId) {
        if (userId == null) {
            throw new IllegalArgumentException("资源不存在");
        }
        AiTrainingRecordEntity record = aiTrainingRecordRepository.findBySessionId(sessionId).orElse(null);
        if (record != null && userId != null && !userId.equals(record.getUserId())) {
            throw new IllegalArgumentException("资源不存在");
        }
        List<AiTrainingQuestion> questions = record == null ? null : readQuestions(record.getQuestionsJson());
        Map<Integer, String> answers = record == null ? null : readAnswers(record.getAnswersJson());
        LocalDateTime startedAt = record == null ? null : record.getStartedAt();
        LocalDateTime finishedAt = record == null ? null : record.getFinishedAt();
        int wordCount = record == null ? 0 : record.getWordCount();
        Long finalSessionId = record == null ? null : record.getSessionId();
        if (record == null) {
            AiTrainingSession session = aiTrainingRepository.getSession(sessionId);
            if (session != null && "completed".equals(session.getStatus())) {
                if (userId != null) {
                    persistSessionRecordIfNeeded(session, userId);
                }
                finalSessionId = session.getSessionId();
                questions = session.getQuestions();
                answers = Map.copyOf(session.getAnswers());
                startedAt = session.getStartedAt();
                finishedAt = session.getFinishedAt();
                wordCount = session.getWordCount();
            }
        }
        if (questions == null || answers == null || finalSessionId == null || startedAt == null) {
            throw new IllegalArgumentException("资源不存在");
        }
        int correctCount = countCorrect(questions, answers);
        Map<Integer, String> finalAnswers = answers;
        List<AiTrainingResultResponse.AiTrainingResultItemDto> items = questions.stream()
                .map(q -> {
                    String userAnswer = finalAnswers.getOrDefault(q.getIndex(), "");
                    boolean correct = isCorrect(q, userAnswer);
                    return new AiTrainingResultResponse.AiTrainingResultItemDto(
                            q.getIndex(),
                            q.getType(),
                            q.getPrompt(),
                            q.getPassageText(),
                            q.getAudioText(),
                            q.getPassageTranslation(),
                            q.getOptions(),
                            userAnswer,
                            q.getCorrectAnswer(),
                            q.getAnswerExplanation(),
                            correct,
                            q.getWrongWords()
                    );
                })
                .collect(Collectors.toList());
        return new AiTrainingResultResponse(
                finalSessionId,
                startedAt.toString(),
                finishedAt == null ? "" : finishedAt.toString(),
                correctCount,
                questions.size(),
                wordCount,
                items
        );
    }

    private void persistSessionRecordIfNeeded(AiTrainingSession session, Long userId) {
        if (session == null || userId == null) {
            return;
        }
        if (aiTrainingRecordRepository.findBySessionId(session.getSessionId()).isPresent()) {
            return;
        }
        AiTrainingRecordEntity recordEntity = new AiTrainingRecordEntity();
        recordEntity.setSessionId(session.getSessionId());
        recordEntity.setUserId(userId);
        recordEntity.setDate(LocalDate.now());
        recordEntity.setStartedAt(session.getStartedAt());
        recordEntity.setFinishedAt(session.getFinishedAt());
        recordEntity.setWordCount(session.getWordCount());
        recordEntity.setQuestionsJson(writeJson(toSnapshots(session.getQuestions())));
        recordEntity.setAnswersJson(writeJson(Map.copyOf(session.getAnswers())));
        aiTrainingRecordRepository.save(recordEntity);
        saveTrainingRecord(userId, "ai", session.getStartedAt(), session.getFinishedAt(), session.getWordCount());
        int minutes = 0;
        if (session.getStartedAt() != null && session.getFinishedAt() != null) {
            minutes = (int) Math.max(0, Duration.between(session.getStartedAt(), session.getFinishedAt()).toMinutes());
        }
        updateDailyStat(userId, LocalDate.now(), minutes, session.getWordCount());
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("训练记录序列化失败");
        }
    }

    private void saveTrainingRecord(
            Long userId,
            String type,
            LocalDateTime startAt,
            LocalDateTime endAt,
            int wordCount
    ) {
        TrainingRecordEntity record = new TrainingRecordEntity();
        record.setUserId(userId);
        record.setType(type);
        record.setStartAt(startAt);
        record.setEndAt(endAt);
        record.setWordCount(wordCount);
        trainingRecordRepository.save(record);
    }

    private void updateDailyStat(Long userId, LocalDate date, int minutes, int words) {
        DailyStatEntity entity = dailyStatRepository.findByUserIdAndDate(userId, date)
                .orElseGet(() -> {
                    DailyStatEntity next = new DailyStatEntity();
                    next.setUserId(userId);
                    next.setDate(date);
                    next.setStudyMinutes(0);
                    next.setStudyWords(0);
                    return next;
                });
        entity.setStudyMinutes(entity.getStudyMinutes() + Math.max(0, minutes));
        entity.setStudyWords(entity.getStudyWords() + Math.max(0, words));
        dailyStatRepository.save(entity);
    }

    private List<AiTrainingQuestion> readQuestions(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            List<AiTrainingQuestionSnapshot> snapshots = objectMapper.readValue(
                    json,
                    new TypeReference<List<AiTrainingQuestionSnapshot>>() {}
            );
            return toQuestions(snapshots);
        } catch (Exception e) {
            throw new IllegalArgumentException("训练记录解析失败");
        }
    }

    private Map<Integer, String> readAnswers(String json) {
        if (json == null || json.isBlank()) {
            return Map.of();
        }
        try {
            Map<String, String> raw = objectMapper.readValue(json, new TypeReference<Map<String, String>>() {});
            Map<Integer, String> result = new LinkedHashMap<>();
            for (Map.Entry<String, String> entry : raw.entrySet()) {
                if (entry.getKey() == null) {
                    continue;
                }
                try {
                    int key = Integer.parseInt(entry.getKey());
                    result.put(key, entry.getValue());
                } catch (NumberFormatException ignored) {
                }
            }
            return result;
        } catch (Exception e) {
            throw new IllegalArgumentException("训练记录解析失败");
        }
    }

    private List<AiTrainingQuestionSnapshot> toSnapshots(List<AiTrainingQuestion> questions) {
        if (questions == null || questions.isEmpty()) {
            return List.of();
        }
        List<AiTrainingQuestionSnapshot> snapshots = new ArrayList<>();
        for (AiTrainingQuestion question : questions) {
            if (question == null) {
                continue;
            }
            AiTrainingQuestionSnapshot snapshot = new AiTrainingQuestionSnapshot();
            snapshot.setIndex(question.getIndex());
            snapshot.setType(question.getType());
            snapshot.setPrompt(question.getPrompt());
            snapshot.setPassageText(question.getPassageText());
            snapshot.setAudioText(question.getAudioText());
            snapshot.setPassageTranslation(question.getPassageTranslation());
            snapshot.setOptions(question.getOptions());
            snapshot.setCorrectAnswer(question.getCorrectAnswer());
            snapshot.setAnswerExplanation(question.getAnswerExplanation());
            snapshot.setWrongWords(question.getWrongWords());
            snapshots.add(snapshot);
        }
        return snapshots;
    }

    private List<AiTrainingQuestion> toQuestions(List<AiTrainingQuestionSnapshot> snapshots) {
        if (snapshots == null || snapshots.isEmpty()) {
            return List.of();
        }
        List<AiTrainingQuestion> questions = new ArrayList<>();
        for (AiTrainingQuestionSnapshot snapshot : snapshots) {
            if (snapshot == null) {
                continue;
            }
            questions.add(new AiTrainingQuestion(
                    snapshot.getIndex(),
                    snapshot.getType(),
                    snapshot.getPrompt(),
                    snapshot.getPassageText(),
                    snapshot.getAudioText(),
                    snapshot.getPassageTranslation(),
                    snapshot.getOptions(),
                    snapshot.getCorrectAnswer(),
                    snapshot.getAnswerExplanation(),
                    snapshot.getWrongWords()
            ));
        }
        return questions;
    }

    private AiTrainingSessionResponse toSessionResponse(AiTrainingSession session) {
        int total = session.getQuestions().size();
        AiTrainingQuestionDto question = null;
        if ("in_progress".equals(session.getStatus()) && session.getCurrentIndex() < total) {
            AiTrainingQuestion q = session.getQuestions().get(session.getCurrentIndex());
            question = new AiTrainingQuestionDto(
                    q.getIndex(),
                    q.getType(),
                    q.getPrompt(),
                    q.getPassageText(),
                    q.getAudioText(),
                    q.getOptions()
            );
        }
        return new AiTrainingSessionResponse(
                session.getSessionId(),
                session.getStatus(),
                session.getCurrentIndex(),
                total,
                session.getWordCount(),
                question
        );
    }

    private List<AiTrainingQuestion> generateQuestionsWithAi(List<Word> words) {
        String endpoint = resolveAiEndpoint(aiEndpoint);
        if (!aiEnabled || endpoint.isBlank() || aiApiKey == null || aiApiKey.isBlank()) {
            return List.of();
        }
        try {
            String wrongWordsText = words.stream()
                    .map(Word::getText)
                    .filter(Objects::nonNull)
                    .collect(Collectors.joining(", "));
            String systemPrompt = """
                    你是四六级听力命题专家。基于错词列表为每个单词生成 1 道四六级听力单选题。必须满足：
                    1) 题型固定为听力单选题（短对话/长对话/短文理解三选一）。
                    2) 每题仅围绕 1 个错词，听力原文自然融入该词的常见考纲用法。
                    3) 选项为 4 个（A-D），1 个正确答案 + 3 个干扰项（形近/近义/语境干扰）。
                    4) 题目难度符合四六级，不使用超纲词汇或过于简单句式。
                    5) 必须提供中文翻译与答案解析。
                    6) 输出严格为 JSON，字段顺序固定。
                    """;
            String userPrompt = """
                    请根据以下错词生成听力单选题：
                    错词列表：%s
                    输出要求：
                    - 每个错词 1 题，总题数 = 错词数
                    - question_type 固定为 "choice"
                    - passage_text 为听力原文，audio_text 与 passage_text 一致
                    - passage_translation 为中文翻译
                    - question_text 为题干（如 "What does the man mean?"）
                    - options 为 4 个选项（字符串）
                    - correct_answer 为正确选项文本
                    - answer_explanation 为中文解析，说明正确答案与干扰项
                    - wrong_words 为该题对应错词数组（仅 1 个）
                    - JSON 字段顺序固定，输出格式示例：
                      {"items":[{"index":0,"question_type":"choice","question_text":"...","passage_text":"...","audio_text":"...","passage_translation":"...","options":["...","...","...","..."],"correct_answer":"...","answer_explanation":"...","wrong_words":["word"]}]}
                    """.formatted(wrongWordsText);
            List<Map<String, String>> messages = new ArrayList<>();
            messages.add(Map.of("role", "system", "content", systemPrompt));
            messages.add(Map.of("role", "user", "content", userPrompt));
            String modelName = aiModel == null || aiModel.isBlank() ? "qwen-plus" : aiModel;
            if (aiAppId != null && !aiAppId.isBlank()) {
                String appRaw = callBailianApp(endpoint, aiAppId.trim(), userPrompt);
                try {
                    List<AiTrainingQuestion> appQuestions = parseAiQuestions(appRaw);
                    if (!appQuestions.isEmpty()) {
                        return enforceChoiceQuestions(appQuestions, words);
                    }
                } catch (IllegalArgumentException ignored) {
                }
            }
            String raw;
            try {
                raw = callBailian(endpoint, messages, modelName);
            } catch (IllegalArgumentException e) {
                String compatibleEndpoint = resolveCompatibleEndpoint(endpoint);
                if (!compatibleEndpoint.isBlank() && !compatibleEndpoint.equals(endpoint)) {
                    raw = callBailian(compatibleEndpoint, messages, modelName);
                } else {
                    throw e;
                }
            }
            return enforceChoiceQuestions(parseAiQuestions(raw), words);
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            String detail = e.getMessage() == null ? "" : sanitizeErrorMessage(e.getMessage());
            String suffix = detail.isBlank() ? "未知错误，请检查网络与百炼额度" : detail;
            throw new IllegalArgumentException("百炼接口调用失败: " + suffix);
        }
    }

    private List<AiTrainingQuestion> parseAiQuestions(String raw) throws Exception {
        if (raw == null || raw.isBlank()) {
            return List.of();
        }
        String payload = extractJsonPayload(raw);
        if (payload == null || payload.isBlank()) {
            return List.of();
        }
        String trimmedPayload = payload.trim();
        if (!(trimmedPayload.startsWith("{") || trimmedPayload.startsWith("["))) {
            String candidate = trimToJson(payload);
            String candidateTrimmed = candidate.trim();
            if (candidateTrimmed.startsWith("{") || candidateTrimmed.startsWith("[")) {
                payload = candidate;
            } else {
                throw new IllegalArgumentException("百炼接口返回内容不是 JSON，请检查应用输出或提示词设置");
            }
        }
        JsonNode root = objectMapper.readTree(payload);
        List<AiGeneratedItem> items = extractGeneratedItems(root);
        if (items.isEmpty()) {
            return List.of();
        }
        List<AiTrainingQuestion> questions = new ArrayList<>();
        int index = 0;
        for (AiGeneratedItem item : items) {
            String type = normalizeType(item.question_type);
            String prompt = item.question_text == null || item.question_text.isBlank()
                    ? (type.equals("choice") ? "请选择最合适的单词" : "请在空格处填入合适的单词")
                    : item.question_text;
            String passage = item.passage_text == null ? "" : item.passage_text;
            String audio = item.audio_text == null || item.audio_text.isBlank() ? passage : item.audio_text;
            List<String> options = item.options == null ? List.of() : item.options;
            List<String> wrongWords = item.wrong_words == null ? List.of() : item.wrong_words;
            String correctAnswer = item.correct_answer == null ? "" : item.correct_answer;
            String translation = item.passage_translation == null ? "" : item.passage_translation;
            String explanation = item.answer_explanation == null ? "" : item.answer_explanation;
            if (correctAnswer.isBlank() && type.equals("cloze") && wrongWords.size() == 1) {
                correctAnswer = wrongWords.get(0);
            }
            int currentIndex = item.index == null ? index : item.index;
            questions.add(new AiTrainingQuestion(
                    currentIndex,
                    type,
                    prompt,
                    passage,
                    audio,
                    translation,
                    options,
                    correctAnswer,
                    explanation,
                    wrongWords
            ));
            index++;
        }
        return questions;
    }

    private List<AiTrainingQuestion> enforceChoiceQuestions(List<AiTrainingQuestion> questions, List<Word> words) {
        if (questions == null || questions.isEmpty()) {
            return questions;
        }
        List<String> candidates = new ArrayList<>();
        if (words != null) {
            for (Word word : words) {
                if (word != null && word.getText() != null && !word.getText().isBlank()) {
                    candidates.add(word.getText());
                }
            }
        }
        for (AiTrainingQuestion question : questions) {
            List<String> wrongWords = question.getWrongWords();
            if (wrongWords != null) {
                for (String word : wrongWords) {
                    if (word != null && !word.isBlank()) {
                        candidates.add(word);
                    }
                }
            }
        }
        List<AiTrainingQuestion> updated = new ArrayList<>();
        for (AiTrainingQuestion question : questions) {
            if ("choice".equals(question.getType())) {
                updated.add(question);
                continue;
            }
            String correctAnswer = question.getCorrectAnswer() == null ? "" : question.getCorrectAnswer();
            if (correctAnswer.isBlank()) {
                List<String> wrongWords = question.getWrongWords();
                if (wrongWords != null && wrongWords.size() == 1) {
                    correctAnswer = wrongWords.get(0);
                }
            }
            List<String> options = question.getOptions();
            if (options == null || options.size() < 2) {
                options = buildOptionsFromCandidates(candidates, correctAnswer, 4);
            }
            updated.add(new AiTrainingQuestion(
                    question.getIndex(),
                    "choice",
                    question.getPrompt(),
                    question.getPassageText(),
                    question.getAudioText(),
                    question.getPassageTranslation(),
                    options,
                    correctAnswer,
                    question.getAnswerExplanation(),
                    question.getWrongWords()
            ));
        }
        return updated;
    }

    private List<String> buildOptionsFromCandidates(List<String> candidates, String correctAnswer, int limit) {
        if (correctAnswer == null || correctAnswer.isBlank()) {
            return List.of();
        }
        List<String> pool = new ArrayList<>();
        for (String candidate : candidates) {
            if (candidate != null && !candidate.isBlank() && !candidate.equals(correctAnswer)) {
                pool.add(candidate);
            }
        }
        Collections.shuffle(pool, random);
        List<String> options = new ArrayList<>();
        options.add(correctAnswer);
        for (String candidate : pool) {
            if (options.size() >= limit) {
                break;
            }
            if (!options.contains(candidate)) {
                options.add(candidate);
            }
        }
        Collections.shuffle(options, random);
        return options;
    }

    private List<AiGeneratedItem> extractGeneratedItems(JsonNode root) throws Exception {
        if (root == null || root.isNull()) {
            return List.of();
        }
        List<AiGeneratedItem> items = new ArrayList<>();
        JsonNode itemsNode = root.get("items");
        if (itemsNode != null && itemsNode.isArray()) {
            for (JsonNode itemNode : itemsNode) {
                items.add(objectMapper.treeToValue(itemNode, AiGeneratedItem.class));
            }
        }
        if (!items.isEmpty()) {
            return items;
        }
        JsonNode output = root.get("output");
        if (output != null && output.isObject()) {
            items.addAll(extractGeneratedItems(output));
        }
        if (!items.isEmpty()) {
            return items;
        }
        JsonNode segments = root.get("segments");
        if (segments != null && segments.isArray()) {
            for (JsonNode segment : segments) {
                AiGeneratedItem mapped = mapSegmentToItem(segment);
                if (mapped != null) {
                    items.add(mapped);
                    continue;
                }
                JsonNode segmentItems = segment.get("items");
                if (segmentItems != null && segmentItems.isArray()) {
                    for (JsonNode itemNode : segmentItems) {
                        items.add(objectMapper.treeToValue(itemNode, AiGeneratedItem.class));
                    }
                    continue;
                }
                JsonNode segmentText = segment.get("text");
                if (segmentText != null && segmentText.isTextual()) {
                    String text = trimToJson(segmentText.asText());
                    if (!text.isBlank()) {
                        JsonNode nested = objectMapper.readTree(text);
                        items.addAll(extractGeneratedItems(nested));
                    }
                }
            }
        }
        return items;
    }

    private AiGeneratedItem mapSegmentToItem(JsonNode segment) {
        if (segment == null || segment.isNull()) {
            return null;
        }
        JsonNode textNode = segment.get("text");
        JsonNode questionNode = segment.get("question");
        if ((textNode == null || textNode.isNull()) && (questionNode == null || questionNode.isNull())) {
            return null;
        }
        AiGeneratedItem item = new AiGeneratedItem();
        if (textNode != null && textNode.isTextual()) {
            item.passage_text = textNode.asText();
            item.audio_text = textNode.asText();
        }
        if (questionNode != null && questionNode.isTextual()) {
            item.question_text = questionNode.asText();
        }
        JsonNode optionsNode = segment.get("options");
        if (optionsNode != null && optionsNode.isArray()) {
            List<String> options = new ArrayList<>();
            for (JsonNode option : optionsNode) {
                if (option != null && option.isTextual()) {
                    options.add(option.asText());
                }
            }
            item.options = options;
        }
        JsonNode answerNode = resolveAnswerNode(segment);
        if (answerNode != null) {
            if (answerNode.isTextual()) {
                item.correct_answer = answerNode.asText();
            } else if (answerNode.isArray() && answerNode.size() > 0) {
                List<String> answers = new ArrayList<>();
                for (JsonNode answer : answerNode) {
                    if (answer != null && answer.isTextual()) {
                        answers.add(answer.asText());
                    }
                }
                if (!answers.isEmpty()) {
                    item.correct_answer = String.join(" / ", answers);
                }
            } else if (answerNode.isObject()) {
                JsonNode text = answerNode.get("text");
                if (text != null && text.isTextual()) {
                    item.correct_answer = text.asText();
                }
            }
        }
        JsonNode wrongWordsNode = segment.get("wrong_words");
        if (wrongWordsNode != null && wrongWordsNode.isArray()) {
            List<String> wrongWords = new ArrayList<>();
            for (JsonNode wordNode : wrongWordsNode) {
                if (wordNode != null && wordNode.isTextual()) {
                    wrongWords.add(wordNode.asText());
                }
            }
            item.wrong_words = wrongWords;
        }
        JsonNode translationNode = segment.get("passage_translation");
        if (translationNode != null && translationNode.isTextual()) {
            item.passage_translation = translationNode.asText();
        }
        JsonNode explanationNode = segment.get("answer_explanation");
        if (explanationNode != null && explanationNode.isTextual()) {
            item.answer_explanation = explanationNode.asText();
        } else {
            JsonNode altExplanation = segment.get("explanation");
            if (altExplanation != null && altExplanation.isTextual()) {
                item.answer_explanation = altExplanation.asText();
            }
        }
        JsonNode typeNode = segment.get("type");
        if (typeNode != null && typeNode.isTextual()) {
            item.question_type = normalizeType(typeNode.asText());
        }
        return item;
    }

    private JsonNode resolveAnswerNode(JsonNode segment) {
        if (segment == null) {
            return null;
        }
        JsonNode answerNode = segment.get("answer");
        if (answerNode != null && !answerNode.isNull()) {
            return answerNode;
        }
        JsonNode correctAnswerNode = segment.get("correct_answer");
        if (correctAnswerNode != null && !correctAnswerNode.isNull()) {
            return correctAnswerNode;
        }
        JsonNode correctAnswerCamel = segment.get("correctAnswer");
        if (correctAnswerCamel != null && !correctAnswerCamel.isNull()) {
            return correctAnswerCamel;
        }
        JsonNode answersNode = segment.get("answers");
        if (answersNode != null && !answersNode.isNull()) {
            return answersNode;
        }
        return null;
    }

    private String resolveAiEndpoint(String endpoint) {
        if (endpoint == null) {
            return "";
        }
        String trimmed = endpoint.trim();
        if (trimmed.isBlank()) {
            return "";
        }
        String normalized = trimmed.endsWith("/") ? trimmed.substring(0, trimmed.length() - 1) : trimmed;
        if (normalized.contains("/services/aigc/text-generation/generation")
                || normalized.endsWith("/compatible-mode/v1/chat/completions")) {
            return normalized;
        }
        if (normalized.endsWith("/compatible-mode/v1")) {
            return normalized + "/chat/completions";
        }
        if (normalized.endsWith("/api/v1")) {
            return normalized + "/services/aigc/text-generation/generation";
        }
        return normalized;
    }

    private String resolveCompatibleEndpoint(String endpoint) {
        if (endpoint == null || endpoint.isBlank()) {
            return "";
        }
        String normalized = endpoint.endsWith("/") ? endpoint.substring(0, endpoint.length() - 1) : endpoint;
        if (normalized.contains("/compatible-mode/")) {
            return normalized;
        }
        if (normalized.contains("/services/aigc/text-generation/generation")) {
            return normalized.replace("/api/v1/services/aigc/text-generation/generation", "/compatible-mode/v1/chat/completions");
        }
        if (normalized.endsWith("/api/v1")) {
            return normalized.replace("/api/v1", "/compatible-mode/v1/chat/completions");
        }
        return "";
    }

    private boolean isCompatibleModeEndpoint(String endpoint) {
        if (endpoint == null) {
            return false;
        }
        String normalized = endpoint.toLowerCase(Locale.ROOT);
        return normalized.contains("/compatible-mode/");
    }

    private String resolveAppEndpoint(String endpoint, String appId) {
        if (appId == null || appId.isBlank()) {
            return "";
        }
        if (endpoint == null || endpoint.isBlank()) {
            return "https://dashscope.aliyuncs.com/api/v1/apps/" + appId + "/completion";
        }
        String normalized = endpoint.endsWith("/") ? endpoint.substring(0, endpoint.length() - 1) : endpoint;
        String base;
        if (normalized.contains("/api/v1")) {
            base = normalized.substring(0, normalized.indexOf("/api/v1") + "/api/v1".length());
        } else if (normalized.contains("/compatible-mode/")) {
            base = normalized.substring(0, normalized.indexOf("/compatible-mode/"));
            base = base + "/api/v1";
        } else if (normalized.startsWith("http")) {
            base = normalized;
        } else {
            return "";
        }
        return base + "/apps/" + appId + "/completion";
    }

    private String callBailian(String endpoint, List<Map<String, String>> messages, String modelName) {
        Map<String, Object> requestBody = new LinkedHashMap<>();
        if (isCompatibleModeEndpoint(endpoint)) {
            requestBody.put("model", modelName);
            requestBody.put("messages", messages);
            requestBody.put("temperature", 0.7);
            requestBody.put("top_p", 0.9);
        } else {
            requestBody.put("model", modelName);
            Map<String, Object> input = new LinkedHashMap<>();
            input.put("messages", messages);
            requestBody.put("input", input);
            requestBody.put("parameters", Map.of("temperature", 0.7, "top_p", 0.9, "result_format", "message"));
        }
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + aiApiKey);
        try {
            return restTemplate.postForObject(endpoint, new HttpEntity<>(requestBody, headers), String.class);
        } catch (HttpStatusCodeException e) {
            String detail = extractErrorMessage(e.getResponseBodyAsString());
            String suffix = detail.isBlank() ? e.getStatusCode().toString() : detail;
            suffix = sanitizeErrorMessage(suffix);
            throw new IllegalArgumentException("百炼接口调用失败: " + suffix + "（endpoint=" + endpoint + "）");
        } catch (ResourceAccessException e) {
            String detail = sanitizeErrorMessage(e.getMessage());
            String suffix = detail.isBlank() ? "连接异常" : detail;
            throw new IllegalArgumentException("百炼接口调用失败: " + suffix + "（endpoint=" + endpoint + "）");
        }
    }

    private String callBailianApp(String endpoint, String appId, String prompt) {
        String appEndpoint = resolveAppEndpoint(endpoint, appId);
        if (appEndpoint.isBlank()) {
            throw new IllegalArgumentException("缺少appID");
        }
        Map<String, Object> requestBody = new LinkedHashMap<>();
        requestBody.put("input", Map.of("prompt", prompt));
        requestBody.put("parameters", Map.of());
        requestBody.put("debug", Map.of());
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + aiApiKey);
        try {
            return restTemplate.postForObject(appEndpoint, new HttpEntity<>(requestBody, headers), String.class);
        } catch (HttpStatusCodeException e) {
            String detail = extractErrorMessage(e.getResponseBodyAsString());
            String suffix = detail.isBlank() ? e.getStatusCode().toString() : detail;
            suffix = sanitizeErrorMessage(suffix);
            throw new IllegalArgumentException("百炼接口调用失败: " + suffix + "（endpoint=" + appEndpoint + "）");
        } catch (ResourceAccessException e) {
            String detail = sanitizeErrorMessage(e.getMessage());
            String suffix = detail.isBlank() ? "连接异常" : detail;
            throw new IllegalArgumentException("百炼接口调用失败: " + suffix + "（endpoint=" + appEndpoint + "）");
        }
    }

    private String extractErrorMessage(String raw) {
        if (raw == null || raw.isBlank()) {
            return "";
        }
        try {
            JsonNode root = objectMapper.readTree(raw);
            if (root.has("message") && root.get("message").isTextual()) {
                return root.get("message").asText();
            }
            if (root.has("error")) {
                JsonNode error = root.get("error");
                if (error.has("message") && error.get("message").isTextual()) {
                    return error.get("message").asText();
                }
                if (error.has("msg") && error.get("msg").isTextual()) {
                    return error.get("msg").asText();
                }
            }
            if (root.has("code") && root.get("code").isTextual()) {
                return root.get("code").asText();
            }
        } catch (Exception ignored) {
            return raw.length() > 200 ? raw.substring(0, 200) : raw;
        }
        return raw.length() > 200 ? raw.substring(0, 200) : raw;
    }

    private String sanitizeErrorMessage(String message) {
        if (message == null || message.isBlank()) {
            return "";
        }
        return message.replaceAll("sk-[A-Za-z0-9_-]{8,}", "sk-***");
    }

    private String extractJsonPayload(String raw) throws Exception {
        String trimmed = raw == null ? "" : raw.trim();
        if (!(trimmed.startsWith("{") || trimmed.startsWith("[") || trimmed.startsWith("```"))) {
            return raw;
        }
        JsonNode root = objectMapper.readTree(raw);
        if (root.has("total_questions") && root.has("items")) {
            return raw;
        }
        JsonNode contentNode = null;
        if (root.has("output")) {
            JsonNode output = root.get("output");
            if (output.has("text")) {
                contentNode = output.get("text");
            } else if (output.has("message")) {
                contentNode = output.get("message");
            }
        }
        if (contentNode == null && root.has("output")) {
            JsonNode output = root.get("output");
            if (output.has("choices")) {
                JsonNode choices = output.get("choices");
                if (choices.isArray() && !choices.isEmpty()) {
                    JsonNode message = choices.get(0).get("message");
                    if (message != null && message.has("content")) {
                        contentNode = message.get("content");
                    }
                }
            }
        }
        if (contentNode == null && root.has("choices")) {
            JsonNode choices = root.get("choices");
            if (choices.isArray() && !choices.isEmpty()) {
                JsonNode message = choices.get(0).get("message");
                if (message != null && message.has("content")) {
                    contentNode = message.get("content");
                }
            }
        }
        String text = contentNode != null && contentNode.isTextual() ? contentNode.asText() : raw;
        return trimToJson(text);
    }

    private String trimToJson(String text) {
        if (text == null) {
            return "";
        }
        String trimmed = text.trim();
        if (trimmed.startsWith("```")) {
            int startFence = trimmed.indexOf('{');
            int endFence = trimmed.lastIndexOf('}');
            if (startFence >= 0 && endFence > startFence) {
                return trimmed.substring(startFence, endFence + 1);
            }
        }
        int start = trimmed.indexOf('{');
        int end = trimmed.lastIndexOf('}');
        if (start >= 0 && end > start) {
            return trimmed.substring(start, end + 1);
        }
        return trimmed;
    }

    private String normalizeType(String type) {
        if (type == null) {
            return "cloze";
        }
        String lower = type.toLowerCase(Locale.ROOT).trim();
        if (lower.equals("blank") || lower.equals("cloze") || lower.equals("fill_blank") || lower.equals("fill_in_blank")) {
            return "cloze";
        }
        if (lower.equals("choice") || lower.equals("single_choice") || lower.equals("multiple_choice") || lower.equals("mcq")) {
            return "choice";
        }
        return "cloze";
    }

    private List<AiTrainingQuestion> generateFallbackQuestions(List<Word> words) {
        if (words == null || words.isEmpty()) {
            return List.of();
        }
        List<AiTrainingQuestion> questions = new ArrayList<>();
        List<Word> pool = new ArrayList<>(words);
        int index = 0;
        for (Word target : words) {
            if (target == null || target.getText() == null || target.getText().isBlank()) {
                continue;
            }
            ListeningTemplate template = buildListeningTemplate(target.getText());
            List<String> options = buildListeningOptions(pool, target.getText(), template.correctOption);
            String explanation = buildExplanation(template.correctOption, options, template.answerHint);
            questions.add(new AiTrainingQuestion(
                    index,
                    "choice",
                    template.questionText,
                    template.passageText,
                    template.passageText,
                    template.passageTranslation,
                    options,
                    template.correctOption,
                    explanation,
                    List.of(target.getText())
            ));
            index++;
        }
        return questions;
    }

    private ListeningTemplate buildListeningTemplate(String word) {
        List<ListeningTemplate> templates = List.of(
                new ListeningTemplate(
                        "W: I was worried about the budget, but the manager said it's just a " + word + " issue.\n"
                                + "M: Then we can solve it without cutting the training program.",
                        "男：我担心预算问题，但经理说这只是一个" + word + "的问题。\n"
                                + "女：那我们就不用削减培训计划了。",
                        "What does the man mean?",
                        "The problem is not serious and can be handled.",
                        "He thinks the issue is minor."
                ),
                new ListeningTemplate(
                        "M: The report seems " + word + ".\n"
                                + "W: Yes, the logic is clear and the data supports it.",
                        "男：这份报告看起来很" + word + "。\n"
                                + "女：是的，逻辑清晰，数据也支持。",
                        "What does the woman imply about the report?",
                        "It is convincing and well supported.",
                        "She agrees with his evaluation."
                ),
                new ListeningTemplate(
                        "W: Why did you " + word + " the offer?\n"
                                + "M: Because the contract didn't mention the overtime pay.",
                        "女：你为什么" + word + "这个提议？\n"
                                + "男：因为合同里没有提到加班费。",
                        "Why did the man refuse the offer?",
                        "He found an important detail missing.",
                        "The contract lacked a key term."
                )
        );
        return templates.get(random.nextInt(templates.size()));
    }

    private List<String> buildListeningOptions(List<Word> pool, String correctWord, String correctOption) {
        List<String> options = new ArrayList<>();
        options.add(correctOption);
        List<String> distractors = new ArrayList<>();
        for (Word word : pool) {
            if (word == null || word.getText() == null) {
                continue;
            }
            String text = word.getText().trim();
            if (!text.equalsIgnoreCase(correctWord) && !text.isBlank()) {
                distractors.add("It is about " + text + ".");
            }
        }
        Collections.shuffle(distractors, random);
        for (String candidate : distractors) {
            if (options.size() >= 4) {
                break;
            }
            if (!options.contains(candidate)) {
                options.add(candidate);
            }
        }
        while (options.size() < 4) {
            options.add("It is unrelated to the main issue.");
        }
        Collections.shuffle(options, random);
        return options;
    }

    private String buildExplanation(String correctOption, List<String> options, String hint) {
        StringBuilder builder = new StringBuilder();
        builder.append("正确答案：").append(correctOption).append("。");
        if (hint != null && !hint.isBlank()) {
            builder.append(hint);
        }
        List<String> wrongs = options.stream()
                .filter(opt -> !opt.equals(correctOption))
                .toList();
        if (!wrongs.isEmpty()) {
            builder.append(" 干扰项");
            for (int i = 0; i < wrongs.size(); i++) {
                builder.append(i + 1).append("表示").append(wrongs.get(i)).append("，与对话含义不符。");
                if (i < wrongs.size() - 1) {
                    builder.append(" ");
                }
            }
        }
        return builder.toString();
    }

    private static class ListeningTemplate {
        private final String passageText;
        private final String passageTranslation;
        private final String questionText;
        private final String correctOption;
        private final String answerHint;

        private ListeningTemplate(
                String passageText,
                String passageTranslation,
                String questionText,
                String correctOption,
                String answerHint
        ) {
            this.passageText = passageText;
            this.passageTranslation = passageTranslation;
            this.questionText = questionText;
            this.correctOption = correctOption;
            this.answerHint = answerHint;
        }
    }

    private int countCorrect(List<AiTrainingQuestion> questions, Map<Integer, String> answers) {
        int correct = 0;
        for (AiTrainingQuestion q : questions) {
            String userAnswer = answers.getOrDefault(q.getIndex(), "");
            if (isCorrect(q, userAnswer)) {
                correct++;
            }
        }
        return correct;
    }

    private boolean isCorrect(AiTrainingQuestion q, String userAnswer) {
        if (q == null) {
            return false;
        }
        String expected = q.getCorrectAnswer() == null ? "" : q.getCorrectAnswer();
        String actual = userAnswer == null ? "" : userAnswer;
        return expected.toLowerCase(Locale.ROOT).trim().equals(actual.toLowerCase(Locale.ROOT).trim());
    }

    private String escapeWord(String word) {
        if (word == null) {
            return "";
        }
        return word.replaceAll("([\\\\.^$|?*+()\\[\\]{}])", "\\\\$1");
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private static class AiGeneratedResponse {
        public int total_questions;
        public List<AiGeneratedItem> items;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private static class AiGeneratedItem {
        public Integer index;
        public String passage_text;
        public String question_type;
        public String question_text;
        public List<String> options;
        public String correct_answer;
        public String answer_explanation;
        public List<String> wrong_words;
        public String audio_text;
        public String passage_translation;
    }
}
