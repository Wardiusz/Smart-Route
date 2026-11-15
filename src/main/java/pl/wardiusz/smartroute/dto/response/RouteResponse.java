package pl.wardiusz.smartroute.dto.response;

public record RouteResponse(double distanceKm, int travelMinutes, int visitMinutes, int totalMinutes) {
}
