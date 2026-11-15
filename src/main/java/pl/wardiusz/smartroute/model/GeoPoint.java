package pl.wardiusz.smartroute.model;

public record GeoPoint(double lat, double lon) {

    public GeoPoint {
        if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
            throw new IllegalArgumentException("Nieprawidłowe współrzędne: " + lat + ", " + lon);
        }
    }
}
