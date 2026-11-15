package pl.wardiusz.smartroute.service.routing;

import pl.wardiusz.smartroute.enums.TransportMode;
import pl.wardiusz.smartroute.model.GeoPoint;
import pl.wardiusz.smartroute.model.Poi;
import pl.wardiusz.smartroute.model.RouteMetrics;

import java.util.ArrayList;
import java.util.List;

public final class RoutePlanner {

    private RoutePlanner() {
    }

    public static RouteMetrics direct(GeoPoint origin, GeoPoint destination, TransportMode mode) {
        return via(origin, List.of(), destination, mode);
    }

    public static RouteMetrics via(GeoPoint origin, List<Poi> stops, GeoPoint destination, TransportMode mode) {
        List<GeoPoint> points = new ArrayList<>();
        points.add(origin);
        stops.forEach(s -> points.add(s.location()));
        points.add(destination);

        double straightKm = 0;
        for (int i = 1; i < points.size(); i++) {
            straightKm += Geo.haversineKm(points.get(i - 1), points.get(i));
        }
        double roadKm = straightKm * mode.roadFactor();
        int travelMinutes = (int) Math.round(roadKm / mode.avgSpeedKmh() * 60);
        int visitMinutes = stops.stream().mapToInt(Poi::visitMinutes).sum();
        return new RouteMetrics(round1(roadKm), travelMinutes, visitMinutes);
    }

    private static double round1(double v) {
        return Math.round(v * 10) / 10.0;
    }
}
