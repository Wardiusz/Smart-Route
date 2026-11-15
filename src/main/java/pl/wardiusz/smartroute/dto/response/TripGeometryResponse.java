package pl.wardiusz.smartroute.dto.response;

import java.util.List;

public record TripGeometryResponse(List<double[]> direct, List<double[]> alternative) {
}
