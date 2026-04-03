package co.uniquindio.rural_house.Rural_House.dto.response;

import lombok.Data;

@Data
public class BankAccountResponse {
    private String id;
    private String numberAccount;
    private String bank;
    private String accountType;
    private Double mount;
}
