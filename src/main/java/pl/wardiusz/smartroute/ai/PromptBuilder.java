package pl.wardiusz.smartroute.ai;

import pl.wardiusz.smartroute.enums.Interest;
import pl.wardiusz.smartroute.model.AdvisorContext;
import pl.wardiusz.smartroute.model.Candidate;
import pl.wardiusz.smartroute.model.Preferences;

import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

public final class PromptBuilder {

    public static final String SYSTEM_PROMPT = """
            Jesteś doradcą podróży. Użytkownik jedzie z punktu A do punktu B. Twoim zadaniem jest
            zaproponować ciekawszą alternatywę trasy prowadzącą przez 0 lub więcej przystanków,
            dopasowaną do jego preferencji. Decyzję podejmie użytkownik – Ty tylko rekomendujesz.

            Zasady:
            - Wybieraj WYŁĄCZNIE punkty z podanej listy kandydatów, odwołując się do nich przez "id".
            - Nie przekraczaj limitu przystanków. Suma kolumny "dodatkowy czas" przy kilku punktach jest
              tylko przybliżeniem – wybieraj tak, by łączny dodatkowy czas zmieścił się w budżecie.
            - Kolejność przystanków w odpowiedzi = priorytet (najważniejszy pierwszy).
            - Uwzględnij opis preferencji użytkownika i to, co wybierał wcześniej.
            - Jeśli żaden punkt nie pasuje, zwróć pustą listę "stops" i wyjaśnij dlaczego.
            - Pisz po polsku, zwięźle i konkretnie.

            Odpowiedz WYŁĄCZNIE obiektem JSON w formacie:
            {"title": "krótki tytuł trasy", "rationale": "2-3 zdania, dlaczego ta trasa pasuje do użytkownika",
             "stops": [{"poiId": 123, "note": "jedno zdanie, co tam zrobić"}]}
            """;

    private PromptBuilder() {
    }

    public static String userPrompt(AdvisorContext ctx) {
        Preferences prefs = ctx.preferences();
        StringBuilder sb = new StringBuilder();
        sb.append("Trasa: ").append(ctx.originName()).append(" → ").append(ctx.destinationName()).append('\n');
        sb.append("Środek transportu: ").append(prefs.mode().label()).append('\n');
        sb.append(String.format(Locale.ROOT, "Trasa bezpośrednia: ok. %.0f km, %d min%n",
                ctx.direct().distanceKm(), ctx.direct().totalMinutes()));
        sb.append("Budżet dodatkowego czasu (jazda + zwiedzanie): ").append(prefs.maxExtraMinutes()).append(" min\n");
        sb.append("Maksymalna liczba przystanków: ").append(prefs.maxStops()).append('\n');
        sb.append("Zainteresowania: ").append(prefs.interests().isEmpty() ? "nie podano"
                : prefs.interests().stream().map(Interest::label).sorted().collect(Collectors.joining(", "))).append('\n');
        if (!prefs.notes().isBlank()) {
            sb.append("Opis preferencji od użytkownika: \"").append(prefs.notes()).append("\"\n");
        }
        sb.append("Wcześniej wybierane kategorie: ").append(formatLikes(ctx.likedCategories())).append("\n\n");

        sb.append("Kandydaci (id | nazwa | kategoria | dodatkowy czas jako jedyny przystanek, jazda + zwiedzanie"
                + " | pozycja na trasie | opis):\n");
        for (Candidate c : ctx.candidates()) {
            sb.append(String.format(Locale.ROOT, "%d | %s | %s | +%d min | %.0f%% | %s%n",
                    c.poi().id(), c.poi().name(), c.poi().category().label(), c.soloExtraMinutes(),
                    Math.max(0, Math.min(1, c.progress())) * 100, c.poi().description()));
        }
        return sb.toString();
    }

    private static String formatLikes(Map<Interest, Long> likes) {
        if (likes.isEmpty()) {
            return "brak historii";
        }
        return likes.entrySet().stream()
                .sorted(Map.Entry.<Interest, Long>comparingByValue().reversed())
                .map(e -> e.getKey().label() + " (" + e.getValue() + "x)")
                .collect(Collectors.joining(", "));
    }
}
