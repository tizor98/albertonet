---
slug: 'patterns-primer-3'
lang: 'es'
title: "Parte 3 de 5: ¿Cuáles son los principales patrones de diseño?"
description: 'Referencia de los patrones de diseño más fundamentales en desarrollo de software con ejemplos.'
categories: 'software;patterns;design'
pubDate: '2025-12-06'
heroImage: '@/presentation/assets/patterns-primer-1.png'
---

# Software Patterns

Este documento presenta una guía completa sobre los patrones de diseño de software más importantes y utilizados en la industria con ejemplos en Java 25. Los patrones están organizados en categorías según su propósito: patrones modernos, principios SOLID, patrones de creación, patrones de estructura y patrones de comportamiento.

---

## Patrones de Diseño de Creación

Los patrones de creación abstraen el proceso de instanciación de objetos, haciendo que el sistema sea independiente de cómo se crean, componen y representan sus objetos.

### Abstract Factory

El patrón **Abstract Factory** se enfoca en crear familias de objetos relacionados sin especificar sus clases concretas. Proporciona una interfaz que define métodos para crear cada tipo de objeto dentro de una familia, mientras que las fábricas concretas implementan la creación de objetos específicos que pertenecen a una misma variante o tema.

Los clientes trabajan exclusivamente con las interfaces abstractas, tanto de la fábrica como de los productos, lo que permite cambiar familias completas de objetos simplemente cambiando la fábrica concreta utilizada. Este patrón es especialmente útil cuando un sistema debe ser configurado con múltiples familias de productos o cuando se desea proporcionar una biblioteca de productos sin revelar sus implementaciones.

**Ejemplo: Sistema de componentes UI multiplataforma**

```java
// Productos abstractos
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

// Fábrica abstracta
public sealed interface UIFactory permits WindowsUIFactory, MacUIFactory {
    
    Button createButton(String label);
    TextField createTextField(String placeholder);
    Dialog createDialog();
    
    // Factory method para obtener la fábrica correcta según el SO
    static UIFactory forCurrentPlatform() {
        String os = System.getProperty("os.name").toLowerCase();
        return switch (os) {
            case String s when s.contains("win") -> new WindowsUIFactory();
            case String s when s.contains("mac") -> new MacUIFactory();
        };
    }
}

// Implementaciones Windows
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

// Implementaciones Mac (similares, con estilo diferente)
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

// ... implementaciones Mac concretas ...

// Cliente - trabaja solo con abstracciones
public class LoginForm {
    private final Button loginButton;
    private final Button cancelButton;
    private final TextField usernameField;
    private final TextField passwordField;
    private final Dialog errorDialog;
    
    public LoginForm(UIFactory factory) {
        this.usernameField = factory.createTextField("Usuario");
        this.passwordField = factory.createTextField("Contraseña");
        this.loginButton = factory.createButton("Iniciar Sesión");
        this.cancelButton = factory.createButton("Cancelar");
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
                IO.println("Login exitoso");
            } else {
                errorDialog.show("Error", "Credenciales inválidas");
            }
        });
    }
    
    private boolean authenticate(String user, String pass) {
        return user != null && pass != null && !user.isEmpty();
    }
}

// Uso
final var factory = UIFactory.forCurrentPlatform();
final var loginForm = new LoginForm(factory);
loginForm.render();
```

---

### Builder

El patrón **Builder** separa la construcción de un objeto complejo de su representación, permitiendo que el mismo proceso de construcción pueda crear diferentes representaciones. Este patrón es ideal cuando un objeto tiene muchos parámetros de configuración, algunos opcionales, o cuando el proceso de construcción debe permitir diferentes representaciones del producto final.

La construcción se realiza paso a paso, donde cada método del builder configura un aspecto del objeto y retorna el mismo builder para permitir encadenamiento. Al final, un método `build()` produce el objeto final. Esto proporciona una API clara y previene la creación de objetos en estados inválidos.

**Ejemplo: Builder para solicitudes HTTP**

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
    // Constructor compacto para validación
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
            // Asumiendo un ObjectMapper disponible
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
        
        // Método conveniente para ejecutar directamente
        public HttpResponse execute() {
            return HttpClient.send(build());
        }
    }
}

