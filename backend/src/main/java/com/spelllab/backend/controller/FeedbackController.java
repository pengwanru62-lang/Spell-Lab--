package com.spelllab.backend.controller;

import com.spelllab.backend.common.ApiResponse;
import com.spelllab.backend.dto.FeedbackRequest;
import com.spelllab.backend.dto.UserProfile;
import com.spelllab.backend.service.FeedbackService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@Tag(name = "反馈", description = "用户反馈")
public class FeedbackController {
    private final FeedbackService feedbackService;

    public FeedbackController(FeedbackService feedbackService) {
        this.feedbackService = feedbackService;
    }

    @PostMapping("/feedback")
    @Operation(summary = "提交反馈", description = "提交用户反馈内容")
    public ApiResponse<Boolean> submit(
            @AuthenticationPrincipal UserProfile profile,
            @RequestBody FeedbackRequest request
    ) {
        feedbackService.submit(profile.getId(), request);
        return ApiResponse.ok(true);
    }
}
