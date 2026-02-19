package main.java.virallink.com.redirect.config;

public class HashidsConfig {
    @Value("${hashids.salt}")
    private String salt;

    @Value("${hashids.min-length:6}")
    private int minLength;

    @Bean
    public Hashids hashids() {
        // You can also provide a custom alphabet here if you want to be extra unique
        return new Hashids(salt, minLength);
    }
}
