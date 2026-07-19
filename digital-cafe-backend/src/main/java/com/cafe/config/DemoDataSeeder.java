package com.cafe.config;

import com.cafe.entity.Cafe;
import com.cafe.entity.CafeTable;
import com.cafe.entity.Menu;
import com.cafe.entity.Profile;
import com.cafe.entity.Role;
import com.cafe.entity.User;
import com.cafe.repository.CafeRepository;
import com.cafe.repository.CafeTableRepository;
import com.cafe.repository.MenuRepository;
import com.cafe.repository.RoleRepository;
import com.cafe.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Component
@org.springframework.core.annotation.Order(2)
public class DemoDataSeeder implements ApplicationRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final CafeRepository cafeRepository;
    private final CafeTableRepository cafeTableRepository;
    private final MenuRepository menuRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed-demo:false}")
    private boolean seedDemo;

    public DemoDataSeeder(RoleRepository roleRepository,
                          UserRepository userRepository,
                          CafeRepository cafeRepository,
                          CafeTableRepository cafeTableRepository,
                          MenuRepository menuRepository,
                          PasswordEncoder passwordEncoder) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.cafeRepository = cafeRepository;
        this.cafeTableRepository = cafeTableRepository;
        this.menuRepository = menuRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!seedDemo) {
            return;
        }
        if (userRepository.existsByUsername("owner.cafe1")) {
            return;
        }

        List<Cafe> cafes = List.of(
            createCafe(
                "Central Perk Cafe",
                "Connaught Place, New Delhi",
                "+91-9810001000",
                "Busy city cafe for office and casual visitors.",
                "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085"
            ),
            createCafe(
                "Riverside Roast",
                "Marine Drive, Mumbai",
                "+91-9810002000",
                "Coffee, desserts, and sunset seating.",
                "https://images.unsplash.com/photo-1509042239860-f550ce710b93"
            ),
            createCafe(
                "TechBrew Hub",
                "Koramangala, Bengaluru",
                "+91-9810003000",
                "Laptop-friendly cafe with quick service and work tables.",
                "https://images.unsplash.com/photo-1523942839745-7848d4a04d76"
            ),
            createCafe(
                "Garden Bean House",
                "Banjara Hills, Hyderabad",
                "+91-9810004000",
                "Relaxed garden cafe with family seating.",
                "https://images.unsplash.com/photo-1554118811-1e0d58224f24"
            ),
            createCafe(
                "Sunrise Sips",
                "MG Road, Pune",
                "+91-9810005000",
                "Neighborhood cafe focused on breakfast and coffee.",
                "https://images.unsplash.com/photo-1517705008128-361805f42e86"
            )
        );

        String[] prefixes = {"CP", "RS", "TB", "GB", "SS"};
        for (int i = 0; i < cafes.size(); i++) {
            Cafe cafe = cafes.get(i);
            createTables(cafe, prefixes[i]);
            createMenu(cafe, defaultMenuRows(cafe.getName()));
            createUser(
                    "owner.cafe" + (i + 1),
                    "owner.cafe" + (i + 1) + "@digitalcafe.local",
                    "demo123",
                    Role.RoleName.OWNER,
                    cafe,
                    ownerFirstName(i),
                    ownerLastName(i)
            );
        }

        for (int i = 0; i < 10; i++) {
            Cafe assignedCafe = cafes.get(i % cafes.size());
            createStaff(
                    "chef" + (i + 1),
                    "chef" + (i + 1) + "@digitalcafe.local",
                    assignedCafe,
                    "ChefFirst" + (i + 1),
                    "ChefLast" + (i + 1)
            );
            createWaiter(
                    "waiter" + (i + 1),
                    "waiter" + (i + 1) + "@digitalcafe.local",
                    assignedCafe,
                    "WaiterFirst" + (i + 1),
                    "WaiterLast" + (i + 1)
            );
        }

        for (int i = 0; i < 20; i++) {
            createUser(
                    "customer" + (i + 1),
                    "customer" + (i + 1) + "@digitalcafe.local",
                    "demo123",
                    Role.RoleName.CUSTOMER,
                    null,
                    "CustomerFirst" + (i + 1),
                    "CustomerLast" + (i + 1)
            );
        }
    }

    private Cafe createCafe(String name, String address, String phone, String description, String imageUrl) {
        Cafe cafe = new Cafe();
        cafe.setName(name);
        cafe.setAddress(address);
        cafe.setPhone(phone);
        cafe.setDescription(description);
        cafe.setImageUrls(imageUrl);
        cafe.setRevenue(BigDecimal.ZERO);
        return cafeRepository.save(cafe);
    }

    private void createTables(Cafe cafe, String prefix) {
        createTable(cafe, prefix + "-1", 2, CafeTable.TableLocation.WINDOW);
        createTable(cafe, prefix + "-2", 4, CafeTable.TableLocation.INDOOR);
        createTable(cafe, prefix + "-3", 6, CafeTable.TableLocation.OUTDOOR);
    }

    private void createTable(Cafe cafe, String tableNumber, int capacity, CafeTable.TableLocation location) {
        CafeTable table = new CafeTable();
        table.setCafe(cafe);
        table.setTableNumber(tableNumber);
        table.setCapacity(capacity);
        table.setLocation(location);
        table.setStatus(CafeTable.TableStatus.AVAILABLE);
        cafeTableRepository.save(table);
    }

    private List<Menu> createMenu(Cafe cafe, List<MenuSeedRow> rows) {
        return rows.stream().map(row -> {
            Menu menu = new Menu();
            menu.setCafe(cafe);
            menu.setName(row.name());
            menu.setDescription(row.description());
            menu.setPrice(BigDecimal.valueOf(row.price()));
            menu.setCategory(row.category());
            menu.setAvailable(true);
            return menuRepository.save(menu);
        }).toList();
    }

    private List<MenuSeedRow> defaultMenuRows(String cafeName) {
        return List.of(
                menuRow(cafeName + " Special Coffee", "House coffee special", 180, Menu.Category.BEVERAGE),
                menuRow("Classic Cappuccino", "Milk coffee", 160, Menu.Category.BEVERAGE),
                menuRow("Veg Sandwich", "Grilled veg sandwich", 220, Menu.Category.FOOD),
                menuRow("Chocolate Brownie", "Fresh dessert", 150, Menu.Category.DESSERT)
        );
    }

    private String ownerFirstName(int index) {
        return List.of("Aarav", "Siya", "Vivaan", "Ishita", "Kunal").get(index);
    }

    private String ownerLastName(int index) {
        return List.of("Mehta", "Kapoor", "Rao", "Shah", "Bose").get(index);
    }

    private User createStaff(String username, String email, Cafe cafe, String firstName, String lastName) {
        return createUser(username, email, "demo123", Role.RoleName.CHEF, cafe, firstName, lastName);
    }

    private User createWaiter(String username, String email, Cafe cafe, String firstName, String lastName) {
        return createUser(username, email, "demo123", Role.RoleName.WAITER, cafe, firstName, lastName);
    }

    private User createUser(String username, String email, String password, Role.RoleName roleName, Cafe cafe, String firstName, String lastName) {
        Role role = roleRepository.findByName(roleName).orElseThrow();
        Profile profile = new Profile();
        profile.setFirstName(firstName);
        profile.setLastName(lastName);
        profile.setFullName((firstName + " " + lastName).trim());
        profile.setPhone("+91-90000" + Math.abs(username.hashCode() % 100000));
        profile.setCity("Demo City");
        profile.setState("Demo State");
        profile.setAddress("Demo address for " + username);
        profile.setCompanyName(cafe != null ? cafe.getName() : null);
        profile.setWorkLocation(cafe != null ? cafe.getAddress() : null);
        profile.setWorkExperience(cafe != null ? cafe.getName() + ", " + cafe.getAddress() : null);
        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setRoles(Set.of(role));
        user.setCafe(cafe);
        user.setOwnerAssignmentAccepted(roleName == Role.RoleName.OWNER);
        user.setEnabled(true);
        user.setProfile(profile);
        profile.setUser(user);
        return userRepository.save(user);
    }

    private MenuSeedRow menuRow(String name, String description, double price, Menu.Category category) {
        return new MenuSeedRow(name, description, price, category);
    }

    private record MenuSeedRow(String name, String description, double price, Menu.Category category) {}
}
