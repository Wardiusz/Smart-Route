package pl.wardiusz.smartroute.ai;

import pl.wardiusz.smartroute.model.AdvisorContext;
import pl.wardiusz.smartroute.model.AdvisorProposal;

public interface RouteAdvisor {

    AdvisorProposal propose(AdvisorContext context);

    String displayName();
}
