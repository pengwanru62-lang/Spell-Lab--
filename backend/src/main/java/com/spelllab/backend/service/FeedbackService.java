package com.spelllab.backend.service;

import com.spelllab.backend.entity.FeedbackEntry;
import com.spelllab.backend.dto.FeedbackRequest;
import com.spelllab.backend.repository.FeedbackRepository;
import java.time.Instant;
import java.util.Date;

import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class FeedbackService {
    private final FeedbackRepository feedbackRepository;

    /**
     * 提交用户反馈内容。
     */
    public void submit(Long userId, FeedbackRequest request) {
        if (request.getContent() == null || request.getContent().isBlank()) {
            throw new IllegalArgumentException("反馈内容不能为空");
        }
        FeedbackEntry entry = FeedbackEntry.builder()
                .content(request.getContent())
                .userId(userId)
                .createdAt(new Date())
                .build();
        feedbackRepository.save(entry);
    }
}
