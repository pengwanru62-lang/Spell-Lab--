package com.spelllab.backend.repository;

import com.spelllab.backend.entity.Word;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface WordRepository extends JpaRepository<Word, Long> {
    List<Word> findByChapterId(Long chapterId);
    List<Word> findByChapterIdOrderByIdAsc(Long chapterId);
    Page<Word> findByChapterId(Long chapterId, Pageable pageable);
    Optional<Word> findFirstByChapterIdInAndTextIgnoreCaseOrderByIdAsc(List<Long> chapterIds, String text);
}
