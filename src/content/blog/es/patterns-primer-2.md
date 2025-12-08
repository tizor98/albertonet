---
slug: 'patterns-primer-2'
lang: 'es'
title: "Parte 2 de 5: ¿Cuáles son los principales patrones de diseño?"
description: 'Referencia de los patrones de diseño más fundamentales en desarrollo de software con ejemplos.'
categories: 'software;patterns;design'
pubDate: '2025-12-06'
heroImage: '@/presentation/assets/patterns-primer-1.png'
---

# Software Patterns

Este documento presenta una guía completa sobre los patrones de diseño de software más importantes y utilizados en la industria con ejemplos en Java 25. Los patrones están organizados en categorías según su propósito: patrones modernos, principios SOLID, patrones de creación, patrones de estructura y patrones de comportamiento.

---

## Principios SOLID

Los principios SOLID representan cinco fundamentos esenciales de la programación orientada a objetos que, cuando se aplican correctamente, conducen a sistemas más mantenibles, flexibles y robustos.

### 1. Single Responsibility Principle (SRP)

Una clase debería responder únicamente a un actor o dominio del negocio, lo que significa que debe tener una sola razón para cambiar. Es común confundir este principio pensando que una clase solo puede tener una responsabilidad técnica, pero esto no es correcto. El enfoque real está en identificar qué actor o entidad del negocio tiene responsabilidad sobre la clase.

**Ejemplo: Separación de responsabilidades por actor**

```java
// INCORRECTO: Una clase que responde a múltiples actores
public class Employee {
    public double calculatePay() { /* Lógica de Contabilidad */ }
    public void saveToDatabase() { /* Lógica de TI */ }
    public String generateReport() { /* Lógica de Recursos Humanos */ }
}

// CORRECTO: Cada clase responde a un solo actor
// Aquí se compartó la entidad, pero una implementación más robusta puede tener una entidad por dominio
public record Employee(long id, String name, String department, double hourlyRate) {}

// Responde al departamento de Contabilidad
public interface PayrollCalculator {
    double calculatePay(Employee employee, int hoursWorked);
}

// Responde al departamento de TI
public interface EmployeeRepository {
    void save(Employee employee);
    Optional<Employee> findById(long id);
}

// Responde a Recursos Humanos
public interface EmployeeReportGenerator {
    String generatePerformanceReport(Employee employee);
}
```

---

### 2. Open/Closed Principle (OCP)

Una clase debería estar abierta para extensión pero cerrada para modificación. Esto se logra típicamente mediante el uso de abstracciones (interfaces o clases abstractas) que permiten cambiar el comportamiento sin modificar el código existente. Cuando se necesita un nuevo comportamiento, simplemente se crea una nueva implementación de la abstracción.

**Ejemplo: Sistema de descuentos extensible**

```java
// Abstracción que permite extensión
public interface DiscountStrategy {
    
    double apply(double originalPrice);
}

public record NoDiscount() implements DiscountStrategy {
    @Override
    public double apply(double originalPrice) {
        return originalPrice;
    }
}

public record PercentageDiscount(double percentage) implements DiscountStrategy {
    public PercentageDiscount {
        if (percentage < 0 || percentage > 100) {
            throw new IllegalArgumentException("Porcentaje debe estar entre 0 y 100");
        }
    }
    
    @Override
    public double apply(double originalPrice) {
        return originalPrice * (1 - percentage / 100);
    }
}

public record FixedAmountDiscount(double amount) implements DiscountStrategy {
    @Override
    public double apply(double originalPrice) {
        return Math.max(0, originalPrice - amount);
    }
}

public record SeasonalDiscount(String season, double percentage) implements DiscountStrategy {
    @Override
    public double apply(double originalPrice) {
        return originalPrice * (1 - percentage / 100);
    }
}

// La clase Order está CERRADA para modificación
public class OrderProcessor {
    
    public double calculateTotal(List<LineItem> items, DiscountStrategy discount) {
        final double subtotal = items.stream()
            .mapToDouble(item -> item.price() * item.quantity())
            .sum();
        
        return discount.apply(subtotal);
    }
}

// Para agregar un nuevo tipo de descuento, NO necesitamos modificar OrderProcessor
// Simplemente creamos una nueva implementación de DiscountStrategy
```

---

### 3. Liskov Substitution Principle (LSP)

Una subclase debe poder sustituir a su clase padre sin alterar el comportamiento correcto del programa. Si existen métodos en la clase padre que no son soportados o tienen sentido en las clases hijas, es una señal de que la jerarquía de clases necesita ser reestructurada.

**Ejemplo: Jerarquía correcta vs incorrecta**

