package co.uniquindio.rural_house.Rural_House;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class RuralHouseApplication {

	public static void main(String[] args) {
		SpringApplication.run(RuralHouseApplication.class, args);
	}

}
