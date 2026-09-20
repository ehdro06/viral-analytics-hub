package com.virallink.redirect.util;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.Arrays;
import java.util.regex.Pattern;

/**
 * GDPR helper: truncates an IP address before it is stored anywhere.
 * <ul>
 *   <li>IPv4: last octet zeroed (203.0.113.42 -> 203.0.113.0)</li>
 *   <li>IPv6: only the first 48 bits kept (2001:db8:1234:5678::1 -> 2001:db8:1234:0:0:0:0:0)</li>
 * </ul>
 * Only accepts IP literals, so it can never trigger a DNS lookup on attacker-controlled input.
 */
public final class IpAnonymizer {

    public static final String UNKNOWN = "unknown";

    private static final Pattern IPV4 = Pattern.compile("^\\d{1,3}(\\.\\d{1,3}){3}$");
    private static final Pattern IPV6 = Pattern.compile("^[0-9a-fA-F:.]+$");

    private IpAnonymizer() {}

    public static String anonymize(String ip) {
        if (ip == null) return UNKNOWN;
        String candidate = ip.trim();
        boolean literal = candidate.contains(":") ? IPV6.matcher(candidate).matches() : IPV4.matcher(candidate).matches();
        if (!literal) return UNKNOWN;

        try {
            byte[] bytes = InetAddress.getByName(candidate).getAddress();
            if (bytes.length == 4) {
                bytes[3] = 0;
            } else {
                Arrays.fill(bytes, 6, bytes.length, (byte) 0);
            }
            return InetAddress.getByAddress(bytes).getHostAddress();
        } catch (UnknownHostException e) {
            return UNKNOWN;
        }
    }
}
