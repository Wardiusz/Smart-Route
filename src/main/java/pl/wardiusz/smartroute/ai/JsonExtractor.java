package pl.wardiusz.smartroute.ai;

public final class JsonExtractor {

    private JsonExtractor() {
    }

    public static String extractObject(String text) {
        if (text == null) {
            throw new IllegalArgumentException("Pusta odpowiedź modelu");
        }
        int start = text.indexOf('{');
        int end = text.lastIndexOf('}');
        if (start < 0 || end <= start) {
            throw new IllegalArgumentException("Odpowiedź modelu nie zawiera obiektu JSON");
        }
        return text.substring(start, end + 1);
    }
}
