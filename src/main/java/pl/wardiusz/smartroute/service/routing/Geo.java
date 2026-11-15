package pl.wardiusz.smartroute.service.routing;

import pl.wardiusz.smartroute.model.GeoPoint;
import pl.wardiusz.smartroute.model.SegmentProjection;

public final class Geo {

    private static final double EARTH_RADIUS_KM = 6371.0;

    private Geo() {
    }

    public static double haversineKm(GeoPoint a, GeoPoint b) {
        double dLat = Math.toRadians(b.lat() - a.lat());
        double dLon = Math.toRadians(b.lon() - a.lon());
        double h = Math.pow(Math.sin(dLat / 2), 2)
                + Math.cos(Math.toRadians(a.lat())) * Math.cos(Math.toRadians(b.lat()))
                * Math.pow(Math.sin(dLon / 2), 2);
        return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
    }

    public static SegmentProjection project(GeoPoint p, GeoPoint a, GeoPoint b) {
        double cosLat = Math.cos(Math.toRadians((a.lat() + b.lat()) / 2));
        double ax = a.lon() * cosLat, ay = a.lat();
        double bx = b.lon() * cosLat, by = b.lat();
        double px = p.lon() * cosLat, py = p.lat();

        double dx = bx - ax, dy = by - ay;
        double lengthSq = dx * dx + dy * dy;
        double t = lengthSq == 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / lengthSq;
        double clamped = Math.max(0, Math.min(1, t));

        GeoPoint closest = new GeoPoint(ay + clamped * dy, (ax + clamped * dx) / cosLat);
        return new SegmentProjection(t, haversineKm(p, closest));
    }
}
