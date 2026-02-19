package virallink.redirect.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

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
    
    // Optional: User ID if we want to associate links with users later
    // private String userId; 
}
