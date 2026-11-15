package pl.wardiusz.smartroute.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.geocoding")
public record GeocodingProperties(String baseUrl, int timeoutSeconds) {

    public GeocodingProperties {
        timeoutSeconds = timeoutSeconds <= 0 ? 5 : timeoutSeconds;
    }

    public boolean enabled() {
        return baseUrl != null && !baseUrl.isBlank();
    }
}
