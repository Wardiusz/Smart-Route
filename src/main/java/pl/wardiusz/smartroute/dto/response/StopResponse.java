package pl.wardiusz.smartroute.dto.response;

import pl.wardiusz.smartroute.enums.Interest;

public record StopResponse(Long poiId,
                           String name,
                           Interest category,
                           String categoryLabel,
                           double lat,
                           double lon,
                           int visitMinutes,
                           String note,
                           String description,
                           String imageUrl,
                           String wikiUrl) {
}
