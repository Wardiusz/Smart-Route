package pl.wardiusz.smartroute.service;

import org.springframework.stereotype.Service;
import pl.wardiusz.smartroute.dto.response.TripGeometryResponse;
import pl.wardiusz.smartroute.entity.TripPlan;
import pl.wardiusz.smartroute.exception.NotFoundException;
import pl.wardiusz.smartroute.model.GeoPoint;
import pl.wardiusz.smartroute.repository.TripPlanRepository;
import pl.wardiusz.smartroute.service.routing.RoadRouter;

import java.util.ArrayList;
import java.util.List;

@Service
public class RouteGeometryService {

    private final TripPlanRepository trips;
    private final RoadRouter roadRouter;

    public RouteGeometryService(TripPlanRepository trips, RoadRouter roadRouter) {
        this.trips = trips;
        this.roadRouter = roadRouter;
    }

    public TripGeometryResponse forTrip(Long tripId) {
        TripPlan plan = trips.findWithStopsById(tripId)
                .orElseThrow(() -> new NotFoundException("Nie znaleziono planu " + tripId));
        GeoPoint origin = plan.getOrigin().location();
        GeoPoint destination = plan.getDestination().location();

        List<double[]> direct = roadRouter.geometry(plan.getMode(), List.of(origin, destination)).orElse(null);
        List<double[]> alternative = null;
        if (plan.hasAlternative()) {
            List<GeoPoint> points = new ArrayList<>();
            points.add(origin);
            plan.getStops().forEach(s -> points.add(new GeoPoint(s.getLat(), s.getLon())));
            points.add(destination);
            alternative = roadRouter.geometry(plan.getMode(), points).orElse(null);
        }
        return new TripGeometryResponse(direct, alternative);
    }
}
