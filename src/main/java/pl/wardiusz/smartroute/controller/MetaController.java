package pl.wardiusz.smartroute.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pl.wardiusz.smartroute.dto.response.MetaResponse;
import pl.wardiusz.smartroute.service.MetaService;

@RestController
@RequestMapping("/api/meta")
public class MetaController {

    private final MetaService metaService;

    public MetaController(MetaService metaService) {
        this.metaService = metaService;
    }

    @GetMapping
    public MetaResponse meta() {
        return metaService.getMeta();
    }
}
