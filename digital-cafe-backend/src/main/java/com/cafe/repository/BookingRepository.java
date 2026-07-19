package com.cafe.repository;

import com.cafe.entity.Booking;
import com.cafe.entity.Booking.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByUserId(Long userId);
    List<Booking> findByCafeTableCafeId(Long cafeId);
    List<Booking> findByBookingTimeBetweenAndStatus(LocalDateTime start, LocalDateTime end, BookingStatus status);
}
