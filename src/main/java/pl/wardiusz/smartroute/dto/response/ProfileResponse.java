package pl.wardiusz.smartroute.dto.response;

import pl.wardiusz.smartroute.enums.Interest;
import pl.wardiusz.smartroute.enums.TransportMode;

import java.util.Set;

public record ProfileResponse(Long id,
                              String name,
                              Set<Interest> interests,
                              TransportMode mode,
                              int maxExtraMinutes,
                              int maxStops,
                              String notes) {
}
