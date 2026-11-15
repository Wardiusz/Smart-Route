package pl.wardiusz.smartroute.service;

import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import pl.wardiusz.smartroute.config.GeocodingProperties;
import pl.wardiusz.smartroute.dto.response.PlaceResponse;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
public class PlaceSearchService {

    private static final Logger log = LoggerFactory.getLogger(PlaceSearchService.class);
    private static final String USER_AGENT = "SmartRoute/0.1 (projekt studencki)";
    private static final String POLAND_BBOX = "14.07,49.0,24.15,54.84";
    private static final int FETCH_LIMIT = 15;
    private static final int RESULT_LIMIT = 8;
    private static final int CACHE_SIZE = 512;

    private final GeocodingProperties props;
    private final RestClient restClient;
    private final Map<String, List<PlaceResponse>> cache = new LinkedHashMap<>(16, 0.75f, true) {
        @Override
        protected boolean removeEldestEntry(Map.Entry<String, List<PlaceResponse>> eldest) {
            return size() > CACHE_SIZE;
        }
    };

    public PlaceSearchService(GeocodingProperties props) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(5_000);
        requestFactory.setReadTimeout(props.timeoutSeconds() * 1_000);
        this.props = props;
        this.restClient = RestClient.builder()
                .requestFactory(requestFactory)
                .defaultHeader("User-Agent", USER_AGENT)
                .build();
    }

    public List<PlaceResponse> search(String query) {
        String q = query == null ? "" : query.trim().replaceAll("\\s+", " ");
        if (q.length() < 2) {
            return List.of();
        }
        if (!props.enabled()) {
            throw new IllegalStateException("Wyszukiwarka miejscowości jest wyłączona");
        }
        String key = q.toLowerCase(Locale.ROOT);
        synchronized (cache) {
            List<PlaceResponse> cached = cache.get(key);
            if (cached != null) {
                return cached;
            }
        }

        JsonNode response;
        try {
            response = restClient.get()
                    .uri(props.baseUrl().replaceAll("/+$", "") + "/api/?q={q}&limit={limit}&bbox={bbox}&osm_tag=place",
                            q, FETCH_LIMIT, POLAND_BBOX)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientException e) {
            log.warn("Wyszukiwanie miejscowości \"{}\" nie powiodło się: {}", q, e.getMessage());
            throw new PlaceSearchUnavailableException();
        }

        List<PlaceResponse> results = parse(response);
        synchronized (cache) {
            cache.put(key, results);
        }
        return results;
    }

    private static List<PlaceResponse> parse(JsonNode response) {
        List<PlaceResponse> results = new ArrayList<>();
        Set<String> seen = new LinkedHashSet<>();
        if (response == null) {
            return results;
        }
        for (JsonNode feature : response.path("features")) {
            JsonNode p = feature.path("properties");
            JsonNode coords = feature.path("geometry").path("coordinates");
            String name = p.path("name").asText("");
            if (!"PL".equalsIgnoreCase(p.path("countrycode").asText()) || name.isBlank() || coords.size() < 2) {
                continue;
            }
            String region = regionOf(p);
            if (!seen.add(name + "|" + region)) {
                continue;
            }
            results.add(new PlaceResponse(name, region, coords.get(1).asDouble(), coords.get(0).asDouble()));
            if (results.size() == RESULT_LIMIT) {
                break;
            }
        }
        return List.copyOf(results);
    }

    private static String regionOf(JsonNode p) {
        List<String> parts = new ArrayList<>();
        for (String field : new String[]{"county", "state"}) {
            String v = p.path(field).asText("");
            if (!v.isBlank() && !parts.contains(v)) {
                parts.add(v);
            }
        }
        return parts.isEmpty() ? null : String.join(", ", parts);
    }

    public static class PlaceSearchUnavailableException extends RuntimeException {
        public PlaceSearchUnavailableException() {
            super("Wyszukiwarka miejscowości jest chwilowo niedostępna. Spróbuj ponownie za chwilę.");
        }
    }
}
