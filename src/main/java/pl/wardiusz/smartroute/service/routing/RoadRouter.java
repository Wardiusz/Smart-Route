package pl.wardiusz.smartroute.service.routing;

import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import pl.wardiusz.smartroute.config.RoadRoutingProperties;
import pl.wardiusz.smartroute.enums.TransportMode;
import pl.wardiusz.smartroute.model.GeoPoint;

import java.net.URI;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
public class RoadRouter {

    private static final Logger log = LoggerFactory.getLogger(RoadRouter.class);
    private static final String USER_AGENT = "SmartRoute/0.1 (projekt studencki)";
    private static final int CACHE_SIZE = 256;

    private final RoadRoutingProperties props;
    private final RestClient restClient;
    private final Map<String, List<double[]>> cache = new LinkedHashMap<>(16, 0.75f, true) {
        @Override
        protected boolean removeEldestEntry(Map.Entry<String, List<double[]>> eldest) {
            return size() > CACHE_SIZE;
        }
    };

    public RoadRouter(RoadRoutingProperties props) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(5_000);
        requestFactory.setReadTimeout(props.timeoutSeconds() * 1_000);
        this.props = props;
        this.restClient = RestClient.builder()
                .requestFactory(requestFactory)
                .defaultHeader("User-Agent", USER_AGENT)
                .build();
    }

    public Optional<List<double[]>> geometry(TransportMode mode, List<GeoPoint> points) {
        if (!props.enabled() || points.size() < 2) {
            return Optional.empty();
        }
        String coords = points.stream()
                .map(p -> String.format(Locale.ROOT, "%.5f,%.5f", p.lon(), p.lat()))
                .collect(Collectors.joining(";"));
        String key = mode + "|" + coords;
        synchronized (cache) {
            List<double[]> cached = cache.get(key);
            if (cached != null) {
                return Optional.of(cached);
            }
        }
        try {
            List<double[]> geometry = fetch(mode, coords);
            synchronized (cache) {
                cache.put(key, geometry);
            }
            return Optional.of(geometry);
        } catch (RuntimeException e) {
            log.warn("Nie udało się wyznaczyć trasy po drogach ({}): {}", mode, e.getMessage());
            return Optional.empty();
        }
    }

    private List<double[]> fetch(TransportMode mode, String coords) {
        URI uri = URI.create(props.baseUrl().replaceAll("/+$", "") + "/" + profilePath(mode) + "/" + coords
                + "?overview=full&geometries=geojson");
        JsonNode response = restClient.get().uri(uri).retrieve().body(JsonNode.class);
        if (response == null || !"Ok".equals(response.path("code").asText())) {
            throw new IllegalStateException("OSRM: " + (response == null ? "pusta odpowiedź" : response.path("code").asText()));
        }
        List<double[]> geometry = new ArrayList<>();
        for (JsonNode c : response.path("routes").path(0).path("geometry").path("coordinates")) {
            geometry.add(new double[]{round5(c.path(1).asDouble()), round5(c.path(0).asDouble())});
        }
        if (geometry.size() < 2) {
            throw new IllegalStateException("OSRM zwrócił pustą geometrię");
        }
        return List.copyOf(geometry);
    }

    private static String profilePath(TransportMode mode) {
        return switch (mode) {
            case CAR, MOTORCYCLE -> "routed-car/route/v1/driving";
            case BIKE -> "routed-bike/route/v1/cycling";
        };
    }

    private static double round5(double v) {
        return Math.round(v * 100_000) / 100_000.0;
    }
}
