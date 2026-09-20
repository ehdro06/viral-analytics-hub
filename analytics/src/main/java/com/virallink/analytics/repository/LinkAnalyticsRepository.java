package com.virallink.analytics.repository;

import com.virallink.analytics.model.LinkAnalytics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/** Every query is scoped to one owner: a user must never see another user's clicks. */
@Repository
public interface LinkAnalyticsRepository extends JpaRepository<LinkAnalytics, Long> {

    long countByOwnerId(Long ownerId);

    long countByOwnerIdAndClickedAtAfter(Long ownerId, LocalDateTime after);

    @Query(value = "SELECT COUNT(DISTINCT ip_address) FROM link_analytics WHERE owner_id = :ownerId AND clicked_at >= :after",
            nativeQuery = true)
    long countDistinctIpSince(@Param("ownerId") Long ownerId, @Param("after") LocalDateTime after);

    @Query(value = """
            SELECT COALESCE(MAX(c), 0) FROM (
                SELECT COUNT(*) AS c FROM link_analytics
                WHERE owner_id = :ownerId AND clicked_at >= :after
                GROUP BY date_trunc('minute', clicked_at)) t
            """, nativeQuery = true)
    long peakPerMinuteSince(@Param("ownerId") Long ownerId, @Param("after") LocalDateTime after);

    @Query(value = """
            SELECT COALESCE(country, 'Unknown') AS country, COALESCE(country_code, '??') AS code, COUNT(*) AS count
            FROM link_analytics WHERE owner_id = :ownerId
            GROUP BY COALESCE(country, 'Unknown'), COALESCE(country_code, '??')
            ORDER BY count DESC LIMIT 20
            """, nativeQuery = true)
    List<GeoCountProjection> topCountries(@Param("ownerId") Long ownerId);

    @Query(value = """
            SELECT COALESCE(referer, 'direct') AS referrer, COUNT(*) AS count
            FROM link_analytics WHERE owner_id = :ownerId
            GROUP BY COALESCE(referer, 'direct') ORDER BY count DESC LIMIT 20
            """, nativeQuery = true)
    List<ReferrerCountProjection> topReferrers(@Param("ownerId") Long ownerId);

    @Query(value = """
            SELECT date_trunc('hour', clicked_at) AS bucket, COUNT(*) AS count
            FROM link_analytics WHERE owner_id = :ownerId AND clicked_at >= :after
            GROUP BY bucket ORDER BY bucket
            """, nativeQuery = true)
    List<TimeSeriesProjection> hourlySince(@Param("ownerId") Long ownerId, @Param("after") LocalDateTime after);

    interface GeoCountProjection {
        String getCountry();
        String getCode();
        long getCount();
    }

    interface ReferrerCountProjection {
        String getReferrer();
        long getCount();
    }

    interface TimeSeriesProjection {
        LocalDateTime getBucket();
        long getCount();
    }
}
