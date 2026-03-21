package co.uniquindio.rural_house.Rural_House.dto.request;

import co.uniquindio.rural_house.Rural_House.entity.enums.TypeOfBed;
import lombok.Data;

import java.util.List;

@Data
public class BedroomRequest {
    private Integer bedroomCode;
    private Boolean bathroom;
    private Byte numberBeds;
    private List<TypeOfBed> typesOfBeds;
}
