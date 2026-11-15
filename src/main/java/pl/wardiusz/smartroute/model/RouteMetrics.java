package pl.wardiusz.smartroute.model;

public record RouteMetrics(double distanceKm, int travelMinutes, int visitMinutes) {

    public int totalMinutes() {
        return travelMinutes + visitMinutes;
    }
}
