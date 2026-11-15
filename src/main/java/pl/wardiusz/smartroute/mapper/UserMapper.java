package pl.wardiusz.smartroute.mapper;

import org.springframework.stereotype.Component;
import pl.wardiusz.smartroute.dto.response.UserResponse;
import pl.wardiusz.smartroute.entity.User;

@Component
public class UserMapper {

    public UserResponse toResponse(User user) {
        return new UserResponse(user.getId(), user.getEmail(), user.getRole());
    }
}
