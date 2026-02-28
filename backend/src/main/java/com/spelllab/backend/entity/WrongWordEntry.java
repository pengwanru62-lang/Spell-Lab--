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
@Table(name = "wrong_word", uniqueConstraints = @UniqueConstraint(columnNames = "word_id"))
@Data
@NoArgsConstructor
public class WrongWordEntry {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "word_id")
    private Long wordId;

    @Column(columnDefinition = "TEXT")
    private String text;

    @Column(name = "wrong_count", nullable = false)
    private int wrongCount;

    @Column(name = "last_wrong_at")
    private LocalDateTime lastWrongAt;

    public WrongWordEntry(Long wordId, String text, int wrongCount, LocalDateTime lastWrongAt) {
        this.wordId = wordId;
        this.text = text;
        this.wrongCount = wrongCount;
        this.lastWrongAt = lastWrongAt;
    }
}
