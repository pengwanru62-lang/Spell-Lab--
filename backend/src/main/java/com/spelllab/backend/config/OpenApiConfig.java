package com.spelllab.backend.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "SpellLab API",
                version = "v1",
                description = "SpellLab 拼写实验室后端接口文档"
        )
)
public class OpenApiConfig {
}
