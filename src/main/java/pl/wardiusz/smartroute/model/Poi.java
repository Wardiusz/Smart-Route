package pl.wardiusz.smartroute.model;

import pl.wardiusz.smartroute.enums.Interest;

public record Poi(long id,
                  String name,
                  Interest category,
                  GeoPoint location,
                  String description,
                  int visitMinutes,
                  String imageUrl,
                  String wikiUrl,
                  int popularity) {

    public Poi(long id, String name, Interest category, GeoPoint location, String description, int visitMinutes) {
        this(id, name, category, location, description, visitMinutes, null, null, 0);
    }
}
