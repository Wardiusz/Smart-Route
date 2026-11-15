package pl.wardiusz.smartroute.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import pl.wardiusz.smartroute.enums.Interest;
import pl.wardiusz.smartroute.enums.TransportMode;

import java.util.Set;

public record ProfileRequest(
        @NotBlank @Size(max = 60) String name,
        Set<Interest> interests,
        @NotNull TransportMode mode,
        @Min(15) @Max(480) int maxExtraMinutes,
        @Min(1) @Max(5) int maxStops,
        @Size(max = 500) String notes) {
}
