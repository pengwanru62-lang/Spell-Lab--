package com.spelllab.backend.repository;

import com.spelllab.backend.entity.WrongWordEntry;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface WrongWordRepository extends JpaRepository<WrongWordEntry, Long> {
    List<WrongWordEntry> findAllByOrderByLastWrongAtDesc();

    Optional<WrongWordEntry> findByWordId(Long wordId);

    void deleteByWordIdIn(List<Long> wordIds);
}
