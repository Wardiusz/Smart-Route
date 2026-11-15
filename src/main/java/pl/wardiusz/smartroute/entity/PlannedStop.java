package pl.wardiusz.smartroute.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import pl.wardiusz.smartroute.enums.Interest;
import pl.wardiusz.smartroute.model.Poi;

@Embeddable
public class PlannedStop {

    private Long poiId;
    private String name;
    @Enumerated(EnumType.STRING)
    private Interest category;
    private double lat;
    private double lon;
    private int visitMinutes;
    @Column(length = 1600)
    private String note;
    @Column(length = 400)
    private String description;
    @Column(length = 1000)
    private String imageUrl;
    @Column(length = 1000)
    private String wikiUrl;

    protected PlannedStop() {
    }

    public PlannedStop(Long poiId, String name, Interest category, double lat, double lon,
                       int visitMinutes, String note) {
        this.poiId = poiId;
        this.name = name;
        this.category = category;
        this.lat = lat;
        this.lon = lon;
        this.visitMinutes = visitMinutes;
        this.note = note;
    }

    public static PlannedStop of(Poi poi, String note) {
        PlannedStop stop = new PlannedStop(poi.id(), poi.name(), poi.category(), poi.location().lat(),
                poi.location().lon(), poi.visitMinutes(), note);
        stop.description = poi.description();
        stop.imageUrl = poi.imageUrl();
        stop.wikiUrl = poi.wikiUrl();
        return stop;
    }

    public Long getPoiId() {
        return poiId;
    }

    public String getName() {
        return name;
    }

    public Interest getCategory() {
        return category;
    }

    public double getLat() {
        return lat;
    }

    public double getLon() {
        return lon;
    }

    public int getVisitMinutes() {
        return visitMinutes;
    }

    public String getNote() {
        return note;
    }

    public String getDescription() {
        return description;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public String getWikiUrl() {
        return wikiUrl;
    }
}
