package pl.wardiusz.smartroute.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import pl.wardiusz.smartroute.dto.request.DecisionRequest;
import pl.wardiusz.smartroute.dto.request.PlanTripRequest;
import pl.wardiusz.smartroute.dto.response.TripGeometryResponse;
import pl.wardiusz.smartroute.dto.response.TripResponse;
import pl.wardiusz.smartroute.service.RouteGeometryService;
import pl.wardiusz.smartroute.service.TripPlannerService;

import java.util.List;

@RestController
@RequestMapping("/api/trips")
public class TripController {

    private final TripPlannerService tripService;
    private final RouteGeometryService geometryService;

    public TripController(TripPlannerService tripService, RouteGeometryService geometryService) {
        this.tripService = tripService;
        this.geometryService = geometryService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TripResponse plan(@Valid @RequestBody PlanTripRequest request) {
        return tripService.plan(request.profileId(), request.origin(), request.destination());
    }

    @PostMapping("/{id}/decision")
    public TripResponse decide(@PathVariable Long id, @Valid @RequestBody DecisionRequest request) {
        return tripService.decide(id, request.decision());
    }

    @GetMapping
    public List<TripResponse> history(@RequestParam Long profileId) {
        return tripService.history(profileId);
    }

    @GetMapping("/{id}/geometry")
    public TripGeometryResponse geometry(@PathVariable Long id) {
        return geometryService.forTrip(id);
    }
}
