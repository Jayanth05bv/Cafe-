package com.cafe.websocket;

import com.cafe.entity.Order;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
public class OrderStatusNotifier {

    private static final String DESTINATION_PREFIX = "/topic/orders/";

    private final SimpMessagingTemplate messagingTemplate;

    public OrderStatusNotifier(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void notifyOrderStatus(Long cafeId, Order order) {
        String destination = DESTINATION_PREFIX + cafeId;
        Map<String, Object> payload = new HashMap<>();
        payload.put("orderId", order.getId());
        payload.put("orderNumber", order.getOrderNumber());
        payload.put("status", order.getStatus().name());
        payload.put("totalAmount", order.getTotalAmount());
        messagingTemplate.convertAndSend(destination, payload);
    }
}
