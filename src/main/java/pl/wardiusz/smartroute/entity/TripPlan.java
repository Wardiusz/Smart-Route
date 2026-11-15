package pl.wardiusz.smartroute.entity;

import jakarta.persistence.AttributeOverride;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OrderColumn;
import pl.wardiusz.smartroute.enums.Decision;
import pl.wardiusz.smartroute.enums.TransportMode;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
public class TripPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private UserProfile profile;
    @Embedded
    @AttributeOverride(name = "name", column = @Column(name = "origin_name", nullable = false))
    @AttributeOverride(name = "region", column = @Column(name = "origin_region"))
    @AttributeOverride(name = "lat", column = @Column(name = "origin_lat"))
    @AttributeOverride(name = "lon", column = @Column(name = "origin_lon"))
    private Place origin;
    @Embedded
    @AttributeOverride(name = "name", column = @Column(name = "destination_name", nullable = false))
    @AttributeOverride(name = "region", column = @Column(name = "destination_region"))
    @AttributeOverride(name = "lat", column = @Column(name = "destination_lat"))
    @AttributeOverride(name = "lon", column = @Column(name = "destination_lon"))
    private Place destination;
    @Enumerated(EnumType.STRING)
    private TransportMode mode;

    private double directDistanceKm;
    private int directTravelMinutes;

    private String altTitle;
    @Column(length = 1600)
    private String altRationale;
    private double altDistanceKm;
    private int altTravelMinutes;
    private int altVisitMinutes;
    private String advisorSource;
    @Column(length = 300)
    private String fallbackReason;

    @ElementCollection
    @OrderColumn(name = "stop_order")
    private List<PlannedStop> stops = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    private Decision decision = Decision.PENDING;
    private Instant createdAt = Instant.now();
    private Instant decidedAt;

    protected TripPlan() {
    }

    public TripPlan(UserProfile profile, Place origin, Place destination, TransportMode mode) {
        this.profile = profile;
        this.origin = origin;
        this.destination = destination;
        this.mode = mode;
    }

    public void setDirect(double distanceKm, int travelMinutes) {
        this.directDistanceKm = distanceKm;
        this.directTravelMinutes = travelMinutes;
    }

    public void setAlternative(String title, String rationale, double distanceKm, int travelMinutes,
                               int visitMinutes, String source, String fallbackReason, List<PlannedStop> stops) {
        this.altTitle = title;
        this.altRationale = rationale;
        this.altDistanceKm = distanceKm;
        this.altTravelMinutes = travelMinutes;
        this.altVisitMinutes = visitMinutes;
        this.advisorSource = source;
        this.fallbackReason = fallbackReason;
        this.stops = new ArrayList<>(stops);
    }

    public boolean hasAlternative() {
        return !stops.isEmpty();
    }

    public void decide(Decision decision) {
        if (decision == Decision.PENDING) {
            throw new IllegalArgumentException("Decyzja musi być ALTERNATIVE albo DIRECT");
        }
        if (decision == Decision.ALTERNATIVE && !hasAlternative()) {
            throw new IllegalStateException("Ten plan nie ma trasy alternatywnej do wybrania");
        }
        this.decision = decision;
        this.decidedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public UserProfile getProfile() {
        return profile;
    }

    public Place getOrigin() {
        return origin;
    }

    public Place getDestination() {
        return destination;
    }

    public TransportMode getMode() {
        return mode;
    }

    public double getDirectDistanceKm() {
        return directDistanceKm;
    }

    public int getDirectTravelMinutes() {
        return directTravelMinutes;
    }

    public String getAltTitle() {
        return altTitle;
    }

    public String getAltRationale() {
        return altRationale;
    }

    public double getAltDistanceKm() {
        return altDistanceKm;
    }

    public int getAltTravelMinutes() {
        return altTravelMinutes;
    }

    public int getAltVisitMinutes() {
        return altVisitMinutes;
    }

    public String getAdvisorSource() {
        return advisorSource;
    }

    public String getFallbackReason() {
        return fallbackReason;
    }

    public List<PlannedStop> getStops() {
        return stops;
    }

    public Decision getDecision() {
        return decision;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getDecidedAt() {
        return decidedAt;
    }
}
