package com.spelllab.backend.service;

import com.spelllab.backend.entity.Word;
import com.spelllab.backend.entity.WrongWordEntry;
import com.spelllab.backend.dto.TrainingUnitResponse;
import com.spelllab.backend.dto.WordDto;
import com.spelllab.backend.dto.WrongWordDto;
import com.spelllab.backend.dto.WrongWordTrainRequest;
import com.spelllab.backend.repository.TrainingRepository;
import com.spelllab.backend.repository.WordRepository;
import com.spelllab.backend.repository.WrongWordRepository;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class WrongWordService {
    private final WrongWordRepository wrongWordRepository;
    private final TrainingRepository trainingRepository;
    private final WordRepository wordRepository;

    public WrongWordService(
            WrongWordRepository wrongWordRepository,
            TrainingRepository trainingRepository,
            WordRepository wordRepository
    ) {
        this.wrongWordRepository = wrongWordRepository;
        this.trainingRepository = trainingRepository;
        this.wordRepository = wordRepository;
    }

    /**
     * 获取错词列表。
     */
    public List<WrongWordDto> listWrongWords() {
        List<WrongWordEntry> entries = wrongWordRepository.findAllByOrderByLastWrongAtDesc();
        Map<Long, Word> wordMap = wordRepository.findAllById(
                        entries.stream().map(WrongWordEntry::getWordId).filter(Objects::nonNull).toList()
                )
                .stream()
                .collect(Collectors.toMap(Word::getId, w -> w));
        return entries.stream()
                .map(entry -> {
                    Word word = wordMap.get(entry.getWordId());
                    String text = word == null ? entry.getText() : word.getText();
                    String pronunciation = word == null ? "" : word.getPronunciation();
                    String audioUrl = word == null ? "" : word.getAudioUrl();
                    List<String> meanings = word == null
                            ? List.of()
                            : List.of(word.getMeaning() != null ? word.getMeaning().split(";") : new String[]{});
                    String lastWrongAt = entry.getLastWrongAt() == null ? "" : entry.getLastWrongAt().toString();
                    return new WrongWordDto(
                            entry.getWordId(),
                            text,
                            entry.getWrongCount(),
                            pronunciation,
                            audioUrl,
                            meanings,
                            lastWrongAt
                    );
                })
                .sorted(Comparator.comparing(WrongWordDto::getLastWrongAt).reversed())
                .collect(Collectors.toList());
    }

    /**
     * 按选中错词生成训练单元。
     */
    public TrainingUnitResponse train(WrongWordTrainRequest request) {
        List<Long> wordIds = request == null ? List.of() : request.getWordIds();
        if (wordIds == null || wordIds.isEmpty()) {
            Long unitId = trainingRepository.createUnit(null, null, List.of());
            return new TrainingUnitResponse(unitId, List.of(), 0);
        }
        Map<Long, Word> wordMap = wordRepository.findAllById(wordIds).stream()
                .collect(Collectors.toMap(Word::getId, w -> w));
        List<WordDto> words = wordIds.stream()
                .map(wordId -> {
                    Word word = wordMap.get(wordId);
                    if (word == null) {
                        return null;
                    }
                    return new WordDto(
                            word.getId(),
                            word.getText(),
                            word.getPronunciation(),
                            word.getAudioUrl(),
                            trainingRepository.isFamiliar(word.getId()),
                            List.of(word.getMeaning() != null ? word.getMeaning().split(";") : new String[]{})
                    );
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        Long unitId = trainingRepository.createUnit(null, null, words);
        return new TrainingUnitResponse(unitId, words, 0);
    }

    public void markKnown(List<Long> wordIds) {
        if (wordIds == null || wordIds.isEmpty()) {
            return;
        }
        wrongWordRepository.deleteByWordIdIn(wordIds);
    }
}
