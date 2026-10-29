package com.virallink.redirect.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.time.LocalDateTime;

@Entity
@Table(name = "links", indexes = {
    @Index(name = "idx_short_code", columnList = "shortCode", unique = true)
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Link {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String shortCode;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String longUrl;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
    
    @Column(nullable = false)
    private Long userId; 

    /** Paused by the owner: stops redirecting until resumed. The DB default lets ddl-auto add it to existing rows. */
    @Column(nullable = false, columnDefinition = "boolean not null default false")
    private boolean paused;

    /** Optional end of life: from this instant on the link stops redirecting. */
    private Instant expiresAt;

    @Transient
    private long clickCount;

    /** "active", "paused" or "expired", as shown in the dashboard (serialized as {@code status}). */
    public String getStatus() {
        if (paused) return "paused";
        if (isExpiredAt(expiresAt, Instant.now())) return "expired";
        return "active";
    }

    public static boolean isExpiredAt(Instant expiresAt, Instant now) {
        return expiresAt != null && !now.isBefore(expiresAt);
    }
}
