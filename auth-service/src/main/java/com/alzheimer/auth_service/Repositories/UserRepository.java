package com.alzheimer.auth_service.Repositories;

import com.alzheimer.auth_service.Entities.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    List<User> findByRole(String role);
    boolean existsByRole(String role);
    List<User> findByRoleAndReferringDoctorEmail(String role, String referringDoctorEmail);
}
