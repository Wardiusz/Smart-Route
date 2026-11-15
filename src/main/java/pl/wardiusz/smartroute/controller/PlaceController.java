package pl.wardiusz.smartroute.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pl.wardiusz.smartroute.dto.response.PlaceResponse;
import pl.wardiusz.smartroute.service.PlaceSearchService;

import java.util.List;

@RestController
@RequestMapping("/api/places")
public class PlaceController {

    private final PlaceSearchService placeSearch;

    public PlaceController(PlaceSearchService placeSearch) {
        this.placeSearch = placeSearch;
    }

    @GetMapping
    public List<PlaceResponse> search(@RequestParam(name = "q", defaultValue = "") String query) {
        return placeSearch.search(query);
    }
}
