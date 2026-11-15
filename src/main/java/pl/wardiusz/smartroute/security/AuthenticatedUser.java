package pl.wardiusz.smartroute.security;

import pl.wardiusz.smartroute.enums.Role;

public record AuthenticatedUser(Long id, String email, Role role) {
}
