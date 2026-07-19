package com.cafe.config;

import com.cafe.entity.*;
import com.cafe.repository.CafeRepository;
import com.cafe.repository.MenuRepository;
import com.cafe.repository.CafeTableRepository;
import com.cafe.repository.ProfileRepository;
import com.cafe.repository.RoleRepository;
import com.cafe.repository.UserRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Set;

/**
 * Seeds roles, default admin user, and a sample cafe only when the database is empty.
 * Ensures admin-created data persists across restarts while still providing initial data on first run.
 */
@Component
@Order(1)
public class DatabaseSeeder implements ApplicationRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final CafeRepository cafeRepository;
    private final CafeTableRepository cafeTableRepository;
    private final MenuRepository menuRepository;
    private final PasswordEncoder passwordEncoder;
    private final boolean seedDemo;

    public DatabaseSeeder(RoleRepository roleRepository, UserRepository userRepository,
                          ProfileRepository profileRepository, CafeRepository cafeRepository,
                          CafeTableRepository cafeTableRepository, MenuRepository menuRepository,
                          PasswordEncoder passwordEncoder,
                          @org.springframework.beans.factory.annotation.Value("${app.seed-demo:false}") boolean seedDemo) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
        this.cafeRepository = cafeRepository;
        this.cafeTableRepository = cafeTableRepository;
        this.menuRepository = menuRepository;
        this.passwordEncoder = passwordEncoder;
        this.seedDemo = seedDemo;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (roleRepository.count() > 0) {
            return;
        }
        seedRoles();
        if (seedDemo) {
            seedAdminOnly();
            return;
        }
        seedAdminAndCafe();
    }

    private void seedRoles() {
        for (Role.RoleName name : Role.RoleName.values()) {
            Role role = new Role();
            role.setName(name);
            roleRepository.save(role);
        }
    }

    private void seedAdminOnly() {
        Role adminRole = roleRepository.findByName(Role.RoleName.ADMIN).orElseThrow();

        Profile profile = new Profile();
        profile.setFullName("System Admin");
        profileRepository.save(profile);

        User admin = new User();
        admin.setUsername("admin");
        admin.setEmail("admin@digitalcafe.local");
        admin.setPassword(passwordEncoder.encode("admin123"));
        admin.setProfile(profile);
        admin.setEnabled(true);
        admin.setRoles(Set.of(adminRole));
        userRepository.save(admin);
    }

    private void seedAdminAndCafe() {
        seedAdminOnly();

        Cafe cafe = new Cafe();
        cafe.setName("Digital Cafe");
        cafe.setAddress("123 Main St");
        cafe.setPhone("+1-555-0100");
        cafe.setDescription("A cozy digital-friendly cafe.");
        cafeRepository.save(cafe);

        for (String[] row : new String[][]{
                {"T1", "2", "AVAILABLE"},
                {"T2", "4", "AVAILABLE"},
                {"T3", "6", "AVAILABLE"}
        }) {
            CafeTable t = new CafeTable();
            t.setTableNumber(row[0]);
            t.setCapacity(Integer.parseInt(row[1]));
            t.setStatus(CafeTable.TableStatus.valueOf(row[2]));
            t.setCafe(cafe);
            cafeTableRepository.save(t);
        }

        Object[][] menuRows = {
                {"Espresso", "Single shot espresso", 2.50, "BEVERAGE"},
                {"Cappuccino", "Espresso with steamed milk", 4.00, "BEVERAGE"},
                {"Latte", "Smooth espresso with steamed milk", 4.50, "BEVERAGE"},
                {"Americano", "Espresso with hot water", 3.00, "BEVERAGE"},
                {"Mocha", "Chocolate and espresso", 5.00, "BEVERAGE"},
                {"Croissant", "Buttery French croissant", 3.50, "FOOD"},
                {"Caesar Salad", "Fresh salad with Caesar dressing", 8.00, "FOOD"},
                {"Avocado Toast", "Sourdough with avocado and poached egg", 9.00, "FOOD"},
                {"Grilled Cheese", "Toasted sandwich with tomato soup", 7.50, "FOOD"},
                {"Chocolate Cake", "Rich chocolate slice", 5.50, "DESSERT"},
                {"Tiramisu", "Classic Italian dessert", 6.50, "DESSERT"},
                {"Brownie", "Warm chocolate brownie with ice cream", 5.00, "DESSERT"},
                {"Muffin", "Blueberry or chocolate chip", 3.00, "SNACK"},
                {"Cookie", "House-made chocolate chip cookie", 2.50, "SNACK"},
        };
        for (Object[] row : menuRows) {
            Menu m = new Menu();
            m.setName((String) row[0]);
            m.setDescription((String) row[1]);
            m.setPrice(BigDecimal.valueOf((Double) row[2]));
            m.setCategory(Menu.Category.valueOf((String) row[3]));
            m.setAvailable(true);
            m.setCafe(cafe);
            menuRepository.save(m);
        }
    }
}
