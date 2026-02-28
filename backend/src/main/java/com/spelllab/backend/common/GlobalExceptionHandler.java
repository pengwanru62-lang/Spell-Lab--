package com.spelllab.backend.common;

import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    public ApiResponse<Void> handleIllegalArgumentException(IllegalArgumentException ex) {
        String message = ex.getMessage() == null || ex.getMessage().isBlank() ? "参数错误" : ex.getMessage();
        int code = resolveBusinessCode(message);
        return new ApiResponse<>(code, message, null);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ApiResponse<Void> handleMethodArgumentNotValid(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(this::formatFieldError)
                .distinct()
                .collect(Collectors.joining("; "));
        return new ApiResponse<>(400, message.isBlank() ? "参数校验失败" : message, null);
    }

    @ExceptionHandler(BindException.class)
    public ApiResponse<Void> handleBindException(BindException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(this::formatFieldError)
                .distinct()
                .collect(Collectors.joining("; "));
        return new ApiResponse<>(400, message.isBlank() ? "参数校验失败" : message, null);
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ApiResponse<Void> handleMissingServletRequestParameter(MissingServletRequestParameterException ex) {
        return new ApiResponse<>(400, "缺少参数: " + ex.getParameterName(), null);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ApiResponse<Void> handleMethodArgumentTypeMismatch(MethodArgumentTypeMismatchException ex) {
        return new ApiResponse<>(400, "参数类型错误: " + ex.getName(), null);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ApiResponse<Void> handleHttpMessageNotReadable(HttpMessageNotReadableException ex) {
        return new ApiResponse<>(400, "请求体解析失败", null);
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ApiResponse<Void> handleHttpRequestMethodNotSupported(HttpRequestMethodNotSupportedException ex) {
        return new ApiResponse<>(405, "不支持的请求方法: " + ex.getMethod(), null);
    }

    @ExceptionHandler(Exception.class)
    public ApiResponse<Void> handleException(Exception ex) {
        String message = ex.getMessage() == null || ex.getMessage().isBlank()
                ? "服务器内部错误"
                : "服务器内部错误: " + ex.getMessage();
        return new ApiResponse<>(500, message, null);
    }

    private String formatFieldError(FieldError error) {
        String field = error.getField();
        String message = error.getDefaultMessage();
        if (message == null || message.isBlank()) {
            return field + " 不合法";
        }
        return field + " " + message;
    }
    private int resolveBusinessCode(String message) {
        return switch (message) {
            case "账号已存在" -> 2002;
            case "验证码错误" -> 2004;
            case "验证码已过期" -> 2005;
            case "账号不存在" -> 2001;
            default -> 2003;
        };
    }
}
