package com.spelllab.backend.controller;

import com.spelllab.backend.common.ApiResponse;
import com.spelllab.backend.dto.DailyStatDto;
import com.spelllab.backend.dto.RecordSummaryStatsDto;
import com.spelllab.backend.dto.TrainingRecordDto;
import com.spelllab.backend.dto.UserProfile;
import com.spelllab.backend.service.RecordService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@Tag(name = "训练记录", description = "训练记录与统计")
public class RecordController {
    private final RecordService recordService;

    public RecordController(RecordService recordService) {
        this.recordService = recordService;
    }

    @GetMapping("/records")
    @Operation(summary = "训练记录列表", description = "获取训练记录列表")
    public ApiResponse<List<TrainingRecordDto>> listRecords(@AuthenticationPrincipal UserProfile profile) {
        Long userId = profile == null ? null : profile.getId();
        return ApiResponse.ok(recordService.listRecords(userId));
    }

    @GetMapping("/stats/daily")
    @Operation(summary = "日统计", description = "获取每日学习统计")
    public ApiResponse<List<DailyStatDto>> listDailyStats(
            @AuthenticationPrincipal UserProfile profile,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to
    ) {
        Long userId = profile == null ? null : profile.getId();
        return ApiResponse.ok(recordService.listDailyStats(userId, from, to));
    }

    @GetMapping("/stats/summary")
    @Operation(summary = "统计摘要", description = "获取训练记录统计摘要")
    public ApiResponse<RecordSummaryStatsDto> getSummary(
            @AuthenticationPrincipal UserProfile profile,
            @RequestParam(required = false) String date
    ) {
        Long userId = profile == null ? null : profile.getId();
        return ApiResponse.ok(recordService.getSummary(userId, date));
    }
}
