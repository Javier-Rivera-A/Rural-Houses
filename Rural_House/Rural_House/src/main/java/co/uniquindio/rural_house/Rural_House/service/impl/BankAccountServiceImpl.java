package co.uniquindio.rural_house.Rural_House.service.impl;


import co.uniquindio.rural_house.Rural_House.dto.request.BankAccountRequest;
import co.uniquindio.rural_house.Rural_House.entity.BankAccount;
import co.uniquindio.rural_house.Rural_House.entity.User;
import co.uniquindio.rural_house.Rural_House.exception.UnauthorizedException;
import co.uniquindio.rural_house.Rural_House.repository.BankAccountRepository;
import co.uniquindio.rural_house.Rural_House.repository.UserRepository;
import co.uniquindio.rural_house.Rural_House.service.BankAccountService;
import co.uniquindio.rural_house.Rural_House.exception.ResourceNotFoundException;
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
    public BankAccount addToUser(String userId, BankAccountRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado: " + userId));
        BankAccount account = new BankAccount();
        account.setNumberAccount(request.getNumberAccount());
        account.setBank(request.getBank());
        account.setAccountType(request.getAccountType());
        account.setMount(request.getMount() != null ? request.getMount() : 0.0);
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

    @Override
    @Transactional
    public void deleteAccount(String userId, String accountId){
        BankAccount account = bankAccountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Cuenta bancaria no encontrada: " + accountId));
        if(!account.getUser().getId().equals(userId)){
            throw new UnauthorizedException("No tienes permiso para eliminar esta cuenta");
        }
        bankAccountRepository.delete(account);
    }

    @Override
    @Transactional
    public BankAccount updateAccount(String userId, String accountId, BankAccountRequest request){
        BankAccount account = bankAccountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Cuenta bancaria no encontrada: " +  accountId));
        if (!account.getUser().getId().equals(userId)){
            throw new UnauthorizedException("No tienes permiso para modificar esta cuenta");
        }

        account.setNumberAccount(request.getNumberAccount());
        account.setBank(request.getBank());
        account.setAccountType(request.getAccountType());
        if (request.getMount() != null) {
            account.setMount(request.getMount());
        }

        return bankAccountRepository.save(account);
    }
}
