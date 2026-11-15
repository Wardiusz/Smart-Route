package pl.wardiusz.smartroute.service.auth;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.wardiusz.smartroute.dto.request.LoginRequest;
import pl.wardiusz.smartroute.dto.request.RegisterRequest;
import pl.wardiusz.smartroute.dto.response.AuthResponse;
import pl.wardiusz.smartroute.entity.RefreshToken;
import pl.wardiusz.smartroute.entity.User;
import pl.wardiusz.smartroute.exception.ConflictException;
import pl.wardiusz.smartroute.exception.UnauthorizedException;
import pl.wardiusz.smartroute.mapper.UserMapper;
import pl.wardiusz.smartroute.repository.RefreshTokenRepository;
import pl.wardiusz.smartroute.repository.UserRepository;
import pl.wardiusz.smartroute.service.auth.JwtService.GeneratedRefreshToken;
import pl.wardiusz.smartroute.service.auth.JwtService.RefreshClaims;

import java.time.Instant;

@Service
@Transactional
public class AuthService {

    private final UserRepository users;
    private final RefreshTokenRepository refreshTokens;
    private final JwtService jwtService;
    private final TokenHasher tokenHasher;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;

    public AuthService(UserRepository users, RefreshTokenRepository refreshTokens, JwtService jwtService, TokenHasher tokenHasher, PasswordEncoder passwordEncoder, UserMapper userMapper) {
        this.users = users;
        this.refreshTokens = refreshTokens;
        this.jwtService = jwtService;
        this.tokenHasher = tokenHasher;
        this.passwordEncoder = passwordEncoder;
        this.userMapper = userMapper;
    }

    public AuthResponse register(RegisterRequest request) {
        String email = request.email().strip().toLowerCase();
        if (users.existsByEmailIgnoreCase(email)) {
            throw new ConflictException("Konto z tym adresem e-mail już istnieje");
        }

        User user = users.save(new User(email, passwordEncoder.encode(request.password())));

        return issueTokens(user);
    }

    public AuthResponse login(LoginRequest request) {
        String email = request.email().strip().toLowerCase();
        User user = users.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new UnauthorizedException("Nieprawidłowy e-mail lub hasło"));
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new UnauthorizedException("Nieprawidłowy e-mail lub hasło");
        }
        return issueTokens(user);
    }

    public AuthResponse refresh(String rawRefreshToken) {
        RefreshClaims claims = jwtService.parseRefreshToken(rawRefreshToken);
        RefreshToken stored = refreshTokens.findByTokenId(claims.tokenId())
                .orElseThrow(() -> new UnauthorizedException("Refresh token nieznany lub unieważniony"));

        if (!stored.isActive(Instant.now()) || !tokenHasher.matches(rawRefreshToken, stored.getTokenHash())) {
            refreshTokens.revokeAllForUser(stored.getUser());
            throw new UnauthorizedException("Refresh token nieaktywny");
        }

        stored.revoke();
        return issueTokens(stored.getUser());
    }

    private AuthResponse issueTokens(User user) {
        String accessToken = jwtService.generateAccessToken(user);
        GeneratedRefreshToken refresh = jwtService.generateRefreshToken(user);
        refreshTokens.save(new RefreshToken(
                refresh.tokenId(),
                tokenHasher.hash(refresh.token()),
                user,
                refresh.expiresAt()
        ));

        return AuthResponse.bearer(accessToken, refresh.token(), jwtService.accessTtlSeconds(), userMapper.toResponse(user));
    }
}
