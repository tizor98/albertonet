---
slug: 'patterns-primer'
lang: 'en'
title: "What are the main design patterns?"
description: 'Reference guide to the most fundamental design patterns in software development with examples.'
categories: 'software;patterns;design'
pubDate: '2025-12-06'
heroImage: '@/presentation/assets/patterns-primer-1.png'
---

# Software Patterns

This document presents a comprehensive guide to the most important and widely used software design patterns in the industry with examples in Java 25. Patterns are organized into categories according to their purpose: modern patterns, SOLID principles, creational patterns, structural patterns, and behavioral patterns.

---

## Modern Design Patterns

### Fluent Interfaces

The **Fluent Interface** pattern aims to provide an API that can be used naturally and expressively to complete complex operations. Each method in the interface returns the same object (or a related one), allowing calls to be chained so that the resulting code reads almost like prose.

Among its main benefits are internal resource management and selective exposure of methods according to the context of use. Unlike the traditional Builder pattern, Fluent Interfaces do not focus exclusively on object creation, but rather on facilitating the use of any functionality in an intuitive way. Additionally, they allow multiple interfaces to participate in the process, guiding the user through valid steps.

**Example: Fluent SQL query system**

```java
public sealed interface QueryBuilder permits SelectBuilder, WhereBuilder, OrderBuilder, ExecutableQuery {
    static SelectBuilder select(String... columns) {
        return new FluentQueryBuilder(columns);
    }
}

public sealed interface SelectBuilder extends QueryBuilder permits FluentQueryBuilder {
    WhereBuilder from(String table);
}

public sealed interface WhereBuilder extends QueryBuilder permits FluentQueryBuilder {
    WhereBuilder where(String condition);
    WhereBuilder and(String condition);
    WhereBuilder or(String condition);
    OrderBuilder orderBy(String column);
    ExecutableQuery build();
}

public sealed interface OrderBuilder extends QueryBuilder permits FluentQueryBuilder {
    OrderBuilder thenBy(String column);
    OrderBuilder descending();
    ExecutableQuery build();
}

public sealed interface ExecutableQuery extends QueryBuilder permits FluentQueryBuilder {
    String toSql();
    <T> List<T> execute(Class<T> resultType);
}

final class FluentQueryBuilder implements SelectBuilder, WhereBuilder, OrderBuilder, ExecutableQuery {
    // Implements functionality
}

// Using the fluent API
final var query = QueryBuilder.select("id", "name", "email")
    .from("users")
    .where("age > 18")
    .and("status = 'ACTIVE'")
    .orderBy("name")
    .descending()
    .build();

IO.println(query.toSql());
// Output: SELECT id, name, email FROM users WHERE age > 18 AND status = 'ACTIVE' ORDER BY name DESC
```

---

### Loan Pattern

The **Loan** pattern allows exposing the functionality of a resource while maintaining complete control over its lifecycle. The central idea is to "loan" a resource to the client so they can perform necessary operations, but control over when and how the resource is initialized, used, and released remains with the class that manages it.

This pattern is particularly useful for resources that require explicit opening and closing, such as database connections, files, or network connections. By centralizing lifecycle management, common errors such as forgetting to close resources or incorrectly handling exceptions are eliminated. As authors of the class, we are in a better position to know exactly when and how these resources should be managed.

**Example: Connection pool with Loan Pattern**

```java
public final class ConnectionPool {
    
    private static final Queue<Connection> pool = new ConcurrentLinkedQueue<>();
    private static final int MAX_CONNECTIONS = 10;
    
    static {
        // Initialize pool with connections
        for (int i = 0; i < MAX_CONNECTIONS; i++) {
            pool.offer(createConnection());
        }
    }
    
    private ConnectionPool() {} // Not instantiable
    
    // Static method that implements the Loan Pattern
    public static <T> T withConnection(Function<Connection, T> operation) {
        Connection conn = null;
        try {
            conn = acquireConnection();
            return operation.apply(conn);
        } catch (DatabaseException e) {
            throw new RuntimeException("Error executing database operation", e);
        } finally {
            if (conn != null) {
                releaseConnection(conn);
            }
        }
    }
    
    // Version for operations without return value
    public static void withConnection(Consumer<Connection> operation) {
        withConnection(conn -> {
            operation.accept(conn);
            return null;
        });
    }
    
    // Version with automatic transaction
    public static <T> T withTransaction(Function<Connection, T> operation) {
        return withConnection(conn -> {
            try {
                conn.setAutoCommit(false);
                T result = operation.apply(conn);
                conn.commit();
                return result;
            } catch (Exception e) {
                conn.rollback();
                throw new DatabaseException("Transaction failed", e);
            } finally {
                conn.setAutoCommit(true);
            }
        });
    }
    
    private static Connection acquireConnection() {
        Connection conn = pool.poll();
        if (conn == null) {
            throw new IllegalStateException("No available connections in pool");
        }
        return conn;
    }
    
    private static void releaseConnection(Connection conn) {
        pool.offer(conn);
    }
    
    private static Connection createConnection() {
        // Create real database connection
        return new Connection();
    }
}

// Using the Loan Pattern - the client never manages the lifecycle
record User(long id, String name, String email) {}

// Simple operation
final List<User> users = ConnectionPool.withConnection(conn -> 
    conn.query("SELECT * FROM users WHERE active = true")
       .stream()
       .map(row -> new User(row.getLong("id"), row.getString("name"), row.getString("email")))
       .toList());

// Transactional operation
ConnectionPool.withTransaction(conn -> {
    conn.execute("UPDATE accounts SET balance = balance - 100 WHERE id = ?", sourceId);
    conn.execute("UPDATE accounts SET balance = balance + 100 WHERE id = ?", targetId);
    conn.execute("INSERT INTO transfers (source, target, amount) VALUES (?, ?, ?)", 
                 sourceId, targetId, 100);
    return null;
});
```


---

## SOLID Principles

The SOLID principles represent five essential foundations of object-oriented programming that, when applied correctly, lead to more maintainable, flexible, and robust systems.

### 1. Single Responsibility Principle (SRP)

A class should respond to only one actor or business domain, meaning it should have only one reason to change. It is common to confuse this principle by thinking that a class can only have one technical responsibility, but this is not correct. The real focus is on identifying which actor or business entity has responsibility over the class.

**Example: Separation of responsibilities by actor**

```java
// INCORRECT: A class that responds to multiple actors
public class Employee {
    public double calculatePay() { /* Accounting logic */ }
    public void saveToDatabase() { /* IT logic */ }
    public String generateReport() { /* Human Resources logic */ }
}

// CORRECT: Each class responds to a single actor
// Here the entity is shared, but a more robust implementation can have an entity per domain
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

A class should be open for extension but closed for modification. This is typically achieved through the use of abstractions (interfaces or abstract classes) that allow changing behavior without modifying existing code. When new behavior is needed, simply create a new implementation of the abstraction.

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

A subclass must be able to substitute its parent class without altering the correct behavior of the program. If there are methods in the parent class that are not supported or do not make sense in child classes, it is a sign that the class hierarchy needs to be restructured.

**Example: Correct vs incorrect hierarchy**

```java
// INCORRECT: LSP violation
public class Bird {
    public void fly() { IO.println("Flying..."); }
}

