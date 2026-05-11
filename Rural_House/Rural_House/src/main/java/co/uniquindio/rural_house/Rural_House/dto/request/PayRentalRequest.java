package co.uniquindio.rural_house.Rural_House.dto.request;

import lombok.Data;

@Data
public class PayRentalRequest {
      private String ownerBankAccountId;
      private String customerBankAccountId;
      private float amount;
}
