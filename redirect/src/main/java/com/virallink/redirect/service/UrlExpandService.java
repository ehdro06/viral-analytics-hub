package com.virallink.redirect.service;

import lombok.AllArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.InetAddress;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class UrlExpandService {

    private final ObjectMapper objectMapper;

    private static final int MAX_REDIRECTS = 5;
    private static final Duration TIMEOUT = Duration.ofSeconds(5);
    private static final Set<Integer> REDIRECT_CODES = Set.of(301, 302, 303, 307, 308);

    @Value("${google.safebrowsing.api-key:}")
    private String safeBrowsingApiKey;

    @Value("${google.safebrowsing.enabled:false}")
    private boolean safeBrowsingEnabled;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(TIMEOUT)
            .followRedirects(HttpClient.Redirect.NEVER)
            .build();

    public ExpandResult expand(String rawUrl) {
        URI current = validateAndNormalize(rawUrl);
        List<Hop> hops = new ArrayList<>();
        Set<String> visited = new HashSet<>();

        for (int i = 0; i < MAX_REDIRECTS; i++) {
            if (!visited.add(current.toString())) {
                return ExpandResult.loop(rawUrl, hops);
            }

            // SSRF guard: block non-public targets
            if (!isPublicAddress(current)) {
                return ExpandResult.blocked(rawUrl, hops, "Blocked non-public address");
            }

            HttpResponse<Void> headResp = sendHead(current);
            int status = headResp != null ? headResp.statusCode() : 0;
            String location = headResp != null ? headResp.headers().firstValue("location").orElse(null) : null;

            hops.add(new Hop(current.toString(), status, location));

            if (!REDIRECT_CODES.contains(status) || location == null) {
                // Reached final or failed to get redirect info
                return ExpandResult.finalized(rawUrl, hops, current.toString());
            }

            URI next = resolveLocation(current, location);
            if (next == null) {
                return ExpandResult.finalized(rawUrl, hops, current.toString());
            }

            current = next;
        }

        return ExpandResult.blocked(rawUrl, hops, "Max redirects exceeded");
    }



    private HttpResponse<Void> sendHead(URI uri) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(uri)
                    .method("HEAD", HttpRequest.BodyPublishers.noBody())
                    .timeout(TIMEOUT)
                    .header("User-Agent", "ViralLink-Expander/1.0")
                    .build();
            HttpResponse<Void> response = httpClient.send(request, HttpResponse.BodyHandlers.discarding());
            // Some servers don't support HEAD; fallback to GET without following redirects
            if (response.statusCode() == 405) {
                HttpRequest getReq = HttpRequest.newBuilder()
                        .uri(uri)
                        .GET()
                        .timeout(TIMEOUT)
                        .header("User-Agent", "ViralLink-Expander/1.0")
                        .build();
                return httpClient.send(getReq, HttpResponse.BodyHandlers.discarding());
            }
            return response;
        } catch (Exception e) {
            log.debug("HEAD request failed for {}: {}", uri, e.getMessage());
            return null;
        }
    }

    private URI validateAndNormalize(String rawUrl) {
        try {
            URI uri = new URI(rawUrl.trim());
            if (uri.getScheme() == null) {
                // assume https if missing
                uri = new URI("https://" + rawUrl.trim());
            }
            if (!"http".equalsIgnoreCase(uri.getScheme()) && !"https".equalsIgnoreCase(uri.getScheme())) {
                throw new IllegalArgumentException("Only http/https allowed");
            }
            return uri;
        } catch (URISyntaxException e) {
            throw new IllegalArgumentException("Invalid URL");
        }
    }

    private URI resolveLocation(URI base, String location) {
        try {
            URI loc = new URI(location);
            if (!loc.isAbsolute()) {
                loc = base.resolve(loc);
            }
            if (!"http".equalsIgnoreCase(loc.getScheme()) && !"https".equalsIgnoreCase(loc.getScheme())) {
                return null;
            }
            return loc;
        } catch (Exception e) {
            log.debug("Failed to resolve location {} from {}", location, base);
            return null;
        }
    }

    private boolean isPublicAddress(URI uri) {
        try {
            String host = uri.getHost();
            if (host == null) return false;
            InetAddress[] addrs = InetAddress.getAllByName(host);
            for (InetAddress addr : addrs) {
                if (addr.isAnyLocalAddress() || addr.isLoopbackAddress() || addr.isLinkLocalAddress() || addr.isSiteLocalAddress()) {
                    return false;
                }
                String ip = addr.getHostAddress();
                if (ip.startsWith("169.254.")) return false; // link-local
                if (ip.startsWith("fc") || ip.startsWith("fd")) return false; // unique local IPv6
            }
            return true;
        } catch (Exception e) {
            log.debug("DNS resolution failed for {}: {}", uri, e.getMessage());
            return false;
        }
    }

    public boolean checkSafeBrowsing(String url) {
        if (!safeBrowsingEnabled || safeBrowsingApiKey == null || safeBrowsingApiKey.isBlank()) {
            return true; // Skip check if disabled
        }

        /* 
         * Local records for Safe Browsing API Request Structure
         */
        record ThreatEntry(String url) {}
        record ThreatInfo(List<String> threatTypes, List<String> platformTypes, List<String> threatEntryTypes, List<ThreatEntry> threatEntries) {}
        record ClientInfo(String clientId, String clientVersion) {}
        record SafeBrowsingRequest(ClientInfo client, ThreatInfo threatInfo) {}

        try {
            SafeBrowsingRequest requestPayload = new SafeBrowsingRequest(
                new ClientInfo("virallink", "1.0.0"),
                new ThreatInfo(
                    List.of("MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE"),
                    List.of("ANY_PLATFORM"),
                    List.of("URL"),
                    List.of(new ThreatEntry(url))
                )
            );

            String jsonBody = objectMapper.writeValueAsString(requestPayload);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://safebrowsing.googleapis.com/v4/threatMatches:find?key=" + safeBrowsingApiKey))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .timeout(Duration.ofSeconds(2))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            
            if (response.statusCode() == 200) {
                // If response body is empty object {}, it's safe. If it has matches, it's unsafe.
                return !response.body().contains("\"matches\":");
            } else {
                 log.warn("Safe Browsing API Error: {}", response.statusCode());
                return true; // Fail open
            }
        } catch (Exception e) {
            log.error("Safe Browsing Check Failed", e);
            return true; // Fail open
        }
    }

    @Data
    @AllArgsConstructor
    public static class Hop {
        private String url;
        private int status;
        private String location;
    }

    @Builder
    @Data
    public static class ExpandResult {
        private String inputUrl;
        private boolean shortened;
        private String finalUrl;
        private List<Hop> hops;
        private String note;
        private boolean safe;

        public static ExpandResult loop(String input, List<Hop> hops) {
            return ExpandResult.builder()
                    .inputUrl(input)
                    .shortened(true)
                    .finalUrl(hops.isEmpty() ? input : hops.get(hops.size() - 1).getUrl())
                    .hops(hops)
                    .note("Loop detected")
                    .safe(false)
                    .build();
        }

        public static ExpandResult blocked(String input, List<Hop> hops, String note) {
            return ExpandResult.builder()
                    .inputUrl(input)
                    .shortened(true)
                    .finalUrl(hops.isEmpty() ? input : hops.get(hops.size() - 1).getUrl())
                    .hops(hops)
                    .note(note)
                    .safe(false)
                    .build();
        }

        public static ExpandResult finalized(String input, List<Hop> hops, String finalUrl) {
            boolean isShort = hops.stream().anyMatch(h -> REDIRECT_CODES.contains(h.getStatus()));
            // By default considered safe if it resolved successfully without loops/blocks.
            // In a real production app, you would integrate Google Safe Browsing API here.
            return ExpandResult.builder()
                    .inputUrl(input)
                    .shortened(isShort)
                    .finalUrl(finalUrl)
                    .hops(hops)
                    .safe(true)
                    .build();
        }
    }
}
