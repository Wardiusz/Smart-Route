package pl.wardiusz.smartroute.service.poi;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import pl.wardiusz.smartroute.config.PoiCatalogProperties;
import pl.wardiusz.smartroute.model.Poi;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;

@Component
public class PoiCatalog {

    private static final Logger log = LoggerFactory.getLogger(PoiCatalog.class);
    private static final long PAUSE_BETWEEN_QUERIES_MS = 1_500;
    private static final int MAX_ATTEMPTS = 4;

    private final PoiCatalogProperties props;
    private final WikidataPoiSource source;
    private final ObjectMapper objectMapper;
    private final AtomicBoolean refreshing = new AtomicBoolean();

    private volatile List<Poi> pois = List.of();
    private volatile boolean complete;

    public PoiCatalog(PoiCatalogProperties props, WikidataPoiSource source, ObjectMapper objectMapper) {
        this.props = props;
        this.source = source;
        this.objectMapper = objectMapper;
    }

    public record Status(boolean ready, int size) {
    }

    record CatalogFile(Instant fetchedAt, List<Poi> pois) {
    }

    public List<Poi> all() {
        return pois;
    }

    public Status status() {
        return new Status(complete, pois.size());
    }

    @EventListener(ApplicationReadyEvent.class)
    public void init() {
        CatalogFile stored = readFile();
        if (stored != null) {
            pois = List.copyOf(stored.pois());
            complete = true;
            log.info("Katalog atrakcji: {} miejsc z pliku {}", pois.size(), props.file());
        }
        boolean stale = stored == null || stored.fetchedAt().plus(props.maxAge()).isBefore(Instant.now());
        if (stale && props.remoteEnabled()) {
            Thread.ofVirtual().name("poi-catalog-refresh").start(this::refresh);
        } else if (stored == null) {
            log.warn("Brak katalogu atrakcji ({}) i wyłączone pobieranie z Wikidata – trasy będą bez przystanków",
                    props.file());
        }
    }

    void refresh() {
        if (!refreshing.compareAndSet(false, true)) {
            return;
        }
        try {
            List<Poi> previous = pois;
            boolean progressive = previous.isEmpty();
            log.info("Pobieram katalog atrakcji z Wikidata ({} typów)…", PoiType.ALL.size());

            Map<Long, Poi> fetched = new LinkedHashMap<>();
            int failed = 0;
            for (PoiType type : PoiType.ALL) {
                sleep(PAUSE_BETWEEN_QUERIES_MS);
                List<Poi> batch = fetchWithRetry(type);
                if (batch == null) {
                    failed++;
                    continue;
                }
                batch.forEach(p -> fetched.putIfAbsent(p.id(), p));
                if (progressive) {
                    pois = List.copyOf(fetched.values());
                }
            }

            if (failed > PoiType.ALL.size() / 2) {
                log.warn("Nie udało się pobrać {} z {} typów atrakcji – zostaje poprzedni katalog", failed,
                        PoiType.ALL.size());
                if (!progressive) {
                    return;
                }
            }
            previous.forEach(p -> fetched.putIfAbsent(p.id(), p));
            pois = List.copyOf(fetched.values());
            complete = true;
            Instant fetchedAt = failed == 0 ? Instant.now() : Instant.now().minus(props.maxAge());
            writeFile(new CatalogFile(fetchedAt, pois));
            log.info("Katalog atrakcji gotowy: {} miejsc (nieudane typy: {})", pois.size(), failed);
        } finally {
            refreshing.set(false);
        }
    }

    private List<Poi> fetchWithRetry(PoiType type) {
        for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            try {
                return source.fetch(type);
            } catch (RuntimeException e) {
                String reason = e.getMessage() == null ? e.getClass().getSimpleName() : e.getMessage().lines().findFirst().orElse("");
                log.warn("Wikidata – typ {} ({}), próba {}/{}: {}", type.label(), type.qid(), attempt, MAX_ATTEMPTS,
                        reason.length() > 120 ? reason.substring(0, 120) + "…" : reason);
                if (attempt < MAX_ATTEMPTS) {
                    sleep(5_000L * attempt * attempt);
                }
            }
        }
        return null;
    }

    private CatalogFile readFile() {
        Path path = Path.of(props.file());
        if (!Files.isRegularFile(path)) {
            return null;
        }
        try {
            CatalogFile file = objectMapper.readValue(path.toFile(), CatalogFile.class);
            return file.pois() == null || file.fetchedAt() == null ? null : file;
        } catch (IOException e) {
            log.warn("Nie udało się odczytać katalogu {}: {}", path, e.getMessage());
            return null;
        }
    }

    private void writeFile(CatalogFile file) {
        Path path = Path.of(props.file()).toAbsolutePath();
        try {
            Files.createDirectories(path.getParent());
            Path tmp = path.resolveSibling(path.getFileName() + ".tmp");
            objectMapper.writeValue(tmp.toFile(), file);
            Files.move(tmp, path, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
        } catch (IOException e) {
            log.warn("Nie udało się zapisać katalogu {}: {}", path, e.getMessage());
        }
    }

    private static void sleep(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
