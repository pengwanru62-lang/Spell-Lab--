package com.spelllab.backend.service;

import com.spelllab.backend.entity.DailyStatEntity;
import com.spelllab.backend.entity.TrainingRecordEntity;
import com.spelllab.backend.dto.DailyStatDto;
import com.spelllab.backend.dto.RecordSummaryStatsDto;
import com.spelllab.backend.dto.TrainingRecordDto;
import com.spelllab.backend.repository.DailyStatRepository;
import com.spelllab.backend.repository.TrainingRecordRepository;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class RecordService {
    private final TrainingRecordRepository trainingRecordRepository;
    private final DailyStatRepository dailyStatRepository;

    public RecordService(
            TrainingRecordRepository trainingRecordRepository,
            DailyStatRepository dailyStatRepository
    ) {
        this.trainingRecordRepository = trainingRecordRepository;
        this.dailyStatRepository = dailyStatRepository;
    }

    /**
     * 获取训练记录列表。
     */
    public List<TrainingRecordDto> listRecords(Long userId) {
        if (userId == null) {
            return List.of();
        }
        return trainingRecordRepository.findAllByUserIdOrderByStartAtDesc(userId).stream()
                .map(record -> new TrainingRecordDto(
                        record.getId(),
                        record.getType(),
                        record.getStartAt() == null ? "" : record.getStartAt().toString(),
                        record.getEndAt() == null ? "" : record.getEndAt().toString()
                ))
                .toList();
    }

    /**
     * 获取每日统计数据。
     */
    public List<DailyStatDto> listDailyStats(Long userId, String from, String to) {
        if (userId == null) {
            return List.of();
        }
        LocalDate end = parseDateOrNull(to);
        if (end == null) {
            end = LocalDate.now();
        }
        LocalDate start = parseDateOrNull(from);
        if (start == null) {
            start = end.minusDays(7);
        }
        if (start.isAfter(end)) {
            LocalDate tmp = start;
            start = end;
            end = tmp;
        }

        List<DailyStatEntity> stats = dailyStatRepository.findAllByUserIdAndDateBetweenOrderByDateAsc(
                userId,
                start,
                end
        );
        Map<LocalDate, int[]> aggregates = new HashMap<>();
        for (DailyStatEntity stat : stats) {
            LocalDate date = stat.getDate();
            if (date == null) {
                continue;
            }
            int[] acc = aggregates.computeIfAbsent(date, k -> new int[]{0, 0});
            acc[0] += stat.getStudyMinutes();
            acc[1] += stat.getStudyWords();
        }

        List<DailyStatDto> result = new java.util.ArrayList<>();
        for (LocalDate d = start; !d.isAfter(end); d = d.plusDays(1)) {
            int[] acc = aggregates.get(d);
            if (acc == null) {
                result.add(new DailyStatDto(d.toString(), 0, 0));
            } else {
                result.add(new DailyStatDto(d.toString(), acc[0], acc[1]));
            }
        }
        return result;
    }

    public RecordSummaryStatsDto getSummary(Long userId, String date) {
        if (userId == null) {
            return new RecordSummaryStatsDto(LocalDate.now().toString(), 0, 0, 0, 0);
        }
        LocalDate target = parseDateOrNull(date);
        if (target == null) {
            target = LocalDate.now();
        }
        List<DailyStatEntity> all = dailyStatRepository.findAllByUserId(userId);
        int totalMinutes = 0;
        int totalWords = 0;
        int todayMinutes = 0;
        int todayWords = 0;
        for (DailyStatEntity stat : all) {
            LocalDate d = stat.getDate();
            if (d == null) {
                continue;
            }
            totalMinutes += stat.getStudyMinutes();
            totalWords += stat.getStudyWords();
            if (d.equals(target)) {
                todayMinutes += stat.getStudyMinutes();
                todayWords += stat.getStudyWords();
            }
        }
        return new RecordSummaryStatsDto(target.toString(), todayWords, todayMinutes, totalMinutes, totalWords);
    }

    private LocalDate parseDateOrNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return LocalDate.parse(value);
        } catch (Exception e) {
            return null;
        }
    }
}
