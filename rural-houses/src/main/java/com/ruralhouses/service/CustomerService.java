package com.ruralhouses.service;

import com.ruralhouses.dto.request.LoginRequest;
import com.ruralhouses.dto.request.RegisterOwnerRequest;
import com.ruralhouses.entity.Customer;

public interface CustomerService {
    Customer register(RegisterOwnerRequest request);
    Customer login(LoginRequest request);
    Customer findById(String id);
}
