package com.cafe.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import com.cafe.service.CafeBootstrapService;

@Component
@Order(Ordered.LOWEST_PRECEDENCE)
public class CafeBootstrapSeeder implements ApplicationRunner {

    private final CafeBootstrapService cafeBootstrapService;

    public CafeBootstrapSeeder(CafeBootstrapService cafeBootstrapService) {
        this.cafeBootstrapService = cafeBootstrapService;
    }

    @Override
    public void run(ApplicationArguments args) {
        cafeBootstrapService.seedDefaultsForAllEmptyCafes();
    }
}
