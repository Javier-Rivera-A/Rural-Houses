package com.ruralhouses.dto.response;

import com.ruralhouses.entity.enums.StateCountryHouse;
import lombok.Data;

import java.util.List;

@Data
public class CountryHouseResponse {
    private String id;
    private String code;
    private String description;
    private Byte privateBathrooms;
    private Byte publicBathrooms;
    private Byte garagePlaces;
    private StateCountryHouse stateCountryHouse;
    private String populationName;
    private String ownerUserName;
    private List<BedroomResponse> bedrooms;
    private List<KitchenResponse> diningRooms;
    private List<PhotoResponse> photo;
}
