package com.spelllab.backend.controller;

import com.spelllab.backend.common.ApiResponse;
import com.spelllab.backend.dto.AiTrainingHistoryItemDto;
import com.spelllab.backend.dto.AiTrainingRecordSummaryDto;
import com.spelllab.backend.dto.AiTrainingResultResponse;
import com.spelllab.backend.dto.AiTrainingSessionResponse;
import com.spelllab.backend.dto.AiTrainingStartRequest;
import com.spelllab.backend.dto.AiTrainingSubmitRequest;
import com.spelllab.backend.dto.UserProfile;
import com.spelllab.backend.service.AiTrainingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai-trainings")
@Tag(name = "AI 快问快答", description = "错词 AI 快问快答训练")
public class AiTrainingController {
    private final AiTrainingService aiTrainingService;

    public AiTrainingController(AiTrainingService aiTrainingService) {
        this.aiTrainingService = aiTrainingService;
    }

    @PostMapping("/start")
    @Operation(summary = "开始训练", description = "基于错词生成 AI 快问快答训练")
    public ApiResponse<AiTrainingSessionResponse> start(@RequestBody AiTrainingStartRequest request) {
        return ApiResponse.ok(aiTrainingService.start(request));
    }

    @GetMapping("/{sessionId}")
    @Operation(summary = "获取训练状态", description = "获取训练进度与当前题目")
    public ApiResponse<AiTrainingSessionResponse> getSession(@PathVariable("sessionId") Long sessionId) {
        return ApiResponse.ok(aiTrainingService.getSession(sessionId));
    }

    @PostMapping("/submit")
    @Operation(summary = "提交答案", description = "提交当前题作答并进入下一题")
    public ApiResponse<AiTrainingSessionResponse> submit(
            @AuthenticationPrincipal UserProfile profile,
            @RequestBody AiTrainingSubmitRequest request
    ) {
        Long userId = profile == null ? null : profile.getId();
        return ApiResponse.ok(aiTrainingService.submit(userId, request));
    }

    @PostMapping("/{sessionId}/abandon")
    @Operation(summary = "放弃训练", description = "放弃本次训练，不保存记录")
    public ApiResponse<Void> abandon(@PathVariable("sessionId") Long sessionId) {
        aiTrainingService.abandon(sessionId);
        return ApiResponse.ok(null);
    }

    @GetMapping("/history")
    @Operation(summary = "训练记录", description = "获取 AI 训练记录列表")
    public ApiResponse<List<AiTrainingRecordSummaryDto>> history(@AuthenticationPrincipal UserProfile profile) {
        Long userId = profile == null ? null : profile.getId();
        return ApiResponse.ok(aiTrainingService.history(userId));
    }

    @GetMapping("/history/items")
    @Operation(summary = "训练记录明细", description = "获取 AI 训练记录题目明细列表")
    public ApiResponse<List<AiTrainingHistoryItemDto>> historyItems(@AuthenticationPrincipal UserProfile profile) {
        Long userId = profile == null ? null : profile.getId();
        return ApiResponse.ok(aiTrainingService.historyItems(userId));
    }

    @GetMapping("/history/{sessionId}")
    @Operation(summary = "训练结果", description = "获取指定训练记录的结果详情")
    public ApiResponse<AiTrainingResultResponse> result(
            @AuthenticationPrincipal UserProfile profile,
            @PathVariable("sessionId") Long sessionId
    ) {
        Long userId = profile == null ? null : profile.getId();
        return ApiResponse.ok(aiTrainingService.result(userId, sessionId));
    }
}
