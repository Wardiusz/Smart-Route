package pl.wardiusz.smartroute.enums;

public enum TransportMode {
    CAR("Samochód", 70.0, 1.25),
    MOTORCYCLE("Motocykl", 65.0, 1.25),
    BIKE("Rower", 18.0, 1.30);

    private final String label;
    private final double avgSpeedKmh;
    private final double roadFactor;

    TransportMode(String label, double avgSpeedKmh, double roadFactor) {
        this.label = label;
        this.avgSpeedKmh = avgSpeedKmh;
        this.roadFactor = roadFactor;
    }

    public String label() {
        return label;
    }

    public double avgSpeedKmh() {
        return avgSpeedKmh;
    }

    public double roadFactor() {
        return roadFactor;
    }
}
