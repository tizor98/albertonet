---
slug: 'patterns-primer-2'
lang: 'en'
title: "SOLID Principles — Part 2 of 5"
description: 'Second installment: a practical guide to the five SOLID principles with examples in Java 25 for building flexible, robust systems that are easy to evolve.'
categories: ['software','patterns','design']
pubDate: '2025-12-06'
heroImage: '@/presentation/assets/patterns-primer-2.png'
---

This is the second installment of the series. We focus on SOLID, five principles that serve as a compass for writing clean, easy-to-change object-oriented code. We'll go through each principle with up-to-date examples in Java 25 and practical guidelines for applying them without over-engineering.

## SOLID Principles

The SOLID principles represent five essential foundations of object-oriented programming that, when applied correctly, lead to more maintainable, flexible, and robust systems.

### 1. Single Responsibility Principle (SRP)

A class should respond to only one actor or business domain, meaning it should have only one reason to change. It's common to confuse this principle by thinking that a class can only have one technical responsibility, but that's not correct. The real focus is on identifying which actor or business entity is responsible for the class.

**Example: Separating responsibilities by actor**

```java
// INCORRECT: A class that responds to multiple actors
public class Employee {
    public double calculatePay() { /* Accounting logic */ }
    public void saveToDatabase() { /* IT logic */ }
    public String generateReport() { /* Human Resources logic */ }
}

// CORRECT: Each class responds to a single actor
// Here the entity is shared, but a more robust implementation may have one entity per domain
public record Employee(long id, String name, String department, double hourlyRate) {}

// Responds to the Accounting department
public interface PayrollCalculator {
    double calculatePay(Employee employee, int hoursWorked);
}

// Responds to the IT department
public interface EmployeeRepository {
    void save(Employee employee);
    Optional<Employee> findById(long id);
}

// Responds to Human Resources
public interface EmployeeReportGenerator {
    String generatePerformanceReport(Employee employee);
}
```

---

### 2. Open/Closed Principle (OCP)

A class should be open for extension but closed for modification. This is typically achieved by using abstractions (interfaces or abstract classes) that allow behavior to change without modifying existing code. When new behavior is needed, you simply create a new implementation of the abstraction.

**Example: Extensible discount system**

```java
// Abstraction that allows extension
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
            throw new IllegalArgumentException("Percentage must be between 0 and 100");
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

// The Order class is CLOSED for modification
public class OrderProcessor {
    
    public double calculateTotal(List<LineItem> items, DiscountStrategy discount) {
        final double subtotal = items.stream()
            .mapToDouble(item -> item.price() * item.quantity())
            .sum();
        
        return discount.apply(subtotal);
    }
}

// To add a new discount type, we do NOT need to modify OrderProcessor
// We simply create a new implementation of DiscountStrategy
```

---

### 3. Liskov Substitution Principle (LSP)

A subclass must be able to replace its parent class without altering the correct behavior of the program. If there are methods in the parent class that are not supported or don't make sense in child classes, that's a sign that the class hierarchy needs to be restructured.

**Example: Correct vs incorrect hierarchy**

```java
// INCORRECT: LSP violation
public class Bird {
    public void fly() { IO.println("Flying..."); }
}

public class Penguin extends Bird {
    @Override
    public void fly() {
        throw new UnsupportedOperationException("Penguins don't fly");
    }
}

// CORRECT: Hierarchy that respects LSP using segregated interfaces
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
    public void eat() { IO.println("Hunting prey"); }
    @Override 
    public void fly() { IO.println("Flying high"); }
    @Override 
    public int maxAltitude() { return 3000; }
}

public record Penguin(String name) implements FlightlessBird {
    @Override 
    public void eat() { IO.println("Eating fish"); }
    @Override 
    public void walk() { IO.println("Walking on ice"); }
}

// Now we can use any FlyingBird where one is expected
public class BirdSanctuary {
    public void releaseBird(FlyingBird bird) {
        bird.fly(); // Guaranteed to work for any FlyingBird
    }
}
```

---

### 4. Interface Segregation Principle (ISP)

A class should not be forced to depend on methods it doesn't use. If an interface contains methods that some implementations don't need, that's a sign that the interface should be split into smaller, more specific interfaces.

**Example: Segregated interfaces for different roles**

```java
// INCORRECT: "Fat" interface that forces implementation of unnecessary methods
public interface Worker {
    void work();
    void eat();
    void attendMeeting();
    void writeCode();
    void reviewCode();
}

// CORRECT: Interfaces segregated by responsibility
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

// Each class implements only what it needs
public class SoftwareEngineer implements Developer, Eatable, MeetingAttendee {
    @Override 
    public void work() { writeCode(); }
    @Override 
    public void eat() { IO.println("Having lunch"); }
    @Override 
    public void attendMeeting() { IO.println("In daily standup"); }
    @Override 
    public void writeCode() { IO.println("Programming"); }
    @Override 
    public void reviewCode() { IO.println("Reviewing PR"); }
}

public class Robot implements Workable {
    @Override 
    public void work() { IO.println("Executing automated task"); }
    // Does not need eat(), attendMeeting(), etc.
}

public class Manager implements Workable, Eatable, MeetingAttendee {
    @Override 
    public void work() { attendMeeting(); }
    @Override 
    public void eat() { IO.println("Business lunch"); }
    @Override 
    public void attendMeeting() { IO.println("Leading meeting"); }
    // Does not need writeCode() or reviewCode()
}
```

---

### 5. Dependency Inversion Principle (DIP)

High-level modules should not depend on low-level modules; both should depend on abstractions. Abstractions should not depend on details; details should depend on abstractions. The intent is to avoid depending on volatile elements, considering that interfaces are less volatile than concrete implementations. However, it is acceptable to depend on concrete classes that are considered stable, such as those in the language's standard library.

**Example: Dependency inversion with injection**

```java
// Abstractions (stable interfaces)
public interface MessageSender {
    void send(String recipient, String message);
}

public interface UserRepository {
    Optional<User> findById(long id);
    void save(User user);
}

// Concrete implementations (volatile details)
@RequiredArgsConstructor
public class EmailSender implements MessageSender {
    private final SmtpClient smtpClient;
    
    @Override
    public void send(String recipient, String message) {
        smtpClient.sendEmail(recipient, "Notification", message);
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

// High-level module - depends ONLY on abstractions
// Dependency injection via constructor
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

// Configuration - concrete dependencies are resolved here
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
