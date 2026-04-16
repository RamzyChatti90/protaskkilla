package com.protaskkilla.service.dto;

import java.io.Serializable;
import java.time.LocalDate;
import java.util.Objects;

public class TaskCountByDateDTO implements Serializable {

    private LocalDate date;
    private Long count;

    public TaskCountByDateDTO(LocalDate date, Long count) {
        this.date = date;
        this.count = count;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public Long getCount() {
        return count;
    }

    public void setCount(Long count) {
        this.count = count;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (o == null || getClass() != o.getClass()) {
            return false;
        }
        TaskCountByDateDTO that = (TaskCountByDateDTO) o;
        return Objects.equals(date, that.date) && Objects.equals(count, that.count);
    }

    @Override
    public int hashCode() {
        return Objects.hash(date, count);
    }

    @Override
    public String toString() {
        return "TaskCountByDateDTO{" +
               "date=" + date +
               ", count=" + count +
               '}';
    }
}
