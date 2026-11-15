package pl.wardiusz.smartroute.entity;

import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import pl.wardiusz.smartroute.enums.Interest;
import pl.wardiusz.smartroute.enums.TransportMode;
import pl.wardiusz.smartroute.model.Preferences;

import java.util.EnumSet;
import java.util.HashSet;
import java.util.Set;

@Entity
public class UserProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @ElementCollection(fetch = FetchType.EAGER)
    @Enumerated(EnumType.STRING)
    private Set<Interest> interests = new HashSet<>();

    @Enumerated(EnumType.STRING)
    private TransportMode mode;

    private int maxExtraMinutes;
    private int maxStops;

    @Column(length = 500)
    private String notes;

    protected UserProfile() {
    }

    public UserProfile(String name) {
        this.name = name;
    }

    public void update(String name, Set<Interest> interests, TransportMode mode,
                       int maxExtraMinutes, int maxStops, String notes) {
        this.name = name;
        this.interests = interests == null || interests.isEmpty() ? new HashSet<>() : EnumSet.copyOf(interests);
        this.mode = mode;
        this.maxExtraMinutes = maxExtraMinutes;
        this.maxStops = maxStops;
        this.notes = notes;
    }

    public Preferences toPreferences() {
        return new Preferences(interests, mode, maxExtraMinutes, maxStops, notes);
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public Set<Interest> getInterests() {
        return interests;
    }

    public TransportMode getMode() {
        return mode;
    }

    public int getMaxExtraMinutes() {
        return maxExtraMinutes;
    }

    public int getMaxStops() {
        return maxStops;
    }

    public String getNotes() {
        return notes;
    }
}
