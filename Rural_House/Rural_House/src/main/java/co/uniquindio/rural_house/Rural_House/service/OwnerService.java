package co.uniquindio.rural_house.Rural_House.service;


import co.uniquindio.rural_house.Rural_House.dto.request.LoginRequest;
import co.uniquindio.rural_house.Rural_House.dto.request.RegisterOwnerRequest;
import co.uniquindio.rural_house.Rural_House.entity.Owner;

public interface OwnerService {
    Owner register(RegisterOwnerRequest request);
    Owner login(LoginRequest request);
    Owner findById(String id);
    Owner findByUserName(String userName);
}
