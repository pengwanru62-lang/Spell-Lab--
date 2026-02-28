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
@Table(name = "chapter")
@Data
@NoArgsConstructor
public class Chapter {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "wordbook_id", nullable = false)
    private Long wordbookId;

    @Column(nullable = false)
    private String name;

    @Column(name = "order_no", nullable = false)
    private int orderNo;

    @Column(name = "total_words", nullable = false)
    private int totalWords = 0;

    public Chapter(Long wordbookId, String name, int orderNo) {
        this.wordbookId = wordbookId;
        this.name = name;
        this.orderNo = orderNo;
    }
}
