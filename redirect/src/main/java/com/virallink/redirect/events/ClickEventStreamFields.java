package com.virallink.redirect.events;

/**
 * Field names for entries appended to the analytics Redis stream (see {@link #STREAM_KEY}).
 * <p>
 * <b>Ownership (Phase A):</b> each click is attributed to the link owner using {@link #USER_ID}
 * and the redirect-service primary key {@link #LINK_ID}. {@link #SHORT_CODE} stays on the event
 * for correlation with redirect caches, ops, and legacy readers.
 */
public final class ClickEventStreamFields {

    private ClickEventStreamFields() {}

    /**
     * Stream key shared with the analytics consumer (sponge).
     * Documented in {@code docs/click-events-stream.md} (canonical name; not {@code click_events}).
     */
    public static final String STREAM_KEY = "analytics:events";

    /** Link owner; required for tenant-scoped analytics once emitters populate it. */
    public static final String USER_ID = "userId";

    /** {@code links.id} in redirect-service PostgreSQL. */
    public static final String LINK_ID = "linkId";

    public static final String SHORT_CODE = "shortCode";
    public static final String IP = "ip";
    public static final String UA = "ua";
    public static final String REF = "ref";
    public static final String TIMESTAMP = "timestamp";
}
