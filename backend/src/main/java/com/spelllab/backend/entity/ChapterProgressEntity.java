package com.spelllab.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDateTime;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(
        name = "chapter_progress",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "chapter_id"})
)
@Data
@NoArgsConstructor
public class ChapterProgressEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "chapter_id", nullable = false)
    private Long chapterId;

    @Column(name = "answered_count", nullable = false)
    private int answeredCount;

    @Column(name = "correct_count", nullable = false)
    private int correctCount;

    @Column(name = "progress_index", nullable = false)
    private int progressIndex;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
