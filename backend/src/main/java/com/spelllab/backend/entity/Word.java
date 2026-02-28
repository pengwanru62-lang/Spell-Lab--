package com.spelllab.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "word")
@Data
@NoArgsConstructor
public class Word {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "chapter_id", nullable = false)
    private Long chapterId;

    @Column(nullable = false)
    private String text;

    private String pronunciation;

    private String audioUrl;

    @Column(columnDefinition = "TEXT")
    private String meaning; // JSON string or simple text

    // Not persisted, but useful for DTO conversion if needed, or keep simple
    // private boolean familiar; // This should be in a separate user-specific table "UserWordStatus" or similar.
    // The previous implementation had `updateFamiliar` but it was in-memory.
    // For now, I'll ignore user-specific familiarity in the Word entity itself as it's a shared resource for system books,
    // but for custom books it's owned by user.
    // Wait, familiarity is user-specific. The previous Mock repo handled it in-memory.
    // I should create a UserWord entity or just ignore it for this specific task (Wordbook management).
    // The task is "create wordbook, edit words". Familiarity is for "Dictation". I'll skip familiarity persistence for now to keep scope manageable, or use a separate table if I have time.

    public Word(Long chapterId, String text, String pronunciation, String meaning) {
        this.chapterId = chapterId;
        this.text = text;
        this.pronunciation = pronunciation;
        this.meaning = meaning;
    }
}
