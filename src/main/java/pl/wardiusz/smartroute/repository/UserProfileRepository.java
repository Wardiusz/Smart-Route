package pl.wardiusz.smartroute.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pl.wardiusz.smartroute.entity.UserProfile;

public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {
}
