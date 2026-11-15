package pl.wardiusz.smartroute.service.poi;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import pl.wardiusz.smartroute.config.PoiCatalogProperties;
import pl.wardiusz.smartroute.model.GeoPoint;
import pl.wardiusz.smartroute.model.Poi;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class WikidataPoiSource {

    private static final String USER_AGENT = "SmartRoute/0.1 (projekt studencki)";
    private static final Pattern POINT = Pattern.compile("Point\\(([-\\d.eE]+) ([-\\d.eE]+)\\)");
    private static final int THUMB_WIDTH = 480;
    private static final int MAX_DESCRIPTION = 300;

    private final PoiCatalogProperties props;
    private final RestClient restClient;

    public WikidataPoiSource(PoiCatalogProperties props) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(10_000);
        requestFactory.setReadTimeout(props.timeoutSeconds() * 1_000);
        this.props = props;
        this.restClient = RestClient.builder()
                .requestFactory(requestFactory)
                .defaultHeader("User-Agent", USER_AGENT)
                .defaultHeader("Accept", "application/sparql-results+json")
                .build();
    }

    public List<Poi> fetch(PoiType type) {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("query", query(type));
        JsonNode response = restClient.post().uri(props.sparqlUrl())
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(form)
                .retrieve()
                .body(JsonNode.class);
        if (response == null) {
            throw new IllegalStateException("Wikidata: pusta odpowiedź");
        }

        Map<Long, Poi> byId = new LinkedHashMap<>();
        for (JsonNode row : response.path("results").path("bindings")) {
            Poi poi = toPoi(row, type);
            if (poi != null) {
                byId.putIfAbsent(poi.id(), poi);
            }
        }
        return new ArrayList<>(byId.values());
    }

    static String query(PoiType type) {
        return """
                SELECT ?item ?itemLabel ?itemDescription ?coord ?image ?article ?links WHERE {
                  ?item wdt:P31 wd:%s ; wdt:P17 wd:Q36 ; wdt:P625 ?coord ; wikibase:sitelinks ?links .
                  ?article schema:about ?item ; schema:isPartOf <https://pl.wikipedia.org/> .
                  FILTER NOT EXISTS { ?item wdt:P576 [] }
                  OPTIONAL { ?item wdt:P18 ?image }
                  SERVICE wikibase:label { bd:serviceParam wikibase:language "pl,en". }
                }""".formatted(type.qid());
    }

    private static Poi toPoi(JsonNode row, PoiType type) {
        String itemUri = value(row, "item");
        String name = value(row, "itemLabel");
        Matcher point = POINT.matcher(value(row, "coord"));
        if (itemUri.isEmpty() || name.isEmpty() || !point.find()) {
            return null;
        }
        String qid = itemUri.substring(itemUri.lastIndexOf('/') + 1);
        if (!qid.startsWith("Q") || name.equals(qid)) {
            return null;
        }
        double lon = Double.parseDouble(point.group(1));
        double lat = Double.parseDouble(point.group(2));
        if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
            return null;
        }

        String description = value(row, "itemDescription");
        if (description.isBlank()) {
            description = type.label();
        } else if (description.length() > MAX_DESCRIPTION) {
            description = description.substring(0, MAX_DESCRIPTION - 1) + "…";
        }
        String image = value(row, "image");
        String imageUrl = image.isEmpty() ? null
                : image.replaceFirst("^http://", "https://") + "?width=" + THUMB_WIDTH;
        String article = value(row, "article");
        int links = row.path("links").path("value").asInt(0);

        return new Poi(Long.parseLong(qid.substring(1)), name, type.category(), new GeoPoint(lat, lon),
                description, type.visitMinutes(), imageUrl, article.isEmpty() ? null : article, links);
    }

    private static String value(JsonNode row, String field) {
        return row.path(field).path("value").asText("");
    }
}
