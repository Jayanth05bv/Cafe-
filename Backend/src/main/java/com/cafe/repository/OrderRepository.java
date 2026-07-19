package com.cafe.repository;

import com.cafe.entity.Order;
import com.cafe.entity.Order.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {

    Optional<Order> findByOrderNumber(String orderNumber);
    List<Order> findByCafeId(Long cafeId);
    List<Order> findByCafeIdAndStatus(Long cafeId, OrderStatus status);
    List<Order> findByCustomerId(Long customerId);
    List<Order> findByWaiterId(Long waiterId);
}
