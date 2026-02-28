package com.spelllab.backend.controller;

import com.spelllab.backend.common.ApiResponse;
import com.spelllab.backend.dto.TrainingUnitResponse;
import com.spelllab.backend.dto.WrongWordDto;
import com.spelllab.backend.dto.WrongWordTrainRequest;
import com.spelllab.backend.service.WrongWordService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@Tag(name = "错词本", description = "错词管理与训练")
public class WrongWordController {
    private final WrongWordService wrongWordService;

    public WrongWordController(WrongWordService wrongWordService) {
        this.wrongWordService = wrongWordService;
    }

    @GetMapping("/wrong-words")
    @Operation(summary = "错词列表", description = "获取错词本列表")
    public ApiResponse<List<WrongWordDto>> listWrongWords() {
        return ApiResponse.ok(wrongWordService.listWrongWords());
    }

    @PostMapping("/wrong-words/train")
    @Operation(summary = "错词训练", description = "按选择错词生成训练单元")
    public ApiResponse<TrainingUnitResponse> train(@RequestBody WrongWordTrainRequest request) {
        return ApiResponse.ok(wrongWordService.train(request));
    }

    @PostMapping("/wrong-words/mark-known")
    @Operation(summary = "标熟", description = "将错词从错词本移除")
    public ApiResponse<Void> markKnown(@RequestBody WrongWordTrainRequest request) {
        wrongWordService.markKnown(request == null ? List.of() : request.getWordIds());
        return ApiResponse.ok(null);
    }
}
