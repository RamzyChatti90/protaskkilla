package com.protaskkilla.service;

import com.protaskkilla.domain.Task;
import com.protaskkilla.domain.enumeration.TaskStatus;
import com.protaskkilla.repository.TaskRepository;
import com.protaskkilla.security.SecurityUtils;
import com.protaskkilla.service.dto.TaskCountByDateDTO;
import com.protaskkilla.service.dto.TaskCountByStatusDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import java.util.Map;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaskDashboardServiceTest {

    @Mock
    private TaskRepository taskRepository;

    @InjectMocks
    private TaskDashboardService taskDashboardService;

    private final String TEST_USER_LOGIN = "testuser";

    @BeforeEach
    void setUp() {
        // Mock SecurityUtils.getCurrentUserLogin() for each test
        try (MockedStatic<SecurityUtils> mockedSecurityUtils = mockStatic(SecurityUtils.class)) {
            mockedSecurityUtils.when(SecurityUtils::getCurrentUserLogin).thenReturn(Optional.of(TEST_USER_LOGIN));
        }
    }

    @Test
    void getTotalTasksForCurrentUser_shouldReturnCorrectCount() {
        try (MockedStatic<SecurityUtils> mockedSecurityUtils = mockStatic(SecurityUtils.class)) {
            mockedSecurityUtils.when(SecurityUtils::getCurrentUserLogin).thenReturn(Optional.of(TEST_USER_LOGIN));
            when(taskRepository.countByUserLogin(TEST_USER_LOGIN)).thenReturn(10L);

            Long totalTasks = taskDashboardService.getTotalTasksForCurrentUser();

            assertThat(totalTasks).isEqualTo(10L);
            verify(taskRepository).countByUserLogin(TEST_USER_LOGIN);
        }
    }

    @Test
    void getTaskCountByStatusForCurrentUser_shouldReturnCorrectCounts() {
        try (MockedStatic<SecurityUtils> mockedSecurityUtils = mockStatic(SecurityUtils.class)) {
            mockedSecurityUtils.when(SecurityUtils::getCurrentUserLogin).thenReturn(Optional.of(TEST_USER_LOGIN));
            when(taskRepository.countByStatusAndUserLogin(TaskStatus.TODO, TEST_USER_LOGIN)).thenReturn(5L);
            when(taskRepository.countByStatusAndUserLogin(TaskStatus.IN_PROGRESS, TEST_USER_LOGIN)).thenReturn(3L);
            when(taskRepository.countByStatusAndUserLogin(TaskStatus.DONE, TEST_USER_LOGIN)).thenReturn(2L);
            when(taskRepository.countByStatusAndUserLogin(TaskStatus.CANCELLED, TEST_USER_LOGIN)).thenReturn(0L);

            List<TaskCountByStatusDTO> result = taskDashboardService.getTaskCountByStatusForCurrentUser();

            assertThat(result).hasSize(TaskStatus.values().length);
            assertThat(result).extracting(TaskCountByStatusDTO::getStatus).containsExactlyInAnyOrder(TaskStatus.values());
            assertThat(result).extracting(TaskCountByStatusDTO::getCount)
                .containsExactlyInAnyOrder(5L, 3L, 2L, 0L);
            verify(taskRepository, times(TaskStatus.values().length)).countByStatusAndUserLogin(any(TaskStatus.class), eq(TEST_USER_LOGIN));
        }
    }

    @Test
    void getCompletedTasksEvolutionForCurrentUser_shouldReturnCorrectCounts() {
        try (MockedStatic<SecurityUtils> mockedSecurityUtils = mockStatic(SecurityUtils.class)) {
            mockedSecurityUtils.when(SecurityUtils::getCurrentUserLogin).thenReturn(Optional.of(TEST_USER_LOGIN));
            int days = 3;
            LocalDate today = LocalDate.now();

            // Mock repository calls for specific dates
            when(taskRepository.countByStatusAndCreatedAtBetweenAndUserLogin(
                eq(TaskStatus.DONE),
                any(Instant.class),
                any(Instant.class),
                eq(TEST_USER_LOGIN)
            )).thenReturn(1L, 2L, 3L); // Counts for today, yesterday, day before yesterday

            List<TaskCountByDateDTO> result = taskDashboardService.getCompletedTasksEvolutionForCurrentUser(days);

            assertThat(result).hasSize(days);
            assertThat(result).extracting(TaskCountByDateDTO::getDate)
                .containsExactly(today, today.minusDays(1), today.minusDays(2));
            assertThat(result).extracting(TaskCountByDateDTO::getCount)
                .containsExactly(1L, 2L, 3L);

            verify(taskRepository, times(days)).countByStatusAndCreatedAtBetweenAndUserLogin(
                eq(TaskStatus.DONE),
                any(Instant.class),
                any(Instant.class),
                eq(TEST_USER_LOGIN)
            );
        }
    }

    @Test
    void getDashboardDataForCurrentUser_shouldAggregateAllData() {
        try (MockedStatic<SecurityUtils> mockedSecurityUtils = mockStatic(SecurityUtils.class)) {
            mockedSecurityUtils.when(SecurityUtils::getCurrentUserLogin).thenReturn(Optional.of(TEST_USER_LOGIN));
            when(taskRepository.countByUserLogin(TEST_USER_LOGIN)).thenReturn(10L);
            when(taskRepository.countByStatusAndUserLogin(TaskStatus.DONE, TEST_USER_LOGIN)).thenReturn(2L);
            when(taskRepository.countByStatusAndUserLogin(TaskStatus.TODO, TEST_USER_LOGIN)).thenReturn(5L);
            when(taskRepository.countByStatusAndUserLogin(TaskStatus.IN_PROGRESS, TEST_USER_LOGIN)).thenReturn(3L);
            when(taskRepository.countByStatusAndUserLogin(TaskStatus.CANCELLED, TEST_USER_LOGIN)).thenReturn(0L);

            // Mock the evolution data for 7 days
            when(taskRepository.countByStatusAndCreatedAtBetweenAndUserLogin(eq(TaskStatus.DONE), any(Instant.class), any(Instant.class), eq(TEST_USER_LOGIN)))
                .thenReturn(1L, 2L, 3L, 4L, 5L, 6L, 7L);

            Map<String, Object> dashboardData = taskDashboardService.getDashboardDataForCurrentUser(7);

            assertThat(dashboardData).isNotNull();
            assertThat(dashboardData).containsKey("totalTasks");
            assertThat(dashboardData.get("totalTasks")).isEqualTo(10L);

            assertThat(dashboardData).containsKey("tasksByStatus");
            List<TaskCountByStatusDTO> tasksByStatus = (List<TaskCountByStatusDTO>) dashboardData.get("tasksByStatus");
            assertThat(tasksByStatus).hasSize(TaskStatus.values().length);

            assertThat(dashboardData).containsKey("completedTasksEvolution");
            List<TaskCountByDateDTO> completedTasksEvolution = (List<TaskCountByDateDTO>) dashboardData.get("completedTasksEvolution");
            assertThat(completedTasksEvolution).hasSize(7);

            verify(taskRepository).countByUserLogin(TEST_USER_LOGIN);
            verify(taskRepository, times(TaskStatus.values().length)).countByStatusAndUserLogin(any(TaskStatus.class), eq(TEST_USER_LOGIN));
            verify(taskRepository, times(7)).countByStatusAndCreatedAtBetweenAndUserLogin(eq(TaskStatus.DONE), any(Instant.class), any(Instant.class), eq(TEST_USER_LOGIN));
        }
    }
}
