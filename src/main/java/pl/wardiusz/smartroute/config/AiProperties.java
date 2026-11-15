package pl.wardiusz.smartroute.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.ai")
public record AiProperties(String apiKey, String model, String baseUrl, int timeoutSeconds) {

    public AiProperties {
        model = model == null || model.isBlank() ? "claude-haiku-5-5" : model;
        baseUrl = baseUrl == null || baseUrl.isBlank() ? "https://api.anthropic.com" : baseUrl;
        timeoutSeconds = timeoutSeconds <= 0 ? 30 : timeoutSeconds;
    }

    public boolean enabled() {
        return apiKey != null && !apiKey.isBlank();
    }
}
