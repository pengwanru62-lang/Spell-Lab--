package com.spelllab.backend.controller;

import com.spelllab.backend.common.ApiResponse;
import com.spelllab.backend.dto.ChapterDto;
import com.spelllab.backend.dto.UserProfile;
import com.spelllab.backend.dto.WordDto;
import com.spelllab.backend.dto.WordbookCreateRequest;
import com.spelllab.backend.dto.WordbookDto;
import com.spelllab.backend.service.WordbookService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import java.util.Map;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api")
@Tag(name = "词书", description = "词书与章节查询")
public class WordbookController {
    private final WordbookService wordbookService;

    public WordbookController(WordbookService wordbookService) {
        this.wordbookService = wordbookService;
    }

    @GetMapping("/wordbooks")
    @Operation(summary = "词书列表", description = "获取系统词书列表及用户自定义词书")
    public ApiResponse<List<WordbookDto>> listWordbooks(@AuthenticationPrincipal UserProfile profile) {
        // If profile is null (unlikely with @Authenticated), pass null to service to get system books only
        Long userId = profile != null ? profile.getId() : null;
        return ApiResponse.ok(wordbookService.listWordbooks(userId));
    }

    @GetMapping("/wordbooks/{id}/chapters")
    @Operation(summary = "章节列表", description = "根据词书获取章节与进度")
    public ApiResponse<List<ChapterDto>> listChapters(
            @AuthenticationPrincipal UserProfile profile,
            @PathVariable("id") Long wordbookId
    ) {
        Long userId = profile == null ? null : profile.getId();
        return ApiResponse.ok(wordbookService.listChapters(wordbookId, userId));
    }

    @GetMapping("/chapters/{id}/words")
    @Operation(summary = "单词列表", description = "根据章节获取单词列表")
    public ApiResponse<Map<String, Object>> listWords(
            @PathVariable("id") Long chapterId,
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "size", defaultValue = "50") int size
    ) {
        return ApiResponse.ok(wordbookService.listWords(chapterId, page, size));
    }

    @GetMapping("/wordbooks/{id}/search")
    @Operation(summary = "搜索单词", description = "在词书内按单词文本搜索")
    public ApiResponse<WordDto> searchWord(
            @PathVariable("id") Long wordbookId,
            @RequestParam("keyword") String keyword
    ) {
        return ApiResponse.ok(wordbookService.searchWord(wordbookId, keyword));
    }

    @PostMapping("/words/{id}/familiar")
    @Operation(summary = "标熟单词", description = "更新单词标熟状态")
    public ApiResponse<Boolean> updateFamiliar(@PathVariable("id") Long wordId, @RequestParam("value") boolean familiar) {
        wordbookService.updateFamiliar(wordId, familiar);
        return ApiResponse.ok(true);
    }

    @PostMapping("/wordbooks")
    @Operation(summary = "创建自定义词书", description = "创建新的自定义词书")
    public ApiResponse<WordbookDto> create(
            @AuthenticationPrincipal UserProfile profile,
            @RequestBody WordbookCreateRequest request
    ) {
        return ApiResponse.ok(wordbookService.createCustomWordbook(profile.getId(), request.getName()));
    }

    @PostMapping("/wordbooks/{id}/import")
    @Operation(summary = "导入单词", description = "导入 CSV 或 Excel 文件到词书")
    public ApiResponse<Boolean> importWords(
            @PathVariable("id") Long id,
            @RequestParam("file") MultipartFile file
    ) {
        wordbookService.importWords(id, file);
        return ApiResponse.ok(true);
    }
}
