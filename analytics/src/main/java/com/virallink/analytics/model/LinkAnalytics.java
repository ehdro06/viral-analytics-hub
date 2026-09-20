package com.virallink.analytics.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * One row per click. Rows are written by {@code LinkAnalyticsBatchWriter} (JDBC batch insert); this entity
 * exists so Hibernate manages the schema and Spring Data can serve the read queries.
 * All timestamps are UTC.
 */
@Entity
@Table(name = "link_analytics", indexes = {
        @Index(name = "idx_link_analytics_owner_clicked", columnList = "owner_id, clicked_at")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LinkAnalytics {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "short_code", nullable = false, length = 20)
    private String shortCode;

    /** User who owns the link that was clicked. Every read query is scoped by this. */
    @Column(name = "owner_id")
    private Long ownerId;

    @Column(name = "clicked_at", nullable = false, updatable = false)
    private LocalDateTime clickedAt;

    /** Already anonymised by the redirect service (last IPv4 octet / last 80 IPv6 bits zeroed). */
    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "user_agent", length = 1000)
    private String userAgent;

    /** Referrer host only (e.g. "twitter.com") or "direct". Paths and query strings are dropped for privacy. */
    @Column(length = 255)
    private String referer;

    private String country;

    @Column(name = "country_code", length = 8)
    private String countryCode;

    private String city;

    private String deviceType;
    private String browser;
    private String os;
}
