package com.spelllab.backend.controller;

import com.spelllab.backend.common.ApiResponse;
import com.spelllab.backend.dto.TrainingResultResponse;
import com.spelllab.backend.dto.TrainingSubmitRequest;
import com.spelllab.backend.dto.TrainingSubmitResponse;
import com.spelllab.backend.dto.TrainingUnitRequest;
import com.spelllab.backend.dto.TrainingUnitResponse;
import com.spelllab.backend.dto.UserProfile;
import com.spelllab.backend.service.TrainingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/training")
@Tag(name = "听写训练", description = "听写训练流程")
public class TrainingController {
    private final TrainingService trainingService;

    public TrainingController(TrainingService trainingService) {
        this.trainingService = trainingService;
    }

    @PostMapping("/units")
    @Operation(summary = "创建训练单元", description = "按词书与章节生成训练单元")
    public ApiResponse<TrainingUnitResponse> createUnit(
            @AuthenticationPrincipal UserProfile profile,
            @RequestBody TrainingUnitRequest request
    ) {
        Long userId = profile == null ? null : profile.getId();
        return ApiResponse.ok(trainingService.createUnit(userId, request));
    }

    @PostMapping("/submit")
    @Operation(summary = "提交听写答案", description = "提交单词听写结果并返回判定")
    public ApiResponse<TrainingSubmitResponse> submit(
            @AuthenticationPrincipal UserProfile profile,
            @RequestBody TrainingSubmitRequest request
    ) {
        Long userId = profile == null ? null : profile.getId();
        return ApiResponse.ok(trainingService.submit(userId, request));
    }

    @GetMapping("/units/{unitId}")
    @Operation(summary = "获取训练单元", description = "按 unitId 获取训练单元的单词序列")
    public ApiResponse<TrainingUnitResponse> getUnit(@PathVariable("unitId") Long unitId) {
        return ApiResponse.ok(trainingService.getUnit(unitId));
    }

    @GetMapping("/result/{unitId}")
    @Operation(summary = "训练结算", description = "获取训练单元的结算结果")
    public ApiResponse<TrainingResultResponse> result(@PathVariable("unitId") Long unitId) {
        return ApiResponse.ok(trainingService.getResult(unitId));
    }
}
