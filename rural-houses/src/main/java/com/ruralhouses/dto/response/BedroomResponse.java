package com.ruralhouses.dto.response;

import com.ruralhouses.entity.enums.TypeOfBed;
import lombok.Data;

import java.util.List;

@Data
public class BedroomResponse {
    private String id;
    private Integer bedroomCode;
    private Boolean bathroom;
    private Byte numberBeds;
    private List<TypeOfBed> typesOfBeds;
}
