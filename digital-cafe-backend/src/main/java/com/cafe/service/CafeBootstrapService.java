package com.cafe.service;

import com.cafe.entity.Cafe;
import com.cafe.entity.CafeTable;
import com.cafe.entity.Menu;
import com.cafe.repository.CafeRepository;
import com.cafe.repository.CafeTableRepository;
import com.cafe.repository.MenuRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class CafeBootstrapService {

    private final CafeRepository cafeRepository;
    private final CafeTableRepository cafeTableRepository;
    private final MenuRepository menuRepository;

    public CafeBootstrapService(CafeRepository cafeRepository,
                                CafeTableRepository cafeTableRepository,
                                MenuRepository menuRepository) {
        this.cafeRepository = cafeRepository;
        this.cafeTableRepository = cafeTableRepository;
        this.menuRepository = menuRepository;
    }

    @Transactional
    public void seedDefaultsForCafe(Long cafeId) {
        Cafe cafe = cafeRepository.findById(cafeId)
                .orElseThrow(() -> new IllegalArgumentException("Cafe not found: " + cafeId));

        if (cafeTableRepository.findByCafeId(cafeId).isEmpty()) {
            cafeTableRepository.saveAll(buildDefaultTables(cafe));
        }
        if (menuRepository.findByCafeId(cafeId).isEmpty()) {
            menuRepository.saveAll(buildDefaultMenu(cafe));
        }
    }

    @Transactional
    public void seedDefaultsForAllEmptyCafes() {
        for (Cafe cafe : cafeRepository.findAll()) {
            seedDefaultsForCafe(cafe.getId());
        }
    }

    private List<CafeTable> buildDefaultTables(Cafe cafe) {
        String prefix = createTablePrefix(cafe.getName());
        return List.of(
                createTable(cafe, prefix + "-1", 2, CafeTable.TableLocation.WINDOW),
                createTable(cafe, prefix + "-2", 4, CafeTable.TableLocation.INDOOR),
                createTable(cafe, prefix + "-3", 6, CafeTable.TableLocation.OUTDOOR),
                createTable(cafe, prefix + "-4", 4, CafeTable.TableLocation.INDOOR)
        );
    }

    private List<Menu> buildDefaultMenu(Cafe cafe) {
        String cafeName = cafe.getName() == null ? "Cafe" : cafe.getName().trim();
        return List.of(
                createMenu(cafe, cafeName + " Special Coffee", "House signature brewed coffee.", "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085", "180", Menu.Category.BEVERAGE),
                createMenu(cafe, "Classic Cappuccino", "Balanced espresso with rich milk foam.", "https://images.unsplash.com/photo-1509042239860-f550ce710b93", "160", Menu.Category.BEVERAGE),
                createMenu(cafe, "Veg Sandwich", "Grilled sandwich with fresh vegetables and house spread.", "https://images.unsplash.com/photo-1528735602780-2552fd46c7af", "220", Menu.Category.FOOD),
                createMenu(cafe, "Chocolate Brownie", "Warm brownie served with soft chocolate center.", "https://images.unsplash.com/photo-1606313564200-e75d5e30476c", "150", Menu.Category.DESSERT)
        );
    }

    private CafeTable createTable(Cafe cafe, String tableNumber, int capacity, CafeTable.TableLocation location) {
        CafeTable table = new CafeTable();
        table.setCafe(cafe);
        table.setTableNumber(tableNumber);
        table.setCapacity(capacity);
        table.setStatus(CafeTable.TableStatus.AVAILABLE);
        table.setLocation(location);
        return table;
    }

    private Menu createMenu(Cafe cafe, String name, String description, String imageUrl, String price, Menu.Category category) {
        Menu menu = new Menu();
        menu.setCafe(cafe);
        menu.setName(name);
        menu.setDescription(description);
        menu.setImageUrls(imageUrl);
        menu.setPrice(new BigDecimal(price));
        menu.setCategory(category);
        menu.setAvailable(true);
        return menu;
    }

    private String createTablePrefix(String cafeName) {
        if (cafeName == null || cafeName.isBlank()) {
            return "TB";
        }
        String letters = cafeName.replaceAll("[^A-Za-z ]", "")
                .trim()
                .replaceAll("\\s+", " ");
        if (letters.isBlank()) {
            return "TB";
        }
        String[] parts = letters.split(" ");
        StringBuilder prefix = new StringBuilder();
        for (String part : parts) {
            if (!part.isBlank()) {
                prefix.append(Character.toUpperCase(part.charAt(0)));
            }
            if (prefix.length() == 2) {
                break;
            }
        }
        if (prefix.length() == 1 && parts[0].length() > 1) {
            prefix.append(Character.toUpperCase(parts[0].charAt(1)));
        }
        if (prefix.isEmpty()) {
            return "TB";
        }
        return prefix.toString();
    }
}