// Uso del Builder
final var request = HttpRequest.post("https://api.example.com/users")
    .contentType("application/json")
    .accept("application/json")
    .authorization("eyJhbGciOiJIUzI1NiIs...")
    .queryParam("version", "v2")
    .jsonBody(new CreateUserDto("John", "john@example.com"))
    .timeout(Duration.ofSeconds(10))
    .build();

// O ejecutar directamente
final var response = HttpRequest.get("https://api.example.com/users")
    .queryParam("page", "1")
    .queryParam("limit", "20")
    .execute();
```

---

### Factory Method

El patrón **Factory Method** define una interfaz para crear objetos, pero delega a las subclases la decisión de qué clase concreta instanciar. Este patrón permite que una clase difiera la instanciación a sus subclases, promoviendo el acoplamiento débil al eliminar la necesidad de vincular clases específicas del código de la aplicación.

A diferencia del Abstract Factory que crea familias de objetos relacionados, el Factory Method se enfoca en la creación de un solo tipo de producto. Es especialmente útil cuando una clase no puede anticipar el tipo de objetos que debe crear o cuando se desea que las subclases especifiquen los objetos a crear.

**Ejemplo: Sistema de notificaciones con Factory Method**

```java
public interface Notification {
    void send(String recipient, String message);
    String getType();
}

public record EmailNotification(String smtpServer) implements Notification {
    @Override
    public void send(String recipient, String message) {
        IO.println("📧 Enviando email a " + recipient + ": " + message);
        // Lógica de envío SMTP
    }
    
    @Override
    public String getType() { return "EMAIL"; }
}

public record SmsNotification(String apiKey) implements Notification {
    @Override
    public void send(String recipient, String message) {
        IO.println("📱 Enviando SMS a " + recipient + ": " + message);
        // Lógica de envío SMS via API
    }
    
    @Override
    public String getType() { return "SMS"; }
}

public record PushNotification(String firebaseToken) implements Notification {
    @Override
    public void send(String recipient, String message) {
        IO.println("🔔 Enviando push a " + recipient + ": " + message);
        // Lógica de notificación push
    }
    
    @Override
    public String getType() { return "PUSH"; }
}

// Clase abstracta con Factory Method
public abstract class NotificationService {
    
    // Factory Method - las subclases deciden qué crear
    protected abstract Notification createNotification();
    
    // Template method que usa el factory method
    public final void notifyUser(User user, String message) {
        Notification notification = createNotification();
        
        // Lógica común: logging, validación, etc.
        IO.println("Preparando notificación tipo: " + notification.getType());
        
        if (user.hasOptedIn(notification.getType())) {
            notification.send(user.getContact(notification.getType()), message);
            logNotification(user, notification.getType(), message);
        } else {
            IO.println("Usuario no ha aceptado " + notification.getType());
        }
    }
    
    private void logNotification(User user, String type, String message) {
        IO.println("LOG: Notificación " + type + " enviada a " + user.name());
    }
}

// Implementaciones concretas del Factory Method
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

// Uso con polimorfismo
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

El patrón **Prototype** permite crear nuevos objetos clonando una instancia existente en lugar de crear una desde cero. Este enfoque es útil cuando la creación de un objeto es costosa o compleja, o cuando se necesitan muchas variaciones de un objeto base con pequeñas modificaciones.

El patrón reduce la cantidad de clases necesarias en un programa y ofrece flexibilidad para agregar o quitar prototipos en tiempo de ejecución. Cada prototipo actúa como una plantilla que puede personalizarse después de la clonación para crear objetos con características ligeramente diferentes.

**Ejemplo: Sistema de plantillas de documentos**

