package pl.wardiusz.smartroute.service;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.wardiusz.smartroute.dto.response.UserResponse;
import pl.wardiusz.smartroute.mapper.UserMapper;
import pl.wardiusz.smartroute.repository.UserRepository;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository users;
    private final UserMapper mapper;

    public UserService(UserRepository users, UserMapper mapper) {
        this.users = users;
        this.mapper = mapper;
    }

    public List<UserResponse> findAll() {
        return users.findAll(Sort.by("id")).stream().map(mapper::toResponse).toList();
    }
}
