package com.virallink.analytics.service;

import com.maxmind.geoip2.DatabaseReader;
import com.maxmind.geoip2.model.CityResponse;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.net.InetAddress;
import java.util.Optional;
import java.util.regex.Pattern;

/**
 * Resolves an (already anonymised) IP to country/city using a local MaxMind GeoLite2-City database.
 * Reading the .mmdb file needs no API key: a MaxMind account is only needed to download/update it.
 */
@Service
@Slf4j
public class GeoService {

    public record Geo(String country, String countryCode, String city) {
        public static final Geo UNKNOWN = new Geo("Unknown", "??", "Unknown");
        public static final Geo LOCAL = new Geo("Localhost", "LO", "Localhost");
    }

    private static final Pattern IPV4 = Pattern.compile("^\\d{1,3}(\\.\\d{1,3}){3}$");
    private static final Pattern IPV6 = Pattern.compile("^[0-9a-fA-F:.]+$");

    private final boolean cityEnabled;
    private final String mmdbPath;
    private DatabaseReader dbReader;

    public GeoService(@Value("${analytics.geo.city.enabled:false}") boolean cityEnabled,
                      @Value("${analytics.geo.city.mmdb-path:}") String mmdbPath) {
        this.cityEnabled = cityEnabled;
        this.mmdbPath = mmdbPath;
    }

    @PostConstruct
    void init() {
        if (!cityEnabled) {
            log.info("Geo enrichment disabled (analytics.geo.city.enabled=false)");
            return;
        }
        if (mmdbPath == null || mmdbPath.isBlank()) {
            log.warn("Geo enrichment enabled but no database path configured (analytics.geo.city.mmdb-path). Disabling.");
            return;
        }
        File dbFile = new File(mmdbPath);
        if (!dbFile.exists()) {
            log.warn("GeoLite database not found at {}. Geo enrichment disabled.", dbFile.getAbsolutePath());
            return;
        }
        try {
            dbReader = new DatabaseReader.Builder(dbFile).build();
            log.info("Loaded GeoLite2 database from {}", dbFile.getAbsolutePath());
        } catch (Exception e) {
            log.error("Failed to load GeoLite database. Geo enrichment disabled.", e);
            dbReader = null;
        }
    }

    public Geo lookup(String ip) {
        InetAddress address = parseLiteral(ip);
        if (address == null) return Geo.UNKNOWN;
        if (address.isLoopbackAddress() || address.isSiteLocalAddress() || address.isAnyLocalAddress()
                || address.isLinkLocalAddress()) {
            return Geo.LOCAL;
        }
        if (dbReader == null) return Geo.UNKNOWN;

        try {
            Optional<CityResponse> response = dbReader.tryCity(address);
            if (response.isEmpty()) return Geo.UNKNOWN;
            CityResponse r = response.get();
            String country = r.getCountry() != null && r.getCountry().getName() != null ? r.getCountry().getName() : "Unknown";
            String code = r.getCountry() != null && r.getCountry().getIsoCode() != null ? r.getCountry().getIsoCode() : "??";
            String city = r.getCity() != null && r.getCity().getName() != null ? r.getCity().getName() : "Unknown";
            return new Geo(country, code, city);
        } catch (Exception e) {
            log.debug("GeoIP lookup failed for {}: {}", ip, e.getMessage());
            return Geo.UNKNOWN;
        }
    }

    /** Only parses IP literals (never a host name), so it cannot trigger a DNS lookup. */
    private InetAddress parseLiteral(String ip) {
        if (ip == null) return null;
        boolean literal = ip.contains(":") ? IPV6.matcher(ip).matches() : IPV4.matcher(ip).matches();
        if (!literal) return null;
        try {
            return InetAddress.getByName(ip);
        } catch (Exception e) {
            return null;
        }
    }
}