```javascript
// Clase base para documentos
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
    console.log(`Título: ${this.title}`);
    console.log(`Autor: ${this.author}`);
    console.log(`Contenido: ${this.content}`);
  }
}

// Usando Proxy para crear un sistema de prototipos dinámico
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
      throw new Error(`Prototipo "${name}" no encontrado`);
    }

    // Crear un proxy que permite clonar y personalizar el prototipo
    const cloned = prototype.clone();
    
    // Proxy para interceptar y personalizar propiedades
    return new Proxy(cloned, {
      get(target, prop) {
        // Si la propiedad está en overrides, devolverla
        if (prop in overrides) {
          return overrides[prop];
        }
        // De lo contrario, devolver la propiedad del objeto clonado
        return target[prop];
      },
      
      set(target, prop, value) {
        // Permitir modificar propiedades
        target[prop] = value;
        return true;
      },
      
      has(target, prop) {
        // Verificar si la propiedad existe en overrides o en el target
        return prop in overrides || prop in target;
      },
      
      ownKeys(target) {
        // Combinar las claves del target y de overrides
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

// Uso del sistema de prototipos con Proxy
const registry = new PrototypeRegistry();

// Registrar prototipos base
const blogPostTemplate = new DocumentTemplate(
  "Título del Post",
  "Contenido por defecto...",
  "Autor Anónimo"
);

const reportTemplate = new DocumentTemplate(
  "Reporte",
  "Este es un reporte estándar.",
  "Sistema"
);

registry.register("blog-post", blogPostTemplate);
registry.register("report", reportTemplate);

// Crear instancias personalizadas usando el proxy
const post1 = registry.create("blog-post", {
  title: "Introducción a Design Patterns",
  content: "Los patrones de diseño son soluciones reutilizables...",
  author: "Juan Pérez"
});

const post2 = registry.create("blog-post", {
  title: "JavaScript Avanzado",
  content: "JavaScript ofrece características poderosas...",
  author: "María García"
});

const report1 = registry.create("report", {
  title: "Reporte Mensual",
  content: "Resumen de actividades del mes..."
});

// Los objetos proxyados mantienen las propiedades del prototipo
// pero pueden ser personalizados
post1.display();
// Título: Introducción a Design Patterns
// Autor: Juan Pérez
// Contenido: Los patrones de diseño son soluciones reutilizables...

post2.display();
// Título: JavaScript Avanzado
// Autor: María García
// Contenido: JavaScript ofrece características poderosas...

// El proxy permite acceso dinámico a propiedades
console.log(post1.createdAt); // Fecha de creación del prototipo
console.log(post1.title);      // "Introducción a Design Patterns" (del override)

// También se pueden modificar propiedades después de la creación
post1.title = "Nuevo Título";
console.log(post1.title); // "Nuevo Título"
```

---

### Singleton

El patrón **Singleton** garantiza que una clase tenga exactamente una instancia y proporciona un punto de acceso global a ella. A diferencia de otros patrones de creación que se centran en cómo crear objetos, el Singleton se enfoca en cuántos objetos se crean.

Este patrón ofrece flexibilidad para cambiar el número de instancias posteriormente y permite extender la funcionalidad de la clase. A diferencia de usar métodos estáticos, un Singleton puede implementar interfaces, ser subclaseado y su implementación puede cambiarse sin afectar a los clientes. Es común en conexiones de base de datos, registros de configuración y fábricas abstractas.

**Ejemplo: Configuración de aplicación como Singleton**

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
        IO.println("Configuración cargada a las " + loadedAt);
    }
    
    public static AppConfiguration getInstance() {
        return Holder.INSTANCE;
    }
    
    // Otros métodos
}

// Alternativa moderna usando enum (inherentemente thread-safe)
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

// Alternativa moderna usando LazyConstants - Preview API en Java 26
final class EventManager {
    private final LazyConstant<EventManager> manager
        = LazyConstant.of(() -> new EventManager());

    CompletionStage<ProcessResult> processAsync(T event, Set<EventListeners> listeners) {
        return manager.get().parallelProcess(event, listeners).combine();
    }

    // Otros métodos
}

// Uso
final var config = AppConfiguration.getInstance();
final String apiUrl = config.get("api.base.url", "https://api.example.com");
final int timeout = config.getInt("api.timeout.seconds", 30);
final boolean debugMode = config.getBoolean("app.debug", false);

final var dbConfig = DatabaseConfig.INSTANCE;
IO.println("Conectando a: " + dbConfig.url());

final var futureResult = EventManager.processAsync(new DummyEvent(), List.of());
futureResult.thenAccept(result -> IO.println(result));
```
