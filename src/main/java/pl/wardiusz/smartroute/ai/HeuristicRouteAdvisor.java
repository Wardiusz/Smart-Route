package pl.wardiusz.smartroute.ai;

import pl.wardiusz.smartroute.enums.Interest;
import pl.wardiusz.smartroute.model.AdvisorContext;
import pl.wardiusz.smartroute.model.AdvisorProposal;
import pl.wardiusz.smartroute.model.Candidate;
import pl.wardiusz.smartroute.model.Poi;
import pl.wardiusz.smartroute.model.Preferences;
import pl.wardiusz.smartroute.model.StopPick;
import pl.wardiusz.smartroute.service.routing.RoutePlanner;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

public class HeuristicRouteAdvisor implements RouteAdvisor {

    @Override
    public AdvisorProposal propose(AdvisorContext ctx) {
        Preferences prefs = ctx.preferences();
        int budget = prefs.maxExtraMinutes();
        int directTotal = ctx.direct().totalMinutes();

        List<Candidate> ranked = ctx.candidates().stream()
                .sorted(Comparator.comparingDouble((Candidate c) -> score(c, ctx)).reversed())
                .toList();

        List<Candidate> chosen = new ArrayList<>();
        for (Candidate candidate : ranked) {
            if (chosen.size() >= prefs.maxStops()) {
                break;
            }
            List<Candidate> attempt = new ArrayList<>(chosen);
            attempt.add(candidate);
            int extra = RoutePlanner.via(ctx.origin(), inRouteOrder(attempt), ctx.destination(), prefs.mode())
                    .totalMinutes() - directTotal;
            if (extra <= budget) {
                chosen.add(candidate);
            }
        }

        if (chosen.isEmpty()) {
            return new AdvisorProposal("Brak ciekawszej alternatywy",
                    "Na tej trasie nie znalazłem punktów, które zmieściłyby się w Twoim budżecie czasu.",
                    List.of());
        }

        List<StopPick> picks = chosen.stream()
                .map(c -> new StopPick(c.poi().id(), noteFor(c, prefs)))
                .toList();
        return new AdvisorProposal(titleFor(chosen), rationaleFor(chosen, prefs), picks);
    }

    @Override
    public String displayName() {
        return "Heurystyka offline";
    }

    double score(Candidate c, AdvisorContext ctx) {
        Interest category = c.poi().category();
        double score = 1.0;
        if (ctx.preferences().interests().contains(category)) {
            score += 3.0;
        }
        score += Math.min(2.0, ctx.likedCategories().getOrDefault(category, 0L) * 0.5);
        int budget = Math.max(1, ctx.preferences().maxExtraMinutes());
        score -= (double) c.soloExtraMinutes() / budget;
        return score;
    }

    private static List<Poi> inRouteOrder(List<Candidate> candidates) {
        return candidates.stream()
                .sorted(Comparator.comparingDouble(Candidate::progress))
                .map(Candidate::poi)
                .toList();
    }

    private static String titleFor(List<Candidate> chosen) {
        return "Przez " + chosen.stream()
                .sorted(Comparator.comparingDouble(Candidate::progress))
                .map(c -> c.poi().name())
                .collect(Collectors.joining(" i "));
    }

    private static String noteFor(Candidate c, Preferences prefs) {
        String match = prefs.interests().contains(c.poi().category())
                ? "pasuje do Twojego zainteresowania: " + c.poi().category().label().toLowerCase()
                : "ciekawy punkt po drodze";
        return match + " (ok. " + c.poi().visitMinutes() + " min na miejscu)";
    }

    private static String rationaleFor(List<Candidate> chosen, Preferences prefs) {
        String categories = chosen.stream()
                .map(c -> c.poi().category())
                .distinct()
                .map(i -> i.label().toLowerCase())
                .collect(Collectors.joining(", "));
        String matchInfo = prefs.interests().isEmpty()
                ? "Nie podałeś zainteresowań, więc wybrałem punkty wymagające najmniejszego objazdu."
                : "Wybrałem punkty najlepiej dopasowane do Twoich zainteresowań przy możliwie małym objeździe.";
        return "Trasa łączy " + categories + ". " + matchInfo
                + " Całość mieści się w limicie " + prefs.maxExtraMinutes() + " min dodatkowego czasu.";
    }
}
