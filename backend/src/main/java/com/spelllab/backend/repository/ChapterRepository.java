package com.spelllab.backend.repository;

import com.spelllab.backend.entity.Chapter;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ChapterRepository extends JpaRepository<Chapter, Long> {
    List<Chapter> findByWordbookIdOrderByOrderNo(Long wordbookId);
}
