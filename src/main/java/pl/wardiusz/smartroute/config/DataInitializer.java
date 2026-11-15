package pl.wardiusz.smartroute.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import pl.wardiusz.smartroute.entity.User;
import pl.wardiusz.smartroute.enums.Role;
import pl.wardiusz.smartroute.repository.UserRepository;

@Component
@ConditionalOnProperty(prefix = "app.demo-users", name = "enabled", havingValue = "true", matchIfMissing = true)
public class DataInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    static final String DEMO_EMAIL = "demo@smartroute.pl";
    static final String DEMO_PASSWORD = "demo1234";
    static final String ADMIN_EMAIL = "admin@smartroute.pl";
    static final String ADMIN_PASSWORD = "admin1234";

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository users, PasswordEncoder passwordEncoder) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        createIfMissing(DEMO_EMAIL, DEMO_PASSWORD, Role.USER);
        createIfMissing(ADMIN_EMAIL, ADMIN_PASSWORD, Role.ADMIN);
    }

    private void createIfMissing(String email, String password, Role role) {
        if (users.existsByEmailIgnoreCase(email)) {
            return;
        }
        users.save(new User(email, passwordEncoder.encode(password), role));
        log.info("Konto demo: {} / {} ({})", email, password, role);
    }
}
