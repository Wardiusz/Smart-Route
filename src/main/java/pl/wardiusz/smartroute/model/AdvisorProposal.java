package pl.wardiusz.smartroute.model;

import java.util.List;

public record AdvisorProposal(String title, String rationale, List<StopPick> stops) {

    public AdvisorProposal {
        stops = stops == null ? List.of() : List.copyOf(stops);
    }
}
