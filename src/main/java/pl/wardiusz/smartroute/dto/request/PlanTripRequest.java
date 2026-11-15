package pl.wardiusz.smartroute.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public record PlanTripRequest(@NotNull Long profileId,
                              @NotNull @Valid PlaceRequest origin,
                              @NotNull @Valid PlaceRequest destination) {
}
