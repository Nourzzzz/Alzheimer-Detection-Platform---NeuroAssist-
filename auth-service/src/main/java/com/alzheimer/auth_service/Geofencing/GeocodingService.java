package com.alzheimer.auth_service.Geofencing;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.List;
import java.util.Map;

/**
 * Turns a postal address into coordinates using Nominatim (OpenStreetMap).
 *
 * <p>Chosen over a commercial geocoder because it needs no API key and no
 * billing account. Called from the server rather than the browser so Nominatim
 * sees one identified caller, as its usage policy asks, instead of every visitor
 * hitting it anonymously.
 */
@Service
@Slf4j
public class GeocodingService {

    private static final String NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${geofencing.geocoder-user-agent:NeuroAssist/1.0}")
    private String userAgent;

    public record Match(double latitude, double longitude, String displayName) {}

    @SuppressWarnings("unchecked")
    public List<Match> search(String query) {
        if (query == null || query.isBlank()) {
            return List.of();
        }
        String url = UriComponentsBuilder.fromUriString(NOMINATIM_URL)
                .queryParam("q", query)
                .queryParam("format", "json")
                .queryParam("limit", 5)
                .build()
                .toUriString();

        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.USER_AGENT, userAgent);

        try {
            List<Map<String, Object>> results = restTemplate
                    .exchange(url, HttpMethod.GET, new HttpEntity<>(headers), List.class)
                    .getBody();
            if (results == null) {
                return List.of();
            }
            return results.stream()
                    .map(r -> new Match(
                            Double.parseDouble(String.valueOf(r.get("lat"))),
                            Double.parseDouble(String.valueOf(r.get("lon"))),
                            String.valueOf(r.getOrDefault("display_name", query))))
                    .toList();
        } catch (Exception e) {
            // Never fatal: the doctor can always place the centre by hand on the map.
            log.warn("Geocoding failed for '{}': {}", query, e.getMessage());
            return List.of();
        }
    }
}
