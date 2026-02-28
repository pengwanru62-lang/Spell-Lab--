package com.spelllab.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "wordbook")
@Data
@NoArgsConstructor
public class Wordbook {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String type; // "system" or "custom"

    @Column(name = "total_words", nullable = false)
    private int totalWords = 0;

    @Column(name = "user_id")
    private Long userId; // Only for custom wordbooks

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    public Wordbook(String name, String type, Long userId) {
        this.name = name;
        this.type = type;
        this.userId = userId;
    }
}