public class Penguin extends Bird {
    @Override
    public void fly() {
        throw new UnsupportedOperationException("Penguins cannot fly");
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

A class should not be forced to depend on methods it does not use. If an interface contains methods that some implementations do not need, it is a sign that the interface should be divided into smaller, more specific interfaces.

**Example: Segregated interfaces for different roles**

```java
// INCORRECT: "Fat" interface that forces implementing unnecessary methods
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

High-level modules should not depend on low-level modules; both should depend on abstractions. Abstractions should not depend on details; details should depend on abstractions. The intention is to avoid depending on volatile elements, considering that interfaces are less volatile than concrete implementations. However, it is acceptable to depend on concrete classes that are considered stable, such as those in the language's standard library.

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

// Configuration - here concrete dependencies are resolved
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


---

## Creational Design Patterns

Creational patterns abstract the object instantiation process, making the system independent of how its objects are created, composed, and represented.

### Abstract Factory

The **Abstract Factory** pattern focuses on creating families of related objects without specifying their concrete classes. It provides an interface that defines methods for creating each type of object within a family, while concrete factories implement the creation of specific objects that belong to the same variant or theme.

Clients work exclusively with abstract interfaces, both of the factory and the products, which allows changing entire families of objects simply by changing the concrete factory used. This pattern is especially useful when a system must be configured with multiple product families or when you want to provide a product library without revealing their implementations.

**Example: Multi-platform UI component system**

```java
// Abstract products
public interface Button {
    void render();
    void onClick(Runnable action);
}

public sealed interface TextField permits WindowsTextField, MacTextField {
    void render();
    String getValue();
    void setValue(String value);
}

public sealed interface Dialog permits WindowsDialog, MacDialog {
    void show(String title, String message);
    boolean confirm(String title, String message);
}

// Abstract factory
public sealed interface UIFactory permits WindowsUIFactory, MacUIFactory {
    
    Button createButton(String label);
    TextField createTextField(String placeholder);
    Dialog createDialog();
    
    // Factory method to get the correct factory based on the OS
    static UIFactory forCurrentPlatform() {
        String os = System.getProperty("os.name").toLowerCase();
        return switch (os) {
            case String s when s.contains("win") -> new WindowsUIFactory();
            case String s when s.contains("mac") -> new MacUIFactory();
        };
    }
}

// Windows implementations
public final class WindowsUIFactory implements UIFactory {
    @Override
    public Button createButton(String label) {
        return new WindowsButton(label);
    }
    
    @Override
    public TextField createTextField(String placeholder) {
        return new WindowsTextField(placeholder);
    }
    
    @Override
    public Dialog createDialog() {
        return new WindowsDialog();
    }
}

// Mac implementations (similar, with different style)
public final class MacUIFactory implements UIFactory {
    @Override
    public Button createButton(String label) { 
        return new MacButton(label); 
    }

    @Override
    public TextField createTextField(String placeholder) { 
        return new MacTextField(placeholder); 
    }

    @Override
    public Dialog createDialog() { 
        return new MacDialog(); 
    }
}

// ... concrete Mac implementations ...

// Client - works only with abstractions
public class LoginForm {
    private final Button loginButton;
    private final Button cancelButton;
    private final TextField usernameField;
    private final TextField passwordField;
    private final Dialog errorDialog;
    
    public LoginForm(UIFactory factory) {
        this.usernameField = factory.createTextField("Username");
        this.passwordField = factory.createTextField("Password");
        this.loginButton = factory.createButton("Sign In");
        this.cancelButton = factory.createButton("Cancel");
        this.errorDialog = factory.createDialog();
    }
    
    public void render() {
        usernameField.render();
        passwordField.render();
        loginButton.render();
        cancelButton.render();
    }
    
    public void login() {
        loginButton.onClick(() -> {
            if (authenticate(usernameField.getValue(), passwordField.getValue())) {
                IO.println("Login successful");
            } else {
                errorDialog.show("Error", "Invalid credentials");
            }
        });
    }
    
    private boolean authenticate(String user, String pass) {
        return user != null && pass != null && !user.isEmpty();
    }
}

// Usage
final var factory = UIFactory.forCurrentPlatform();
final var loginForm = new LoginForm(factory);
loginForm.render();
```

---

### Builder

The **Builder** pattern separates the construction of a complex object from its representation, allowing the same construction process to create different representations. This pattern is ideal when an object has many configuration parameters, some optional, or when the construction process must allow different representations of the final product.

Construction is done step by step, where each builder method configures an aspect of the object and returns the same builder to allow chaining. At the end, a `build()` method produces the final object. This provides a clear API and prevents creating objects in invalid states.

**Example: Builder for HTTP requests**

```java
public record HttpRequest(
    String method,
    String url,
    Map<String, String> headers,
    Map<String, String> queryParams,
    byte[] body,
    Duration timeout,
    boolean followRedirects
) {
    // Compact constructor for validation
    public HttpRequest {
        Objects.requireNonNull(method, "HTTP method is required");
        Objects.requireNonNull(url, "URL is required");
        headers = headers != null ? Map.copyOf(headers) : Map.of();
        queryParams = queryParams != null ? Map.copyOf(queryParams) : Map.of();
        body = body != null ? body.clone() : new byte[0];
        timeout = timeout != null ? timeout : Duration.ofSeconds(30);
    }
    
    public static Builder get(String url) {
        return new Builder("GET", url);
    }
    
    public static Builder post(String url) {
        return new Builder("POST", url);
    }
    
    public static Builder put(String url) {
        return new Builder("PUT", url);
    }
    
    public static Builder delete(String url) {
        return new Builder("DELETE", url);
    }
    
    public static final class Builder {
        private final String method;
        private final String url;
        private final Map<String, String> headers = new LinkedHashMap<>();
        private final Map<String, String> queryParams = new LinkedHashMap<>();
        private byte[] body;
        private Duration timeout;
        private boolean followRedirects = true;
        
        private Builder(String method, String url) {
            this.method = method;
            this.url = url;
        }
        
        public Builder header(String name, String value) {
            headers.put(name, value);
            return this;
        }
        
        public Builder contentType(String contentType) {
            return header("Content-Type", contentType);
        }
        
        public Builder accept(String mediaType) {
            return header("Accept", mediaType);
        }
        
        public Builder authorization(String token) {
            return header("Authorization", "Bearer " + token);
        }
        
        public Builder queryParam(String name, String value) {
            queryParams.put(name, value);
            return this;
        }
        
        public Builder body(byte[] body) {
            this.body = body;
            return this;
        }
        
        public Builder body(String body) {
            return body(body.getBytes(StandardCharsets.UTF_8));
        }
        
        public Builder jsonBody(Object obj) {
            // Assuming an ObjectMapper is available
            try {
                return contentType("application/json")
                    .body(new ObjectMapper().writeValueAsBytes(obj));
            } catch (JsonProcessingException e) {
                throw new IllegalArgumentException("Cannot serialize to JSON", e);
            }
        }
        
        public Builder timeout(Duration timeout) {
            this.timeout = timeout;
            return this;
        }
        
        public Builder noFollowRedirects() {
            this.followRedirects = false;
            return this;
        }
        
        public HttpRequest build() {
            return new HttpRequest(method, url, headers, queryParams, body, timeout, followRedirects);
        }
        
        // Convenient method to execute directly
        public HttpResponse execute() {
            return HttpClient.send(build());
        }
    }
}

// Using the Builder
final var request = HttpRequest.post("https://api.example.com/users")
    .contentType("application/json")
    .accept("application/json")
    .authorization("eyJhbGciOiJIUzI1NiIs...")
    .queryParam("version", "v2")
    .jsonBody(new CreateUserDto("John", "john@example.com"))
    .timeout(Duration.ofSeconds(10))
    .build();

// Or execute directly
final var response = HttpRequest.get("https://api.example.com/users")
    .queryParam("page", "1")
    .queryParam("limit", "20")
    .execute();
```

---

### Factory Method

The **Factory Method** pattern defines an interface for creating objects, but delegates to subclasses the decision of which concrete class to instantiate. This pattern allows a class to defer instantiation to its subclasses, promoting loose coupling by eliminating the need to bind specific classes in the application code.

Unlike Abstract Factory which creates families of related objects, Factory Method focuses on creating a single type of product. It is especially useful when a class cannot anticipate the type of objects it must create or when you want subclasses to specify the objects to create.

**Example: Notification system with Factory Method**

```java
public interface Notification {
    void send(String recipient, String message);
    String getType();
}

public record EmailNotification(String smtpServer) implements Notification {
    @Override
    public void send(String recipient, String message) {
        IO.println("📧 Sending email to " + recipient + ": " + message);
        // SMTP sending logic
    }
    
    @Override
    public String getType() { return "EMAIL"; }
}

public record SmsNotification(String apiKey) implements Notification {
    @Override
    public void send(String recipient, String message) {
        IO.println("📱 Sending SMS to " + recipient + ": " + message);
        // SMS sending logic via API
    }
    
    @Override
    public String getType() { return "SMS"; }
}

public record PushNotification(String firebaseToken) implements Notification {
    @Override
    public void send(String recipient, String message) {
        IO.println("🔔 Sending push to " + recipient + ": " + message);
        // Push notification logic
    }
    
    @Override
    public String getType() { return "PUSH"; }
}

// Abstract class with Factory Method
public abstract class NotificationService {
    
    // Factory Method - subclasses decide what to create
    protected abstract Notification createNotification();
    
    // Template method that uses the factory method
    public final void notifyUser(User user, String message) {
        Notification notification = createNotification();
        
        // Common logic: logging, validation, etc.
        IO.println("Preparando notificación tipo: " + notification.getType());
        
        if (user.hasOptedIn(notification.getType())) {
            notification.send(user.getContact(notification.getType()), message);
            logNotification(user, notification.getType(), message);
        } else {
            IO.println("User has not opted in for " + notification.getType());
        }
    }
    
    private void logNotification(User user, String type, String message) {
        IO.println("LOG: " + type + " notification sent to " + user.name());
    }
}

// Concrete implementations of the Factory Method
@RequiredArgsConstructor
public class EmailNotificationService extends NotificationService {
    private final String smtpServer;
    
    @Override
    protected Notification createNotification() {
        return new EmailNotification(smtpServer);
    }
}

@RequiredArgsConstructor
public class SmsNotificationService extends NotificationService {
    private final String apiKey;
    
    @Override
    protected Notification createNotification() {
        return new SmsNotification(apiKey);
    }
}

@RequiredArgsConstructor
public class PushNotificationService extends NotificationService {
    private final String firebaseToken;
    
    @Override
    protected Notification createNotification() {
        return new PushNotification(firebaseToken);
    }
}

// Usage with polymorphism
public class NotificationManager {
    private final Map<String, NotificationService> services;
    
    public NotificationManager() {
        this.services = Map.of(
            "EMAIL", new EmailNotificationService("smtp.example.com"),
            "SMS", new SmsNotificationService("twilio-api-key"),
            "PUSH", new PushNotificationService("firebase-token")
        );
    }
    
    public void broadcast(User user, String message) {
        services.values().forEach(service -> service.notifyUser(user, message));
    }
    
    public void notify(User user, String message, String preferredChannel) {
        services.getOrDefault(preferredChannel, services.get("EMAIL"))
                .notifyUser(user, message);
    }
}
```

---

### Prototype

The **Prototype** pattern allows creating new objects by cloning an existing instance instead of creating one from scratch. This approach is useful when object creation is expensive or complex, or when many variations of a base object with small modifications are needed.

The pattern reduces the number of classes needed in a program and offers flexibility to add or remove prototypes at runtime. Each prototype acts as a template that can be customized after cloning to create objects with slightly different characteristics.

**Example: Document template system**

```javascript
// Base class for documents
class DocumentTemplate {
  constructor(title, content, author) {
    this.title = title;
    this.content = content;
    this.author = author;
    this.createdAt = new Date();
  }

  clone() {
    return new DocumentTemplate(
      this.title,
      this.content,
      this.author
    );
  }

  display() {
    console.log(`Title: ${this.title}`);
    console.log(`Author: ${this.author}`);
    console.log(`Content: ${this.content}`);
  }
}

// Using Proxy to create a dynamic prototype system
class PrototypeRegistry {
  constructor() {
    this.prototypes = new Map();
  }

  register(name, prototype) {
    this.prototypes.set(name, prototype);
  }

  create(name, overrides = {}) {
    const prototype = this.prototypes.get(name);
    if (!prototype) {
      throw new Error(`Prototype "${name}" not found`);
    }

    // Create a proxy that allows cloning and customizing the prototype
    const cloned = prototype.clone();
    
    // Proxy to intercept and customize properties
    return new Proxy(cloned, {
      get(target, prop) {
        // If the property is in overrides, return it
        if (prop in overrides) {
          return overrides[prop];
        }
        // Otherwise, return the property from the cloned object
        return target[prop];
      },
      
      set(target, prop, value) {
        // Allow modifying properties
        target[prop] = value;
        return true;
      },
      
      has(target, prop) {
        // Check if the property exists in overrides or in the target
        return prop in overrides || prop in target;
      },
      
      ownKeys(target) {
        // Combine the keys from target and overrides
        const targetKeys = Reflect.ownKeys(target);
        const overrideKeys = Object.keys(overrides);
        return [...new Set([...targetKeys, ...overrideKeys])];
      },
      
      getOwnPropertyDescriptor(target, prop) {
        if (prop in overrides) {
          return {
            enumerable: true,
            configurable: true,
            value: overrides[prop]
          };
        }
        return Reflect.getOwnPropertyDescriptor(target, prop);
      }
    });
  }
}

// Using the prototype system with Proxy
const registry = new PrototypeRegistry();

// Register base prototypes
const blogPostTemplate = new DocumentTemplate(
  "Post Title",
  "Default content...",
  "Anonymous Author"
);

const reportTemplate = new DocumentTemplate(
  "Report",
  "This is a standard report.",
  "System"
);

registry.register("blog-post", blogPostTemplate);
registry.register("report", reportTemplate);

// Create customized instances using the proxy
const post1 = registry.create("blog-post", {
  title: "Introduction to Design Patterns",
  content: "Design patterns are reusable solutions...",
  author: "John Doe"
});

const post2 = registry.create("blog-post", {
  title: "Advanced JavaScript",
  content: "JavaScript offers powerful features...",
  author: "Jane Smith"
});

const report1 = registry.create("report", {
  title: "Monthly Report",
  content: "Summary of monthly activities..."
});

// Proxied objects maintain the prototype's properties
// but can be customized
post1.display();
// Title: Introduction to Design Patterns
// Author: John Doe
// Content: Design patterns are reusable solutions...

post2.display();
// Title: Advanced JavaScript
// Author: Jane Smith
// Content: JavaScript offers powerful features...

// The proxy allows dynamic property access
console.log(post1.createdAt); // Prototype creation date
console.log(post1.title);      // "Introduction to Design Patterns" (from override)

// Properties can also be modified after creation
post1.title = "New Title";
console.log(post1.title); // "New Title"
```

---

### Singleton

The **Singleton** pattern ensures that a class has exactly one instance and provides a global access point to it. Unlike other creational patterns that focus on how to create objects, Singleton focuses on how many objects are created.

This pattern offers flexibility to change the number of instances later and allows extending the class's functionality. Unlike using static methods, a Singleton can implement interfaces, be subclassed, and its implementation can be changed without affecting clients. It is common in database connections, configuration registries, and abstract factories.

**Example: Application configuration as Singleton**

```java
public final class AppConfiguration {
    
    // Holder pattern - thread-safe y lazy initialization
    private static final class Holder {
        private static final AppConfiguration INSTANCE = new AppConfiguration();
    }
    
    private final Map<String, String> properties;
    private final Instant loadedAt;
    
    private AppConfiguration() {
        this.properties = loadProperties();
        this.loadedAt = Instant.now();
        IO.println("Configuration loaded at " + loadedAt);
    }
    
    public static AppConfiguration getInstance() {
        return Holder.INSTANCE;
    }
    
    // Other methods
}

// Modern alternative using enum (inherently thread-safe)
public enum DatabaseConfig {
    INSTANCE;
    
    private final String url;
    private final String username;
    private final int maxPoolSize;
    
    DatabaseConfig() {
        final var config = AppConfiguration.getInstance();
        this.url = config.get("database.url", "jdbc:postgresql://localhost:5432/mydb");
        this.username = config.get("database.username", "admin");
        this.maxPoolSize = config.getInt("database.pool.maxSize", 10);
    }
    
    public String url() { return url; }
    public String username() { return username; }
    public int maxPoolSize() { return maxPoolSize; }
}

// Modern alternative using LazyConstants - Preview API in Java 26
final class EventManager {
    private final LazyConstant<EventManager> manager
        = LazyConstant.of(() -> new EventManager());

    CompletionStage<ProcessResult> processAsync(T event, Set<EventListeners> listeners) {
        return manager.get().parallelProcess(event, listeners).combine();
    }

    // Other methods
}

// Usage
final var config = AppConfiguration.getInstance();
final String apiUrl = config.get("api.base.url", "https://api.example.com");
final int timeout = config.getInt("api.timeout.seconds", 30);
final boolean debugMode = config.getBoolean("app.debug", false);

final var dbConfig = DatabaseConfig.INSTANCE;
IO.println("Conectando a: " + dbConfig.url());

final var futureResult = EventManager.processAsync(new DummyEvent(), List.of());
futureResult.thenAccept(result -> IO.println(result));
```


---

## Structural Design Patterns

Structural patterns focus on how classes and objects are composed to form larger structures. They use inheritance and composition to create new functionality from existing ones.

### Adapter

The **Adapter** pattern allows incompatible interfaces to work together by converting the interface of a class into another that the client expects. There are two main variants: class adapter (which uses multiple inheritance where the language allows it) and object adapter (which uses composition).

The class adapter inherits from the adapted class and implements the target interface, allowing modification of inherited behavior. The object adapter contains an instance of the adapted class and delegates calls, which allows adapting multiple classes and dynamically switching between them. The amount of work the adapter does depends on how different the interfaces are.

**Example: Adapter for payment system integration**

```java
// Target interface that our system expects
public interface PaymentProcessor {
    PaymentResult process(PaymentRequest request);
    PaymentStatus checkStatus(String transactionId);
    RefundResult refund(String transactionId, Money amount);
}

public record PaymentRequest(
    String customerId,
    Money amount,
    CardInfo card,
    String description
) {}

public record PaymentResult(
    String transactionId,
    PaymentStatus status,
    Instant processedAt,
    String message
) {}

public enum PaymentStatus { PENDING, COMPLETED, FAILED, REFUNDED }

// External library with incompatible interface (we cannot modify it)
public class StripeClient {
    public StripeCharge createCharge(String apiKey, StripeChargeRequest request) {
        // Stripe implementation
        return new StripeCharge();
    }
    
    public StripeCharge retrieveCharge(String apiKey, String chargeId) {
        return new StripeCharge();
    }
    
    public StripeRefund createRefund(String apiKey, String chargeId, long amountCents) {
        return new StripeRefund();
    }
}

public class StripeChargeRequest {
    private long amount;
    private String currency;
    private String source;
    private String description;
    // getters, setters...
}

// Object adapter - adapts StripeClient to PaymentProcessor
public class StripePaymentAdapter implements PaymentProcessor {
    
    private final StripeClient stripeClient;
    private final String apiKey;
    
    public StripePaymentAdapter(String apiKey) {
        this.stripeClient = new StripeClient();
        this.apiKey = apiKey;
    }
    
    @Override
    public PaymentResult process(PaymentRequest request) {
        // Convert our request to Stripe format
        var stripeRequest = new StripeChargeRequest();
        stripeRequest.setAmount(request.amount().toCents());
        stripeRequest.setCurrency(request.amount().currency());
        stripeRequest.setSource(createStripeToken(request.card()));
        stripeRequest.setDescription(request.description());
        
        try {
            StripeCharge charge = stripeClient.createCharge(apiKey, stripeRequest);
            
            // Convert Stripe response to our format
            return new PaymentResult(
                charge.getId(),
                mapStripeStatus(charge.getStatus()),
                Instant.ofEpochSecond(charge.getCreated()),
                charge.getOutcomeMessage()
            );
        } catch (StripeException e) {
            return new PaymentResult(
                null,
                PaymentStatus.FAILED,
                Instant.now(),
                e.getMessage()
            );
        }
    }
    
    @Override
    public PaymentStatus checkStatus(String transactionId) {
        StripeCharge charge = stripeClient.retrieveCharge(apiKey, transactionId);
        return mapStripeStatus(charge.getStatus());
    }
    
    @Override
    public RefundResult refund(String transactionId, Money amount) {
        StripeRefund refund = stripeClient.createRefund(apiKey, transactionId, amount.toCents());
        return new RefundResult(refund.getId(), refund.getStatus().equals("succeeded"));
    }
    
    private PaymentStatus mapStripeStatus(String stripeStatus) {
        return switch (stripeStatus) {
            case "succeeded" -> PaymentStatus.COMPLETED;
            case "pending" -> PaymentStatus.PENDING;
            case "refunded" -> PaymentStatus.REFUNDED;
            default -> PaymentStatus.FAILED;
        };
    }
    
    private String createStripeToken(CardInfo card) {
        // Create card token for Stripe
        return "tok_" + card.number().substring(card.number().length() - 4);
    }
}

// Usage - the client works with the unified interface
public class CheckoutService {
    private final PaymentProcessor paymentProcessor;
    
    public CheckoutService(PaymentProcessor paymentProcessor) {
        this.paymentProcessor = paymentProcessor;
    }
    
    public OrderConfirmation checkout(Cart cart, CardInfo card) {
        var request = new PaymentRequest(
            cart.customerId(),
            cart.total(),
            card,
            "Order #" + cart.id()
        );
        
        PaymentResult result = paymentProcessor.process(request);
        
        return switch (result.status()) {
            case COMPLETED -> new OrderConfirmation(cart.id(), result.transactionId(), true);
            case PENDING -> throw new PaymentPendingException(result.transactionId());
            default -> throw new PaymentFailedException(result.message());
        };
    }
}

// Configuration - choose adapter based on configuration
PaymentProcessor processor = switch (config.get("payment.provider")) {
    case "stripe" -> new StripePaymentAdapter(config.get("stripe.api.key"));
    case "paypal" -> new PayPalPaymentAdapter(config.get("paypal.client.id"), config.get("paypal.secret"));
    default -> throw new IllegalStateException("Unknown payment provider");
};
```

---

### Bridge

The **Bridge** pattern decouples an abstraction from its implementation, allowing both to vary independently. This pattern separates a class hierarchy into two independent hierarchies: one for abstractions and another for implementations.

The abstraction maintains a reference to an implementer object and delegates the actual work to it. This allows changing the implementation at runtime and avoids a combinatorial explosion of classes when there are multiple dimensions of variation. It is especially useful when you want to expose a public API while keeping implementation details internal.

**Example: Multi-platform rendering system**

```java
// Implementor - defines the low-level interface
public interface RenderingEngine {
    void drawLine(int x1, int y1, int x2, int y2, Color color);
    void drawCircle(int x, int y, int radius, Color color, boolean filled);
    void drawRectangle(int x, int y, int width, int height, Color color, boolean filled);
    void drawText(String text, int x, int y, Font font, Color color);
    void clear();
    byte[] exportAsImage(String format);
}

// Concrete implementations for different platforms
public class OpenGLRenderer implements RenderingEngine {
    private final long glContext;
    
    public OpenGLRenderer(int width, int height) {
        this.glContext = initOpenGL(width, height);
    }
    
    @Override
    public void drawLine(int x1, int y1, int x2, int y2, Color color) {
        glBegin(GL_LINES);
        glColor4f(color.getRed()/255f, color.getGreen()/255f, color.getBlue()/255f, color.getAlpha()/255f);
        glVertex2i(x1, y1);
        glVertex2i(x2, y2);
        glEnd();
    }
    
    @Override
    public void drawCircle(int x, int y, int radius, Color color, boolean filled) {
        // OpenGL implementation for circles
    }
    
    // ... other methods
}

public class SVGRenderer implements RenderingEngine {
    private final StringBuilder svgContent;
    private final int width;
    private final int height;
    
    public SVGRenderer(int width, int height) {
        this.width = width;
        this.height = height;
        this.svgContent = new StringBuilder();
        clear();
    }
    
    // ... other methods
}

// Abstraction - defines the high-level interface for shapes
public abstract class Shape {
    protected RenderingEngine renderer;
    protected Color color;
    protected int x, y;
    
    protected Shape(RenderingEngine renderer, Color color, int x, int y) {
        this.renderer = renderer;
        this.color = color;
        this.x = x;
        this.y = y;
    }
    
    public abstract void draw();
    public abstract double area();
    
    public void setRenderer(RenderingEngine renderer) {
        this.renderer = renderer;
    }
    
    public void moveTo(int newX, int newY) {
        this.x = newX;
        this.y = newY;
    }
}

// Refined abstractions - different types of shapes
public class Circle extends Shape {
    private final int radius;
    
    public Circle(RenderingEngine renderer, Color color, int x, int y, int radius) {
        super(renderer, color, x, y);
        this.radius = radius;
    }
    
    @Override
    public void draw() {
        renderer.drawCircle(x, y, radius, color, true);
    }
    
    @Override
    public double area() {
        return Math.PI * radius * radius;
    }
}

public class Rectangle extends Shape {
    private final int width;
    private final int height;
    
    public Rectangle(RenderingEngine renderer, Color color, int x, int y, int width, int height) {
        super(renderer, color, x, y);
        this.width = width;
        this.height = height;
    }
    
    @Override
    public void draw() {
        renderer.drawRectangle(x, y, width, height, color, true);
    }
    
    @Override
    public double area() {
        return width * height;
    }
}

public class Triangle extends Shape {
    private final int base;
    private final int height;
    
    public Triangle(RenderingEngine renderer, Color color, int x, int y, int base, int height) {
        super(renderer, color, x, y);
        this.base = base;
        this.height = height;
    }
    
    @Override
    public void draw() {
        // Draw triangle using lines
        int x2 = x + base;
        int x3 = x + base / 2;
        int y3 = y - height;
        
        renderer.drawLine(x, y, x2, y, color);
        renderer.drawLine(x2, y, x3, y3, color);
        renderer.drawLine(x3, y3, x, y, color);
    }
    
    @Override
    public double area() {
        return (base * height) / 2.0;
    }
}

// Using the Bridge pattern
public class DrawingApplication {
    private final List<Shape> shapes = new ArrayList<>();
    private RenderingEngine currentRenderer;
    
    public DrawingApplication(RenderingEngine renderer) {
        this.currentRenderer = renderer;
    }
    
    public void addShape(Shape shape) {
        shapes.add(shape);
    }
    
    public void switchRenderer(RenderingEngine newRenderer) {
        this.currentRenderer = newRenderer;
        // Update all shapes with new render
        shapes.forEach(shape -> shape.setRenderer(newRenderer));
    }
    
    public void render() {
        currentRenderer.clear();
        shapes.forEach(Shape::draw);
    }
    
    public byte[] export(String format) {
        render();
        return currentRenderer.exportAsImage(format);
    }
}

// Usage example
var svgRenderer = new SVGRenderer(800, 600);
var app = new DrawingApplication(svgRenderer);

app.addShape(new Circle(svgRenderer, Color.RED, 100, 100, 50));
app.addShape(new Rectangle(svgRenderer, Color.BLUE, 200, 200, 150, 100));
app.addShape(new Triangle(svgRenderer, Color.GREEN, 400, 300, 100, 80));

// Exportar como SVG
byte[] svgImage = app.export("svg");

// Cambiar a OpenGL para renderizado en pantalla
app.switchRenderer(new OpenGLRenderer(800, 600));
app.render();
```

---

### Composite

The **Composite** pattern allows composing objects into tree structures to represent part-whole hierarchies. Clients can treat individual objects and object compositions uniformly through a common interface.

This pattern organizes components into leaves (primitive elements without children) and composites (elements that contain other components). There is a trade-off between type safety (separating operations specific to leaves and composites) and transparency (having the same interface for both). Complex structures can be elegantly built from simple components.

**Example: File system with Composite**

```javascript
// Composite in React: Nested menu components

// Base component
export function Menu({ children }) {
  return <ul>{children}</ul>;
}

// "Leaf": simple menu item
export function MenuItem({ label }) {
  return <li>{label}</li>;
}

// "Composite": menu item with children (submenu)
export function SubMenu({ label, children }) {
  return (
    <li>
      <span>{label}</span>
      <ul>{children}</ul>
    </li>
  );
}

// Usage example:
export function AppMenu() {
  return (
    <Menu>
      <MenuItem label="Inicio" />
      <MenuItem label="Acerca de" />
      <SubMenu label="Productos">
        <MenuItem label="Producto A" />
        <MenuItem label="Producto B" />
        <SubMenu label="Más productos">
          <MenuItem label="Producto C" />
        </SubMenu>
      </SubMenu>
      <MenuItem label="Contacto" />
    </Menu>
  );
}
```


---

### Decorator

The **Decorator** pattern adds additional responsibilities to an object dynamically, providing a flexible alternative to inheritance for extending functionality. Decorators wrap the original object and maintain its interface, allowing multiple decorators to be stacked transparently.

This pattern is ideal when you need to add behavior to individual objects without affecting other objects of the same class. Each decorator can execute logic before, during, or after delegating to the wrapped object. In modern Java, decorators can also be elegantly implemented using function composition.

**Example: Text processing system with decorators**

```java
// Base interface
public interface TextProcessor {
    String process(String text);
}

// Base implementation
public class PlainTextProcessor implements TextProcessor {
    @Override
    public String process(String text) {
        return text;
    }
}

// Decorador base abstracto
public abstract class TextProcessorDecorator implements TextProcessor {
    protected final TextProcessor wrapped;
    
    protected TextProcessorDecorator(TextProcessor wrapped) {
        this.wrapped = Objects.requireNonNull(wrapped);
    }
    
    @Override
    public String process(String text) {
        return wrapped.process(text);
    }
}

// Decoradores concretos
public class UpperCaseDecorator extends TextProcessorDecorator {
    public UpperCaseDecorator(TextProcessor wrapped) {
        super(wrapped);
    }
    
    @Override
    public String process(String text) {
        return super.process(text).toUpperCase();
    }
}

@Slf4j
public class LoggingDecorator extends TextProcessorDecorator {
    public LoggingDecorator(TextProcessor wrapped) {
        super(wrapped);
    }
    
    @Override
    public String process(String text) {
        log.info("Input: " + text.substring(0, Math.min(50, text.length())) + "...");
        String result = super.process(text);
        log.info("Output: " + result.substring(0, Math.min(50, result.length())) + "...");
        return result;
    }
}

// Usage with stacked decorators
final TextProcessor processor = new LoggingDecorator(
    new HtmlEncodingDecorator(
        new CensoringDecorator(
            new TrimmingDecorator(
                new PlainTextProcessor()
            ),
            Set.of("spam", "inappropriate")
        )
    )
);

final String result = processor.process("  <script>spam content</script>  ");
// Output: &lt;script&gt;*** content&lt;/script&gt;

// Functional alternative using function composition
public class FunctionalTextProcessor {
    
    public static Function<String, String> trim() {
        return String::strip;
    }
    
    public static Function<String, String> toUpperCase() {
        return String::toUpperCase;
    }
    
    public static Function<String, String> censor(Set<String> bannedWords) {
        return text -> {
            String result = text;
            for (String word : bannedWords) {
                result = result.replaceAll("(?i)" + Pattern.quote(word), "***");
            }
            return result;
        };
    }
    
    public static Function<String, String> htmlEncode() {
        return text -> text
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;");
    }
    
    @SafeVarargs
    public static Function<String, String> compose(Function<String, String>... processors) {
        return Stream.of(processors)
            .reduce(Function.identity(), Function::andThen);
    }
}

// Functional use
final var processor = FunctionalTextProcessor.compose(
    FunctionalTextProcessor.trim(),
    FunctionalTextProcessor.censor(Set.of("spam")),
    FunctionalTextProcessor.htmlEncode(),
    FunctionalTextProcessor.toUpperCase()
);

final String result = processor.apply("  <spam>hello</spam>  ");
// Output: &LT;***&GT;HELLO&LT;/***&GT;
```

---

### Facade

The **Facade** pattern provides a unified and simplified interface for a set of interfaces in a subsystem. It reduces system complexity by hiding its internal components behind a facade that exposes only the most common operations.

This pattern is useful when there is a complex system with multiple interdependent classes and you want to provide a simple way to use it for the most frequent use cases. 

For example, you want to provide a facade for using a relational database, but you want to hide the complexity of changing implementations when working with OracleDB vs Aurora RDS. So you provide only an interface and internally make the corresponding changes depending on which database is being used. 

The facade does not prevent direct access to subsystem components when advanced functionality is needed, but offers a convenient entry point for most situations.

**Example: Facade for e-commerce system**

```php
// Example of Facade usage in Laravel

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;

Route::get('/facade-ejemplo', function () {
    // Access a database (can be postgresql, mysql, etc.) using the DB facade
    $users = DB::table('users')->where('active', true)->get();

    // Temporarily store data with the Cache facade
    Cache::put('active_users', $users, 60);

    // Send an email using the Mail facade
    Mail::raw('Bienvenido!', function ($message) {
        $message->to('correo@ejemplo.com')
                ->subject('Saludos desde Laravel');
    });

    return 'Operaciones realizadas mediante facades.';
});

/*
Laravel Facades allow accessing complex functionality (databases, cache, email, etc.)
through a global and simple interface, using only a static class as an access point.
This simplifies the code and eliminates the need to manually instantiate services or dependencies.
Behind the scenes, each one can use different services (e.g., redis, valkey, etc.)
*/

```

---

### Flyweight

The **Flyweight** pattern optimizes memory usage by efficiently sharing large numbers of similar objects. It separates an object's state into intrinsic state (shared, immutable) and extrinsic state (unique per context, provided by the client).

This pattern is applicable when many objects are used whose storage is expensive, most of the state can be externalized, and using the pattern significantly reduces the number of objects. A flyweight object must be indistinguishable from one created independently for each use.

**Example: Text editor with shared characters**

```java
// Example: String pool (implicit flyweight in Java)
public class PoolStringFlyweightDemo {
    public static void main(String[] args) {
        // Literals: both point to the same object in the pool
        String a = "hola";
        String b = "hola";
        System.out.println(a == b); // true

        // new String: creates a new object ONLY if intern() is not used
        String c = new String("hola");
        System.out.println(a == c); // false

        // intern(): forces using the unique object from the pool (flyweight)
        String d = c.intern();
        System.out.println(a == d); // true

        // Whenever a string is interned, the instance is shared in memory
    }
}
/*
In Java, string literals and interned strings are stored in a pool.
This implements the flyweight pattern: if two parts of the program use the same literal or intern(), 
they get the same immutable and shared reference — saving memory.
Note: since the result of == changes depending on how the String was created
it is still bad practice in Java to compare two Strings with ==. Always use the equals method
*/

```

---

### Proxy

The **Proxy** pattern provides a substitute or placeholder for another object to control access to it. Unlike the Adapter which changes the interface, the Proxy implements the same interface as the real object and can add additional behavior such as lazy loading, access control, logging, or caching.

There are several types of proxies: virtual (creates expensive objects on demand), remote (represents objects in another address space), protection (controls access permissions), and smart reference (performs additional operations on each access).

**Example: Proxy with multiple functionalities**

```java
// Common interface
public interface ImageLoader {
    Image load(String path);
    byte[] loadRaw(String path);
    ImageMetadata getMetadata(String path);
}

public record Image(String path, int width, int height, byte[] data) {}
public record ImageMetadata(String path, long size, String format, Instant created) {}

// Real implementation (expensive)
public class DiskImageLoader implements ImageLoader {
    // Implements logic to load image from disk
}

// Virtual proxy with lazy loading and cache
public class CachingImageProxy implements ImageLoader {
    
    private final ImageLoader realLoader;
    private final Map<String, Image> imageCache = new ConcurrentHashMap<>();
    private final Map<String, ImageMetadata> metadataCache = new ConcurrentHashMap<>();
    private final int maxCacheSize;
    
    public CachingImageProxy(ImageLoader realLoader, int maxCacheSize) {
        this.realLoader = realLoader;
        this.maxCacheSize = maxCacheSize;
    }
    
    @Override
    public Image load(String path) {
        return imageCache.computeIfAbsent(path, p -> {
            evictIfNecessary();
            return realLoader.load(p);
        });
    }
    
    @Override
    public byte[] loadRaw(String path) {
        // Raw siempre va al disco, no se cachea
        return realLoader.loadRaw(path);
    }
    
    @Override
    public ImageMetadata getMetadata(String path) {
        return metadataCache.computeIfAbsent(path, realLoader::getMetadata);
    }
    
    private void evictIfNecessary() {
        if (imageCache.size() >= maxCacheSize) {
            // Evict oldest entry (simplified)
            imageCache.keySet().stream().findFirst().ifPresent(imageCache::remove);
        }
    }
    
    public void clearCache() {
        imageCache.clear();
        metadataCache.clear();
    }
    
    public int cacheSize() {
        return imageCache.size();
    }
}

// Combined use of proxies (proxy decorator)
final ImageLoader loader =
        new CachingImageProxy(
            new DiskImageLoader(),
            100  // max cache size
        );

// The client uses the interface without knowing about the proxies
final Image img1 = loader.load("/images/photo.png");  // Load from disk
final Image img2 = loader.load("/images/photo.png");  // From cache
```


---

## Behavioral Design Patterns

Behavioral patterns focus on communication between objects, defining how they interact and distribute responsibilities.

### Chain of Responsibility

The **Chain of Responsibility** pattern allows passing requests through a chain of potential handlers. Each handler decides whether to process the request or pass it to the next in the chain. This decouples the sender of the request from its receivers, giving multiple objects the opportunity to handle it.

This pattern provides flexibility to dynamically determine which object handles each request. It is especially useful for implementing processing pipelines, middlewares, or validation systems where multiple filters must be applied in sequence.

**Example: HTTP middleware pipeline**

```java
// Handler interface
public interface HttpHandler {
    HttpResponse handle(HttpRequest request);
}

// Abstract base class for middleware
public abstract class Middleware implements HttpHandler {
    protected HttpHandler next;
    
    public Middleware setNext(HttpHandler next) {
        this.next = next;
        return this;
    }
    
    protected HttpResponse passToNext(HttpRequest request) {
        if (next != null) {
            return next.handle(request);
        }
        return HttpResponse.notFound("No handler found");
    }
}

// Logging middleware
public class LoggingMiddleware extends Middleware {
    
    private static final Logger log = Logger.getLogger(LoggingMiddleware.class.getName());
    
    @Override
    public HttpResponse handle(HttpRequest request) {
        long startTime = System.currentTimeMillis();
        String requestId = UUID.randomUUID().toString().substring(0, 8);
        
        log.info("[%s] → %s %s".formatted(requestId, request.method(), request.path()));
        
        HttpResponse response = passToNext(request);
        
        long duration = System.currentTimeMillis() - startTime;
        log.info("[%s] ← %d (%dms)".formatted(requestId, response.status(), duration));
        
        return response;
    }
}

// Cache middleware
public class CacheMiddleware extends Middleware {
    
    private final Cache<String, HttpResponse> cache;
    private final Duration ttl;
    
    public CacheMiddleware(Cache<String, HttpResponse> cache, Duration ttl) {
        this.cache = cache;
        this.ttl = ttl;
    }
    
    @Override
    public HttpResponse handle(HttpRequest request) {
        // Only cache GET requests
        if (!"GET".equals(request.method())) {
            return passToNext(request);
        }
        
        String cacheKey = request.method() + ":" + request.path() + ":" + request.queryString();
        
        HttpResponse cached = cache.get(cacheKey);
        if (cached != null) {
            return cached.withHeader("X-Cache", "HIT");
        }
        
        HttpResponse response = passToNext(request);
        
        if (response.status() == 200) {
            cache.put(cacheKey, response, ttl);
        }
        
        return response.withHeader("X-Cache", "MISS");
    }
}

// Final controller (ends the chain)
public class ApiController implements HttpHandler {
    
    private final Map<String, Function<HttpRequest, HttpResponse>> routes;
    
    public ApiController() {
        this.routes = new HashMap<>();
    }
    
    public void addRoute(String path, Function<HttpRequest, HttpResponse> handler) {
        routes.put(path, handler);
    }
    
    @Override
    public HttpResponse handle(HttpRequest request) {
        return routes.getOrDefault(request.path(), 
            r -> HttpResponse.notFound("Route not found"))
            .apply(request);
    }
}

// Builder to construct the pipeline
public class MiddlewarePipeline {
    
    private final List<Middleware> middlewares = new ArrayList<>();
    private HttpHandler finalHandler;
    
    public MiddlewarePipeline use(Middleware middleware) {
        middlewares.add(middleware);
        return this;
    }
    
    public MiddlewarePipeline endpoint(HttpHandler handler) {
        this.finalHandler = handler;
        return this;
    }
    
    public HttpHandler build() {
        if (finalHandler == null) {
            throw new IllegalStateException("Final handler not set");
        }
        
        HttpHandler current = finalHandler;
        for (int i = middlewares.size() - 1; i >= 0; i--) {
            middlewares.get(i).setNext(current);
            current = middlewares.get(i);
        }
        
        return current;
    }
}

// Using Chain of Responsibility
final var controller = new ApiController();
controller.addRoute("/api/users", req -> HttpResponse.ok("{\"users\": []}"));
controller.addRoute("/api/products", req -> HttpResponse.ok("{\"products\": []}"));

final var pipeline = new MiddlewarePipeline()
    .use(new LoggingMiddleware())
    .use(new CacheMiddleware(new LRUCache<>(), Duration.ofMinutes(5)))
    .endpoint(controller)
    .build();

HttpResponse response = pipeline.handle(new HttpRequest("GET", "/api/users"));
```

---

### Command

The **Command** pattern encapsulates a request as an object, allowing parameterizing clients with different requests, queuing or logging requests, and supporting reversible operations. It decouples the object that invokes the operation from the one that knows how to execute it.

Each command is an autonomous object that contains all the information necessary to execute an action. This allows creating command queues, implementing undo/redo, logging operation history, and creating composite commands (macros).

**Example: Text editor system with undo/redo**

```java
// Command interface
public interface TextCommand {
    void execute();
    void undo();
    String description();
}

// Receiver - the document on which commands operate
public class TextDocument {
    private final StringBuilder content;
    private final List<TextDocumentListener> listeners = new ArrayList<>();
    
    public TextDocument() {
        this.content = new StringBuilder();
    }
    
    public TextDocument(String initialContent) {
        this.content = new StringBuilder(initialContent);
    }
    
    public void insert(int position, String text) {
        content.insert(position, text);
        notifyListeners();
    }
    
    public String delete(int start, int length) {
        String deleted = content.substring(start, start + length);
        content.delete(start, start + length);
        notifyListeners();
        return deleted;
    }
    
    public String replace(int start, int end, String newText) {
        String replaced = content.substring(start, end);
        content.replace(start, end, newText);
        notifyListeners();
        return replaced;
    }
    
    public String getText() {
        return content.toString();
    }
    
    public int length() {
        return content.length();
    }
    
    public void addListener(TextDocumentListener listener) {
        listeners.add(listener);
    }
    
    private void notifyListeners() {
        listeners.forEach(l -> l.onDocumentChanged(this));
    }
}

// Concrete commands
public final class InsertCommand implements TextCommand {
    private final TextDocument document;
    private final int position;
    private final String text;
    
    public InsertCommand(TextDocument document, int position, String text) {
        this.document = document;
        this.position = position;
        this.text = text;
    }
    
    @Override
    public void execute() {
        document.insert(position, text);
    }
    
    @Override
    public void undo() {
        document.delete(position, text.length());
    }
    
    @Override
    public String description() {
        return "Insert '%s' at position %d".formatted(
            text.length() > 20 ? text.substring(0, 20) + "..." : text, 
            position);
    }
}

public final class DeleteCommand implements TextCommand {
    private final TextDocument document;
    private final int start;
    private final int length;
    private String deletedText;
    
    public DeleteCommand(TextDocument document, int start, int length) {
        this.document = document;
        this.start = start;
        this.length = length;
    }
    
    @Override
    public void execute() {
        deletedText = document.delete(start, length);
    }
    
    @Override
    public void undo() {
        document.insert(start, deletedText);
    }
    
    @Override
    public String description() {
        return "Delete %d characters at position %d".formatted(length, start);
    }
}

// Other commands ...

// Composite command (Macro)
public final class MacroCommand implements TextCommand {
    private final String name;
    private final List<TextCommand> commands;
    
    public MacroCommand(String name, List<TextCommand> commands) {
        this.name = name;
        this.commands = new ArrayList<>(commands);
    }
    
    @Override
    public void execute() {
        commands.forEach(TextCommand::execute);
    }
    
    @Override
    public void undo() {
        // Undo en orden inverso
        for (int i = commands.size() - 1; i >= 0; i--) {
            commands.get(i).undo();
        }
    }
    
    @Override
    public String description() {
        return "Macro '%s' (%d commands)".formatted(name, commands.size());
    }
}

// Invoker - manages history and undo/redo
public class CommandHistory {
    private final Deque<TextCommand> undoStack = new ArrayDeque<>();
    private final Deque<TextCommand> redoStack = new ArrayDeque<>();
    private final int maxHistory;
    
    public CommandHistory(int maxHistory) {
        this.maxHistory = maxHistory;
    }
    
    public void execute(TextCommand command) {
        command.execute();
        undoStack.push(command);
        redoStack.clear(); // Clear redo when executing new command
        
        // Maintain history limit
        while (undoStack.size() > maxHistory) {
            undoStack.removeLast();
        }
    }
    
    public boolean canUndo() {
        return !undoStack.isEmpty();
    }
    
    public boolean canRedo() {
        return !redoStack.isEmpty();
    }
    
    public void undo() {
        if (canUndo()) {
            TextCommand command = undoStack.pop();
            command.undo();
            redoStack.push(command);
        }
    }
    
    public void redo() {
        if (canRedo()) {
            TextCommand command = redoStack.pop();
            command.execute();
            undoStack.push(command);
        }
    }
    
    public List<String> getUndoHistory() {
        return undoStack.stream().map(TextCommand::description).toList();
    }
    
    public List<String> getRedoHistory() {
        return redoStack.stream().map(TextCommand::description).toList();
    }
}

// Client - Text editor
public class TextEditor {
    private final TextDocument document;
    private final CommandHistory history;
    private int cursorPosition = 0;
    
    public TextEditor() {
        this.document = new TextDocument();
        this.history = new CommandHistory(100);
    }
    
    public void type(String text) {
        history.execute(new InsertCommand(document, cursorPosition, text));
        cursorPosition += text.length();
    }
    
    public void delete(int length) {
        if (cursorPosition > 0 && length > 0) {
            int deleteStart = Math.max(0, cursorPosition - length);
            int actualLength = cursorPosition - deleteStart;
            history.execute(new DeleteCommand(document, deleteStart, actualLength));
            cursorPosition = deleteStart;
        }
    }
    
    public void replaceSelection(int selectionLength, String newText) {
        history.execute(new ReplaceCommand(
            document, cursorPosition, cursorPosition + selectionLength, newText));
        cursorPosition += newText.length();
    }
    
    public void undo() { history.undo(); }
    public void redo() { history.redo(); }
    
    public String getText() { return document.getText(); }
}

// Using the Command pattern
final var editor = new TextEditor();

editor.type("Hello ");
editor.type("World");
IO.println(editor.getText()); // "Hello World"

editor.undo();
IO.println(editor.getText()); // "Hello "

editor.redo();
IO.println(editor.getText()); // "Hello World"

editor.type("!");
IO.println(editor.getText()); // "Hello World!"
```

---

### Interpreter

The **Interpreter** pattern defines a grammatical representation for a language and an interpreter that uses that representation to interpret sentences in the language. It is useful when there is a problem that occurs frequently and can be expressed through a simple language.

The pattern uses an abstract syntax tree (AST) where each node is an expression. Terminal expressions represent atomic elements of the language, while non-terminal expressions compose other expressions. Although not the most efficient, it is ideal for simple domain-specific languages (DSL).

**Example: Filter expression interpreter**

```java
// Interpretation context
public record FilterContext<T>(T item, Map<String, Object> variables) {
    
    @SuppressWarnings("unchecked")
    public <V> V getVariable(String name) {
        return (V) variables.get(name);
    }
    
    public Object getProperty(String propertyName) {
        try {
            var getter = item.getClass().getMethod(propertyName);
            return getter.invoke(item);
        } catch (Exception e) {
            throw new RuntimeException("Cannot access property: " + propertyName, e);
        }
    }
}

// Abstract expression
public sealed interface FilterExpression<T> 
        permits PropertyExpression, LiteralExpression, ComparisonExpression, 
                AndExpression, OrExpression, NotExpression, InExpression {
    
    boolean interpret(FilterContext<T> context);
    String toQueryString();
}

// Expresiones terminales
public record PropertyExpression<T>(String propertyName) implements FilterExpression<T> {
    @Override
    public boolean interpret(FilterContext<T> context) {
        Object value = context.getProperty(propertyName);
        return value instanceof Boolean b ? b : value != null;
    }
    
    @Override
    public String toQueryString() {
        return propertyName;
    }
    
    public Object getValue(FilterContext<T> context) {
        return context.getProperty(propertyName);
    }
}

// Expresiones no terminales - comparaciones
public record ComparisonExpression<T>(
    PropertyExpression<T> left,
    ComparisonOperator operator,
    FilterExpression<T> right
) implements FilterExpression<T> {
    
    public enum ComparisonOperator {
        EQUALS("="), NOT_EQUALS("!="), 
        GREATER_THAN(">"), LESS_THAN("<"),
        GREATER_OR_EQUALS(">="), LESS_OR_EQUALS("<="),
        CONTAINS("CONTAINS"), STARTS_WITH("STARTS_WITH");
        
        private final String symbol;
        ComparisonOperator(String symbol) { this.symbol = symbol; }
        public String symbol() { return symbol; }
    }
    
    @Override
    public boolean interpret(FilterContext<T> context) {
        Object leftValue = left.getValue(context);
        Object rightValue = right instanceof LiteralExpression<T> lit ? 
            lit.value() : right.interpret(context);
        
        return switch (operator) {
            case EQUALS -> Objects.equals(leftValue, rightValue);
            case NOT_EQUALS -> !Objects.equals(leftValue, rightValue);
            case GREATER_THAN -> compare(leftValue, rightValue) > 0;
            case LESS_THAN -> compare(leftValue, rightValue) < 0;
            case GREATER_OR_EQUALS -> compare(leftValue, rightValue) >= 0;
            case LESS_OR_EQUALS -> compare(leftValue, rightValue) <= 0;
            case CONTAINS -> String.valueOf(leftValue).contains(String.valueOf(rightValue));
            case STARTS_WITH -> String.valueOf(leftValue).startsWith(String.valueOf(rightValue));
        };
    }
    
    @SuppressWarnings("unchecked")
    private int compare(Object a, Object b) {
        if (a instanceof Comparable c1 && b instanceof Comparable c2) {
            return c1.compareTo(c2);
        }
        throw new IllegalArgumentException("Cannot compare: " + a + " with " + b);
    }
    
    @Override
    public String toQueryString() {
        return "%s %s %s".formatted(left.toQueryString(), operator.symbol(), right.toQueryString());
    }
}

// Logical expressions
public record AndExpression<T>(FilterExpression<T> left, FilterExpression<T> right) 
        implements FilterExpression<T> {
    
    @Override
    public boolean interpret(FilterContext<T> context) {
        return left.interpret(context) && right.interpret(context);
    }
    
    @Override
    public String toQueryString() {
        return "(%s AND %s)".formatted(left.toQueryString(), right.toQueryString());
    }
}

public record OrExpression<T>(FilterExpression<T> left, FilterExpression<T> right) 
        implements FilterExpression<T> {
    
    @Override
    public boolean interpret(FilterContext<T> context) {
        return left.interpret(context) || right.interpret(context);
    }
    
    @Override
    public String toQueryString() {
        return "(%s OR %s)".formatted(left.toQueryString(), right.toQueryString());
    }
}

// Otras implementaciones

// Builder DSL to construct expressions
public class FilterBuilder<T> {
    
    public PropertyBuilder<T> where(String property) {
        return new PropertyBuilder<>(new PropertyExpression<>(property));
    }
    
    public static class PropertyBuilder<T> {
        private final PropertyExpression<T> property;
        
        PropertyBuilder(PropertyExpression<T> property) {
            this.property = property;
        }
        
        public FilterExpression<T> equals(Object value) {
            return new ComparisonExpression<>(property, 
                ComparisonExpression.ComparisonOperator.EQUALS, 
                new LiteralExpression<>(value));
        }
        
        public FilterExpression<T> greaterThan(Object value) {
            return new ComparisonExpression<>(property,
                ComparisonExpression.ComparisonOperator.GREATER_THAN,
                new LiteralExpression<>(value));
        }
        
        public FilterExpression<T> contains(String value) {
            return new ComparisonExpression<>(property,
                ComparisonExpression.ComparisonOperator.CONTAINS,
                new LiteralExpression<>(value));
        }
        
        public FilterExpression<T> in(Object... values) {
            return new InExpression<>(property, List.of(values));
        }
    }
    
    public static <T> FilterExpression<T> and(FilterExpression<T> left, FilterExpression<T> right) {
        return new AndExpression<>(left, right);
    }
    
    public static <T> FilterExpression<T> or(FilterExpression<T> left, FilterExpression<T> right) {
        return new OrExpression<>(left, right);
    }
    
    public static <T> FilterExpression<T> not(FilterExpression<T> expr) {
        return new NotExpression<>(expr);
    }
}

// Using the Interpreter
public record Product(String name, String category, double price, boolean active) {}

final var filter = new FilterBuilder<Product>();

// Build expression: category = 'Electronics' AND price > 100 AND active = true
final FilterExpression<Product> expression = FilterBuilder.and(
    FilterBuilder.and(
        filter.where("category").equals("Electronics"),
        filter.where("price").greaterThan(100.0)
    ),
    filter.where("active").equals(true)
);

IO.println("Query: " + expression.toQueryString());
// Output: ((category = 'Electronics' AND price > 100.0) AND active = true)

// Filtrar productos
final List<Product> products = List.of(
    new Product("Laptop", "Electronics", 999.99, true),
    new Product("Mouse", "Electronics", 29.99, true),
    new Product("Desk", "Furniture", 199.99, true),
    new Product("Monitor", "Electronics", 299.99, false)
);

final var filtered = products.stream()
    .filter(p -> expression.interpret(new FilterContext<>(p, Map.of())))
    .toList();

IO.println("Filtered: " + filtered);
// Output: [Product[name=Laptop, category=Electronics, price=999.99, active=true]]
```


---

### Iterator

The **Iterator** pattern provides a way to sequentially access elements of a collection without exposing its internal representation. It separates the responsibility of traversing the collection from the collection itself, allowing different iteration strategies.

This pattern offers flexibility to implement multiple ways to traverse a data structure. In modern Java, the pattern is integrated into the language through `Iterable`, `Iterator`, and the Streams API. However, it is still valuable to implement it explicitly for custom data structures or when specialized iterators are needed.

**Example: Custom iterators for binary tree**

```java
// Estructura del nodo
public class TreeNode<T> {
    private final T value;
    private TreeNode<T> left;
    private TreeNode<T> right;
    
    public TreeNode(T value) {
        this.value = value;
    }
    
    public T value() { return value; }
    public TreeNode<T> left() { return left; }
    public TreeNode<T> right() { return right; }
    
    public void setLeft(TreeNode<T> left) { this.left = left; }
    public void setRight(TreeNode<T> right) { this.right = right; }
}

// Binary tree with multiple iteration strategies
public class BinaryTree<T> implements Iterable<T> {
    
    private TreeNode<T> root;
    
    public enum TraversalOrder { IN_ORDER }
    
    private TraversalOrder defaultOrder = TraversalOrder.IN_ORDER;
    
    public void setRoot(TreeNode<T> root) {
        this.root = root;
    }
    
    public void setDefaultTraversal(TraversalOrder order) {
        this.defaultOrder = order;
    }
    
    @Override
    public Iterator<T> iterator() {
        return iterator(defaultOrder);
    }
    
    public Iterator<T> iterator(TraversalOrder order) {
        return switch (order) {
            case IN_ORDER -> new InOrderIterator<>(root);
        };
    }
    
    public Iterable<T> inOrder() {
        return () -> iterator(TraversalOrder.IN_ORDER);
    }
    
    // Stream support
    public Stream<T> stream() {
        return stream(defaultOrder);
    }
    
    public Stream<T> stream(TraversalOrder order) {
        return StreamSupport.stream(
            Spliterators.spliteratorUnknownSize(iterator(order), Spliterator.ORDERED),
            false
        );
    }
}

// In-Order iterator (left -> root -> right)
class InOrderIterator<T> implements Iterator<T> {
    private final Deque<TreeNode<T>> stack = new ArrayDeque<>();
    
    InOrderIterator(TreeNode<T> root) {
        pushLeft(root);
    }
    
    private void pushLeft(TreeNode<T> node) {
        while (node != null) {
            stack.push(node);
            node = node.left();
        }
    }
    
    @Override
    public boolean hasNext() {
        return !stack.isEmpty();
    }
    
    @Override
    public T next() {
        if (!hasNext()) throw new NoSuchElementException();
        TreeNode<T> current = stack.pop();
        pushLeft(current.right());
        return current.value();
    }
}

// Using the Iterator pattern
final var tree = new BinaryTree<Integer>();
//        4
//       / \
//      2   6
//     / \ / \
//    1  3 5  7

final var root = new TreeNode<>(4);
root.setLeft(new TreeNode<>(2));
root.setRight(new TreeNode<>(6));
root.left().setLeft(new TreeNode<>(1));
root.left().setRight(new TreeNode<>(3));
root.right().setLeft(new TreeNode<>(5));
root.right().setRight(new TreeNode<>(7));
tree.setRoot(root);

// Diferentes formas de iterar
IO.println("In-Order: " + tree.stream(TraversalOrder.IN_ORDER).toList());
// [1, 2, 3, 4, 5, 6, 7]

// Usage with for-each
for (Integer value : tree.inOrder()) {
    System.out.print(value + " ");
}

// Usage with Streams for functional operations
int sum = tree.stream()
    .filter(n -> n % 2 == 0)
    .mapToInt(Integer::intValue)
    .sum();
```

---

### Mediator

The **Mediator** pattern defines an object that encapsulates how a set of objects interact. It promotes loose coupling by preventing objects from referring to each other explicitly, and allows their interactions to vary independently.

This pattern centralizes control of complex communications between related objects. Participating objects (colleagues) only know the mediator, not the other objects they interact with. This simplifies maintenance and makes it easier to reuse individual objects.

**Example: Chat room as mediator**

```java
// Mediator interface
public interface ChatMediator {
    void sendMessage(String message, User sender);
    void sendPrivateMessage(String message, User sender, User recipient);
    void addUser(User user);
    void removeUser(User user);
    List<User> getOnlineUsers();
}

// Colleague interface (user)
public abstract class User {
    protected final String id;
    protected final String name;
    protected ChatMediator mediator;
    protected boolean online;
    
    protected User(String id, String name) {
        this.id = id;
        this.name = name;
        this.online = false;
    }
    
    public String id() { return id; }
    public String name() { return name; }
    public boolean isOnline() { return online; }
    
    public void join(ChatMediator mediator) {
        this.mediator = mediator;
        this.online = true;
        mediator.addUser(this);
    }
    
    public void leave() {
        if (mediator != null) {
            mediator.removeUser(this);
            this.online = false;
        }
    }
    
    public abstract void send(String message);
    public abstract void sendPrivate(String message, User recipient);
    public abstract void receive(String message, User sender);
    public abstract void receivePrivate(String message, User sender);
}

// Concrete user implementation
public class ChatUser extends User {
    private final List<ChatMessage> messageHistory = new ArrayList<>();
    
    public record ChatMessage(String content, String senderId, Instant timestamp, boolean isPrivate) {}
    
    public ChatUser(String id, String name) {
        super(id, name);
    }
    
    @Override
    public void send(String message) {
        if (mediator != null && online) {
            IO.println("[" + name + "] sends: " + message);
            mediator.sendMessage(message, this);
        }
    }
    
    @Override
    public void sendPrivate(String message, User recipient) {
        if (mediator != null && online) {
            IO.println("[" + name + "] whispers to [" + recipient.name() + "]: " + message);
            mediator.sendPrivateMessage(message, this, recipient);
        }
    }
    
    @Override
    public void receive(String message, User sender) {
        var chatMessage = new ChatMessage(message, sender.id(), Instant.now(), false);
        messageHistory.add(chatMessage);
        IO.println("  [" + name + "] received from [" + sender.name() + "]: " + message);
    }
    
    @Override
    public void receivePrivate(String message, User sender) {
        var chatMessage = new ChatMessage(message, sender.id(), Instant.now(), true);
        messageHistory.add(chatMessage);
        IO.println("  [" + name + "] received private from [" + sender.name() + "]: " + message);
    }
    
    public List<ChatMessage> getHistory() {
        return Collections.unmodifiableList(messageHistory);
    }
}

// Mediator implementation
public class ChatRoom implements ChatMediator {
    private final String roomId;
    private final String roomName;
    private final Set<User> users = ConcurrentHashMap.newKeySet();
    private final List<BroadcastMessage> broadcastHistory = new ArrayList<>();
    private final Map<String, List<String>> blockedUsers = new ConcurrentHashMap<>();
    
    public record BroadcastMessage(String content, String senderId, Instant timestamp) {}
    
    public ChatRoom(String roomId, String roomName) {
        this.roomId = roomId;
        this.roomName = roomName;
    }
    
    @Override
    public void sendMessage(String message, User sender) {
        broadcastHistory.add(new BroadcastMessage(message, sender.id(), Instant.now()));
        
        // The mediator coordinates who receives the message
        users.stream()
            .filter(user -> !user.equals(sender))
            .filter(User::isOnline)
            .filter(user -> !isBlocked(sender.id(), user.id()))
            .forEach(user -> user.receive(message, sender));
    }
    
    @Override
    public void sendPrivateMessage(String message, User sender, User recipient) {
        if (users.contains(recipient) && recipient.isOnline() && !isBlocked(sender.id(), recipient.id())) {
            recipient.receivePrivate(message, sender);
        }
    }
    
    @Override
    public void addUser(User user) {
        users.add(user);
        // Notify other users
        sendSystemMessage(user.name() + " se ha unido al chat");
    }
    
    @Override
    public void removeUser(User user) {
        users.remove(user);
        sendSystemMessage(user.name() + " ha salido del chat");
    }
    
    @Override
    public List<User> getOnlineUsers() {
        return users.stream().filter(User::isOnline).toList();
    }
    
    public void blockUser(String blockerId, String blockedId) {
        blockedUsers.computeIfAbsent(blockerId, k -> new ArrayList<>()).add(blockedId);
    }
    
    private boolean isBlocked(String senderId, String recipientId) {
        return blockedUsers.getOrDefault(recipientId, List.of()).contains(senderId);
    }
    
    private void sendSystemMessage(String message) {
        users.stream()
            .filter(User::isOnline)
            .forEach(user -> IO.println("  [SYSTEM -> " + user.name() + "]: " + message));
    }
}

// Using the Mediator pattern
var chatRoom = new ChatRoom("room-1", "General");

var alice = new ChatUser("1", "Alice");
var bob = new ChatUser("2", "Bob");
var charlie = new ChatUser("3", "Charlie");

// Users join through the mediator
alice.join(chatRoom);
bob.join(chatRoom);
charlie.join(chatRoom);

// Mediated communication
alice.send("Hola a todos!");
// [Alice] sends: Hola a todos!
//   [Bob] received from [Alice]: Hola a todos!
//   [Charlie] received from [Alice]: Hola a todos!

bob.sendPrivate("Hola Alice, ¿cómo estás?", alice);
// [Bob] whispers to [Alice]: Hola Alice, ¿cómo estás?
//   [Alice] received private from [Bob]: Hola Alice, ¿cómo estás?

// Bloquear usuario
chatRoom.blockUser("Charlie", "Bob");
bob.send("Este mensaje no llegará a Charlie");

alice.leave();
// [SYSTEM -> Bob]: Alice ha salido del chat
// [SYSTEM -> Charlie]: Alice ha salido del chat
```

---

### Memento

The **Memento** pattern allows capturing and externalizing an object's internal state without violating its encapsulation, so it can be restored to that state later. It is especially useful for implementing undo functionality, checkpoints, or error recovery.

The pattern involves three participants: the Originator (the object whose state is saved), the Memento (stores the state), and the Caretaker (manages mementos without accessing their content). The Memento has a narrow interface for the Caretaker but a wide one for the Originator.

**Example: Code editor with snapshots**

```java
// Memento - almacena el estado
public final class EditorMemento {
    private final String content;
    private final int cursorPosition;
    private final Set<Integer> breakpoints;
    private final Instant savedAt;
    private final String description;
    
    // Package-private constructor - only Originator can create mementos
    EditorMemento(String content, int cursorPosition, Set<Integer> breakpoints, String description) {
        this.content = content;
        this.cursorPosition = cursorPosition;
        this.breakpoints = Set.copyOf(breakpoints);
        this.savedAt = Instant.now();
        this.description = description;
    }
    
    // Limited public interface for the Caretaker
    public Instant savedAt() { return savedAt; }
    public String description() { return description; }
    
    // Package-private methods for the Originator
    String content() { return content; }
    int cursorPosition() { return cursorPosition; }
    Set<Integer> breakpoints() { return breakpoints; }
}

// Originator - the editor
public class CodeEditor {
    private StringBuilder content;
    private int cursorPosition;
    private final Set<Integer> breakpoints;
    private String filename;
    
    public CodeEditor() {
        this.content = new StringBuilder();
        this.cursorPosition = 0;
        this.breakpoints = new HashSet<>();
    }
    
    public void newFile(String filename) {
        this.filename = filename;
        this.content = new StringBuilder();
        this.cursorPosition = 0;
        this.breakpoints.clear();
    }
    
    public void type(String text) {
        content.insert(cursorPosition, text);
        cursorPosition += text.length();
    }
    
    public void delete(int count) {
        int start = Math.max(0, cursorPosition - count);
        content.delete(start, cursorPosition);
        cursorPosition = start;
    }
    
    public void moveCursor(int position) {
        this.cursorPosition = Math.max(0, Math.min(position, content.length()));
    }
    
    public void toggleBreakpoint(int line) {
        if (breakpoints.contains(line)) {
            breakpoints.remove(line);
        } else {
            breakpoints.add(line);
        }
    }
    
    public String getContent() {
        return content.toString();
    }
    
    // Create memento
    public EditorMemento save(String description) {
        return new EditorMemento(
            content.toString(),
            cursorPosition,
            breakpoints,
            description
        );
    }
    
    // Restaurar desde memento
    public void restore(EditorMemento memento) {
        this.content = new StringBuilder(memento.content());
        this.cursorPosition = memento.cursorPosition();
        this.breakpoints.clear();
        this.breakpoints.addAll(memento.breakpoints());
    }
    
    public void displayStatus() {
        IO.println("=== Editor Status ===");
        IO.println("File: " + filename);
        IO.println("Content: " + content);
        IO.println("Cursor: " + cursorPosition);
        IO.println("Breakpoints: " + breakpoints);
        IO.println("====================");
    }
}

// Caretaker - gestiona el historial de mementos
public class EditorHistory {
    private final Deque<EditorMemento> history = new ArrayDeque<>();
    private final Deque<EditorMemento> redoStack = new ArrayDeque<>();
    private final int maxSnapshots;
    
    public EditorHistory(int maxSnapshots) {
        this.maxSnapshots = maxSnapshots;
    }
    
    public void save(EditorMemento memento) {
        history.push(memento);
        redoStack.clear();
        
        while (history.size() > maxSnapshots) {
            history.removeLast();
        }
    }
    
    public Optional<EditorMemento> undo() {
        if (history.size() > 1) {
            EditorMemento current = history.pop();
            redoStack.push(current);
            return Optional.of(history.peek());
        }
        return Optional.empty();
    }
    
    public Optional<EditorMemento> redo() {
        if (!redoStack.isEmpty()) {
            EditorMemento memento = redoStack.pop();
            history.push(memento);
            return Optional.of(memento);
        }
        return Optional.empty();
    }
    
    public List<String> getSnapshotDescriptions() {
        return history.stream()
            .map(m -> "[%s] %s".formatted(
                m.savedAt().toString().substring(11, 19),
                m.description()))
            .toList();
    }
    
    public Optional<EditorMemento> getSnapshot(int index) {
        return history.stream().skip(index).findFirst();
    }
}

// Facade to simplify usage
public class EditorWithHistory {
    private final CodeEditor editor;
    private final EditorHistory history;
    
    public EditorWithHistory() {
        this.editor = new CodeEditor();
        this.history = new EditorHistory(50);
    }
    
    public void newFile(String filename) {
        editor.newFile(filename);
        saveSnapshot("New file: " + filename);
    }
    
    public void type(String text) {
        editor.type(text);
        saveSnapshot("Typed: " + truncate(text, 20));
    }
    
    public void delete(int count) {
        editor.delete(count);
        saveSnapshot("Deleted " + count + " chars");
    }
    
    public void undo() {
        history.undo().ifPresent(memento -> {
            editor.restore(memento);
            IO.println("Undo: " + memento.description());
        });
    }
    
    public void redo() {
        history.redo().ifPresent(memento -> {
            editor.restore(memento);
            IO.println("Redo: " + memento.description());
        });
    }
    
    public void showHistory() {
        IO.println("=== Snapshot History ===");
        history.getSnapshotDescriptions().forEach(System.out::println);
    }
    
    private void saveSnapshot(String description) {
        history.save(editor.save(description));
    }
    
    private String truncate(String s, int maxLen) {
        return s.length() > maxLen ? s.substring(0, maxLen) + "..." : s;
    }
    
    public String getContent() { return editor.getContent(); }
    public void displayStatus() { editor.displayStatus(); }
}

// Using the Memento pattern
var editor = new EditorWithHistory();

editor.newFile("Main.java");
editor.type("public class Main {\n");
editor.type("    public static void main(String[] args) {\n");
editor.type("        IO.println(\"Hello\");\n");
editor.type("    }\n");
editor.type("}");

IO.println(editor.getContent());

editor.showHistory();

// Deshacer cambios
editor.undo();
editor.undo();
IO.println("After 2 undos:\n" + editor.getContent());

// Rehacer
editor.redo();
IO.println("After redo:\n" + editor.getContent());
```


---

### Observer

The **Observer** pattern defines a one-to-many relationship between objects, so that when an object (subject) changes its state, all its dependents (observers) are notified and updated automatically. Also known as publish-subscribe, this pattern is fundamental for implementing decoupled event systems.

The subject maintains a list of observers without knowing their concrete classes, providing maximum flexibility. Observers can subscribe, unsubscribe, or be notified of specific changes. An object can simultaneously act as a subject and observer of other objects.

**Example: Reactive event system**

```java
// Eventos tipados
public interface DomainEvent {
    String eventId();
    Instant occurredAt();
    String aggregateId();
}

public record OrderCreated(
    String eventId,
    Instant occurredAt,
    String aggregateId,
    String customerId,
    List<OrderItem> items,
    Money total
) implements DomainEvent {}

public record OrderShipped(
    String eventId,
    Instant occurredAt,
    String aggregateId,
    String trackingNumber,
    String carrier
) implements DomainEvent {}

// Observer interface with generic support
@FunctionalInterface
public interface EventListener<E extends DomainEvent> {
    void onEvent(E event);
}

// Subject - central EventBus
public class EventBus {
    
    private final Map<Class<? extends DomainEvent>, Set<EventListener<?>>> listeners = 
        new ConcurrentHashMap<>();
    
    private final ExecutorService asyncExecutor = Executors.newVirtualThreadPerTaskExecutor();
    
    @SuppressWarnings("unchecked")
    public <E extends DomainEvent> Subscription subscribe(Class<E> eventType, EventListener<E> listener) {
        listeners.computeIfAbsent(eventType, k -> ConcurrentHashMap.newKeySet())
                 .add(listener);
        
        return () -> unsubscribe(eventType, listener);
    }
    
    public <E extends DomainEvent> void unsubscribe(Class<E> eventType, EventListener<E> listener) {
        var eventListeners = listeners.get(eventType);
        if (eventListeners != null) {
            eventListeners.remove(listener);
        }
    }
    
    @SuppressWarnings("unchecked")
    public <E extends DomainEvent> void publish(E event) {
        var eventListeners = listeners.get(event.getClass());
        if (eventListeners != null) {
            eventListeners.forEach(listener -> 
                ((EventListener<E>) listener).onEvent(event));
        }
    }
    
    @SuppressWarnings("unchecked")
    public <E extends DomainEvent> void publishAsync(E event) {
        var eventListeners = listeners.get(event.getClass());
        if (eventListeners != null) {
            eventListeners.forEach(listener -> 
                asyncExecutor.submit(() -> {
                    try {
                        ((EventListener<E>) listener).onEvent(event);
                    } catch (Exception e) {
                        System.err.println("Error handling event: " + e.getMessage());
                    }
                }));
        }
    }
    
    // Functional interface for unsubscribe
    @FunctionalInterface
    public interface Subscription extends AutoCloseable {
        void unsubscribe();
        
        @Override
        default void close() { unsubscribe(); }
    }
}

// Concrete observers
public class InventoryService implements EventListener<OrderCreated> {
    
    @Override
    public void onEvent(OrderCreated event) {
        IO.println("📦 Reserving inventory for order: " + event.aggregateId());
        event.items().forEach(item -> 
            IO.println("  - Reserving " + item.quantity() + " x " + item.productId()));
    }
}

public class AnalyticsService {
    
    private final Map<String, AtomicInteger> ordersByCustomer = new ConcurrentHashMap<>();
    private final AtomicLong totalRevenue = new AtomicLong();
    
    public void trackOrderCreated(OrderCreated event) {
        ordersByCustomer.computeIfAbsent(event.customerId(), k -> new AtomicInteger())
                        .incrementAndGet();
        IO.println("📊 Analytics: New order tracked for customer " + event.customerId());
    }
}

// Other observer implementations...

// Using the Observer pattern
final var eventBus = new EventBus();

// Register observers
final var emailSender = new EmailSender();
final var notificationService = new NotificationService(emailSender);
final var inventoryService = new InventoryService();
final var analyticsService = new AnalyticsService();
final var shippingNotifier = new ShippingNotifier();

// Subscriptions - different observers for the same event
final var sub1 = eventBus.subscribe(OrderCreated.class, notificationService);
final var sub2 = eventBus.subscribe(OrderCreated.class, inventoryService);
final var sub3 = eventBus.subscribe(OrderCreated.class, analyticsService::trackOrderCreated);
final var sub4 = eventBus.subscribe(OrderShipped.class, shippingNotifier);

// Publish events
final var orderCreated = new OrderCreated(
    UUID.randomUUID().toString(),
    Instant.now(),
    "ORD-001",
    "CUST-123",
    List.of(new OrderItem("PROD-A", 2), new OrderItem("PROD-B", 1)),
    new Money(299.99, "USD")
);

eventBus.publish(orderCreated);
// Output:
// 📧 Sending order confirmation for order: ORD-001
// 📦 Reserving inventory for order: ORD-001
//   - Reserving 2 x PROD-A
//   - Reserving 1 x PROD-B
// 📊 Analytics: New order tracked for customer CUST-123

// Unsubscribe
sub1.unsubscribe();
// Or using try-with-resources
try (var subscription = eventBus.subscribe(OrderCreated.class, e -> 
        IO.println("Temporary listener: " + e.aggregateId()))) {
    eventBus.publish(orderCreated);
}
```

---

### State

The **State** pattern allows an object to alter its behavior when its internal state changes. The object will appear to change its class, as each state encapsulates the specific behavior associated with it in a separate class.

This pattern eliminates extensive conditional statements that check the object's current state. Instead, each possible state is represented as a class that implements the appropriate behavior. The context delegates operations to the current state object, and transitions between states can be managed by the context or by the states themselves.

**Example: State machine for order process**

```java
// State interface
public sealed interface OrderState permits 
        DraftState, PendingPaymentState, PaidState, ShippedState, DeliveredState, CancelledState {
    
    void addItem(OrderContext order, OrderItem item);
    void removeItem(OrderContext order, String productId);
    void submitOrder(OrderContext order);
    void processPayment(OrderContext order, PaymentInfo payment);
    void shipOrder(OrderContext order, ShippingInfo shipping);
    void deliverOrder(OrderContext order);
    void cancelOrder(OrderContext order, String reason);
    
    String stateName();
    
    // Default behavior - operation not allowed
    default void throwInvalidOperation(String operation) {
        throw new IllegalStateException(
            "Cannot " + operation + " in state: " + stateName());
    }
}

// Estados concretos
public final class DraftState implements OrderState {
    public static final DraftState INSTANCE = new DraftState();
    private DraftState() {}
    
    @Override
    public String stateName() { return "DRAFT"; }
    
    @Override
    public void addItem(OrderContext order, OrderItem item) {
        order.getItems().add(item);
        IO.println("✓ Item added: " + item);
    }
    
    @Override
    public void removeItem(OrderContext order, String productId) {
        order.getItems().removeIf(i -> i.productId().equals(productId));
        IO.println("✓ Item removed: " + productId);
    }
    
    @Override
    public void submitOrder(OrderContext order) {
        if (order.getItems().isEmpty()) {
            throw new IllegalStateException("Cannot submit empty order");
        }
        order.setState(PendingPaymentState.INSTANCE);
        IO.println("✓ Order submitted, awaiting payment");
    }
    
    @Override
    public void processPayment(OrderContext order, PaymentInfo payment) {
        throwInvalidOperation("process payment");
    }
    
    @Override
    public void shipOrder(OrderContext order, ShippingInfo shipping) {
        throwInvalidOperation("ship");
    }
    
    @Override
    public void deliverOrder(OrderContext order) {
        throwInvalidOperation("deliver");
    }
    
    @Override
    public void cancelOrder(OrderContext order, String reason) {
        order.setState(CancelledState.INSTANCE);
        order.setCancellationReason(reason);
        IO.println("✓ Draft order cancelled: " + reason);
    }
}

public final class PendingPaymentState implements OrderState {
    public static final PendingPaymentState INSTANCE = new PendingPaymentState();
    private PendingPaymentState() {}
    
    @Override
    public String stateName() { return "PENDING_PAYMENT"; }
    
    @Override
    public void addItem(OrderContext order, OrderItem item) {
        throwInvalidOperation("add items");
    }
    
    @Override
    public void removeItem(OrderContext order, String productId) {
        throwInvalidOperation("remove items");
    }
    
    @Override
    public void submitOrder(OrderContext order) {
        throwInvalidOperation("submit");
    }
    
    @Override
    public void processPayment(OrderContext order, PaymentInfo payment) {
        // Validar y procesar pago
        if (payment.amount().compareTo(order.getTotal()) < 0) {
            throw new IllegalArgumentException("Insufficient payment amount");
        }
        order.setPaymentInfo(payment);
        order.setState(PaidState.INSTANCE);
        IO.println("✓ Payment processed: " + payment.amount());
    }
    
    @Override
    public void shipOrder(OrderContext order, ShippingInfo shipping) {
        throwInvalidOperation("ship");
    }
    
    @Override
    public void deliverOrder(OrderContext order) {
        throwInvalidOperation("deliver");
    }
    
    @Override
    public void cancelOrder(OrderContext order, String reason) {
        order.setState(CancelledState.INSTANCE);
        order.setCancellationReason(reason);
        IO.println("✓ Order cancelled before payment: " + reason);
    }
}

// Implementation of other states

// Context
@Getter
@Setter
public class OrderContext {
    private final String orderId;
    private final List<OrderItem> items = new ArrayList<>();
    private OrderState state = DraftState.INSTANCE;
    private PaymentInfo paymentInfo;
    private ShippingInfo shippingInfo;
    private String cancellationReason;
    private boolean refundRequired;
    private Instant deliveredAt;
    
    public OrderContext(String orderId) {
        this.orderId = orderId;
    }
    
    // Delegation to current state
    public void addItem(OrderItem item) { state.addItem(this, item); }
    public void removeItem(String productId) { state.removeItem(this, productId); }
    public void submit() { state.submitOrder(this); }
    public void pay(PaymentInfo payment) { state.processPayment(this, payment); }
    public void ship(ShippingInfo shipping) { state.shipOrder(this, shipping); }
    public void deliver() { state.deliverOrder(this); }
    public void cancel(String reason) { state.cancelOrder(this, reason); }
    
    public Money getTotal() {
        return items.stream()
            .map(i -> i.price().multiply(i.quantity()))
            .reduce(Money.ZERO, Money::add);
    }
    
    public void printStatus() {
        IO.println("\n=== Order " + orderId + " ===");
        IO.println("State: " + state.stateName());
        IO.println("Items: " + items);
        IO.println("Total: " + getTotal());
    }
}

// Using the State pattern
final var order = new OrderContext("ORD-001");

order.addItem(new OrderItem("LAPTOP", 1, new Money(999.99, "USD")));
order.addItem(new OrderItem("MOUSE", 2, new Money(29.99, "USD")));
order.printStatus(); // State: DRAFT

order.submit(); // ✓ Order submitted, awaiting payment
order.printStatus(); // State: PENDING_PAYMENT

order.pay(new PaymentInfo("4111111111111111", new Money(1059.97, "USD")));
// ✓ Payment processed

order.ship(new ShippingInfo("TRACK-123", "FedEx"));
// ✓ Order shipped

order.deliver();
// ✓ Order delivered!

order.printStatus(); // State: DELIVERED

// Attempt invalid operation
try {
    order.cancel("Changed my mind");
} catch (IllegalStateException e) {
    IO.println("Error: " + e.getMessage());
    // Error: Cannot cancel delivered in state: DELIVERED
}
```


---

### Strategy

The **Strategy** pattern defines a family of algorithms, encapsulates each one, and makes them interchangeable. It allows the algorithm to vary independently of the clients that use it. This pattern is ideal when there are multiple ways to perform a task and the algorithm choice must be made at runtime.

Unlike the State pattern where behavior changes according to internal state, in Strategy the algorithm choice depends on external conditions such as configuration, user preferences, or data type. In modern Java, strategies can be elegantly implemented using functional interfaces and lambdas.

**Example: Payment processing system with strategies**

```java
// Strategy interface
@FunctionalInterface
public interface CalculatePrice extends Function<Order, Money> {
    
    default String strategyName() {
        return this.getClass().getSimpleName();
    }
}

// Concrete strategies
public class StandardPricing implements PricingStrategy {
    @Override
    public Money apply(Order order) {
        return order.subtotal();
    }
    
    @Override
    public String strategyName() { return "Standard Pricing"; }
}

public class MembershipPricing implements PricingStrategy {
    private final MembershipLevel level;
    
    @Getter
    @RequiredArgsConstructor
    public enum MembershipLevel {
        SILVER(0.05), GOLD(0.10), PLATINUM(0.15);
        
        private final double discount;
    }
    
    public MembershipPricing(MembershipLevel level) {
        this.level = level;
    }
    
    @Override
    public Money apply(Order order) {
        return order.subtotal().multiply(1 - level.getDiscount());
    }
    
    @Override
    public String strategyName() { 
        return level + " Membership (" + (int)(level.getDiscount() * 100) + "% off)"; 
    }
}

// Composite strategy - applies multiple strategies
public class CompositePricingStrategy implements PricingStrategy {
    private final List<PricingStrategy> strategies;
    private final CombinationMode mode;
    
    public enum CombinationMode { BEST_PRICE, STACK_ALL }
    
    public CompositePricingStrategy(CombinationMode mode, PricingStrategy... strategies) {
        this.mode = mode;
        this.strategies = List.of(strategies);
    }
    
    @Override
    public Money apply(Order order) {
        return switch (mode) {
            case BEST_PRICE -> strategies.stream()
                .map(PricingStrategy)
                .min(Comparator.naturalOrder())
                .orElse(order.subtotal());
            case STACK_ALL -> {
                Money current = order.subtotal();
                for (var strategy : strategies) {
                    Order tempOrder = order.withSubtotal(current);
                    current = strategy.apply(tempOrder);
                }
                yield current;
            }
        };
    }
    
    @Override
    public String strategyName() {
        return "Composite: " + mode;
    }
}

// Usage with lambdas - strategies as functions
@RequiredArgsConstructor
public class FunctionalPricingExample {

    public Money applyDiscount(Order order, PricingStrategy strategy) {
        return strategy.apply(order);
    }
    
    public static void main(String[] args) {
        var order = new Order("ORD-001", List.of(
            new OrderItem("PROD-A", 5, new Money(20, "USD")),
            new OrderItem("PROD-B", 3, new Money(15, "USD"))
        ));
        
        // Strategies as lambdas
        PricingStrategy standard = new StandardPricing();
        PricingStrategy members = new MembershipPricing(GOLD);
        
        IO.println("Standard discount: " + applyDiscount(order, standard));
        IO.println("10% off for members: " + applyDiscount(order, members));
        IO.println("Compound: " + applyDiscount(order, new CompositePricingStrategy(BEST_PRICE, standard, members)));
    }
}
```

---

### Template Method

The **Template Method** pattern defines the skeleton of an algorithm in an operation, deferring some steps to subclasses. It allows subclasses to redefine certain steps of the algorithm without changing its overall structure. The philosophy is "Don't call us, we'll call you" (Hollywood Principle).

The base class defines the sequence of steps and provides default or abstract implementations for each step. Subclasses can override specific steps while the algorithm's structure remains intact. "Hooks" can also be included - empty methods that subclasses can optionally override.

**Example: Data processing pipeline**

```java
// Template abstracto
public abstract class DataProcessor<T, R> {
    
    // Template method - defines the algorithm structure
    public final ProcessingResult<R> process(DataSource<T> source) {
        final var startTime = Instant.now();
        final var metrics = new ProcessingMetrics();
        
        try {
            // Hook - optional preparation
            beforeProcessing(source);
            
            // Step 1: Extract data (abstract)
            final List<T> rawData = extractData(source);
            metrics.setRecordsRead(rawData.size());
            
            // Step 2: Validate data (with default implementation)
            final List<T> validData = validateData(rawData, metrics);
            
            // Step 3: Transform data (abstract)
            final List<R> transformedData = transformData(validData);
            metrics.setRecordsTransformed(transformedData.size());
            
            // Step 4: Filter data (with default implementation)
            final List<R> filteredData = filterData(transformedData);
            metrics.setRecordsFiltered(transformedData.size() - filteredData.size());
            
            // Step 5: Load/save data (abstract)
            final int loaded = loadData(filteredData);
            metrics.setRecordsLoaded(loaded);
            
            // Hook - optional finalization
            afterProcessing(metrics);
            
            metrics.setDuration(Duration.between(startTime, Instant.now()));
            return ProcessingResult.success(filteredData, metrics);
            
        } catch (Exception e) {
            handleError(e, metrics);
            metrics.setDuration(Duration.between(startTime, Instant.now()));
            return ProcessingResult.failure(e.getMessage(), metrics);
        }
    }
    
    // Abstract methods - subclasses MUST implement
    protected abstract List<T> extractData(DataSource<T> source);
    protected abstract List<R> transformData(List<T> data);
    protected abstract int loadData(List<R> data);
    
    // Methods with default implementation - subclasses CAN override
    protected List<T> validateData(List<T> data, ProcessingMetrics metrics) {
        // By default, all data is valid
        return data;
    }
    
    protected List<R> filterData(List<R> data) {
        // By default, nothing is filtered
        return data;
    }
    
    // Hooks - empty methods that subclasses can override
    protected void beforeProcessing(DataSource<T> source) {
        // Empty hook by default
    }
    
    protected void afterProcessing(ProcessingMetrics metrics) {
        // Empty hook by default
    }
    
    protected void handleError(Exception e, ProcessingMetrics metrics) {
        System.err.println("Error processing: " + e.getMessage());
        metrics.setError(e.getMessage());
    }
}

// Concrete implementation: API to Database processor
@RequiredArgsConstructor
public class ApiToDatabaseProcessor extends DataProcessor<ApiResponse, DatabaseRecord> {
    
    private final DatabaseConnection db;
    private final String tableName;
    
    @Override
    protected List<ApiResponse> extractData(DataSource<ApiResponse> source) {
        return source.readAll();
    }
    
    @Override
    protected List<DatabaseRecord> transformData(List<ApiResponse> data) {
        return data.stream()
            .map(response -> new DatabaseRecord(
                response.id(),
                response.data(),
                Instant.now()
            ))
            .toList();
    }
    
    @Override
    protected int loadData(List<DatabaseRecord> data) {
        return db.batchInsert(tableName, data);
    }
    
    @Override
    protected void handleError(Exception e, ProcessingMetrics metrics) {
        // More detailed logging for database errors
        System.err.println("Database error: " + e.getMessage());
        db.rollback();
        super.handleError(e, metrics);
    }
}

// Using the Template Method
final var apiToDbProcessor = new ApiToDatabaseProcessor(posgresqlConn, "processingTable");

final var result = apiToDbProcessor.process(apiResponse);

if (result.success()) {
    IO.println("Created %d records".formatted(result.data().size()));
} else {
    System.err.println("Processing failed: " + result.errorMessage());
}
```

---

### Visitor

The **Visitor** pattern allows defining new operations on an object structure without modifying the classes of the elements on which it operates. It separates an algorithm from the object structure on which it operates, making it easy to add new operations without changing existing classes.

This pattern is ideal when the object structure is stable but operations on it change frequently. It defines double dispatch: the element accepts a visitor and the visitor determines which operation to execute based on the concrete type of the element.

**Example: Document reporting system**

```java
// Visitor interface
public interface DocumentVisitor<T> {
    T visitParagraph(Paragraph paragraph);
    T visitHeading(Heading heading);
    T visitCodeBlock(CodeBlock codeBlock);
    
    // Default method for composite elements
    default T visitDocument(Document document) {
        document.elements().forEach(e -> e.accept(this));
        return null;
    }
}

// Element interface
public interface DocumentElement {
    <T> T accept(DocumentVisitor<T> visitor);
}

// Concrete elements
public record Paragraph(String text, TextStyle style) implements DocumentElement {
    public enum TextStyle { NORMAL, BOLD, ITALIC, QUOTE }
    
    @Override
    public <T> T accept(DocumentVisitor<T> visitor) {
        return visitor.visitParagraph(this);
    }
}

public record Heading(String text, int level) implements DocumentElement {
    public Heading {
        if (level < 1 || level > 6) throw new IllegalArgumentException("Level must be 1-6");
    }
    
    @Override
    public <T> T accept(DocumentVisitor<T> visitor) {
        return visitor.visitHeading(this);
    }
}

public record CodeBlock(String code, String language) implements DocumentElement {
    @Override
    public <T> T accept(DocumentVisitor<T> visitor) {
        return visitor.visitCodeBlock(this);
    }
}

public record Document(String title, List<DocumentElement> elements) implements DocumentElement {
    @Override
    public <T> T accept(DocumentVisitor<T> visitor) {
        return visitor.visitDocument(this);
    }
}

// Visitor concreto: Exportar a Markdown
public class MarkdownExportVisitor implements DocumentVisitor<String> {
    
    private final StringBuilder markdown = new StringBuilder();
    
    @Override
    public String visitParagraph(Paragraph paragraph) {
        String result = switch (paragraph.style()) {
            case NORMAL -> paragraph.text();
            case BOLD -> "**" + paragraph.text() + "**";
            case ITALIC -> "*" + paragraph.text() + "*";
            case QUOTE -> "> " + paragraph.text();
        };
        markdown.append(result).append("\n\n");
        return result;
    }
    
    @Override
    public String visitHeading(Heading heading) {
        String result = "#".repeat(heading.level()) + " " + heading.text();
        markdown.append(result).append("\n\n");
        return result;
    }
    
    @Override
    public String visitCodeBlock(CodeBlock codeBlock) {
        String result = "```%s\n%s\n```".formatted(codeBlock.language(), codeBlock.code());
        markdown.append(result).append("\n\n");
        return result;
    }
    
    @Override
    public String visitDocument(Document document) {
        markdown.append("# ").append(document.title()).append("\n\n");
        document.elements().forEach(e -> e.accept(this));
        return markdown.toString();
    }
    
    public String getMarkdown() {
        return markdown.toString();
    }
}

// Using the Visitor pattern
final var document = new Document("Mi Documento", List.of(
    new Heading("Introducción", 1),
    new Paragraph("Este es un documento de ejemplo.", Paragraph.TextStyle.NORMAL),
    new Heading("Datos", 2),
    new Heading("Código", 2),
    new CodeBlock("IO.println(\"Hello!\");", "java")
));

// Exportar a Markdown
final var markdownVisitor = new MarkdownExportVisitor();
document.accept(markdownVisitor);
IO.println(markdownVisitor.getMarkdown());
```
