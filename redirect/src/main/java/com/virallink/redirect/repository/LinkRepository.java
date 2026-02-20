package com.virallink.redirect.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.virallink.redirect.model.Link;

import java.util.List;
import java.util.Optional;

@Repository
public interface LinkRepository extends JpaRepository<Link, Long> {
    Optional<Link> findByShortCode(String shortCode);
    List<Link> findByUserId(Long userId);
    Optional<Link> findByIdAndUserId(Long id, Long userId);
}
