package pl.wardiusz.smartroute.service;

import org.springframework.stereotype.Service;
import pl.wardiusz.smartroute.ai.RecommendationEngine;
import pl.wardiusz.smartroute.dto.response.MetaResponse;
import pl.wardiusz.smartroute.dto.response.OptionResponse;
import pl.wardiusz.smartroute.enums.Interest;
import pl.wardiusz.smartroute.enums.TransportMode;
import pl.wardiusz.smartroute.service.poi.PoiCatalog;

import java.util.Arrays;
import java.util.List;

@Service
public class MetaService {

    private final PoiCatalog catalog;
    private final RecommendationEngine engine;

    public MetaService(PoiCatalog catalog, RecommendationEngine engine) {
        this.catalog = catalog;
        this.engine = engine;
    }

    public MetaResponse getMeta() {
        List<OptionResponse> interests = Arrays.stream(Interest.values())
                .map(i -> new OptionResponse(i.name(), i.label())).toList();
        List<OptionResponse> modes = Arrays.stream(TransportMode.values())
                .map(m -> new OptionResponse(m.name(), m.label())).toList();
        PoiCatalog.Status status = catalog.status();
        return new MetaResponse(interests, modes, engine.aiEnabled(), engine.activeAdvisorName(),
                status.size(), status.ready());
    }
}
