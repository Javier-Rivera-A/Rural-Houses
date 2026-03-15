package com.ruralhouses.service.impl;

import com.ruralhouses.entity.BankAccount;
import com.ruralhouses.entity.User;
import com.ruralhouses.exception.ResourceNotFoundException;
import com.ruralhouses.repository.BankAccountRepository;
import com.ruralhouses.repository.UserRepository;
import com.ruralhouses.service.BankAccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BankAccountServiceImpl implements BankAccountService {

    private final BankAccountRepository bankAccountRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public BankAccount addToUser(String userId, String numberAccount, String bank, String accountType) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado: " + userId));

        BankAccount account = new BankAccount();
        account.setNumberAccount(numberAccount);
        account.setBank(bank);
        account.setAccountType(accountType);
        account.setMount(0.0);
        account.setUser(user);

        return bankAccountRepository.save(account);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BankAccount> findByUser(String userId) {
        return bankAccountRepository.findByUser_Id(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public BankAccount findById(String id) {
        return bankAccountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cuenta bancaria no encontrada: " + id));
    }
}
