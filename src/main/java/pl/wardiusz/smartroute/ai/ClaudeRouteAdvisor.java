package pl.wardiusz.smartroute.ai;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;
import pl.wardiusz.smartroute.config.AiProperties;
import pl.wardiusz.smartroute.model.AdvisorContext;
import pl.wardiusz.smartroute.model.AdvisorProposal;
import pl.wardiusz.smartroute.model.StopPick;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class ClaudeRouteAdvisor implements RouteAdvisor {

    private static final Logger log = LoggerFactory.getLogger(ClaudeRouteAdvisor.class);
    private static final String API_VERSION = "2023-06-01";
    private static final int MAX_TOKENS = 2048;

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final String model;

    public ClaudeRouteAdvisor(AiProperties props, ObjectMapper objectMapper) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(5_000);
        requestFactory.setReadTimeout(props.timeoutSeconds() * 1_000);

        this.restClient = RestClient.builder()
                .baseUrl(props.baseUrl())
                .requestFactory(requestFactory)
                .defaultHeader("x-api-key", props.apiKey())
                .defaultHeader("anthropic-version", API_VERSION)
                .build();
        this.objectMapper = objectMapper;
        this.model = props.model();
    }

    @Override
    public AdvisorProposal propose(AdvisorContext ctx) {
        Map<String, Object> request = Map.of(
                "model", model,
                "max_tokens", MAX_TOKENS,
                "thinking", Map.of("type", "disabled"),
                "system", PromptBuilder.SYSTEM_PROMPT,
                "messages", List.of(Map.of("role", "user", "content", PromptBuilder.userPrompt(ctx))));

        JsonNode response = restClient.post()
                .uri("/v1/messages")
                .contentType(MediaType.APPLICATION_JSON)
                .body(request)
                .retrieve()
                .body(JsonNode.class);

        if (response != null && "max_tokens".equals(response.path("stop_reason").asText())) {
            throw new IllegalStateException("Odpowiedź modelu została ucięta (limit " + MAX_TOKENS + " tokenów)");
        }
        String text = extractText(response);
        try {
            return parseAnswer(text, objectMapper);
        } catch (RuntimeException e) {
            log.warn("Nie udało się sparsować odpowiedzi modelu: {}", text);
            throw e;
        }
    }

    @Override
    public String displayName() {
        return "Claude (" + model + ")";
    }

    static String extractText(JsonNode response) {
        if (response == null) {
            throw new IllegalStateException("Pusta odpowiedź API");
        }
        for (JsonNode block : response.path("content")) {
            if ("text".equals(block.path("type").asText())) {
                return block.path("text").asText();
            }
        }
        throw new IllegalStateException("Odpowiedź API nie zawiera tekstu");
    }

    static AdvisorProposal parseAnswer(String text, ObjectMapper mapper) {
        JsonNode root;
        try {
            root = mapper.readTree(JsonExtractor.extractObject(text));
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Model zwrócił niepoprawny JSON", e);
        }
        List<StopPick> stops = new ArrayList<>();
        for (JsonNode stop : root.path("stops")) {
            JsonNode id = stop.path("poiId");
            if (id.canConvertToLong()) {
                stops.add(new StopPick(id.asLong(), stop.path("note").asText("")));
            }
        }
        return new AdvisorProposal(root.path("title").asText(""), root.path("rationale").asText(""), stops);
    }
}
