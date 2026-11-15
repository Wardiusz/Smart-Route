package pl.wardiusz.smartroute.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.road-routing")
public record RoadRoutingProperties(String baseUrl, int timeoutSeconds) {

    public RoadRoutingProperties {
        timeoutSeconds = timeoutSeconds <= 0 ? 10 : timeoutSeconds;
    }

    public boolean enabled() {
        return baseUrl != null && !baseUrl.isBlank();
    }
}
