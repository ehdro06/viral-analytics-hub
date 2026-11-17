package com.virallink.redirect.service;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.net.InetAddress;

import static org.assertj.core.api.Assertions.assertThat;

/** The expander's SSRF guard: which addresses it refuses to contact. Literal IPs only, no DNS. */
class UrlExpandAddressTest {

    @ParameterizedTest
    @ValueSource(strings = {
            "0.0.0.0", "0.1.2.3", "10.138.0.2", "100.64.0.1", "100.127.255.254", "127.0.0.1", "169.254.169.254",
            "172.16.0.1", "172.31.255.255", "192.0.0.8", "192.168.1.1", "198.18.0.1", "198.19.255.255",
            "224.0.0.1", "240.0.0.1", "255.255.255.255",
            "::", "::1", "fe80::1", "fc00::1", "fd12:3456::1", "ff02::1", "::ffff:10.0.0.1", "::ffff:169.254.169.254"
    })
    void refusesNonPublic(String ip) throws Exception {
        assertThat(UrlExpandService.isNonPublic(InetAddress.getByName(ip))).isTrue();
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "8.8.8.8", "1.1.1.1", "100.63.255.255", "100.128.0.1", "172.15.0.1", "172.32.0.1", "192.0.1.1",
            "198.17.0.1", "198.20.0.1", "223.255.255.254", "2001:4860:4860::8888", "2606:4700::1111"
    })
    void allowsPublic(String ip) throws Exception {
        assertThat(UrlExpandService.isNonPublic(InetAddress.getByName(ip))).isFalse();
    }
}
