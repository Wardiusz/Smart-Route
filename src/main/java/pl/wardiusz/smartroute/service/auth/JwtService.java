package pl.wardiusz.smartroute.service.auth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;
import pl.wardiusz.smartroute.config.JwtProperties;
import pl.wardiusz.smartroute.entity.User;
import pl.wardiusz.smartroute.enums.Role;
import pl.wardiusz.smartroute.exception.UnauthorizedException;
import pl.wardiusz.smartroute.security.AuthenticatedUser;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

@Service
public class JwtService {

    private static final String CLAIM_EMAIL = "email";
    private static final String CLAIM_ROLE = "role";
    private static final String TYPE_REFRESH = "refresh";

    private final JwtProperties props;
    private final SecretKey accessKey;
    private final SecretKey refreshKey;

    public JwtService(JwtProperties props) {
        this.props = props;
        this.accessKey = Keys.hmacShaKeyFor(props.accessSecret().getBytes(StandardCharsets.UTF_8));
        this.refreshKey = Keys.hmacShaKeyFor(props.refreshSecret().getBytes(StandardCharsets.UTF_8));
    }

    public String generateAccessToken(User user) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(String.valueOf(user.getId()))
                .claim(CLAIM_EMAIL, user.getEmail())
                .claim(CLAIM_ROLE, user.getRole().name())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(props.accessTtl())))
                .signWith(accessKey)
                .compact();
    }

    public GeneratedRefreshToken generateRefreshToken(User user) {
        Instant now = Instant.now();
        Instant expiresAt = now.plus(props.refreshTtl());
        String tokenId = UUID.randomUUID().toString();
        String token = Jwts.builder()
                .id(tokenId)
                .subject(String.valueOf(user.getId()))
                .claim("typ", TYPE_REFRESH)
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiresAt))
                .signWith(refreshKey)
                .compact();
        return new GeneratedRefreshToken(token, tokenId, expiresAt);
    }

    public AuthenticatedUser parseAccessToken(String token) {
        Claims claims = parse(token, accessKey);
        try {
            return new AuthenticatedUser(
                    Long.valueOf(claims.getSubject()),
                    claims.get(CLAIM_EMAIL, String.class),
                    Role.valueOf(claims.get(CLAIM_ROLE, String.class)));
        } catch (IllegalArgumentException e) {
            throw new UnauthorizedException("Nieprawidłowy token dostępu");
        }
    }

    public RefreshClaims parseRefreshToken(String token) {
        Claims claims = parse(token, refreshKey);
        if (!TYPE_REFRESH.equals(claims.get("typ", String.class))) {
            throw new UnauthorizedException("To nie jest refresh token");
        }
        try {
            return new RefreshClaims(Long.valueOf(claims.getSubject()), claims.getId());
        } catch (IllegalArgumentException e) {
            throw new UnauthorizedException("Nieprawidłowy refresh token");
        }
    }

    public long accessTtlSeconds() {
        return props.accessTtl().toSeconds();
    }

    private Claims parse(String token, SecretKey key) {
        try {
            return Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (JwtException | IllegalArgumentException e) {
            throw new UnauthorizedException("Token nieprawidłowy lub wygasł");
        }
    }

    public record GeneratedRefreshToken(String token, String tokenId, Instant expiresAt) {
    }

    public record RefreshClaims(Long userId, String tokenId) {
    }
}
