package pl.wardiusz.smartroute.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.wardiusz.smartroute.dto.request.ProfileRequest;
import pl.wardiusz.smartroute.dto.response.ProfileResponse;
import pl.wardiusz.smartroute.entity.UserProfile;
import pl.wardiusz.smartroute.exception.NotFoundException;
import pl.wardiusz.smartroute.mapper.ProfileMapper;
import pl.wardiusz.smartroute.repository.UserProfileRepository;

@Service
@Transactional
public class ProfileService {

    private final UserProfileRepository profiles;
    private final ProfileMapper mapper;

    public ProfileService(UserProfileRepository profiles, ProfileMapper mapper) {
        this.profiles = profiles;
        this.mapper = mapper;
    }

    public ProfileResponse create(ProfileRequest request) {
        return mapper.toResponse(profiles.save(mapper.toEntity(request)));
    }

    public ProfileResponse update(Long id, ProfileRequest request) {
        UserProfile profile = findEntity(id);
        mapper.updateEntity(profile, request);
        return mapper.toResponse(profile);
    }

    @Transactional(readOnly = true)
    public ProfileResponse get(Long id) {
        return mapper.toResponse(findEntity(id));
    }

    @Transactional(readOnly = true)
    public UserProfile findEntity(Long id) {
        return profiles.findById(id).orElseThrow(() -> new NotFoundException("Nie znaleziono profilu " + id));
    }
}
