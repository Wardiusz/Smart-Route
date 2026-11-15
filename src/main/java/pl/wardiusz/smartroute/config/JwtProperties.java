package pl.wardiusz.smartroute.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

@ConfigurationProperties(prefix = "app.jwt")
public record JwtProperties(String accessSecret, String refreshSecret, Duration accessTtl, Duration refreshTtl) {

    private static final int MIN_SECRET_LENGTH = 32;

    public JwtProperties {
        if (accessSecret == null || accessSecret.length() < MIN_SECRET_LENGTH) {
            throw new IllegalStateException("app.jwt.access-secret musi mieć co najmniej "
                    + MIN_SECRET_LENGTH + " znaków (ustaw JWT_ACCESS_SECRET)");
        }
        if (refreshSecret == null || refreshSecret.length() < MIN_SECRET_LENGTH) {
            throw new IllegalStateException("app.jwt.refresh-secret musi mieć co najmniej "
                    + MIN_SECRET_LENGTH + " znaków (ustaw JWT_REFRESH_SECRET)");
        }
        if (accessSecret.equals(refreshSecret)) {
            throw new IllegalStateException("app.jwt.access-secret i refresh-secret muszą się różnić");
        }
        accessTtl = accessTtl == null ? Duration.ofMinutes(15) : accessTtl;
        refreshTtl = refreshTtl == null ? Duration.ofDays(7) : refreshTtl;
    }
}
