package pl.wardiusz.smartroute.service.routing;

import pl.wardiusz.smartroute.enums.TransportMode;
import pl.wardiusz.smartroute.model.Candidate;
import pl.wardiusz.smartroute.model.GeoPoint;
import pl.wardiusz.smartroute.model.Poi;
import pl.wardiusz.smartroute.model.Preferences;
import pl.wardiusz.smartroute.model.SegmentProjection;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

public final class CandidateFinder {

    private static final double ENDPOINT_EXCLUSION_KM = 8.0;
    private static final double MAX_CORRIDOR_KM = 80.0;
    private static final double MIN_CORRIDOR_KM = 5.0;
    private static final double LINE_SPACING_KM = 1.0;
    private static final double MIN_DISTANCE_BETWEEN_KM = 1.0;
    private static final double KM_PER_DEGREE = 111.2;

    private CandidateFinder() {
    }

    public static List<Candidate> find(GeoPoint origin,
                                       GeoPoint destination,
                                       Preferences prefs,
                                       List<Poi> catalog,
                                       int limit) {
        return find(origin, destination, List.of(origin, destination), prefs, catalog, limit);
    }

    public static List<Candidate> find(GeoPoint origin,
                                       GeoPoint destination,
                                       List<GeoPoint> routeLine,
                                       Preferences prefs,
                                       List<Poi> catalog,
                                       int limit) {
        TransportMode mode = prefs.mode();
        int directMinutes = RoutePlanner.direct(origin, destination, mode).totalMinutes();
        double corridorKm = corridorWidthKm(prefs);
        Polyline line = Polyline.of(routeLine.size() >= 2 ? routeLine : List.of(origin, destination));
        BoundingBox box = line.boundingBox(corridorKm);

        List<Candidate> ranked = catalog.stream()
                .filter(poi -> box.contains(poi.location()))
                .filter(poi -> Geo.haversineKm(poi.location(), origin) > ENDPOINT_EXCLUSION_KM)
                .filter(poi -> Geo.haversineKm(poi.location(), destination) > ENDPOINT_EXCLUSION_KM)
                .map(poi -> {
                    SegmentProjection proj = line.project(poi.location());
                    if (proj.offsetKm() > corridorKm) {
                        return null;
                    }
                    int soloExtra = RoutePlanner.via(origin, List.of(poi), destination, mode).totalMinutes()
                            - directMinutes;
                    return new Candidate(poi, proj.progress(), proj.offsetKm(), soloExtra);
                })
                .filter(c -> c != null)
                .filter(c -> c.progress() > -0.05 && c.progress() < 1.05)
                .filter(c -> c.soloExtraMinutes() <= prefs.maxExtraMinutes())
                .sorted(Comparator
                        .comparing((Candidate c) -> !prefs.interests().contains(c.poi().category()))
                        .thenComparing(Comparator.comparingDouble(CandidateFinder::score).reversed()))
                .toList();

        List<Candidate> picked = new ArrayList<>();
        for (Candidate c : ranked) {
            if (picked.size() == limit) {
                break;
            }
            boolean tooClose = picked.stream().anyMatch(p ->
                    Geo.haversineKm(p.poi().location(), c.poi().location()) < MIN_DISTANCE_BETWEEN_KM);
            if (!tooClose) {
                picked.add(c);
            }
        }
        return picked;
    }

    static double score(Candidate c) {
        double appeal = Math.log1p(c.poi().popularity()) + (c.poi().imageUrl() != null ? 0.5 : 0);
        return appeal - c.soloExtraMinutes() / 40.0;
    }

    static double corridorWidthKm(Preferences prefs) {
        TransportMode mode = prefs.mode();
        double extraRoadKm = mode.avgSpeedKmh() * prefs.maxExtraMinutes() / 60.0;
        double width = extraRoadKm / 2 / mode.roadFactor();
        return Math.clamp(width, MIN_CORRIDOR_KM, MAX_CORRIDOR_KM);
    }

    public static Map<Long, Candidate> byId(List<Candidate> candidates) {
        return candidates.stream()
                .collect(java.util.stream.Collectors.toMap(c -> c.poi().id(), c -> c, (a, b) -> a,
                        java.util.LinkedHashMap::new));
    }

    private record BoundingBox(double minLat, double maxLat, double minLon, double maxLon) {
        boolean contains(GeoPoint p) {
            return p.lat() >= minLat && p.lat() <= maxLat && p.lon() >= minLon && p.lon() <= maxLon;
        }
    }

    private record Polyline(List<GeoPoint> points, double[] cumulativeKm) {

        static Polyline of(List<GeoPoint> raw) {
            List<GeoPoint> pts = new ArrayList<>();
            pts.add(raw.getFirst());
            for (int i = 1; i < raw.size() - 1; i++) {
                if (Geo.haversineKm(pts.getLast(), raw.get(i)) >= LINE_SPACING_KM) {
                    pts.add(raw.get(i));
                }
            }
            pts.add(raw.getLast());
            double[] cum = new double[pts.size()];
            for (int i = 1; i < pts.size(); i++) {
                cum[i] = cum[i - 1] + Geo.haversineKm(pts.get(i - 1), pts.get(i));
            }
            return new Polyline(pts, cum);
        }

        double totalKm() {
            return cumulativeKm[cumulativeKm.length - 1];
        }

        BoundingBox boundingBox(double marginKm) {
            double minLat = 90, maxLat = -90, minLon = 180, maxLon = -180;
            for (GeoPoint p : points) {
                minLat = Math.min(minLat, p.lat());
                maxLat = Math.max(maxLat, p.lat());
                minLon = Math.min(minLon, p.lon());
                maxLon = Math.max(maxLon, p.lon());
            }
            double dLat = marginKm / KM_PER_DEGREE;
            double cosLat = Math.cos(Math.toRadians(Math.max(Math.abs(minLat), Math.abs(maxLat))));
            double dLon = marginKm / (KM_PER_DEGREE * Math.max(cosLat, 0.1));
            return new BoundingBox(minLat - dLat, maxLat + dLat, minLon - dLon, maxLon + dLon);
        }

        SegmentProjection project(GeoPoint p) {
            double total = totalKm();
            if (total == 0) {
                return new SegmentProjection(0, Geo.haversineKm(p, points.getFirst()));
            }
            int last = points.size() - 2;
            double bestOffset = Double.MAX_VALUE, bestProgress = 0;
            for (int i = 0; i <= last; i++) {
                SegmentProjection s = Geo.project(p, points.get(i), points.get(i + 1));
                if (s.offsetKm() < bestOffset) {
                    double segKm = cumulativeKm[i + 1] - cumulativeKm[i];
                    double t = s.progress();
                    if (!(i == 0 && t < 0) && !(i == last && t > 1)) {
                        t = Math.max(0, Math.min(1, t));
                    }
                    bestOffset = s.offsetKm();
                    bestProgress = (cumulativeKm[i] + t * segKm) / total;
                }
            }
            return new SegmentProjection(bestProgress, bestOffset);
        }
    }
}
