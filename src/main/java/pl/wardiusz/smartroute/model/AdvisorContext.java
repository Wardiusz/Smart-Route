package pl.wardiusz.smartroute.model;

import pl.wardiusz.smartroute.enums.Interest;

import java.util.List;
import java.util.Map;

public record AdvisorContext(String originName, GeoPoint origin, String destinationName, GeoPoint destination, Preferences preferences, RouteMetrics direct, List<Candidate> candidates, Map<Interest, Long> likedCategories) {

    public AdvisorContext {
        candidates = List.copyOf(candidates);
        likedCategories = likedCategories == null ? Map.of() : Map.copyOf(likedCategories);
    }
}
