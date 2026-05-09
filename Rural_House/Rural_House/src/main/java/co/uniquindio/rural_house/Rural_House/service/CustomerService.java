package co.uniquindio.rural_house.Rural_House.service;


import co.uniquindio.rural_house.Rural_House.dto.request.LoginRequest;
import co.uniquindio.rural_house.Rural_House.dto.request.RegisterCustomerRequest;
import co.uniquindio.rural_house.Rural_House.entity.Customer;

public interface CustomerService {
    Customer register(RegisterCustomerRequest request);
    Customer login(LoginRequest request);
    Customer findById(String id);
    void updateUserName(String id, String newUserName);
    void updateEmail(String id, String newEmail);
    void updatePassword(String id, String newPassword);
    void updatePhone(String id, String newPhone);
}

