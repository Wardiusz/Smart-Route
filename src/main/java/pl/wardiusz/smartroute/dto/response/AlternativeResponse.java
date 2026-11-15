package pl.wardiusz.smartroute.dto.response;

import java.util.List;

public record AlternativeResponse(String title,
                                  String rationale,
                                  RouteResponse route,
                                  int extraMinutes,
                                  double extraKm,
                                  List<StopResponse> stops) {
}
