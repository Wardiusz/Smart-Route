package pl.wardiusz.smartroute.model;

import java.util.List;

public record Recommendation(String title,
                             String rationale,
                             List<ChosenStop> stops,
                             RouteMetrics metrics,
                             String source,
                             String fallbackReason) {

    public Recommendation {
        stops = List.copyOf(stops);
    }

    public boolean hasAlternative() {
        return !stops.isEmpty();
    }
}
