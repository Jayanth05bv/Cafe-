package com.cafe.repository;

import com.cafe.entity.Menu;
import com.cafe.entity.Menu.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MenuRepository extends JpaRepository<Menu, Long> {

    List<Menu> findByCafeId(Long cafeId);
    List<Menu> findByCafeIdAndAvailableTrue(Long cafeId);
    List<Menu> findByCafeIdAndCategory(Long cafeId, Category category);
}
