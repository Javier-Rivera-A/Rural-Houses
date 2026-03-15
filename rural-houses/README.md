# 🏡 Gestión de Reservas de Casas Rurales

Proyecto Spring Boot con arquitectura en capas, basado en el diagrama UML del sistema de reservas.

---

## 📁 Estructura del Proyecto

```
src/main/java/com/ruralhouses/
├── RuralHousesApplication.java         ← Punto de entrada
│
├── entity/                             ← CAPA: Entidades JPA
│   ├── enums/
│   │   ├── EnumAccountState.java       (ACTIVE, DISABLED, CREATED, REMOVED)
│   │   ├── RentalState.java            (PENDING, CONFIRMED, CANCELLED, EXPIRED)
│   │   ├── TypeRental.java             (ENTIRE_HOUSE, ROOMS, BOTH)
│   │   ├── TypeOfBed.java              (SIMPLE, DOUBLE)
│   │   ├── PaidState.java              (PENDING, CONFIRMED, RETURNED)
│   │   └── StateCountryHouse.java      (ACTIVE, DISABLED)
│   ├── User.java                       ← Clase base (herencia JOINED)
│   ├── Owner.java                      ← Extiende User
│   ├── Customer.java                   ← Extiende User
│   ├── CountryHouse.java
│   ├── Bedroom.java
│   ├── Kitchen.java
│   ├── Photo.java
│   ├── Population.java
│   ├── RentalPackage.java
│   ├── Rental.java
│   ├── Paid.java
│   └── BankAccount.java
│
├── repository/                         ← CAPA: Repositorios (Spring Data JPA)
│   ├── UserRepository.java
│   ├── OwnerRepository.java
│   ├── CustomerRepository.java
│   ├── CountryHouseRepository.java
│   ├── RentalRepository.java
│   ├── RentalPackageRepository.java
│   ├── PaidRepository.java
│   └── PopulationRepository.java
│
├── service/                            ← CAPA: Interfaces de Servicio
│   ├── OwnerService.java
│   ├── CountryHouseService.java
│   └── RentalService.java
│   └── impl/                          ← CAPA: Implementaciones de Servicio
│       ├── OwnerServiceImpl.java
│       ├── CountryHouseServiceImpl.java
│       └── RentalServiceImpl.java
│
├── controller/                         ← CAPA: Controladores REST
│   ├── OwnerController.java
│   ├── CountryHouseController.java
│   └── RentalController.java
│
├── dto/                                ← CAPA: Objetos de Transferencia
│   ├── request/
│   │   ├── RegisterOwnerRequest.java
│   │   ├── LoginRequest.java
│   │   ├── CountryHouseRequest.java
│   │   ├── BedroomRequest.java
│   │   ├── KitchenRequest.java
│   │   ├── PhotoRequest.java
│   │   ├── RentalPackageRequest.java
│   │   ├── RentalRequest.java
│   │   └── AvailabilityRequest.java
│   └── response/
│       ├── ApiResponse.java            ← Wrapper genérico
│       ├── CountryHouseResponse.java
│       ├── BedroomResponse.java
│       ├── KitchenResponse.java
│       ├── PhotoResponse.java
│       ├── RentalResponse.java
│       ├── RentalPackageResponse.java
│       └── AvailabilityResponse.java
│
├── exception/                          ← Manejo de errores
│   ├── ResourceNotFoundException.java
│   ├── BusinessException.java
│   ├── UnauthorizedException.java
│   └── GlobalExceptionHandler.java
│
└── config/
    ├── SecurityConfig.java             ← Spring Security + BCrypt
    └── DataInitializer.java            ← Datos de prueba al arrancar
```

---

## 🚀 Cómo ejecutar

### Requisitos
- Java 17+
- Maven 3.8+

### Arrancar
```bash
mvn spring-boot:run
```

La app arranca en **http://localhost:8080**

### Consola H2 (base de datos en memoria)
- URL: http://localhost:8080/h2-console
- JDBC URL: `jdbc:h2:mem:ruraldb`
- User: `sa` | Password: *(vacío)*

---

## 📡 Endpoints principales

### Propietarios
| Método | URL | Descripción |
|--------|-----|-------------|
| POST | `/api/owners/register` | Registrar propietario |
| POST | `/api/owners/login` | Login |

### Casas Rurales
| Método | URL | Descripción |
|--------|-----|-------------|
| POST | `/api/houses?ownerId=X` | Dar de alta casa rural |
| PUT | `/api/houses/{id}?ownerId=X` | Actualizar casa |
| DELETE | `/api/houses/{id}?ownerId=X` | Dar de baja casa |
| GET | `/api/houses/search?population=Salento` | Buscar por población |
| GET | `/api/houses/code/{code}` | Buscar por código |
| GET | `/api/houses/{code}/availability?checkIn=2025-07-01&nights=7` | Ver disponibilidad |

### Paquetes de Alquiler
| Método | URL | Descripción |
|--------|-----|-------------|
| POST | `/api/houses/{houseId}/packages?ownerId=X` | Añadir paquete |
| PUT | `/api/houses/packages/{id}?ownerId=X` | Modificar paquete |
| DELETE | `/api/houses/packages/{id}?ownerId=X` | Eliminar paquete |

### Reservas
| Método | URL | Descripción |
|--------|-----|-------------|
| POST | `/api/rentals?customerId=X` | Hacer reserva |
| GET | `/api/rentals/{rentalCode}` | Ver reserva |
| POST | `/api/rentals/{id}/payment?ownerId=X&amount=Y` | Registrar pago |
| POST | `/api/rentals/{id}/cancel?ownerId=X` | Cancelar reserva |
| GET | `/api/rentals/expired?ownerId=X` | Ver reservas con pago vencido |

---

## 🧪 Ejemplo de uso (curl)

```bash
# 1. Registrar propietario
curl -X POST http://localhost:8080/api/owners/register \
  -H "Content-Type: application/json" \
  -d '{"userName":"pedro","password":"pass123","accessWord":"acc123","email":"pedro@test.com"}'

# 2. Buscar casas en Salento
curl http://localhost:8080/api/houses/search?population=Salento

# 3. Ver disponibilidad
curl "http://localhost:8080/api/houses/CASA-001/availability?checkIn=2025-07-01&nights=7"

# 4. Hacer reserva
curl -X POST "http://localhost:8080/api/rentals" \
  -H "Content-Type: application/json" \
  -d '{"countryHouseCode":"CASA-001","checkInDate":"2025-07-01","numberNights":7,"contactPhoneNumber":"600111222"}'
```

---

## 📐 Reglas de negocio implementadas

- ✅ Mínimo 3 habitaciones, 1 cocina, 2 baños por casa rural
- ✅ Los propietarios deben registrarse e identificarse para operar
- ✅ Los paquetes de alquiler controlan período, precio y tipo (entera/habitaciones/ambas)
- ✅ Al reservar se requiere depósito del 20% en 3 días
- ✅ Las reservas no se cancelan automáticamente, el propietario decide
- ✅ El sistema avisa al propietario de reservas con pago vencido al registrar pagos
- ✅ No se hacen reservas parciales: todo o nada
