package pl.wardiusz.smartroute.enums;

public enum Interest {
    NATURE("Natura i parki"),
    HISTORY("Historia i zabytki"),
    CULTURE("Kultura i muzea"),
    FOOD("Kulinaria regionalne"),
    VIEWPOINTS("Punkty widokowe"),
    ACTIVE("Aktywny wypoczynek");

    private final String label;

    Interest(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }
}
