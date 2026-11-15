package pl.wardiusz.smartroute.mapper;

import org.springframework.stereotype.Component;
import pl.wardiusz.smartroute.dto.response.AlternativeResponse;
import pl.wardiusz.smartroute.dto.response.PlaceResponse;
import pl.wardiusz.smartroute.dto.response.RouteResponse;
import pl.wardiusz.smartroute.dto.response.StopResponse;
import pl.wardiusz.smartroute.dto.response.TripResponse;
import pl.wardiusz.smartroute.entity.Place;
import pl.wardiusz.smartroute.entity.PlannedStop;
import pl.wardiusz.smartroute.entity.TripPlan;
import pl.wardiusz.smartroute.model.Recommendation;

import java.util.List;

@Component
public class TripMapper {

    public List<PlannedStop> toPlannedStops(Recommendation rec) {
        return rec.stops().stream()
                .map(s -> PlannedStop.of(s.poi(), s.note()))
                .toList();
    }

    public TripResponse toResponse(TripPlan plan) {
        RouteResponse direct = new RouteResponse(plan.getDirectDistanceKm(), plan.getDirectTravelMinutes(), 0,
                plan.getDirectTravelMinutes());

        AlternativeResponse alternative = null;
        String message = null;
        if (plan.hasAlternative()) {
            alternative = toAlternative(plan, direct);
        } else {
            message = plan.getAltRationale();
        }

        return new TripResponse(plan.getId(), toPlace(plan.getOrigin()), toPlace(plan.getDestination()),
                plan.getMode(), direct, alternative, message, plan.getAdvisorSource(),
                plan.getFallbackReason(), plan.getDecision(), plan.getCreatedAt());
    }

    private static PlaceResponse toPlace(Place p) {
        return new PlaceResponse(p.getName(), p.getRegion(), p.getLat(), p.getLon());
    }

    private AlternativeResponse toAlternative(TripPlan plan, RouteResponse direct) {
        int altTotal = plan.getAltTravelMinutes() + plan.getAltVisitMinutes();
        RouteResponse route = new RouteResponse(plan.getAltDistanceKm(), plan.getAltTravelMinutes(),
                plan.getAltVisitMinutes(), altTotal);
        List<StopResponse> stops = plan.getStops().stream().map(this::toStop).toList();
        return new AlternativeResponse(plan.getAltTitle(), plan.getAltRationale(), route,
                altTotal - direct.totalMinutes(),
                Math.round((plan.getAltDistanceKm() - plan.getDirectDistanceKm()) * 10) / 10.0,
                stops);
    }

    private StopResponse toStop(PlannedStop s) {
        return new StopResponse(s.getPoiId(), s.getName(), s.getCategory(), s.getCategory().label(),
                s.getLat(), s.getLon(), s.getVisitMinutes(), s.getNote(), s.getDescription(), s.getImageUrl(),
                s.getWikiUrl());
    }
}
