package com.protaskkilla.service;

import com.protaskkilla.domain.enumeration.TaskStatus;
import com.protaskkilla.repository.TaskRepository;
import com.protaskkilla.security.SecurityUtils;
import com.protaskkilla.service.dto.TaskCountByDateDTO;
import com.protaskkilla.service.dto.TaskCountByStatusDTO;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class TaskDashboardService {

    private final Logger log = LoggerFactory.getLogger(TaskDashboardService.class);

    private final TaskRepository taskRepository;

    public TaskDashboardService(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    /**
     * Get the total number of tasks for the current user.
     * @return the total number of tasks.
     */
    public Long getTotalTasksForCurrentUser() {
        String userLogin = SecurityUtils.getCurrentUserLogin().orElseThrow(() -> new IllegalStateException("Current user login not found"));
        log.debug("Request to get total tasks for user: {}", userLogin);
        return taskRepository.countByUserLogin(userLogin);
    }

    /**
     * Get the task count by status for the current user.
     * @return a list of TaskCountByStatusDTO.
     */
    public List<TaskCountByStatusDTO> getTaskCountByStatusForCurrentUser() {
        String userLogin = SecurityUtils.getCurrentUserLogin().orElseThrow(() -> new IllegalStateException("Current user login not found"));
        log.debug("Request to get task count by status for user: {}", userLogin);

        return Arrays.stream(TaskStatus.values())
            .map(status -> new TaskCountByStatusDTO(status, taskRepository.countByStatusAndUserLogin(status, userLogin)))
            .collect(Collectors.toList());
    }

    /**
     * Get the evolution of completed tasks for the current user over a given number of days.
     * @param days the number of days to look back.
     * @return a list of TaskCountByDateDTO.
     */
    public List<TaskCountByDateDTO> getCompletedTasksEvolutionForCurrentUser(int days) {
        String userLogin = SecurityUtils.getCurrentUserLogin().orElseThrow(() -> new IllegalStateException("Current user login not found"));
        log.debug("Request to get completed tasks evolution for user: {} over {} days", userLogin, days);

        LocalDate endDate = LocalDate.now();
        return java.util.stream.IntStream.range(0, days)
            .mapToObj(i -> endDate.minusDays(i))
            .map(date -> {
                Instant startOfDay = date.atStartOfDay(ZoneId.systemDefault()).toInstant();
                Instant endOfDay = date.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant();
                Long count = taskRepository.countByStatusAndCreatedAtBetweenAndUserLogin(TaskStatus.DONE, startOfDay, endOfDay, userLogin);
                return new TaskCountByDateDTO(date, count);
            })
            .collect(Collectors.toList());
    }

    /**
     * Get all dashboard data for the current user.
     * @return a map containing all dashboard statistics.
     */
    public Map<String, Object> getDashboardDataForCurrentUser(int daysForEvolution) {
        Map<String, Object> dashboardData = new java.util.HashMap<>();
        dashboardData.put("totalTasks", getTotalTasksForCurrentUser());
        dashboardData.put("tasksByStatus", getTaskCountByStatusForCurrentUser());
        dashboardData.put("completedTasksEvolution", getCompletedTasksEvolutionForCurrentUser(daysForEvolution));
        return dashboardData;
    }
}
