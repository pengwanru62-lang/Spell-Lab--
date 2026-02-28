package com.spelllab.backend.repository;

import com.spelllab.backend.entity.Wordbook;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface WordbookRepository extends JpaRepository<Wordbook, Long> {
    List<Wordbook> findByUserIdOrType(Long userId, String type);
    Optional<Wordbook> findByNameAndType(String name, String type);
}
