package com.spelllab.backend.repository;

import com.spelllab.backend.entity.AiTrainingRecordEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AiTrainingRecordRepository extends JpaRepository<AiTrainingRecordEntity, Long> {
    Optional<AiTrainingRecordEntity> findBySessionId(Long sessionId);

    List<AiTrainingRecordEntity> findAllByUserIdOrderByStartedAtDesc(Long userId);

    List<AiTrainingRecordEntity> findAllByUserId(Long userId);
}
