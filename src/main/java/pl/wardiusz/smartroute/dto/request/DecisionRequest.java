package pl.wardiusz.smartroute.dto.request;

import jakarta.validation.constraints.NotNull;
import pl.wardiusz.smartroute.enums.Decision;

public record DecisionRequest(@NotNull Decision decision) {
}
