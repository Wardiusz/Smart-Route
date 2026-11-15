package pl.wardiusz.smartroute.ai;

import pl.wardiusz.smartroute.model.AdvisorContext;
import pl.wardiusz.smartroute.model.AdvisorProposal;
import pl.wardiusz.smartroute.model.Candidate;
import pl.wardiusz.smartroute.model.ChosenStop;
import pl.wardiusz.smartroute.model.Poi;
import pl.wardiusz.smartroute.model.Preferences;
import pl.wardiusz.smartroute.model.Recommendation;
import pl.wardiusz.smartroute.model.RouteMetrics;
import pl.wardiusz.smartroute.model.StopPick;
import pl.wardiusz.smartroute.service.routing.CandidateFinder;
import pl.wardiusz.smartroute.service.routing.RoutePlanner;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

public final class ProposalValidator {

    private static final int MAX_TEXT_LENGTH = 1500;

    private ProposalValidator() {
    }

    public static Recommendation validate(AdvisorProposal proposal, AdvisorContext ctx, String source) {
        Preferences prefs = ctx.preferences();
        Map<Long, Candidate> candidates = CandidateFinder.byId(ctx.candidates());

        List<Picked> picked = new ArrayList<>();
        Set<Long> seen = new HashSet<>();
        for (StopPick pick : proposal.stops()) {
            Candidate candidate = candidates.get(pick.poiId());
            if (candidate != null && seen.add(pick.poiId())) {
                picked.add(new Picked(candidate, clean(pick.note())));
            }
        }
        while (picked.size() > prefs.maxStops()) {
            picked.removeLast();
        }
        while (!picked.isEmpty() && extraMinutes(picked, ctx) > prefs.maxExtraMinutes()) {
            picked.removeLast();
        }

        List<Picked> ordered = picked.stream()
                .sorted(Comparator.comparingDouble(p -> p.candidate().progress()))
                .toList();
        RouteMetrics metrics = RoutePlanner.via(ctx.origin(), pois(ordered), ctx.destination(), prefs.mode());
        List<ChosenStop> stops = ordered.stream()
                .map(p -> new ChosenStop(p.candidate().poi(), p.note()))
                .toList();

        String title = clean(proposal.title());
        if (title.isBlank()) {
            title = stops.isEmpty() ? "Brak ciekawszej alternatywy" : "Alternatywna trasa";
        }
        return new Recommendation(title, clean(proposal.rationale()), stops, metrics, source, null);
    }

    private static int extraMinutes(List<Picked> picked, AdvisorContext ctx) {
        List<Picked> ordered = picked.stream()
                .sorted(Comparator.comparingDouble(p -> p.candidate().progress()))
                .toList();
        return RoutePlanner.via(ctx.origin(), pois(ordered), ctx.destination(), ctx.preferences().mode())
                .totalMinutes() - ctx.direct().totalMinutes();
    }

    private static List<Poi> pois(List<Picked> picked) {
        return picked.stream().map(p -> p.candidate().poi()).toList();
    }

    private static String clean(String text) {
        if (text == null) {
            return "";
        }
        String stripped = text.strip();
        return stripped.length() > MAX_TEXT_LENGTH ? stripped.substring(0, MAX_TEXT_LENGTH) + "…" : stripped;
    }

    private record Picked(Candidate candidate, String note) {
    }
}
