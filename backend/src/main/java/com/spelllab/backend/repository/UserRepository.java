package com.spelllab.backend.repository;

import com.spelllab.backend.entity.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<UserAccount, Long> {
    boolean existsByUsername(String username);

    UserAccount findByUsername(String username);
}
