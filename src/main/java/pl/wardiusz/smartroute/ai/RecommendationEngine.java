package pl.wardiusz.smartroute.ai;

import pl.wardiusz.smartroute.model.AdvisorContext;
import pl.wardiusz.smartroute.model.AdvisorProposal;
import pl.wardiusz.smartroute.model.Recommendation;

import java.util.Optional;

public class RecommendationEngine {

    private final RouteAdvisor primary;
    private final RouteAdvisor fallback;

    public RecommendationEngine(RouteAdvisor primary, RouteAdvisor fallback) {
        this.primary = primary;
        this.fallback = fallback;
    }

    public Recommendation recommend(AdvisorContext ctx) {
        if (ctx.candidates().isEmpty()) {
            return ProposalValidator.validate(
                    new AdvisorProposal("Brak ciekawszej alternatywy",
                            "W pobliżu tej trasy nie ma w bazie punktów mieszczących się w Twoim budżecie czasu. "
                                    + "Spróbuj zwiększyć limit dodatkowego czasu.",
                            null),
                    ctx, activeAdvisorName());
        }

        String fallbackReason = null;
        if (primary != null) {
            try {
                AdvisorProposal proposal = primary.propose(ctx);
                Recommendation result = ProposalValidator.validate(proposal, ctx, primary.displayName());
                if (result.hasAlternative() || proposal.stops().isEmpty()) {
                    return result;
                }
                fallbackReason = "AI wskazało punkty spoza dozwolonej listy";
            } catch (RuntimeException e) {
                String message = Optional.ofNullable(e.getMessage()).orElse(e.getClass().getSimpleName());
                fallbackReason = "AI niedostępne: " + (message.length() > 200 ? message.substring(0, 200) + "…" : message);
            }
        }

        Recommendation result = ProposalValidator.validate(fallback.propose(ctx), ctx, fallback.displayName());
        return new Recommendation(result.title(), result.rationale(), result.stops(), result.metrics(),
                result.source(), fallbackReason);
    }

    public boolean aiEnabled() {
        return primary != null;
    }

    public String activeAdvisorName() {
        return primary != null ? primary.displayName() : fallback.displayName();
    }
}
