package com.spelllab.backend.repository;

import com.spelllab.backend.dto.DailyStatDto;
import com.spelllab.backend.dto.TrainingRecordDto;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import org.springframework.stereotype.Repository;

@Repository
public class RecordRepository {
    private final List<TrainingRecordDto> records = new CopyOnWriteArrayList<>();
    private final List<DailyStatDto> dailyStats = new CopyOnWriteArrayList<>();

    public RecordRepository() {
        records.add(new TrainingRecordDto(1L, "dictation", "2025-01-10T10:00:00", "2025-01-10T10:20:00"));
        records.add(new TrainingRecordDto(2L, "wrongbook", "2025-01-11T09:00:00", "2025-01-11T09:12:00"));
        dailyStats.add(new DailyStatDto("2025-01-10", 20, 30));
        dailyStats.add(new DailyStatDto("2025-01-11", 12, 18));
        dailyStats.add(new DailyStatDto("2025-01-12", 25, 40));
    }

    public List<TrainingRecordDto> findAllRecords() {
        return List.copyOf(records);
    }

    public List<DailyStatDto> findDailyStats() {
        return List.copyOf(dailyStats);
    }

    public void addRecord(TrainingRecordDto record) {
        records.add(record);
    }

    public void addOrUpdateDailyStat(LocalDate date, int studyMinutes, int studyWords) {
        List<DailyStatDto> copy = new ArrayList<>(dailyStats);
        DailyStatDto target = copy.stream().filter(stat -> stat.getDate().equals(date.toString())).findFirst().orElse(null);
        if (target != null) {
            dailyStats.remove(target);
            dailyStats.add(new DailyStatDto(
                    target.getDate(),
                    target.getStudyMinutes() + studyMinutes,
                    target.getStudyWords() + studyWords
            ));
            return;
        }
        dailyStats.add(new DailyStatDto(date.toString(), studyMinutes, studyWords));
    }
}
