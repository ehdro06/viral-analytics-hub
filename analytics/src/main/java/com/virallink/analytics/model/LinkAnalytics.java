package com.virallink.analytics.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "link_analytics")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LinkAnalytics {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 20)
    private String shortCode; // Foreign key-like reference to the link service

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime clickedAt;

    private String ipAddress;
    
    @Column(length = 1000)
    private String userAgent;
    
    @Column(length = 1000)
    private String referer;
    
    // Geolocation data
    private String country;
    private String city;
    
    // Device info parsed from UA
    private String deviceType;
    private String browser;
    private String os;
}
