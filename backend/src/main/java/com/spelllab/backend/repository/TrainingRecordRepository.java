package com.spelllab.backend.repository;

import com.spelllab.backend.entity.TrainingRecordEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TrainingRecordRepository extends JpaRepository<TrainingRecordEntity, Long> {
    List<TrainingRecordEntity> findAllByUserIdOrderByStartAtDesc(Long userId);
}
