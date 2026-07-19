package com.cafe.repository;

import com.cafe.entity.CafeTable;
import com.cafe.entity.CafeTable.TableStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CafeTableRepository extends JpaRepository<CafeTable, Long> {

    List<CafeTable> findByCafeId(Long cafeId);
    List<CafeTable> findByCafeIdAndStatus(Long cafeId, TableStatus status);
    Optional<CafeTable> findByIdAndCafeId(Long id, Long cafeId);
    Optional<CafeTable> findFirstByCafeIdAndStatusOrderByIdAsc(Long cafeId, TableStatus status);
    Optional<CafeTable> findFirstByCafeIdAndStatusAndLocationOrderByIdAsc(
            Long cafeId, TableStatus status, CafeTable.TableLocation location
    );
}
