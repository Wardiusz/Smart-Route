package pl.wardiusz.smartroute.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import pl.wardiusz.smartroute.ai.ClaudeRouteAdvisor;
import pl.wardiusz.smartroute.ai.HeuristicRouteAdvisor;
import pl.wardiusz.smartroute.ai.RecommendationEngine;
import pl.wardiusz.smartroute.ai.RouteAdvisor;

@Configuration
public class AiConfig {

    private static final Logger log = LoggerFactory.getLogger(AiConfig.class);

    @Bean
    RecommendationEngine recommendationEngine(AiProperties props, ObjectMapper objectMapper) {
        RouteAdvisor primary = null;
        if (props.enabled()) {
            primary = new ClaudeRouteAdvisor(props, objectMapper);
            log.info("Rekomendacje tras: {} (z heurystyką jako zabezpieczeniem)", primary.displayName());
        } else {
            log.info("Brak ANTHROPIC_API_KEY – rekomendacje tras w trybie offline (heurystyka)");
        }
        return new RecommendationEngine(primary, new HeuristicRouteAdvisor());
    }
}
