package com.ruralhouses.service;

import com.ruralhouses.dto.request.LoginRequest;
import com.ruralhouses.dto.request.RegisterOwnerRequest;
import com.ruralhouses.entity.Owner;

public interface OwnerService {
    Owner register(RegisterOwnerRequest request);
    Owner login(LoginRequest request);
    Owner findById(String id);
    Owner findByUserName(String userName);
}
