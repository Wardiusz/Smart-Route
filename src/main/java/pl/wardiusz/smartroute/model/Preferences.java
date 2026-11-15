package pl.wardiusz.smartroute.model;

import pl.wardiusz.smartroute.enums.Interest;
import pl.wardiusz.smartroute.enums.TransportMode;

import java.util.Set;

public record Preferences(Set<Interest> interests,
                          TransportMode mode,
                          int maxExtraMinutes,
                          int maxStops,
                          String notes) {

    public Preferences {
        interests = interests == null ? Set.of() : Set.copyOf(interests);
        mode = mode == null ? TransportMode.CAR : mode;
        if (maxExtraMinutes < 0) {
            throw new IllegalArgumentException("maxExtraMinutes nie może być ujemne");
        }
        if (maxStops < 0) {
            throw new IllegalArgumentException("maxStops nie może być ujemne");
        }
        notes = notes == null ? "" : notes.strip();
    }
}
