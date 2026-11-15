package pl.wardiusz.smartroute.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

@ConfigurationProperties(prefix = "app.poi-catalog")
public record PoiCatalogProperties(String sparqlUrl, String file, Duration maxAge, int timeoutSeconds) {

    public PoiCatalogProperties {
        file = file == null || file.isBlank() ? "data/poi-catalog.json" : file;
        maxAge = maxAge == null ? Duration.ofDays(30) : maxAge;
        timeoutSeconds = timeoutSeconds <= 0 ? 90 : timeoutSeconds;
    }

    public boolean remoteEnabled() {
        return sparqlUrl != null && !sparqlUrl.isBlank();
    }
}
