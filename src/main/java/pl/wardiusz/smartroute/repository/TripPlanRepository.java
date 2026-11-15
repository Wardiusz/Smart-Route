package pl.wardiusz.smartroute.repository;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import pl.wardiusz.smartroute.entity.TripPlan;
import pl.wardiusz.smartroute.enums.Decision;

import java.util.List;
import java.util.Optional;

public interface TripPlanRepository extends JpaRepository<TripPlan, Long> {

    @EntityGraph(attributePaths = {"stops"})
    Optional<TripPlan> findWithStopsById(Long id);

    List<TripPlan> findTop20ByProfileIdOrderByCreatedAtDesc(Long profileId);

    List<TripPlan> findByProfileIdAndDecision(Long profileId, Decision decision);
}
