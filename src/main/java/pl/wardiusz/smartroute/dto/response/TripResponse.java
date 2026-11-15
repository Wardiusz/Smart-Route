package pl.wardiusz.smartroute.dto.response;

import pl.wardiusz.smartroute.enums.Decision;
import pl.wardiusz.smartroute.enums.TransportMode;

import java.time.Instant;

public record TripResponse(Long id,
                           PlaceResponse origin,
                           PlaceResponse destination,
                           TransportMode mode,
                           RouteResponse direct,
                           AlternativeResponse alternative,
                           String message,
                           String advisor,
                           String fallbackReason,
                           Decision decision,
                           Instant createdAt) {
}
