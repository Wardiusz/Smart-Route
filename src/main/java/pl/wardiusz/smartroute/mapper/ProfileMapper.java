package pl.wardiusz.smartroute.mapper;

import org.springframework.stereotype.Component;
import pl.wardiusz.smartroute.dto.request.ProfileRequest;
import pl.wardiusz.smartroute.dto.response.ProfileResponse;
import pl.wardiusz.smartroute.entity.UserProfile;
import pl.wardiusz.smartroute.enums.Interest;

import java.util.EnumSet;

@Component
public class ProfileMapper {

    public UserProfile toEntity(ProfileRequest request) {
        UserProfile profile = new UserProfile(request.name().strip());
        updateEntity(profile, request);
        return profile;
    }

    public void updateEntity(UserProfile profile, ProfileRequest request) {
        profile.update(request.name().strip(), request.interests(), request.mode(),
                request.maxExtraMinutes(), request.maxStops(),
                request.notes() == null ? "" : request.notes().strip());
    }

    public ProfileResponse toResponse(UserProfile profile) {
        return new ProfileResponse(profile.getId(), profile.getName(),
                profile.getInterests().isEmpty() ? EnumSet.noneOf(Interest.class)
                        : EnumSet.copyOf(profile.getInterests()),
                profile.getMode(), profile.getMaxExtraMinutes(), profile.getMaxStops(), profile.getNotes());
    }
}
