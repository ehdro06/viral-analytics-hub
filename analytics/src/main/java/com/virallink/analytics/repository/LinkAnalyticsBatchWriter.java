package com.virallink.analytics.repository;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Writes clicks with a single JDBC batch instead of one INSERT round trip per click.
 * (JPA cannot batch inserts for IDENTITY ids, so the write path bypasses it.)
 */
@Repository
@RequiredArgsConstructor
public class LinkAnalyticsBatchWriter {

    public record ClickRow(String shortCode, Long ownerId, LocalDateTime clickedAt, String ipAddress,
                           String userAgent, String referer, String country, String countryCode, String city,
                           String deviceType, String browser, String os) {}

    private static final String INSERT = """
            INSERT INTO link_analytics (short_code, owner_id, clicked_at, ip_address, user_agent, referer,
                                        country, country_code, city, device_type, browser, os)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """;

    private final JdbcTemplate jdbc;

    @Transactional
    public void insertAll(List<ClickRow> rows) {
        if (rows.isEmpty()) return;
        jdbc.batchUpdate(INSERT, rows, rows.size(), (ps, r) -> {
            ps.setString(1, r.shortCode());
            ps.setObject(2, r.ownerId());
            ps.setObject(3, r.clickedAt()); // LocalDateTime -> "timestamp without time zone", no zone conversion
            ps.setString(4, r.ipAddress());
            ps.setString(5, r.userAgent());
            ps.setString(6, r.referer());
            ps.setString(7, r.country());
            ps.setString(8, r.countryCode());
            ps.setString(9, r.city());
            ps.setString(10, r.deviceType());
            ps.setString(11, r.browser());
            ps.setString(12, r.os());
        });
    }
}
