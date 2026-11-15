package pl.wardiusz.smartroute.dto.response;

import java.util.List;

public record MetaResponse(List<OptionResponse> interests,
                           List<OptionResponse> modes,
                           boolean aiEnabled,
                           String advisor,
                           int poiCount,
                           boolean poiCatalogReady) {
}
