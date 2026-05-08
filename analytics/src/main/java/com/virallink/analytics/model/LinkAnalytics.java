package com.virallink.analytics.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "link_analytics",
        indexes = @Index(name = "idx_link_analytics_user_id", columnList = "user_id")
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LinkAnalytics {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Link owner (denormalized from redirect service). */
    @Column(name = "user_id")
    private Long userId;

    /** {@code links.id} in redirect DB. */
    @Column(name = "link_id")
    private Long linkId;

    @Column(nullable = false, length = 20)
    private String shortCode;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime clickedAt;

    private String ipAddress;

    @Column(length = 1000)
    private String userAgent;

    @Column(length = 1000)
    private String referer;

    private String country;
    private String city;

    private String deviceType;
    private String browser;
    private String os;
}
