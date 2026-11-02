package com.virallink.user.service;

import com.virallink.user.model.ApiKey;
import com.virallink.user.model.User;
import com.virallink.user.repository.ApiKeyRepository;
import com.virallink.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InOrder;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyIterable;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class UserServiceDeleteTest {

    private final UserRepository users = mock(UserRepository.class);
    private final ApiKeyRepository apiKeys = mock(ApiKeyRepository.class);
    private final StringRedisTemplate redis = mock(StringRedisTemplate.class);
    @SuppressWarnings("unchecked")
    private final ValueOperations<String, String> ops = mock(ValueOperations.class);
    private UserService service;
    private final User user = new User();

    @BeforeEach
    void setUp() {
        when(redis.opsForValue()).thenReturn(ops);
        service = new UserService(users, apiKeys, redis);
        user.setId(42L);
    }

    @Test
    void marksTheAccountDeletedBeforeRemovingKeysAndUser() {
        List<ApiKey> keys = List.of(new ApiKey());
        when(apiKeys.findByUserId(42L)).thenReturn(keys);

        service.deleteAccount(user);

        InOrder order = inOrder(ops, apiKeys, users);
        order.verify(ops).set("auth:deleted-user:42", "1");
        order.verify(apiKeys).deleteAll(keys);
        order.verify(users).delete(user);
    }

    @Test
    void redisDown_NothingIsDeleted() {
        doThrow(new RedisConnectionFailureException("down")).when(ops).set(any(), any());

        assertThatThrownBy(() -> service.deleteAccount(user)).isInstanceOf(RedisConnectionFailureException.class);
        verify(apiKeys, never()).deleteAll(anyIterable());
        verify(users, never()).delete(any());
    }
}
