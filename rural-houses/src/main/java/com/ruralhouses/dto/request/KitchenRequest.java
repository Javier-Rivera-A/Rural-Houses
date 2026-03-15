package com.ruralhouses.dto.request;

import lombok.Data;

@Data
public class KitchenRequest {
    // UML: idCocina: String
    private String idCocina;
    // UML: dishWasher: Boolean
    private Boolean dishWasher;
    // UML: washingMachine: Boolean
    private Boolean washingMachine;
}
