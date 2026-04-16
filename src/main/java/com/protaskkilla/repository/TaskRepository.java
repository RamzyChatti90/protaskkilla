package com.protaskkilla.repository;

import com.protaskkilla.domain.Task;
import com.protaskkilla.domain.enumeration.TaskStatus;
import java.time.Instant;
import java.util.List;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for the Task entity.
 */
@SuppressWarnings("unused")
@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    Long countByUserLogin(String login);

    List<Task> findByUserLogin(String login);

    Long countByStatusAndUserLogin(TaskStatus status, String login);

    Long countByStatusAndCreatedAtBetweenAndUserLogin(TaskStatus status, Instant start, Instant end, String login);
}
