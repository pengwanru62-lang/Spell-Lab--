package com.spelllab.backend.repository;

import com.spelllab.backend.entity.DailyStatEntity;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DailyStatRepository extends JpaRepository<DailyStatEntity, Long> {
    Optional<DailyStatEntity> findByUserIdAndDate(Long userId, LocalDate date);

    List<DailyStatEntity> findAllByUserIdAndDateBetweenOrderByDateAsc(
            Long userId,
            LocalDate from,
            LocalDate to
    );

    List<DailyStatEntity> findAllByUserId(Long userId);
}
