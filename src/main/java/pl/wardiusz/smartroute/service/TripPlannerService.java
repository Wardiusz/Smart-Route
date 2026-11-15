package pl.wardiusz.smartroute.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.wardiusz.smartroute.ai.RecommendationEngine;
import pl.wardiusz.smartroute.dto.request.PlaceRequest;
import pl.wardiusz.smartroute.dto.response.TripResponse;
import pl.wardiusz.smartroute.entity.Place;
import pl.wardiusz.smartroute.entity.PlannedStop;
import pl.wardiusz.smartroute.entity.TripPlan;
import pl.wardiusz.smartroute.entity.UserProfile;
import pl.wardiusz.smartroute.enums.Decision;
import pl.wardiusz.smartroute.enums.Interest;
import pl.wardiusz.smartroute.exception.NotFoundException;
import pl.wardiusz.smartroute.mapper.TripMapper;
import pl.wardiusz.smartroute.model.AdvisorContext;
import pl.wardiusz.smartroute.model.Candidate;
import pl.wardiusz.smartroute.model.GeoPoint;
import pl.wardiusz.smartroute.model.Preferences;
import pl.wardiusz.smartroute.model.Recommendation;
import pl.wardiusz.smartroute.model.RouteMetrics;
import pl.wardiusz.smartroute.repository.TripPlanRepository;
import pl.wardiusz.smartroute.service.poi.PoiCatalog;
import pl.wardiusz.smartroute.service.routing.CandidateFinder;
import pl.wardiusz.smartroute.service.routing.Geo;
import pl.wardiusz.smartroute.service.routing.RoadRouter;
import pl.wardiusz.smartroute.service.routing.RoutePlanner;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class TripPlannerService {

    private static final double MIN_TRIP_KM = 2.0;

    private final PoiCatalog catalog;
    private final RoadRouter roadRouter;
    private final TripPlanRepository trips;
    private final ProfileService profileService;
    private final TripMapper mapper;
    private final RecommendationEngine engine;
    private final int maxCandidates;

    public TripPlannerService(PoiCatalog catalog,
                              RoadRouter roadRouter,
                              TripPlanRepository trips,
                              ProfileService profileService,
                              TripMapper mapper,
                              RecommendationEngine engine,
                              @Value("${app.routing.max-candidates:12}") int maxCandidates) {
        this.catalog = catalog;
        this.roadRouter = roadRouter;
        this.trips = trips;
        this.profileService = profileService;
        this.mapper = mapper;
        this.engine = engine;
        this.maxCandidates = maxCandidates;
    }

    @Transactional
    public TripResponse plan(Long profileId, PlaceRequest originReq, PlaceRequest destinationReq) {
        Place origin = toPlace(originReq);
        Place destination = toPlace(destinationReq);
        if (Geo.haversineKm(origin.location(), destination.location()) < MIN_TRIP_KM) {
            throw new IllegalArgumentException("Punkt startowy i docelowy muszą być różne");
        }
        UserProfile profile = profileService.findEntity(profileId);
        Preferences prefs = profile.toPreferences();

        List<GeoPoint> routeLine = roadRouter.geometry(prefs.mode(), List.of(origin.location(), destination.location()))
                .map(line -> line.stream().map(p -> new GeoPoint(p[0], p[1])).toList())
                .orElse(List.of(origin.location(), destination.location()));
        List<Candidate> candidates = CandidateFinder.find(origin.location(), destination.location(), routeLine,
                prefs, catalog.all(), maxCandidates);
        RouteMetrics direct = RoutePlanner.direct(origin.location(), destination.location(), prefs.mode());

        AdvisorContext ctx = new AdvisorContext(origin.getName(), origin.location(),
                destination.getName(), destination.location(), prefs, direct, candidates,
                likedCategories(profileId));
        Recommendation rec = engine.recommend(ctx);

        TripPlan plan = new TripPlan(profile, origin, destination, prefs.mode());
        plan.setDirect(direct.distanceKm(), direct.travelMinutes());
        plan.setAlternative(rec.title(), rec.rationale(), rec.metrics().distanceKm(),
                rec.metrics().travelMinutes(), rec.metrics().visitMinutes(), rec.source(),
                rec.fallbackReason(), mapper.toPlannedStops(rec));
        return mapper.toResponse(trips.save(plan));
    }

    @Transactional
    public TripResponse decide(Long tripId, Decision decision) {
        TripPlan plan = trips.findById(tripId)
                .orElseThrow(() -> new NotFoundException("Nie znaleziono planu " + tripId));
        plan.decide(decision);
        return mapper.toResponse(plan);
    }

    @Transactional(readOnly = true)
    public List<TripResponse> history(Long profileId) {
        return trips.findTop20ByProfileIdOrderByCreatedAtDesc(profileId).stream()
                .map(mapper::toResponse)
                .toList();
    }

    private Map<Interest, Long> likedCategories(Long profileId) {
        return trips.findByProfileIdAndDecision(profileId, Decision.ALTERNATIVE).stream()
                .flatMap(t -> t.getStops().stream())
                .collect(Collectors.groupingBy(PlannedStop::getCategory, Collectors.counting()));
    }

    private static Place toPlace(PlaceRequest req) {
        String region = req.region() == null || req.region().isBlank() ? null : req.region().trim();
        return new Place(req.name().trim(), region, req.lat(), req.lon());
    }
}
