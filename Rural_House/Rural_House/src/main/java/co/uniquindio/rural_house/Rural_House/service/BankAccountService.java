package co.uniquindio.rural_house.Rural_House.service;



import co.uniquindio.rural_house.Rural_House.dto.request.BankAccountRequest;
import co.uniquindio.rural_house.Rural_House.entity.BankAccount;

import java.util.List;

public interface BankAccountService {
    BankAccount addToUser(String userId, String numberAccount, String bank, String accountType);
    List<BankAccount> findByUser(String userId);
    BankAccount findById(String id);
    void deleteAccount(String userId, String accountId);
    BankAccount updateAccount(String userId, String accountId, BankAccountRequest request);
}
