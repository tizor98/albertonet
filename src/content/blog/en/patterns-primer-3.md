---
slug: 'patterns-primer-3'
lang: 'en'
title: "How and When to Instantiate Objects - Part 3 of 5"
description: 'Third installment: Factory, Abstract Factory, Builder, Prototype and Singleton in Java 25 — when to use them, what benefits they offer, and the pitfalls to avoid.'
categories: ['software','patterns','design']
pubDate: '2025-12-06'
heroImage: '@/presentation/assets/patterns-primer-3.png'
---

This third installment covers creational patterns. You'll see techniques for separating construction from use, reducing coupling to concrete constructors, and selecting families of products in a consistent way. Also when a builder adds clarity, how to clone safely, and what risks to avoid with Singleton, all with examples in Java 25.

## Creational Design Patterns

Creational patterns abstract the process of instantiating objects, making the system independent of how its objects are created, composed, and represented.

### Abstract Factory

The **Abstract Factory** pattern focuses on creating families of related objects without specifying their concrete classes. It provides an interface that defines methods for creating each type of object within a family, while concrete factories implement the creation of specific objects that belong to the same variant or theme.

Clients work exclusively with the abstract interfaces, both of the factory and of the products, which allows entire families of objects to be changed simply by switching the concrete factory used. This pattern is especially useful when a system must be configured with multiple product families or when you want to provide a library of products without revealing their implementations.

**Example: Cross-platform UI component system**

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
    
    // Factory method to get the correct factory for the current OS
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

Construction is done step by step, where each builder method configures one aspect of the object and returns the same builder to allow chaining. At the end, a `build()` method produces the final object. This provides a clear API and prevents creating objects in invalid states.

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
        
        // Convenience method to execute directly
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

The **Factory Method** pattern defines an interface for creating objects, but delegates to subclasses the decision of which concrete class to instantiate. This pattern allows a class to defer instantiation to its subclasses, promoting loose coupling by eliminating the need to tie the application code to specific classes.

Unlike Abstract Factory, which creates families of related objects, the Factory Method focuses on creating a single type of product. It is especially useful when a class cannot anticipate the type of objects it must create or when you want subclasses to specify the objects to create.

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
        // SMTP send logic
    }
    
    @Override
    public String getType() { return "EMAIL"; }
}

public record SmsNotification(String apiKey) implements Notification {
    @Override
    public void send(String recipient, String message) {
        IO.println("📱 Sending SMS to " + recipient + ": " + message);
        // SMS send logic via API
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
        IO.println("Preparing notification type: " + notification.getType());
        
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

The **Prototype** pattern allows creating new objects by cloning an existing instance instead of creating one from scratch. This approach is useful when object creation is costly or complex, or when many variations of a base object with small modifications are needed.

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
        // Otherwise return the property from the cloned object
        return target[prop];
      },
      
      set(target, prop, value) {
        // Allow modifying properties
        target[prop] = value;
        return true;
      },
      
      has(target, prop) {
        // Check if the property exists in overrides or in target
        return prop in overrides || prop in target;
      },
      
      ownKeys(target) {
        // Combine keys from target and overrides
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
  content: "Summary of activities for the month..."
});

// Proxied objects keep the prototype's properties
// but can be customized
post1.display();
// Title: Introduction to Design Patterns
// Author: John Doe
// Content: Design patterns are reusable solutions...

post2.display();
// Title: Advanced JavaScript
// Author: Jane Smith
// Content: JavaScript offers powerful features...

// The proxy allows dynamic access to properties
console.log(post1.createdAt); // Creation date of the prototype
console.log(post1.title);      // "Introduction to Design Patterns" (from override)

// Properties can also be modified after creation
post1.title = "New Title";
console.log(post1.title); // "New Title"
```

---

### Singleton

The **Singleton** pattern ensures that a class has exactly one instance and provides a global point of access to it. Unlike other creational patterns that focus on how objects are created, Singleton focuses on how many objects are created.

This pattern offers flexibility to change the number of instances later and allows extending the class's functionality. Unlike using static methods, a Singleton can implement interfaces, be subclassed, and its implementation can be changed without affecting clients. It's common for database connections, configuration registries, and abstract factories.

**Example: Application configuration as Singleton**

```java
public final class AppConfiguration {
    
    // Holder pattern - thread-safe and lazy initialization
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
IO.println("Connecting to: " + dbConfig.url());

final var futureResult = EventManager.processAsync(new DummyEvent(), List.of());
futureResult.thenAccept(result -> IO.println(result));
```
