package com.spelllab.backend.repository;

import com.spelllab.backend.entity.ChapterProgressEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ChapterProgressRepository extends JpaRepository<ChapterProgressEntity, Long> {
    Optional<ChapterProgressEntity> findByUserIdAndChapterId(Long userId, Long chapterId);

    List<ChapterProgressEntity> findAllByUserIdAndChapterIdIn(Long userId, List<Long> chapterIds);
}
