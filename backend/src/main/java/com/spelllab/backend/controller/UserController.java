package com.spelllab.backend.controller;

import com.spelllab.backend.common.ApiResponse;
import com.spelllab.backend.dto.ImageUploadRequest;
import com.spelllab.backend.dto.NicknameUpdateRequest;
import com.spelllab.backend.dto.UserProfile;
import com.spelllab.backend.dto.UserSettingsDto;
import com.spelllab.backend.dto.UserSettingsRequest;
import com.spelllab.backend.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@Tag(name = "用户", description = "设置与账号操作")
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/user/settings")
    @Operation(summary = "获取听写设置", description = "获取用户默认倍速与遍数")
    public ApiResponse<UserSettingsDto> getSettings(@AuthenticationPrincipal UserProfile profile) {
        return ApiResponse.ok(userService.getSettings(profile.getId()));
    }

    @PostMapping("/user/settings")
    @Operation(summary = "更新听写设置", description = "更新默认倍速与遍数")
    public ApiResponse<UserSettingsDto> updateSettings(
            @AuthenticationPrincipal UserProfile profile,
            @RequestBody UserSettingsRequest request
    ) {
        return ApiResponse.ok(userService.updateSettings(profile.getId(), request));
    }

    @PostMapping("/user/deactivate")
    @Operation(summary = "注销账号", description = "注销当前账号")
    public ApiResponse<Boolean> deactivate(@AuthenticationPrincipal UserProfile profile) {
        userService.deactivate(profile.getId());
        return ApiResponse.ok(true);
    }

    @PostMapping("/user/avatar")
    @Operation(summary = "更新头像", description = "上传用户头像")
    public ApiResponse<UserProfile> updateAvatar(
            @AuthenticationPrincipal UserProfile profile,
            @RequestBody ImageUploadRequest request
    ) {
        return ApiResponse.ok(userService.updateAvatar(profile.getId(), request.getDataUrl()));
    }

    @PostMapping("/user/banner")
    @Operation(summary = "更新背景", description = "上传用户背景图")
    public ApiResponse<UserProfile> updateBanner(
            @AuthenticationPrincipal UserProfile profile,
            @RequestBody ImageUploadRequest request
    ) {
        return ApiResponse.ok(userService.updateBanner(profile.getId(), request.getDataUrl()));
    }

    @PostMapping("/user/nickname")
    @Operation(summary = "更新昵称", description = "更新用户昵称")
    public ApiResponse<UserProfile> updateNickname(
            @AuthenticationPrincipal UserProfile profile,
            @RequestBody NicknameUpdateRequest request
    ) {
        return ApiResponse.ok(userService.updateNickname(profile.getId(), request.getNickname()));
    }
}
