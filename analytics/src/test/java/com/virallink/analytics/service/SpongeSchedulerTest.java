package com.virallink.analytics.service;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

class SpongeSchedulerTest {

    private final ApplicationContextRunner runner = new ApplicationContextRunner()
            .withBean(AnalyticsSpongeService.class, () -> mock(AnalyticsSpongeService.class))
            .withUserConfiguration(SpongeScheduler.class);

    @Test
    void pollsByDefault() {
        runner.run(ctx -> assertThat(ctx).hasSingleBean(SpongeScheduler.class));
    }

    @Test
    void noPollingInOnDemandMode() {
        runner.withPropertyValues("analytics.sponge.mode=on-demand")
                .run(ctx -> assertThat(ctx).doesNotHaveBean(SpongeScheduler.class));
    }
}
