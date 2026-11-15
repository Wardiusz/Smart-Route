package pl.wardiusz.smartroute.dto.response;

import pl.wardiusz.smartroute.enums.Role;

public record UserResponse(Long id, String email, Role role) {
}
