package co.uniquindio.rural_house.Rural_House.controller;

import co.uniquindio.rural_house.Rural_House.dto.request.BankAccountRequest;
import co.uniquindio.rural_house.Rural_House.dto.response.ApiResponse;
import co.uniquindio.rural_house.Rural_House.dto.response.BankAccountResponse;
import co.uniquindio.rural_house.Rural_House.entity.BankAccount;
import co.uniquindio.rural_house.Rural_House.service.BankAccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/bank-accounts")
@RequiredArgsConstructor
public class BankAccountController {

    private final BankAccountService bankAccountService;

    /**
     * POST /api/bank-accounts?userId={id}
     * Añade una cuenta bancaria al usuario autenticado.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<BankAccountResponse>> addAccount(
            @RequestParam String userId,
            @Valid @RequestBody BankAccountRequest request) {

        BankAccount account = bankAccountService.addToUser(
                userId,
                request.getNumberAccount(),
                request.getBank(),
                request.getAccountType()
        );
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Cuenta bancaria añadida correctamente", toResponse(account)));
    }

    /**
     * GET /api/bank-accounts?userId={id}
     * Lista todas las cuentas bancarias de un usuario.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<BankAccountResponse>>> getByUser(
            @RequestParam String userId) {

        List<BankAccountResponse> accounts = bankAccountService.findByUser(userId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(accounts));
    }

    /**
     * DELETE /api/bank-accounts/{accountId}?userId={id}
     * Elimina una cuenta bancaria (solo si pertenece al usuario).
     */
    @DeleteMapping("/{accountId}")
    public ResponseEntity<ApiResponse<Void>> deleteAccount(
            @PathVariable String accountId,
            @RequestParam String userId) {

        bankAccountService.deleteAccount(userId, accountId);
        return ResponseEntity.ok(ApiResponse.ok("Cuenta eliminada correctamente", null));
    }

    /**
     * PUT /api/bank-accounts/{accountId}?userId={id}
     * Actualiza una cuenta bancaria existente.
     */
    @PutMapping("/{accountId}")
    public ResponseEntity<ApiResponse<BankAccountResponse>> updateAccount(
            @PathVariable String accountId,
            @RequestParam String userId,
            @Valid @RequestBody BankAccountRequest request) {

        BankAccount updated = bankAccountService.updateAccount(userId, accountId, request);
        return ResponseEntity.ok(ApiResponse.ok("Cuenta actualizada correctamente", toResponse(updated)));
    }

    private BankAccountResponse toResponse(BankAccount account) {
        BankAccountResponse response = new BankAccountResponse();
        response.setId(account.getId());
        response.setNumberAccount(account.getNumberAccount());
        response.setBank(account.getBank());
        response.setAccountType(account.getAccountType());
        response.setMount(account.getMount());
        return response;
    }
}