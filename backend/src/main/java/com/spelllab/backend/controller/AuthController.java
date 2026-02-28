package com.spelllab.backend.controller;

import com.spelllab.backend.common.ApiResponse;
import com.spelllab.backend.dto.AuthLoginRequest;
import com.spelllab.backend.dto.AuthLoginResponse;
import com.spelllab.backend.dto.AuthRegisterCodeRequest;
import com.spelllab.backend.dto.AuthRegisterRequest;
import com.spelllab.backend.dto.UserProfile;
import com.spelllab.backend.service.AuthService;
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
@Tag(name = "认证", description = "登录与用户信息")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/auth/login")
    @Operation(summary = "用户登录", description = "支持邮箱登录，返回登录 token 与用户信息")
    public ApiResponse<AuthLoginResponse> login(@RequestBody AuthLoginRequest request) {
        return ApiResponse.ok(authService.login(request));
    }

    @PostMapping("/auth/register/code")
    @Operation(summary = "发送注册验证码", description = "向邮箱发送6位验证码")
    public ApiResponse<String> sendRegisterCode(@RequestBody AuthRegisterCodeRequest request) {
        authService.sendRegisterCode(request.getEmail());
        return ApiResponse.ok("ok");
    }

    @PostMapping("/auth/register")
    @Operation(summary = "用户注册", description = "注册账号并返回登录 token 与用户信息")
    public ApiResponse<AuthLoginResponse> register(@RequestBody AuthRegisterRequest request) {
        return ApiResponse.ok(authService.register(request));
    }

    @GetMapping("/user/profile")
    @Operation(summary = "获取用户信息", description = "获取当前登录用户资料")
    public ApiResponse<UserProfile> profile(@AuthenticationPrincipal UserProfile profile) {
        return ApiResponse.ok(authService.profile(profile));
    }

    @PostMapping("/auth/logout")
    @Operation(summary = "退出登录", description = "服务端无状态注销")
    public ApiResponse<Boolean> logout() {
        return ApiResponse.ok(true);
    }
}
