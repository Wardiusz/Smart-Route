package pl.wardiusz.smartroute.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import pl.wardiusz.smartroute.dto.request.ProfileRequest;
import pl.wardiusz.smartroute.dto.response.ProfileResponse;
import pl.wardiusz.smartroute.service.ProfileService;

@RestController
@RequestMapping("/api/profiles")
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProfileResponse create(@Valid @RequestBody ProfileRequest request) {
        return profileService.create(request);
    }

    @GetMapping("/{id}")
    public ProfileResponse get(@PathVariable Long id) {
        return profileService.get(id);
    }

    @PutMapping("/{id}")
    public ProfileResponse update(@PathVariable Long id, @Valid @RequestBody ProfileRequest request) {
        return profileService.update(id, request);
    }
}
