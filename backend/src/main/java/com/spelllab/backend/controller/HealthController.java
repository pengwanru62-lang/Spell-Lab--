package com.spelllab.backend.controller;

import java.util.Map;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Tag(name = "系统", description = "健康检查")
public class HealthController {
    @GetMapping("/api/health")
    @Operation(summary = "健康检查", description = "用于检测服务是否正常")
    public Map<String, String> health() {
        return Map.of("status", "ok");
    }
}
