package pl.wardiusz.smartroute;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class SmartRouteApplication {

    public static void main(String[] args) {
        SpringApplication.run(SmartRouteApplication.class, args);
    }
}