```java
// INCORRECTO: Violación del LSP
public class Bird {
    public void fly() { IO.println("Volando..."); }
}

public class Penguin extends Bird {
    @Override
    public void fly() {
        throw new UnsupportedOperationException("Los pingüinos no vuelan");
    }
}

// CORRECTO: Jerarquía que respeta LSP usando interfaces segregadas
public sealed interface Bird permits FlyingBird, FlightlessBird {
    String name();
    void eat();
}

public interface FlyingBird extends Bird {
    void fly();
    default int maxAltitude() { return 1000; }
}

public interface FlightlessBird extends Bird {
    void walk();
}

public record Eagle(String name) implements FlyingBird {
    @Override 
    public void eat() { IO.println("Cazando presas"); }
    @Override 
    public void fly() { IO.println("Volando alto"); }
    @Override 
    public int maxAltitude() { return 3000; }
}

public record Penguin(String name) implements FlightlessBird {
    @Override 
    public void eat() { IO.println("Comiendo peces"); }
    @Override 
    public void walk() { IO.println("Caminando en el hielo"); }
}

// Ahora podemos usar cualquier FlyingBird donde se espere uno
public class BirdSanctuary {
    public void releaseBird(FlyingBird bird) {
        bird.fly(); // Garantizado que funciona para cualquier FlyingBird
    }
}
```

---

### 4. Interface Segregation Principle (ISP)

Una clase no debería verse obligada a depender de métodos que no utiliza. Si una interfaz contiene métodos que algunas implementaciones no necesitan, es una señal de que la interfaz debería dividirse en interfaces más pequeñas y específicas.

**Ejemplo: Interfaces segregadas para diferentes roles**

```java
// INCORRECTO: Interfaz "gorda" que obliga a implementar métodos innecesarios
public interface Worker {
    void work();
    void eat();
    void attendMeeting();
    void writeCode();
    void reviewCode();
}

// CORRECTO: Interfaces segregadas por responsabilidad
public interface Workable {
    void work();
}

public interface Eatable {
    void eat();
}

public interface MeetingAttendee {
    void attendMeeting();
}

public interface Developer extends Workable {
    void writeCode();
    void reviewCode();
}

// Cada clase implementa solo lo que necesita
public class SoftwareEngineer implements Developer, Eatable, MeetingAttendee {
    @Override 
    public void work() { writeCode(); }
    @Override 
    public void eat() { IO.println("Almorzando"); }
    @Override 
    public void attendMeeting() { IO.println("En daily standup"); }
    @Override 
    public void writeCode() { IO.println("Programando"); }
    @Override 
    public void reviewCode() { IO.println("Revisando PR"); }
}

public class Robot implements Workable {
    @Override 
    public void work() { IO.println("Ejecutando tarea automatizada"); }
    // No necesita eat(), attendMeeting(), etc.
}

public class Manager implements Workable, Eatable, MeetingAttendee {
    @Override 
    public void work() { attendMeeting(); }
    @Override 
    public void eat() { IO.println("Almuerzo de negocios"); }
    @Override 
    public void attendMeeting() { IO.println("Liderando reunión"); }
    // No necesita writeCode() ni reviewCode()
}
```

---

### 5. Dependency Inversion Principle (DIP)

Los módulos de alto nivel no deben depender de módulos de bajo nivel; ambos deben depender de abstracciones. Las abstracciones no deben depender de los detalles; los detalles deben depender de las abstracciones. La intención es evitar depender de elementos volátiles, considerando que las interfaces son menos volátiles que las implementaciones concretas. Sin embargo, es aceptable depender de clases concretas que se consideren estables, como las de la biblioteca estándar del lenguaje.

**Ejemplo: Inversión de dependencias con inyección**

```java
// Abstracciones (interfaces estables)
public interface MessageSender {
    void send(String recipient, String message);
}

public interface UserRepository {
    Optional<User> findById(long id);
    void save(User user);
}

// Implementaciones concretas (detalles volátiles)
@RequiredArgsConstructor
public class EmailSender implements MessageSender {
    private final SmtpClient smtpClient;
    
    @Override
    public void send(String recipient, String message) {
        smtpClient.sendEmail(recipient, "Notificación", message);
    }
}

@RequiredArgsConstructor
public class SmsSender implements MessageSender {
    private final TwilioClient twilioClient;
    
    @Override
    public void send(String recipient, String message) {
        twilioClient.sendSms(recipient, message);
    }
}

@RequiredArgsConstructor
public class JpaUserRepository implements UserRepository {
    private final EntityManager entityManager;
    
    @Override
    public Optional<User> findById(long id) {
        return Optional.ofNullable(entityManager.find(User.class, id));
    }
    
    @Override
    public void save(User user) {
        entityManager.persist(user);
    }
}

// Módulo de alto nivel - depende SOLO de abstracciones
// Inyección de dependencias via constructor
@RequiredArgsConstructor
public class NotificationService {
    private final MessageSender messageSender;
    private final UserRepository userRepository;
    
    public void notifyUser(long userId, String message) {
        userRepository.findById(userId)
            .ifPresentOrElse(
                user -> messageSender.send(user.contactInfo(), message),
                () -> { throw new UserNotFoundException(userId); }
            );
    }
}

// Configuración - aquí se resuelven las dependencias concretas
public class ApplicationConfig {
    public NotificationService provideNotificationService() {
        final var smtpClient = new SmtpClient("smtp.example.com", 587);
        final var entityManager = createEntityManager();
        
        return new NotificationService(
            new EmailSender(smtpClient),
            new JpaUserRepository(entityManager)
        );
    }
}
```
