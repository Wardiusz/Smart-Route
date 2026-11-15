package pl.wardiusz.smartroute.entity;

import jakarta.persistence.Embeddable;
import pl.wardiusz.smartroute.model.GeoPoint;

@Embeddable
public class Place {

    private String name;
    private String region;
    private double lat;
    private double lon;

    protected Place() {
    }

    public Place(String name, String region, double lat, double lon) {
        this.name = name;
        this.region = region;
        this.lat = lat;
        this.lon = lon;
    }

    public GeoPoint location() {
        return new GeoPoint(lat, lon);
    }

    public String getName() {
        return name;
    }

    public String getRegion() {
        return region;
    }

    public double getLat() {
        return lat;
    }

    public double getLon() {
        return lon;
    }
}
