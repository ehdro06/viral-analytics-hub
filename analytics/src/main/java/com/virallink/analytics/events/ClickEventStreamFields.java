package com.virallink.analytics.events;

/**
 * Field names for entries read from the click Redis stream. Must stay in lockstep with
 * {@code com.virallink.redirect.events.ClickEventStreamFields} in the redirect service.
 * <p>
 * <b>Ownership:</b> {@link #USER_ID} and {@link #LINK_ID} are the source of truth for scoping
 * analytics to a tenant; {@link #SHORT_CODE} is auxiliary correlation data.
 */
public final class ClickEventStreamFields {

    private ClickEventStreamFields() {}

    /** See {@code docs/click-events-stream.md}. */
    public static final String STREAM_KEY = "analytics:events";

    public static final String USER_ID = "userId";
    public static final String LINK_ID = "linkId";

    public static final String SHORT_CODE = "shortCode";
    public static final String IP = "ip";
    public static final String UA = "ua";
    public static final String REF = "ref";
    public static final String TIMESTAMP = "timestamp";
}
