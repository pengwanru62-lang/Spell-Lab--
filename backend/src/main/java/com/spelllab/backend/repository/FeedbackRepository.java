package com.spelllab.backend.repository;

import com.spelllab.backend.entity.FeedbackEntry;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FeedbackRepository extends JpaRepository<FeedbackEntry, Long> {
}
