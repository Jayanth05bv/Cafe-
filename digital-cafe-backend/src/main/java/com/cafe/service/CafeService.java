package com.cafe.service;

import com.cafe.entity.Cafe;
import com.cafe.entity.CafeTable;
import com.cafe.entity.Menu;
import com.cafe.repository.CafeRepository;
import com.cafe.repository.CafeTableRepository;
import com.cafe.repository.MenuRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CafeService {

    private final CafeRepository cafeRepository;
    private final CafeTableRepository cafeTableRepository;
    private final MenuRepository menuRepository;

    public CafeService(CafeRepository cafeRepository, CafeTableRepository cafeTableRepository,
                       MenuRepository menuRepository) {
        this.cafeRepository = cafeRepository;
        this.cafeTableRepository = cafeTableRepository;
        this.menuRepository = menuRepository;
    }

    @Transactional(readOnly = true)
    public List<Cafe> findAll() {
        return cafeRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Cafe findById(Long id) {
        return cafeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Cafe not found: " + id));
    }

    @Transactional
    public Cafe create(Cafe cafe) {
        return cafeRepository.save(cafe);
    }

    @Transactional
    public Cafe update(Long id, Cafe updates) {
        Cafe cafe = findById(id);
        if (updates.getName() != null) cafe.setName(updates.getName());
        if (updates.getAddress() != null) cafe.setAddress(updates.getAddress());
        if (updates.getPhone() != null) cafe.setPhone(updates.getPhone());
        if (updates.getDescription() != null) cafe.setDescription(updates.getDescription());
        if (updates.getLogoUrl() != null) cafe.setLogoUrl(updates.getLogoUrl());
        if (updates.getImageUrls() != null) cafe.setImageUrls(updates.getImageUrls());
        if (updates.getBankAccount() != null) cafe.setBankAccount(updates.getBankAccount());
        if (updates.getBankAccountHolder() != null) cafe.setBankAccountHolder(updates.getBankAccountHolder());
        if (updates.getBankName() != null) cafe.setBankName(updates.getBankName());
        if (updates.getBankAccountNumber() != null) cafe.setBankAccountNumber(updates.getBankAccountNumber());
        if (updates.getBankIfscCode() != null) cafe.setBankIfscCode(updates.getBankIfscCode());
        if (updates.getRevenue() != null) cafe.setRevenue(updates.getRevenue());
        return cafeRepository.save(cafe);
    }

    @Transactional(readOnly = true)
    public List<CafeTable> getTables(Long cafeId) {
        return cafeTableRepository.findByCafeId(cafeId);
    }

    @Transactional(readOnly = true)
    public List<Menu> getMenu(Long cafeId) {
        return menuRepository.findByCafeIdAndAvailableTrue(cafeId);
    }

    @Transactional(readOnly = true)
    public List<Menu> getMenuForOwner(Long cafeId) {
        return menuRepository.findByCafeId(cafeId);
    }

    @Transactional
    public Menu addMenuItem(Long cafeId, Menu menu) {
        Cafe cafe = findById(cafeId);
        menu.setCafe(cafe);
        return menuRepository.save(menu);
    }

    @Transactional
    public Menu updateMenuItem(Long cafeId, Long menuId, Menu updates) {
        Menu menu = menuRepository.findById(menuId)
                .orElseThrow(() -> new IllegalArgumentException("Menu item not found: " + menuId));
        if (menu.getCafe() == null || !menu.getCafe().getId().equals(cafeId)) {
            throw new IllegalArgumentException("Menu item does not belong to this cafe");
        }
        if (updates.getName() != null) menu.setName(updates.getName());
        if (updates.getDescription() != null) menu.setDescription(updates.getDescription());
        if (updates.getImageUrls() != null) menu.setImageUrls(updates.getImageUrls());
        if (updates.getPrice() != null) menu.setPrice(updates.getPrice());
        if (updates.getCategory() != null) menu.setCategory(updates.getCategory());
        if (updates.isAvailable() != menu.isAvailable()) menu.setAvailable(updates.isAvailable());
        return menuRepository.save(menu);
    }

    @Transactional
    public CafeTable addTable(Long cafeId, CafeTable table) {
        Cafe cafe = findById(cafeId);
        table.setCafe(cafe);
        if (table.getLocation() == null) {
            table.setLocation(CafeTable.TableLocation.INDOOR);
        }
        return cafeTableRepository.save(table);
    }

    @Transactional
    public CafeTable updateTable(Long cafeId, Long tableId, CafeTable updates) {
        CafeTable table = cafeTableRepository.findById(tableId)
                .orElseThrow(() -> new IllegalArgumentException("Table not found: " + tableId));
        if (table.getCafe() == null || !table.getCafe().getId().equals(cafeId)) {
            throw new IllegalArgumentException("Table does not belong to this cafe");
        }
        if (updates.getTableNumber() != null) table.setTableNumber(updates.getTableNumber());
        if (updates.getCapacity() != null) table.setCapacity(updates.getCapacity());
        if (updates.getStatus() != null) table.setStatus(updates.getStatus());
        if (updates.getLocation() != null) table.setLocation(updates.getLocation());
        return cafeTableRepository.save(table);
    }

    @Transactional
    public void deleteTable(Long cafeId, Long tableId) {
        CafeTable table = cafeTableRepository.findByIdAndCafeId(tableId, cafeId)
                .orElseThrow(() -> new IllegalArgumentException("Table not found for this cafe"));
        cafeTableRepository.delete(table);
    }
}
