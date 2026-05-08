package com.virallink.analytics.repository;

import com.virallink.analytics.model.LinkAnalytics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LinkAnalyticsRepository extends JpaRepository<LinkAnalytics, Long> {
    List<LinkAnalytics> findByShortCode(String shortCode);

    long countByUserId(Long userId);

    @Query("SELECT COUNT(l) FROM LinkAnalytics l WHERE l.userId = :userId AND l.clickedAt >= :after")
    long countByUserIdAndClickedAtAfter(@Param("userId") Long userId, @Param("after") java.time.LocalDateTime after);

    @Query(value = "SELECT COUNT(DISTINCT ip_address) FROM link_analytics WHERE user_id = :userId AND clicked_at >= :after", nativeQuery = true)
    long countDistinctIpSince(@Param("userId") Long userId, @Param("after") java.time.LocalDateTime after);

    @Query(value = "SELECT COALESCE(MAX(c),0) FROM (SELECT COUNT(*) AS c FROM link_analytics WHERE user_id = :userId AND clicked_at >= now() - interval '1 day' GROUP BY date_trunc('minute', clicked_at)) t", nativeQuery = true)
    long peakPerMinuteLastDay(@Param("userId") Long userId);

    @Query(value = "SELECT COALESCE(country, 'Unknown') AS country, COUNT(*) AS count FROM link_analytics WHERE user_id = :userId GROUP BY COALESCE(country, 'Unknown') ORDER BY count DESC LIMIT 20", nativeQuery = true)
    List<GeoCountProjection> topCountries(@Param("userId") Long userId);

    @Query(value = "SELECT COALESCE(referer, 'direct') AS referrer, COUNT(*) AS count FROM link_analytics WHERE user_id = :userId GROUP BY COALESCE(referer, 'direct') ORDER BY count DESC LIMIT 20", nativeQuery = true)
    List<ReferrerCountProjection> topReferrers(@Param("userId") Long userId);

    @Query(value = "SELECT date_trunc('hour', clicked_at) AS bucket, COUNT(*) AS count FROM link_analytics WHERE user_id = :userId AND clicked_at >= now() - interval '48 hour' GROUP BY bucket ORDER BY bucket", nativeQuery = true)
    List<TimeSeriesProjection> hourlyLast48h(@Param("userId") Long userId);

    interface GeoCountProjection {
        String getCountry();
        long getCount();
    }

    interface ReferrerCountProjection {
        String getReferrer();
        long getCount();
    }

    interface TimeSeriesProjection {
        java.time.LocalDateTime getBucket();
        long getCount();
    }
}
