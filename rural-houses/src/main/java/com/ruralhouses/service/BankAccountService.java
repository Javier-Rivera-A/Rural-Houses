package com.ruralhouses.service;

import com.ruralhouses.entity.BankAccount;

import java.util.List;

public interface BankAccountService {
    BankAccount addToUser(String userId, String numberAccount, String bank, String accountType);
    List<BankAccount> findByUser(String userId);
    BankAccount findById(String id);
}
