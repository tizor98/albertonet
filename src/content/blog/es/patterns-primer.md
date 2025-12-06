---
slug: 'patterns-primer'
lang: 'es'
title: "¿Cuáles son los principales patrones de diseño?"
description: 'Referencia de los patrones de diseño más fundamentales en desarrollo de software con ejemplos.'
categories: 'software;patterns;design'
pubDate: '2025-12-01'
heroImage: '@/presentation/assets/patterns-primer-1.png'
---

# Software Patterns

Este documento presenta una guía completa sobre los patrones de diseño de software más importantes y utilizados en la industria con ejemplos en Java 25. Los patrones están organizados en categorías según su propósito: patrones modernos, principios SOLID, patrones de creación, patrones de estructura y patrones de comportamiento.

---

## Patrones de Diseño Modernos

### Fluent Interfaces

El patrón **Fluent Interface** tiene como objetivo proporcionar una API que pueda utilizarse de forma natural y expresiva para completar operaciones complejas. Cada método de la interfaz retorna el mismo objeto (o uno relacionado), permitiendo encadenar llamadas de manera que el código resultante se lea casi como prosa.

Entre sus principales beneficios se encuentra la gestión interna de recursos y la exposición selectiva de métodos según el contexto de uso. A diferencia del patrón Builder tradicional, las Fluent Interfaces no se centran exclusivamente en la creación de objetos, sino en facilitar el uso de cualquier funcionalidad de manera intuitiva. Además, permiten que múltiples interfaces participen en el proceso, guiando al usuario a través de los pasos válidos.

**Ejemplo: Sistema de consultas SQL fluido**

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
    // Implementa funcionalidad
}

// Uso del API fluida
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

El patrón **Loan** permite exponer la funcionalidad de un recurso mientras se mantiene el control total sobre su ciclo de vida. La idea central es "prestar" un recurso al cliente para que realice las operaciones necesarias, pero el control sobre cuándo y cómo se inicializa, usa y libera el recurso permanece en la clase que lo gestiona.

Este patrón es particularmente útil para recursos que requieren apertura y cierre explícitos, como conexiones de base de datos, archivos o conexiones de red. Al centralizar la gestión del ciclo de vida, se eliminan errores comunes como olvidar cerrar recursos o manejar incorrectamente las excepciones. Como autores de la clase, estamos en mejor posición para saber exactamente cuándo y cómo deben gestionarse estos recursos.

**Ejemplo: Pool de conexiones con Loan Pattern**

```java
public final class ConnectionPool {
    
    private static final Queue<Connection> pool = new ConcurrentLinkedQueue<>();
    private static final int MAX_CONNECTIONS = 10;
    
    static {
        // Inicializar pool con conexiones
        for (int i = 0; i < MAX_CONNECTIONS; i++) {
            pool.offer(createConnection());
        }
    }
    
    private ConnectionPool() {} // No instanciable
    
    // Método estático que implementa el Loan Pattern
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
    
    // Versión para operaciones sin retorno
    public static void withConnection(Consumer<Connection> operation) {
        withConnection(conn -> {
            operation.accept(conn);
            return null;
        });
    }
    
    // Versión con transacción automática
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
        // Crear conexión real a la base de datos
        return new Connection();
    }
}

// Uso del Loan Pattern - el cliente nunca gestiona el ciclo de vida
record User(long id, String name, String email) {}

// Operación simple
final List<User> users = ConnectionPool.withConnection(conn -> 
    conn.query("SELECT * FROM users WHERE active = true")
       .stream()
       .map(row -> new User(row.getLong("id"), row.getString("name"), row.getString("email")))
       .toList());

// Operación transaccional
ConnectionPool.withTransaction(conn -> {
    conn.execute("UPDATE accounts SET balance = balance - 100 WHERE id = ?", sourceId);
    conn.execute("UPDATE accounts SET balance = balance + 100 WHERE id = ?", targetId);
    conn.execute("INSERT INTO transfers (source, target, amount) VALUES (?, ?, ?)", 
                 sourceId, targetId, 100);
    return null;
});
```


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
public sealed interface DiscountStrategy permits 
        NoDiscount, PercentageDiscount, FixedAmountDiscount, SeasonalDiscount {
    
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

public sealed interface TextField permits WindowsTextField, MacTextField, LinuxTextField {
    void render();
    String getValue();
    void setValue(String value);
}

public sealed interface Dialog permits WindowsDialog, MacDialog, LinuxDialog {
    void show(String title, String message);
    boolean confirm(String title, String message);
}

// Fábrica abstracta
public sealed interface UIFactory permits WindowsUIFactory, MacUIFactory, LinuxUIFactory {
    
    Button createButton(String label);
    TextField createTextField(String placeholder);
    Dialog createDialog();
    
    // Factory method para obtener la fábrica correcta según el SO
    static UIFactory forCurrentPlatform() {
        String os = System.getProperty("os.name").toLowerCase();
        return switch (os) {
            case String s when s.contains("win") -> new WindowsUIFactory();
            case String s when s.contains("mac") -> new MacUIFactory();
            default -> new LinuxUIFactory();
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

public record WindowsButton(String label) implements Button {
    @Override
    public void render() {
        IO.println("[Windows Button: " + label + "]");
    }
    
    @Override
    public void onClick(Runnable action) {
        IO.println("Windows click event registered");
        action.run();
    }
}

public record WindowsTextField(String placeholder) implements TextField {
    private static String value = "";
    
    @Override
    public void render() {
        IO.println("|__Windows: " + placeholder + "__|");
    }
    
    @Override
    public String getValue() { return value; }
    
    @Override
    public void setValue(String newValue) { value = newValue; }
}

public final class WindowsDialog implements Dialog {
    @Override
    public void show(String title, String message) {
        IO.println("╔═══ Windows Dialog: " + title + " ═══╗");
        IO.println("║ " + message);
        IO.println("╚═══════════════════════════════════╝");
    }
    
    @Override
    public boolean confirm(String title, String message) {
        show(title, message + " [OK] [Cancel]");
        return true;
    }
}

// Implementaciones Mac (similares, con estilo diferente)
public final class MacUIFactory implements UIFactory {
    @Override
    public Button createButton(String label) { return new MacButton(label); }
    @Override
    public TextField createTextField(String placeholder) { return new MacTextField(placeholder); }
    @Override
    public Dialog createDialog() { return new MacDialog(); }
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
var factory = UIFactory.forCurrentPlatform();
var loginForm = new LoginForm(factory);
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
    
    private Map<String, String> loadProperties() {
        // Cargar desde archivo, variables de entorno, etc.
        final var props = new ConcurrentHashMap<String, String>();
        
        // Cargar desde archivo application.properties
        try (var input = getClass().getClassLoader().getResourceAsStream("application.properties")) {
            if (input != null) {
                final var p = new Properties();
                p.load(input);
                p.forEach((k, v) -> props.put(k.toString(), v.toString()));
            }
        } catch (IOException e) {
            System.err.println("No se pudo cargar application.properties");
        }
        
        // Variables de entorno sobrescriben archivo
        System.getenv().forEach((k, v) -> {
            if (k.startsWith("APP_")) {
                props.put(k.substring(4).toLowerCase().replace('_', '.'), v);
            }
        });
        
        return props;
    }
    
    public String get(String key) {
        return properties.get(key);
    }
    
    public String get(String key, String defaultValue) {
        return properties.getOrDefault(key, defaultValue);
    }
    
    public int getInt(String key, int defaultValue) {
        String value = properties.get(key);
        if (value == null) return defaultValue;
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }
    
    public boolean getBoolean(String key, boolean defaultValue) {
        String value = properties.get(key);
        if (value == null) return defaultValue;
        return Boolean.parseBoolean(value);
    }
    
    public <T> T getAs(String key, Function<String, T> parser, T defaultValue) {
        String value = properties.get(key);
        if (value == null) return defaultValue;
        try {
            return parser.apply(value);
        } catch (Exception e) {
            return defaultValue;
        }
    }
    
    public Duration getDuration(String key, Duration defaultValue) {
        return getAs(key, Duration::parse, defaultValue);
    }
    
    public Instant getLoadedAt() {
        return loadedAt;
    }
    
    // Para testing - permite recargar configuración
    public void reload() {
        properties.clear();
        properties.putAll(loadProperties());
    }
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


---

## Patrones de Diseño de Estructura

Los patrones estructurales se centran en cómo las clases y objetos se componen para formar estructuras más grandes. Utilizan herencia y composición para crear nuevas funcionalidades a partir de las existentes.

### Adapter

El patrón **Adapter** permite que interfaces incompatibles trabajen juntas convirtiendo la interfaz de una clase en otra que el cliente espera. Existen dos variantes principales: el adaptador de clase (que usa herencia múltiple donde el lenguaje lo permite) y el adaptador de objeto (que usa composición).

El adaptador de clase hereda de la clase adaptada e implementa la interfaz objetivo, permitiendo modificar el comportamiento heredado. El adaptador de objeto contiene una instancia de la clase adaptada y delega las llamadas, lo que permite adaptar múltiples clases y cambiar dinámicamente entre ellas. La cantidad de trabajo que realiza el adaptador depende de qué tan diferentes sean las interfaces.

**Ejemplo: Adaptador para integración de sistemas de pago**

```java
// Interfaz objetivo que nuestro sistema espera
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

// Librería externa con interfaz incompatible (no podemos modificarla)
public class StripeClient {
    public StripeCharge createCharge(String apiKey, StripeChargeRequest request) {
        // Implementación de Stripe
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

// Adaptador de objeto - adapta StripeClient a PaymentProcessor
public class StripePaymentAdapter implements PaymentProcessor {
    
    private final StripeClient stripeClient;
    private final String apiKey;
    
    public StripePaymentAdapter(String apiKey) {
        this.stripeClient = new StripeClient();
        this.apiKey = apiKey;
    }
    
    @Override
    public PaymentResult process(PaymentRequest request) {
        // Convertir nuestro request al formato de Stripe
        var stripeRequest = new StripeChargeRequest();
        stripeRequest.setAmount(request.amount().toCents());
        stripeRequest.setCurrency(request.amount().currency());
        stripeRequest.setSource(createStripeToken(request.card()));
        stripeRequest.setDescription(request.description());
        
        try {
            StripeCharge charge = stripeClient.createCharge(apiKey, stripeRequest);
            
            // Convertir respuesta de Stripe a nuestro formato
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
        // Crear token de tarjeta para Stripe
        return "tok_" + card.number().substring(card.number().length() - 4);
    }
}

// Otro adaptador para PayPal (misma interfaz objetivo)
public class PayPalPaymentAdapter implements PaymentProcessor {
    
    private final PayPalHttpClient paypalClient;
    private final String clientId;
    private final String clientSecret;
    
    public PayPalPaymentAdapter(String clientId, String clientSecret) {
        this.paypalClient = new PayPalHttpClient();
        this.clientId = clientId;
        this.clientSecret = clientSecret;
    }
    
    @Override
    public PaymentResult process(PaymentRequest request) {
        // Adaptar a formato PayPal
        var order = new PayPalOrder();
        order.setIntent("CAPTURE");
        order.setPurchaseUnits(List.of(
            new PurchaseUnit(request.amount().toString(), request.description())
        ));
        
        PayPalOrderResponse response = paypalClient.createOrder(authenticate(), order);
        
        return new PaymentResult(
            response.getId(),
            mapPayPalStatus(response.getStatus()),
            Instant.now(),
            "PayPal order created"
        );
    }
    
    // ... otros métodos adaptados
}

// Uso - el cliente trabaja con la interfaz unificada
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

// Configuración - elegir adaptador según configuración
PaymentProcessor processor = switch (config.get("payment.provider")) {
    case "stripe" -> new StripePaymentAdapter(config.get("stripe.api.key"));
    case "paypal" -> new PayPalPaymentAdapter(config.get("paypal.client.id"), config.get("paypal.secret"));
    default -> throw new IllegalStateException("Unknown payment provider");
};
```

---

### Bridge

El patrón **Bridge** desacopla una abstracción de su implementación, permitiendo que ambas varíen independientemente. Este patrón separa una jerarquía de clases en dos jerarquías independientes: una para las abstracciones y otra para las implementaciones.

La abstracción mantiene una referencia a un objeto implementador y delega el trabajo real a este. Esto permite cambiar la implementación en tiempo de ejecución y evita una explosión combinatoria de clases cuando hay múltiples dimensiones de variación. Es especialmente útil cuando se quiere exponer una API pública mientras se mantienen los detalles de implementación internos.

**Ejemplo: Sistema de renderizado multiplataforma**

```java
// Implementador - define la interfaz de bajo nivel
public interface RenderingEngine {
    void drawLine(int x1, int y1, int x2, int y2, Color color);
    void drawCircle(int x, int y, int radius, Color color, boolean filled);
    void drawRectangle(int x, int y, int width, int height, Color color, boolean filled);
    void drawText(String text, int x, int y, Font font, Color color);
    void clear();
    byte[] exportAsImage(String format);
}

// Implementaciones concretas para diferentes plataformas
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
        // Implementación OpenGL para círculos
    }
    
    // ... otros métodos
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
    
    @Override
    public void drawLine(int x1, int y1, int x2, int y2, Color color) {
        svgContent.append("<line x1=\"%d\" y1=\"%d\" x2=\"%d\" y2=\"%d\" stroke=\"%s\" />\n"
            .formatted(x1, y1, x2, y2, toHexColor(color)));
    }
    
    @Override
    public void drawCircle(int x, int y, int radius, Color color, boolean filled) {
        svgContent.append("<circle cx=\"%d\" cy=\"%d\" r=\"%d\" %s />\n"
            .formatted(x, y, radius, filled ? 
                "fill=\"" + toHexColor(color) + "\"" : 
                "stroke=\"" + toHexColor(color) + "\" fill=\"none\""));
    }
    
    @Override
    public void clear() {
        svgContent.setLength(0);
        svgContent.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        svgContent.append("<svg width=\"%d\" height=\"%d\" xmlns=\"http://www.w3.org/2000/svg\">\n"
            .formatted(width, height));
    }
    
    @Override
    public byte[] exportAsImage(String format) {
        svgContent.append("</svg>");
        return svgContent.toString().getBytes(StandardCharsets.UTF_8);
    }
    
    private String toHexColor(Color c) {
        return "#%02x%02x%02x".formatted(c.getRed(), c.getGreen(), c.getBlue());
    }
    
    // ... otros métodos
}

// Abstracción - define la interfaz de alto nivel para figuras
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

// Abstracciones refinadas - diferentes tipos de figuras
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
        // Dibujar triángulo usando líneas
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

// Uso del patrón Bridge
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
        // Actualizar todas las figuras al nuevo renderer
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

// Ejemplo de uso
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

El patrón **Composite** permite componer objetos en estructuras de árbol para representar jerarquías parte-todo. Los clientes pueden tratar objetos individuales y composiciones de objetos de manera uniforme a través de una interfaz común.

Este patrón organiza los componentes en hojas (elementos primitivos sin hijos) y composites (elementos que contienen otros componentes). Existe un trade-off entre seguridad de tipos (separando operaciones específicas para hojas y composites) y transparencia (teniendo la misma interfaz para ambos). A partir de componentes simples se pueden construir estructuras complejas de forma elegante.

**Ejemplo: Sistema de archivos con Composite**

```java
// Componente base
public sealed interface FileSystemNode permits File, Directory {
    String name();
    long size();
    void display(int indent);
    
    default String indent(int level) {
        return "  ".repeat(level);
    }
    
    // Operaciones de búsqueda con comportamiento por defecto
    default List<FileSystemNode> find(Predicate<FileSystemNode> predicate) {
        return predicate.test(this) ? List.of(this) : List.of();
    }
    
    default Optional<FileSystemNode> findFirst(Predicate<FileSystemNode> predicate) {
        return predicate.test(this) ? Optional.of(this) : Optional.empty();
    }
}

// Hoja (Leaf) - archivo individual
public record File(String name, long size, FileType type, Instant createdAt) implements FileSystemNode {
    
    public enum FileType { TEXT, IMAGE, VIDEO, AUDIO, BINARY }
    
    @Override
    public void display(int indent) {
        IO.println(indent(indent) + "📄 " + name + " (" + formatSize(size) + ")");
    }
    
    private String formatSize(long bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return bytes / 1024 + " KB";
        if (bytes < 1024 * 1024 * 1024) return bytes / (1024 * 1024) + " MB";
        return bytes / (1024 * 1024 * 1024) + " GB";
    }
}

// Composite - directorio que contiene otros nodos
public final class Directory implements FileSystemNode {
    private final String name;
    private final List<FileSystemNode> children;
    private final Instant createdAt;
    
    public Directory(String name) {
        this.name = name;
        this.children = new ArrayList<>();
        this.createdAt = Instant.now();
    }
    
    @Override
    public String name() { return name; }
    
    @Override
    public long size() {
        return children.stream()
            .mapToLong(FileSystemNode::size)
            .sum();
    }
    
    @Override
    public void display(int indent) {
        IO.println(indent(indent) + "📁 " + name + "/");
        children.forEach(child -> child.display(indent + 1));
    }
    
    @Override
    public List<FileSystemNode> find(Predicate<FileSystemNode> predicate) {
        var results = new ArrayList<FileSystemNode>();
        if (predicate.test(this)) {
            results.add(this);
        }
        children.stream()
            .flatMap(child -> child.find(predicate).stream())
            .forEach(results::add);
        return results;
    }
    
    @Override
    public Optional<FileSystemNode> findFirst(Predicate<FileSystemNode> predicate) {
        if (predicate.test(this)) return Optional.of(this);
        return children.stream()
            .map(child -> child.findFirst(predicate))
            .filter(Optional::isPresent)
            .map(Optional::get)
            .findFirst();
    }
    
    // Operaciones específicas de Directory
    public Directory add(FileSystemNode node) {
        children.add(node);
        return this;
    }
    
    public Directory addAll(FileSystemNode... nodes) {
        children.addAll(Arrays.asList(nodes));
        return this;
    }
    
    public boolean remove(FileSystemNode node) {
        return children.remove(node);
    }
    
    public List<FileSystemNode> children() {
        return Collections.unmodifiableList(children);
    }
    
    public int fileCount() {
        return (int) children.stream()
            .mapToLong(child -> switch (child) {
                case File f -> 1;
                case Directory d -> d.fileCount();
            })
            .sum();
    }
    
    public int directoryCount() {
        return (int) children.stream()
            .mapToLong(child -> switch (child) {
                case File f -> 0;
                case Directory d -> 1 + d.directoryCount();
            })
            .sum();
    }
}

// Uso del Composite
var root = new Directory("proyecto")
    .add(new File("README.md", 2048, File.FileType.TEXT, Instant.now()))
    .add(new File("pom.xml", 4096, File.FileType.TEXT, Instant.now()))
    .add(new Directory("src")
        .add(new Directory("main")
            .add(new Directory("java")
                .add(new File("App.java", 1024, File.FileType.TEXT, Instant.now()))
                .add(new File("Service.java", 2048, File.FileType.TEXT, Instant.now())))
            .add(new Directory("resources")
                .add(new File("application.properties", 512, File.FileType.TEXT, Instant.now()))))
        .add(new Directory("test")
            .add(new Directory("java")
                .add(new File("AppTest.java", 1536, File.FileType.TEXT, Instant.now())))))
    .add(new Directory("target")
        .add(new File("app.jar", 1024 * 1024, File.FileType.BINARY, Instant.now())));

// Mostrar estructura
root.display(0);
/*
📁 proyecto/
  📄 README.md (2 KB)
  📄 pom.xml (4 KB)
  📁 src/
    📁 main/
      📁 java/
        📄 App.java (1 KB)
        📄 Service.java (2 KB)
      📁 resources/
        📄 application.properties (512 B)
    📁 test/
      📁 java/
        📄 AppTest.java (1 KB)
  📁 target/
    📄 app.jar (1 MB)
*/

// Operaciones uniformes en toda la estructura
IO.println("Tamaño total: " + root.size() + " bytes");
IO.println("Total archivos: " + root.fileCount());
IO.println("Total directorios: " + root.directoryCount());

// Búsqueda
var javaFiles = root.find(node -> 
    node instanceof File f && f.name().endsWith(".java"));
IO.println("Archivos Java: " + javaFiles.size());

var largeFiles = root.find(node -> 
    node instanceof File f && f.size() > 10_000);
```


---

### Decorator

El patrón **Decorator** agrega responsabilidades adicionales a un objeto de forma dinámica, proporcionando una alternativa flexible a la herencia para extender funcionalidad. Los decoradores envuelven al objeto original y mantienen su interfaz, permitiendo apilar múltiples decoradores de forma transparente.

Este patrón es ideal cuando se necesita añadir comportamiento a objetos individuales sin afectar a otros objetos de la misma clase. Cada decorador puede ejecutar lógica antes, durante o después de delegar al objeto envuelto. En Java moderno, los decoradores también pueden implementarse elegantemente usando composición de funciones.

**Ejemplo: Sistema de procesamiento de texto con decoradores**

```java
// Interfaz base
public interface TextProcessor {
    String process(String text);
}

// Implementación base
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
public class TrimmingDecorator extends TextProcessorDecorator {
    public TrimmingDecorator(TextProcessor wrapped) {
        super(wrapped);
    }
    
    @Override
    public String process(String text) {
        return super.process(text.strip());
    }
}

public class UpperCaseDecorator extends TextProcessorDecorator {
    public UpperCaseDecorator(TextProcessor wrapped) {
        super(wrapped);
    }
    
    @Override
    public String process(String text) {
        return super.process(text).toUpperCase();
    }
}

public class CensoringDecorator extends TextProcessorDecorator {
    private final Set<String> bannedWords;
    private final String replacement;
    
    public CensoringDecorator(TextProcessor wrapped, Set<String> bannedWords) {
        super(wrapped);
        this.bannedWords = bannedWords;
        this.replacement = "***";
    }
    
    @Override
    public String process(String text) {
        String processed = super.process(text);
        for (String word : bannedWords) {
            processed = processed.replaceAll("(?i)" + Pattern.quote(word), replacement);
        }
        return processed;
    }
}

public class HtmlEncodingDecorator extends TextProcessorDecorator {
    public HtmlEncodingDecorator(TextProcessor wrapped) {
        super(wrapped);
    }
    
    @Override
    public String process(String text) {
        String processed = super.process(text);
        return processed
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;");
    }
}

public class LoggingDecorator extends TextProcessorDecorator {
    private static final Logger log = Logger.getLogger(LoggingDecorator.class.getName());
    
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

// Uso con decoradores apilados
TextProcessor processor = new LoggingDecorator(
    new HtmlEncodingDecorator(
        new CensoringDecorator(
            new TrimmingDecorator(
                new PlainTextProcessor()
            ),
            Set.of("spam", "inappropriate")
        )
    )
);

String result = processor.process("  <script>spam content</script>  ");
// Output: &lt;script&gt;*** content&lt;/script&gt;

// Alternativa funcional usando composición de funciones
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

// Uso funcional
var processor = FunctionalTextProcessor.compose(
    FunctionalTextProcessor.trim(),
    FunctionalTextProcessor.censor(Set.of("spam")),
    FunctionalTextProcessor.htmlEncode(),
    FunctionalTextProcessor.toUpperCase()
);

String result = processor.apply("  <spam>hello</spam>  ");
// Output: &LT;***&GT;HELLO&LT;/***&GT;
```

---

### Facade

El patrón **Facade** proporciona una interfaz unificada y simplificada para un conjunto de interfaces en un subsistema. Reduce la complejidad del sistema al ocultar sus componentes internos detrás de una fachada que expone solo las operaciones más comunes.

Este patrón es útil cuando existe un sistema complejo con múltiples clases interdependientes y se desea proporcionar una forma simple de usarlo para los casos de uso más frecuentes. La fachada no impide el acceso directo a los componentes del subsistema cuando se necesita funcionalidad avanzada, pero ofrece un punto de entrada conveniente para la mayoría de situaciones.

**Ejemplo: Facade para sistema de e-commerce**

```java
// Subsistemas complejos
public class InventoryService {
    public boolean checkAvailability(String productId, int quantity) {
        // Verificar stock en múltiples almacenes
        return true;
    }
    
    public void reserveStock(String productId, int quantity, String orderId) {
        // Reservar inventario
    }
    
    public void releaseStock(String productId, int quantity, String orderId) {
        // Liberar reserva
    }
}

public class PaymentGateway {
    public PaymentAuthorization authorize(String customerId, Money amount, CardInfo card) {
        // Autorizar pago con el banco
        return new PaymentAuthorization("auth_123", true);
    }
    
    public void capture(String authorizationId, Money amount) {
        // Capturar el pago autorizado
    }
    
    public void refund(String authorizationId, Money amount) {
        // Procesar reembolso
    }
}

public class ShippingService {
    public ShippingQuote getQuote(Address from, Address to, List<PackageInfo> packages) {
        // Calcular costos de envío
        return new ShippingQuote(new Money(15.99, "USD"), Duration.ofDays(3));
    }
    
    public String createShipment(Address from, Address to, List<PackageInfo> packages) {
        // Crear orden de envío
        return "SHIP_" + UUID.randomUUID();
    }
    
    public ShipmentStatus trackShipment(String shipmentId) {
        return new ShipmentStatus(shipmentId, "IN_TRANSIT", Instant.now());
    }
}

public class NotificationService {
    public void sendOrderConfirmation(String email, Order order) {
        // Enviar email de confirmación
    }
    
    public void sendShippingNotification(String email, String trackingNumber) {
        // Notificar envío
    }
}

public class CustomerService {
    public Customer findById(String customerId) {
        return new Customer(customerId, "John Doe", "john@example.com");
    }
    
    public void addLoyaltyPoints(String customerId, int points) {
        // Agregar puntos de fidelidad
    }
}

// Facade - interfaz simplificada para el proceso de compra
public class OrderFacade {
    
    private final InventoryService inventoryService;
    private final PaymentGateway paymentGateway;
    private final ShippingService shippingService;
    private final NotificationService notificationService;
    private final CustomerService customerService;
    
    public OrderFacade() {
        this.inventoryService = new InventoryService();
        this.paymentGateway = new PaymentGateway();
        this.shippingService = new ShippingService();
        this.notificationService = new NotificationService();
        this.customerService = new CustomerService();
    }
    
    // Método facade principal - oculta toda la complejidad
    public OrderResult placeOrder(OrderRequest request) {
        String orderId = generateOrderId();
        
        try {
            // 1. Verificar disponibilidad
            for (var item : request.items()) {
                if (!inventoryService.checkAvailability(item.productId(), item.quantity())) {
                    return OrderResult.failed(orderId, "Product not available: " + item.productId());
                }
            }
            
            // 2. Reservar inventario
            for (var item : request.items()) {
                inventoryService.reserveStock(item.productId(), item.quantity(), orderId);
            }
            
            // 3. Calcular envío
            var customer = customerService.findById(request.customerId());
            var shippingQuote = shippingService.getQuote(
                getWarehouseAddress(),
                request.shippingAddress(),
                calculatePackages(request.items())
            );
            
            // 4. Procesar pago
            Money total = calculateTotal(request.items()).add(shippingQuote.cost());
            var authorization = paymentGateway.authorize(
                request.customerId(),
                total,
                request.paymentInfo()
            );
            
            if (!authorization.approved()) {
                // Liberar inventario si el pago falla
                releaseAllStock(request.items(), orderId);
                return OrderResult.failed(orderId, "Payment declined");
            }
            
            // 5. Capturar pago
            paymentGateway.capture(authorization.id(), total);
            
            // 6. Crear envío
            String shipmentId = shippingService.createShipment(
                getWarehouseAddress(),
                request.shippingAddress(),
                calculatePackages(request.items())
            );
            
            // 7. Agregar puntos de fidelidad
            customerService.addLoyaltyPoints(request.customerId(), calculatePoints(total));
            
            // 8. Enviar notificación
            Order order = createOrder(orderId, request, shipmentId, total);
            notificationService.sendOrderConfirmation(customer.email(), order);
            
            return OrderResult.success(order);
            
        } catch (Exception e) {
            releaseAllStock(request.items(), orderId);
            return OrderResult.failed(orderId, "Order processing failed: " + e.getMessage());
        }
    }
    
    // Métodos facade secundarios para operaciones comunes
    public ShipmentStatus trackOrder(String orderId) {
        // Simplificar tracking
        String shipmentId = getShipmentIdForOrder(orderId);
        return shippingService.trackShipment(shipmentId);
    }
    
    public RefundResult requestRefund(String orderId) {
        // Proceso simplificado de reembolso
        Order order = getOrder(orderId);
        paymentGateway.refund(order.paymentAuthId(), order.total());
        releaseAllStock(order.items(), orderId);
        return new RefundResult(orderId, true, "Refund processed");
    }
    
    // Métodos auxiliares privados
    private void releaseAllStock(List<OrderItem> items, String orderId) {
        items.forEach(item -> 
            inventoryService.releaseStock(item.productId(), item.quantity(), orderId));
    }
    
    private String generateOrderId() {
        return "ORD_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
    
    // ... otros métodos auxiliares
}

// Records para datos
public record OrderRequest(
    String customerId,
    List<OrderItem> items,
    Address shippingAddress,
    CardInfo paymentInfo
) {}

public record OrderResult(String orderId, boolean success, String message, Order order) {
    public static OrderResult success(Order order) {
        return new OrderResult(order.id(), true, "Order placed successfully", order);
    }
    
    public static OrderResult failed(String orderId, String reason) {
        return new OrderResult(orderId, false, reason, null);
    }
}

// Uso del Facade - el cliente no conoce la complejidad interna
var facade = new OrderFacade();

var result = facade.placeOrder(new OrderRequest(
    "CUST_001",
    List.of(
        new OrderItem("PROD_A", 2),
        new OrderItem("PROD_B", 1)
    ),
    new Address("123 Main St", "City", "12345"),
    new CardInfo("4111111111111111", "12/25", "123")
));

if (result.success()) {
    IO.println("Orden creada: " + result.orderId());
    var status = facade.trackOrder(result.orderId());
    IO.println("Estado del envío: " + status.status());
}
```

---

### Flyweight

El patrón **Flyweight** optimiza el uso de memoria compartiendo eficientemente grandes cantidades de objetos similares. Separa el estado de un objeto en estado intrínseco (compartido, inmutable) y estado extrínseco (único por contexto, proporcionado por el cliente).

Este patrón es aplicable cuando se utilizan muchos objetos cuyo almacenamiento es costoso, la mayoría del estado puede externalizarse, y el uso del patrón reduce significativamente la cantidad de objetos. Un objeto flyweight debe ser indistinguible de uno creado independientemente para cada uso.

**Ejemplo: Editor de texto con caracteres compartidos**

```java
// Flyweight - estado intrínseco inmutable
public record CharacterGlyph(char character, String fontFamily, int fontSize) {
    
    public void render(int x, int y, Color color, Graphics2D g) {
        g.setFont(new Font(fontFamily, Font.PLAIN, fontSize));
        g.setColor(color);
        g.drawString(String.valueOf(character), x, y);
    }
    
    public int width() {
        return fontSize / 2; // Simplificado
    }
    
    public int height() {
        return fontSize;
    }
}

// Flyweight Factory con caché
public class GlyphFactory {
    
    private static final Map<String, CharacterGlyph> glyphCache = new ConcurrentHashMap<>();
    
    public static CharacterGlyph getGlyph(char character, String fontFamily, int fontSize) {
        String key = character + "_" + fontFamily + "_" + fontSize;
        
        return glyphCache.computeIfAbsent(key, 
            k -> new CharacterGlyph(character, fontFamily, fontSize));
    }
    
    public static int cacheSize() {
        return glyphCache.size();
    }
    
    public static void clearCache() {
        glyphCache.clear();
    }
    
    // Estadísticas de uso
    public static Map<String, Long> getCacheStats() {
        return glyphCache.entrySet().stream()
            .collect(Collectors.groupingBy(
                e -> e.getValue().fontFamily(),
                Collectors.counting()
            ));
    }
}

// Contexto - almacena estado extrínseco
public record CharacterContext(int x, int y, Color color) {}

// Documento que usa flyweights
public class TextDocument {
    
    private final List<FormattedCharacter> characters = new ArrayList<>();
    private String defaultFont = "Monospace";
    private int defaultSize = 12;
    
    public record FormattedCharacter(CharacterGlyph glyph, CharacterContext context) {
        public void render(Graphics2D g) {
            glyph.render(context.x(), context.y(), context.color(), g);
        }
    }
    
    public void insertText(String text, int startX, int startY, Color color) {
        int x = startX;
        int y = startY;
        
        for (char c : text.toCharArray()) {
            if (c == '\n') {
                x = startX;
                y += defaultSize + 2;
                continue;
            }
            
            // Obtener glyph compartido (flyweight)
            CharacterGlyph glyph = GlyphFactory.getGlyph(c, defaultFont, defaultSize);
            
            // Crear contexto único para esta posición
            CharacterContext context = new CharacterContext(x, y, color);
            
            characters.add(new FormattedCharacter(glyph, context));
            
            x += glyph.width();
        }
    }
    
    public void insertFormattedText(String text, int startX, int startY, 
                                     String font, int size, Color color) {
        int x = startX;
        int y = startY;
        
        for (char c : text.toCharArray()) {
            if (c == '\n') {
                x = startX;
                y += size + 2;
                continue;
            }
            
            CharacterGlyph glyph = GlyphFactory.getGlyph(c, font, size);
            CharacterContext context = new CharacterContext(x, y, color);
            
            characters.add(new FormattedCharacter(glyph, context));
            
            x += glyph.width();
        }
    }
    
    public void render(Graphics2D g) {
        characters.forEach(fc -> fc.render(g));
    }
    
    public int characterCount() {
        return characters.size();
    }
    
    public void printMemoryStats() {
        IO.println("Caracteres en documento: " + characterCount());
        IO.println("Glyphs únicos en caché: " + GlyphFactory.cacheSize());
        IO.println("Ahorro estimado: " + 
            (characterCount() - GlyphFactory.cacheSize()) + " objetos");
    }
}

// Uso del Flyweight
var document = new TextDocument();

// Insertar mucho texto - los caracteres repetidos comparten glyphs
document.insertText("""
    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
    Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
    Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
    """, 10, 10, Color.BLACK);

document.insertFormattedText("TÍTULO IMPORTANTE", 10, 100, "Arial", 24, Color.RED);

document.insertText("""
    Más texto con muchos caracteres repetidos que comparten glyphs...
    aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
    bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
    """, 10, 130, Color.DARK_GRAY);

document.printMemoryStats();
/*
Caracteres en documento: 458
Glyphs únicos en caché: 52
Ahorro estimado: 406 objetos
*/
```

---

### Proxy

El patrón **Proxy** proporciona un sustituto o representante de otro objeto para controlar el acceso a este. A diferencia del Adapter que cambia la interfaz, el Proxy implementa la misma interfaz que el objeto real y puede agregar comportamiento adicional como lazy loading, control de acceso, logging o caching.

Existen varios tipos de proxies: virtual (crea objetos costosos bajo demanda), remoto (representa objetos en otro espacio de direcciones), de protección (controla permisos de acceso) y smart reference (realiza operaciones adicionales en cada acceso).

**Ejemplo: Proxy con múltiples funcionalidades**

```java
// Interfaz común
public interface ImageLoader {
    Image load(String path);
    byte[] loadRaw(String path);
    ImageMetadata getMetadata(String path);
}

public record Image(String path, int width, int height, byte[] data) {}
public record ImageMetadata(String path, long size, String format, Instant created) {}

// Implementación real (costosa)
public class DiskImageLoader implements ImageLoader {
    
    @Override
    public Image load(String path) {
        IO.println("Cargando imagen del disco: " + path);
        // Simular carga costosa
        try { Thread.sleep(100); } catch (InterruptedException e) {}
        byte[] data = readFromDisk(path);
        return new Image(path, 800, 600, data);
    }
    
    @Override
    public byte[] loadRaw(String path) {
        return readFromDisk(path);
    }
    
    @Override
    public ImageMetadata getMetadata(String path) {
        return new ImageMetadata(path, 1024000, "PNG", Instant.now());
    }
    
    private byte[] readFromDisk(String path) {
        // Leer archivo real
        return new byte[1024];
    }
}

// Proxy virtual con lazy loading y caché
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
            // Evictar entrada más antigua (simplificado)
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

// Proxy de protección con control de acceso
public class SecureImageProxy implements ImageLoader {
    
    private final ImageLoader delegate;
    private final SecurityContext securityContext;
    private final Set<String> restrictedPaths;
    
    public SecureImageProxy(ImageLoader delegate, SecurityContext securityContext) {
        this.delegate = delegate;
        this.securityContext = securityContext;
        this.restrictedPaths = Set.of("/admin/", "/private/", "/internal/");
    }
    
    @Override
    public Image load(String path) {
        checkAccess(path, "READ");
        return delegate.load(path);
    }
    
    @Override
    public byte[] loadRaw(String path) {
        checkAccess(path, "READ_RAW");
        return delegate.loadRaw(path);
    }
    
    @Override
    public ImageMetadata getMetadata(String path) {
        checkAccess(path, "READ_METADATA");
        return delegate.getMetadata(path);
    }
    
    private void checkAccess(String path, String operation) {
        if (isRestricted(path) && !securityContext.hasPermission("ADMIN")) {
            throw new SecurityException(
                "Access denied to %s for operation %s".formatted(path, operation));
        }
    }
    
    private boolean isRestricted(String path) {
        return restrictedPaths.stream().anyMatch(path::startsWith);
    }
}

// Proxy de logging/auditoría
public class AuditingImageProxy implements ImageLoader {
    
    private final ImageLoader delegate;
    private final AuditLog auditLog;
    
    public AuditingImageProxy(ImageLoader delegate, AuditLog auditLog) {
        this.delegate = delegate;
        this.auditLog = auditLog;
    }
    
    @Override
    public Image load(String path) {
        long start = System.currentTimeMillis();
        try {
            Image image = delegate.load(path);
            auditLog.log(new AuditEntry(
                "IMAGE_LOAD",
                path,
                true,
                System.currentTimeMillis() - start
            ));
            return image;
        } catch (Exception e) {
            auditLog.log(new AuditEntry(
                "IMAGE_LOAD",
                path,
                false,
                System.currentTimeMillis() - start,
                e.getMessage()
            ));
            throw e;
        }
    }
    
    @Override
    public byte[] loadRaw(String path) {
        auditLog.log(new AuditEntry("IMAGE_LOAD_RAW", path, true, 0));
        return delegate.loadRaw(path);
    }
    
    @Override
    public ImageMetadata getMetadata(String path) {
        return delegate.getMetadata(path);
    }
}

// Uso combinado de proxies (decorador de proxies)
ImageLoader loader = new AuditingImageProxy(
    new SecureImageProxy(
        new CachingImageProxy(
            new DiskImageLoader(),
            100  // max cache size
        ),
        SecurityContext.current()
    ),
    AuditLog.getInstance()
);

// El cliente usa la interfaz sin saber de los proxies
Image img1 = loader.load("/images/photo.png");  // Carga del disco
Image img2 = loader.load("/images/photo.png");  // Desde caché

try {
    loader.load("/admin/secret.png");  // SecurityException si no es admin
} catch (SecurityException e) {
    IO.println("Acceso denegado: " + e.getMessage());
}
```


---

## Patrones de Diseño de Comportamiento

Los patrones de comportamiento se centran en la comunicación entre objetos, definiendo cómo interactúan y distribuyen responsabilidades.

### Chain of Responsibility

El patrón **Chain of Responsibility** permite pasar solicitudes a través de una cadena de manejadores potenciales. Cada manejador decide si procesa la solicitud o la pasa al siguiente en la cadena. Esto desacopla al emisor de la solicitud de sus receptores, dando a múltiples objetos la oportunidad de manejarla.

Este patrón proporciona flexibilidad para determinar dinámicamente qué objeto maneja cada solicitud. Es especialmente útil para implementar pipelines de procesamiento, middlewares o sistemas de validación donde múltiples filtros deben aplicarse en secuencia.

**Ejemplo: Pipeline de middleware HTTP**

```java
// Interfaz del manejador
public interface HttpHandler {
    HttpResponse handle(HttpRequest request);
}

// Clase base abstracta para middleware
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

// Middleware de logging
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

// Middleware de caché
public class CacheMiddleware extends Middleware {
    
    private final Cache<String, HttpResponse> cache;
    private final Duration ttl;
    
    public CacheMiddleware(Cache<String, HttpResponse> cache, Duration ttl) {
        this.cache = cache;
        this.ttl = ttl;
    }
    
    @Override
    public HttpResponse handle(HttpRequest request) {
        // Solo cachear GET requests
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

// Controlador final (termina la cadena)
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

// Builder para construir el pipeline
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

// Uso del Chain of Responsibility
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

El patrón **Command** encapsula una solicitud como un objeto, permitiendo parametrizar clientes con diferentes solicitudes, encolar o registrar solicitudes, y soportar operaciones reversibles. Desacopla el objeto que invoca la operación del que sabe cómo ejecutarla.

Cada comando es un objeto autónomo que contiene toda la información necesaria para ejecutar una acción. Esto permite crear colas de comandos, implementar undo/redo, registrar historial de operaciones y crear comandos compuestos (macros).

**Ejemplo: Sistema de editor de texto con undo/redo**

```java
// Interfaz Command
public sealed interface TextCommand permits InsertCommand, DeleteCommand, ReplaceCommand, MacroCommand {
    void execute();
    void undo();
    String description();
}

// Receptor - el documento sobre el que operan los comandos
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

// Comandos concretos
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

public final class ReplaceCommand implements TextCommand {
    private final TextDocument document;
    private final int start;
    private final int end;
    private final String newText;
    private String replacedText;
    
    public ReplaceCommand(TextDocument document, int start, int end, String newText) {
        this.document = document;
        this.start = start;
        this.end = end;
        this.newText = newText;
    }
    
    @Override
    public void execute() {
        replacedText = document.replace(start, end, newText);
    }
    
    @Override
    public void undo() {
        document.replace(start, start + newText.length(), replacedText);
    }
    
    @Override
    public String description() {
        return "Replace '%s' with '%s'".formatted(
            replacedText != null ? truncate(replacedText) : "?",
            truncate(newText));
    }
    
    private String truncate(String s) {
        return s.length() > 10 ? s.substring(0, 10) + "..." : s;
    }
}

// Comando compuesto (Macro)
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

// Invoker - maneja el historial y undo/redo
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
        redoStack.clear(); // Limpiar redo al ejecutar nuevo comando
        
        // Mantener límite de historial
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

// Cliente - Editor de texto
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

// Uso del patrón Command
var editor = new TextEditor();

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

El patrón **Interpreter** define una representación gramatical para un lenguaje y un intérprete que usa esa representación para interpretar sentencias del lenguaje. Es útil cuando existe un problema que ocurre frecuentemente y puede expresarse mediante un lenguaje simple.

El patrón utiliza un árbol de sintaxis abstracta (AST) donde cada nodo es una expresión. Las expresiones terminales representan elementos atómicos del lenguaje, mientras que las no terminales componen otras expresiones. Aunque no es el más eficiente, es ideal para lenguajes simples de dominio específico (DSL).

**Ejemplo: Intérprete de expresiones de filtrado**

```java
// Contexto de interpretación
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

// Expresión abstracta
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

public record LiteralExpression<T>(Object value) implements FilterExpression<T> {
    @Override
    public boolean interpret(FilterContext<T> context) {
        return value instanceof Boolean b ? b : value != null;
    }
    
    @Override
    public String toQueryString() {
        return value instanceof String ? "'" + value + "'" : String.valueOf(value);
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

// Expresiones lógicas
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

public record NotExpression<T>(FilterExpression<T> expression) implements FilterExpression<T> {
    @Override
    public boolean interpret(FilterContext<T> context) {
        return !expression.interpret(context);
    }
    
    @Override
    public String toQueryString() {
        return "NOT " + expression.toQueryString();
    }
}

public record InExpression<T>(PropertyExpression<T> property, List<Object> values) 
        implements FilterExpression<T> {
    
    @Override
    public boolean interpret(FilterContext<T> context) {
        Object propValue = property.getValue(context);
        return values.contains(propValue);
    }
    
    @Override
    public String toQueryString() {
        String valuesList = values.stream()
            .map(v -> v instanceof String ? "'" + v + "'" : String.valueOf(v))
            .collect(Collectors.joining(", "));
        return "%s IN (%s)".formatted(property.toQueryString(), valuesList);
    }
}

// Builder DSL para construir expresiones
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

// Uso del Interpreter
public record Product(String name, String category, double price, boolean active) {}

var filter = new FilterBuilder<Product>();

// Construir expresión: category = 'Electronics' AND price > 100 AND active = true
FilterExpression<Product> expression = FilterBuilder.and(
    FilterBuilder.and(
        filter.where("category").equals("Electronics"),
        filter.where("price").greaterThan(100.0)
    ),
    filter.where("active").equals(true)
);

IO.println("Query: " + expression.toQueryString());
// Output: ((category = 'Electronics' AND price > 100.0) AND active = true)

// Filtrar productos
List<Product> products = List.of(
    new Product("Laptop", "Electronics", 999.99, true),
    new Product("Mouse", "Electronics", 29.99, true),
    new Product("Desk", "Furniture", 199.99, true),
    new Product("Monitor", "Electronics", 299.99, false)
);

var filtered = products.stream()
    .filter(p -> expression.interpret(new FilterContext<>(p, Map.of())))
    .toList();

IO.println("Filtered: " + filtered);
// Output: [Product[name=Laptop, category=Electronics, price=999.99, active=true]]
```


---

### Iterator

El patrón **Iterator** proporciona una forma de acceder secuencialmente a los elementos de una colección sin exponer su representación interna. Separa la responsabilidad de recorrer la colección de la colección misma, permitiendo diferentes estrategias de iteración.

Este patrón ofrece flexibilidad para implementar múltiples formas de recorrer una estructura de datos. En Java moderno, el patrón está integrado en el lenguaje a través de `Iterable`, `Iterator` y la API de Streams. Sin embargo, sigue siendo valioso implementarlo explícitamente para estructuras de datos personalizadas o cuando se necesitan iteradores especializados.

**Ejemplo: Iteradores personalizados para árbol binario**

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

// Árbol binario con múltiples estrategias de iteración
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

// Iterador In-Order (izquierda -> raíz -> derecha)
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

// Uso del patrón Iterator
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

// Uso con for-each
for (Integer value : tree.inOrder()) {
    System.out.print(value + " ");
}

// Uso con Streams para operaciones funcionales
int sum = tree.stream()
    .filter(n -> n % 2 == 0)
    .mapToInt(Integer::intValue)
    .sum();
```

---

### Mediator

El patrón **Mediator** define un objeto que encapsula cómo interactúan un conjunto de objetos. Promueve el acoplamiento débil evitando que los objetos se refieran entre sí explícitamente, y permite variar sus interacciones de forma independiente.

Este patrón centraliza el control de las comunicaciones complejas entre objetos relacionados. Los objetos participantes (colegas) solo conocen al mediador, no a los otros objetos con los que interactúan. Esto simplifica el mantenimiento y hace más fácil reutilizar los objetos individuales.

**Ejemplo: Chat room como mediador**

```java
// Interfaz del mediador
public interface ChatMediator {
    void sendMessage(String message, User sender);
    void sendPrivateMessage(String message, User sender, User recipient);
    void addUser(User user);
    void removeUser(User user);
    List<User> getOnlineUsers();
}

// Interfaz del colega (usuario)
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

// Implementación concreta del usuario
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

// Implementación del mediador
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
        
        // El mediador coordina quién recibe el mensaje
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
        // Notificar a otros usuarios
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

// Uso del patrón Mediator
var chatRoom = new ChatRoom("room-1", "General");

var alice = new ChatUser("1", "Alice");
var bob = new ChatUser("2", "Bob");
var charlie = new ChatUser("3", "Charlie");

// Los usuarios se unen a través del mediador
alice.join(chatRoom);
bob.join(chatRoom);
charlie.join(chatRoom);

// Comunicación mediada
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

El patrón **Memento** permite capturar y externalizar el estado interno de un objeto sin violar su encapsulamiento, de modo que pueda restaurarse a ese estado posteriormente. Es especialmente útil para implementar funcionalidades de undo, checkpoints o recuperación ante errores.

El patrón involucra tres participantes: el Originator (el objeto cuyo estado se guarda), el Memento (almacena el estado) y el Caretaker (gestiona los mementos sin acceder a su contenido). El Memento tiene una interfaz estrecha para el Caretaker pero amplia para el Originator.

**Ejemplo: Editor de código con snapshots**

```java
// Memento - almacena el estado
public final class EditorMemento {
    private final String content;
    private final int cursorPosition;
    private final Set<Integer> breakpoints;
    private final Instant savedAt;
    private final String description;
    
    // Constructor package-private - solo Originator puede crear mementos
    EditorMemento(String content, int cursorPosition, Set<Integer> breakpoints, String description) {
        this.content = content;
        this.cursorPosition = cursorPosition;
        this.breakpoints = Set.copyOf(breakpoints);
        this.savedAt = Instant.now();
        this.description = description;
    }
    
    // Interfaz pública limitada para el Caretaker
    public Instant savedAt() { return savedAt; }
    public String description() { return description; }
    
    // Métodos package-private para el Originator
    String content() { return content; }
    int cursorPosition() { return cursorPosition; }
    Set<Integer> breakpoints() { return breakpoints; }
}

// Originator - el editor
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
    
    // Crear memento
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

// Facade para simplificar el uso
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

// Uso del patrón Memento
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

El patrón **Observer** define una relación de uno a muchos entre objetos, de modo que cuando un objeto (subject) cambia su estado, todos sus dependientes (observers) son notificados y actualizados automáticamente. También conocido como publish-subscribe, este patrón es fundamental para implementar sistemas de eventos desacoplados.

El subject mantiene una lista de observers sin conocer sus clases concretas, proporcionando máxima flexibilidad. Los observers pueden suscribirse, desuscribirse o ser notificados de cambios específicos. Un objeto puede actuar simultáneamente como subject y observer de otros objetos.

**Ejemplo: Sistema de eventos reactivo**

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

// Observer interface con soporte genérico
@FunctionalInterface
public interface EventListener<E extends DomainEvent> {
    void onEvent(E event);
}

// Subject - EventBus central
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
    
    // Interface funcional para unsubscribe
    @FunctionalInterface
    public interface Subscription extends AutoCloseable {
        void unsubscribe();
        
        @Override
        default void close() { unsubscribe(); }
    }
}

// Observers concretos
public class NotificationService implements EventListener<OrderCreated> {
    
    private final EmailSender emailSender;
    
    public NotificationService(EmailSender emailSender) {
        this.emailSender = emailSender;
    }
    
    @Override
    public void onEvent(OrderCreated event) {
        IO.println("📧 Sending order confirmation for order: " + event.aggregateId());
        // emailSender.send(buildConfirmationEmail(event));
    }
}

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

public class ShippingNotifier implements EventListener<OrderShipped> {
    
    @Override
    public void onEvent(OrderShipped event) {
        IO.println("🚚 Notifying customer about shipment: " + event.trackingNumber());
    }
}

// Uso del patrón Observer
final var eventBus = new EventBus();

// Registrar observers
final var emailSender = new EmailSender();
final var notificationService = new NotificationService(emailSender);
final var inventoryService = new InventoryService();
final var analyticsService = new AnalyticsService();
final var shippingNotifier = new ShippingNotifier();

// Suscripciones - diferentes observers para el mismo evento
final var sub1 = eventBus.subscribe(OrderCreated.class, notificationService);
final var sub2 = eventBus.subscribe(OrderCreated.class, inventoryService);
final var sub3 = eventBus.subscribe(OrderCreated.class, analyticsService::trackOrderCreated);
final var sub4 = eventBus.subscribe(OrderShipped.class, shippingNotifier);

// Publicar eventos
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

// Desuscribirse
sub1.unsubscribe();
// O usando try-with-resources
try (var subscription = eventBus.subscribe(OrderCreated.class, e -> 
        IO.println("Temporary listener: " + e.aggregateId()))) {
    eventBus.publish(orderCreated);
}
```

---

### State

El patrón **State** permite que un objeto altere su comportamiento cuando cambia su estado interno. El objeto parecerá cambiar de clase, ya que cada estado encapsula el comportamiento específico asociado a él en una clase separada.

Este patrón elimina las sentencias condicionales extensas que verifican el estado actual del objeto. En su lugar, cada estado posible se representa como una clase que implementa el comportamiento apropiado. El contexto delega las operaciones al objeto de estado actual, y las transiciones entre estados pueden ser gestionadas por el contexto o por los propios estados.

**Ejemplo: Máquina de estados para proceso de pedido**

```java
// Interfaz State
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
    
    // Comportamiento por defecto - operación no permitida
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

public final class PaidState implements OrderState {
    public static final PaidState INSTANCE = new PaidState();
    private PaidState() {}
    
    @Override
    public String stateName() { return "PAID"; }
    
    @Override
    public void addItem(OrderContext order, OrderItem item) { throwInvalidOperation("add items"); }
    @Override
    public void removeItem(OrderContext order, String productId) { throwInvalidOperation("remove items"); }
    @Override
    public void submitOrder(OrderContext order) { throwInvalidOperation("submit"); }
    @Override
    public void processPayment(OrderContext order, PaymentInfo payment) { throwInvalidOperation("pay again"); }
    
    @Override
    public void shipOrder(OrderContext order, ShippingInfo shipping) {
        order.setShippingInfo(shipping);
        order.setState(ShippedState.INSTANCE);
        IO.println("✓ Order shipped: " + shipping.trackingNumber());
    }
    
    @Override
    public void deliverOrder(OrderContext order) {
        throwInvalidOperation("deliver");
    }
    
    @Override
    public void cancelOrder(OrderContext order, String reason) {
        // Requiere reembolso
        order.setState(CancelledState.INSTANCE);
        order.setCancellationReason(reason);
        order.setRefundRequired(true);
        IO.println("✓ Paid order cancelled, refund required: " + reason);
    }
}

public final class ShippedState implements OrderState {
    public static final ShippedState INSTANCE = new ShippedState();
    private ShippedState() {}
    
    @Override
    public String stateName() { return "SHIPPED"; }
    
    @Override
    public void addItem(OrderContext order, OrderItem item) { throwInvalidOperation("add items"); }
    @Override
    public void removeItem(OrderContext order, String productId) { throwInvalidOperation("remove items"); }
    @Override
    public void submitOrder(OrderContext order) { throwInvalidOperation("submit"); }
    @Override
    public void processPayment(OrderContext order, PaymentInfo payment) { throwInvalidOperation("pay"); }
    @Override
    public void shipOrder(OrderContext order, ShippingInfo shipping) { throwInvalidOperation("ship again"); }
    
    @Override
    public void deliverOrder(OrderContext order) {
        order.setDeliveredAt(Instant.now());
        order.setState(DeliveredState.INSTANCE);
        IO.println("✓ Order delivered!");
    }
    
    @Override
    public void cancelOrder(OrderContext order, String reason) {
        throwInvalidOperation("cancel shipped order");
    }
}

public final class DeliveredState implements OrderState {
    public static final DeliveredState INSTANCE = new DeliveredState();
    private DeliveredState() {}
    
    @Override
    public String stateName() { return "DELIVERED"; }
    
    // Todas las operaciones no permitidas en estado final
    @Override public void addItem(OrderContext order, OrderItem item) { throwInvalidOperation("modify"); }
    @Override public void removeItem(OrderContext order, String productId) { throwInvalidOperation("modify"); }
    @Override public void submitOrder(OrderContext order) { throwInvalidOperation("submit"); }
    @Override public void processPayment(OrderContext order, PaymentInfo payment) { throwInvalidOperation("pay"); }
    @Override public void shipOrder(OrderContext order, ShippingInfo shipping) { throwInvalidOperation("ship"); }
    @Override public void deliverOrder(OrderContext order) { throwInvalidOperation("deliver again"); }
    @Override public void cancelOrder(OrderContext order, String reason) { throwInvalidOperation("cancel delivered"); }
}

public final class CancelledState implements OrderState {
    public static final CancelledState INSTANCE = new CancelledState();
    private CancelledState() {}
    
    @Override
    public String stateName() { return "CANCELLED"; }
    
    // Ninguna operación permitida
    @Override public void addItem(OrderContext order, OrderItem item) { throwInvalidOperation("modify cancelled"); }
    @Override public void removeItem(OrderContext order, String productId) { throwInvalidOperation("modify cancelled"); }
    @Override public void submitOrder(OrderContext order) { throwInvalidOperation("submit cancelled"); }
    @Override public void processPayment(OrderContext order, PaymentInfo payment) { throwInvalidOperation("pay cancelled"); }
    @Override public void shipOrder(OrderContext order, ShippingInfo shipping) { throwInvalidOperation("ship cancelled"); }
    @Override public void deliverOrder(OrderContext order) { throwInvalidOperation("deliver cancelled"); }
    @Override public void cancelOrder(OrderContext order, String reason) { throwInvalidOperation("cancel again"); }
}

// Context
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
    
    // Delegación al estado actual
    public void addItem(OrderItem item) { state.addItem(this, item); }
    public void removeItem(String productId) { state.removeItem(this, productId); }
    public void submit() { state.submitOrder(this); }
    public void pay(PaymentInfo payment) { state.processPayment(this, payment); }
    public void ship(ShippingInfo shipping) { state.shipOrder(this, shipping); }
    public void deliver() { state.deliverOrder(this); }
    public void cancel(String reason) { state.cancelOrder(this, reason); }
    
    // Getters y setters
    public String getOrderId() { return orderId; }
    public List<OrderItem> getItems() { return items; }
    public OrderState getState() { return state; }
    public void setState(OrderState state) { this.state = state; }
    public Money getTotal() {
        return items.stream()
            .map(i -> i.price().multiply(i.quantity()))
            .reduce(Money.ZERO, Money::add);
    }
    
    // Otros setters...
    public void setPaymentInfo(PaymentInfo info) { this.paymentInfo = info; }
    public void setShippingInfo(ShippingInfo info) { this.shippingInfo = info; }
    public void setCancellationReason(String reason) { this.cancellationReason = reason; }
    public void setRefundRequired(boolean required) { this.refundRequired = required; }
    public void setDeliveredAt(Instant at) { this.deliveredAt = at; }
    
    public void printStatus() {
        IO.println("\n=== Order " + orderId + " ===");
        IO.println("State: " + state.stateName());
        IO.println("Items: " + items);
        IO.println("Total: " + getTotal());
    }
}

// Uso del patrón State
var order = new OrderContext("ORD-001");

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

// Intentar operación inválida
try {
    order.cancel("Changed my mind");
} catch (IllegalStateException e) {
    IO.println("Error: " + e.getMessage());
    // Error: Cannot cancel delivered in state: DELIVERED
}
```


---

### Strategy

El patrón **Strategy** define una familia de algoritmos, encapsula cada uno y los hace intercambiables. Permite que el algoritmo varíe independientemente de los clientes que lo usan. Este patrón es ideal cuando se tienen múltiples formas de realizar una tarea y la elección del algoritmo debe hacerse en tiempo de ejecución.

A diferencia del patrón State donde el comportamiento cambia según el estado interno, en Strategy la elección del algoritmo depende de condiciones externas como configuración, preferencias del usuario o tipo de datos. En Java moderno, las estrategias pueden implementarse elegantemente usando interfaces funcionales y lambdas.

**Ejemplo: Sistema de procesamiento de pagos con estrategias**

```java
// Interfaz Strategy
@FunctionalInterface
public interface CalculatePrice extends Function<Order, Money> {
    
    default String strategyName() {
        return this.getClass().getSimpleName();
    }
}

// Estrategias concretas
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

// Estrategia compuesta - aplica múltiples estrategias
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

// Uso con lambdas - estrategias como funciones
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
        
        // Estrategias como lambdas
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

El patrón **Template Method** define el esqueleto de un algoritmo en una operación, difiriendo algunos pasos a las subclases. Permite que las subclases redefinan ciertos pasos del algoritmo sin cambiar su estructura general. La filosofía es "No nos llames, nosotros te llamamos" (Hollywood Principle).

La clase base define la secuencia de pasos y proporciona implementaciones por defecto o abstractas para cada paso. Las subclases pueden sobrescribir pasos específicos mientras la estructura del algoritmo permanece intacta. También pueden incluirse "hooks" - métodos vacíos que las subclases pueden sobrescribir opcionalmente.

**Ejemplo: Pipeline de procesamiento de datos**

```java
// Template abstracto
public abstract class DataProcessor<T, R> {
    
    // Template method - define la estructura del algoritmo
    public final ProcessingResult<R> process(DataSource<T> source) {
        final var startTime = Instant.now();
        final var metrics = new ProcessingMetrics();
        
        try {
            // Hook - preparación opcional
            beforeProcessing(source);
            
            // Paso 1: Extraer datos (abstracto)
            final List<T> rawData = extractData(source);
            metrics.setRecordsRead(rawData.size());
            
            // Paso 2: Validar datos (con implementación por defecto)
            final List<T> validData = validateData(rawData, metrics);
            
            // Paso 3: Transformar datos (abstracto)
            final List<R> transformedData = transformData(validData);
            metrics.setRecordsTransformed(transformedData.size());
            
            // Paso 4: Filtrar datos (con implementación por defecto)
            final List<R> filteredData = filterData(transformedData);
            metrics.setRecordsFiltered(transformedData.size() - filteredData.size());
            
            // Paso 5: Cargar/guardar datos (abstracto)
            final int loaded = loadData(filteredData);
            metrics.setRecordsLoaded(loaded);
            
            // Hook - finalización opcional
            afterProcessing(metrics);
            
            metrics.setDuration(Duration.between(startTime, Instant.now()));
            return ProcessingResult.success(filteredData, metrics);
            
        } catch (Exception e) {
            handleError(e, metrics);
            metrics.setDuration(Duration.between(startTime, Instant.now()));
            return ProcessingResult.failure(e.getMessage(), metrics);
        }
    }
    
    // Métodos abstractos - las subclases DEBEN implementar
    protected abstract List<T> extractData(DataSource<T> source);
    protected abstract List<R> transformData(List<T> data);
    protected abstract int loadData(List<R> data);
    
    // Métodos con implementación por defecto - las subclases PUEDEN sobrescribir
    protected List<T> validateData(List<T> data, ProcessingMetrics metrics) {
        // Por defecto, todos los datos son válidos
        return data;
    }
    
    protected List<R> filterData(List<R> data) {
        // Por defecto, no se filtra nada
        return data;
    }
    
    // Hooks - métodos vacíos que las subclases pueden sobrescribir
    protected void beforeProcessing(DataSource<T> source) {
        // Hook vacío por defecto
    }
    
    protected void afterProcessing(ProcessingMetrics metrics) {
        // Hook vacío por defecto
    }
    
    protected void handleError(Exception e, ProcessingMetrics metrics) {
        System.err.println("Error processing: " + e.getMessage());
        metrics.setError(e.getMessage());
    }
}

// Implementación concreta: procesador de API a Base de datos
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
        // Logging más detallado para errores de BD
        System.err.println("Database error: " + e.getMessage());
        db.rollback();
        super.handleError(e, metrics);
    }
}

// Uso del Template Method
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

El patrón **Visitor** permite definir nuevas operaciones sobre una estructura de objetos sin modificar las clases de los elementos sobre los que opera. Separa un algoritmo de la estructura de objetos sobre la que opera, facilitando agregar nuevas operaciones sin cambiar las clases existentes.

Este patrón es ideal cuando la estructura de objetos es estable pero las operaciones sobre ella cambian frecuentemente. Define una doble despacho: el elemento acepta un visitor y el visitor determina qué operación ejecutar basándose en el tipo concreto del elemento.

**Ejemplo: Sistema de reportes para documentos**

```java
// Interfaz Visitor
public interface DocumentVisitor<T> {
    T visitParagraph(Paragraph paragraph);
    T visitHeading(Heading heading);
    T visitImage(Image image);
    T visitTable(Table table);
    T visitCodeBlock(CodeBlock codeBlock);
    
    // Método por defecto para elementos compuestos
    default T visitDocument(Document document) {
        document.elements().forEach(e -> e.accept(this));
        return null;
    }
}

// Interfaz Element
public interface DocumentElement {
    <T> T accept(DocumentVisitor<T> visitor);
}

// Elementos concretos
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

public record Image(String src, String alt, int width, int height) implements DocumentElement {
    @Override
    public <T> T accept(DocumentVisitor<T> visitor) {
        return visitor.visitImage(this);
    }
}

public record Table(List<String> headers, List<List<String>> rows) implements DocumentElement {
    @Override
    public <T> T accept(DocumentVisitor<T> visitor) {
        return visitor.visitTable(this);
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
    public String visitImage(Image image) {
        String result = "![%s](%s)".formatted(image.alt(), image.src());
        markdown.append(result).append("\n\n");
        return result;
    }
    
    @Override
    public String visitTable(Table table) {
        var sb = new StringBuilder();
        sb.append("| ").append(String.join(" | ", table.headers())).append(" |\n");
        sb.append("| ").append(table.headers().stream().map(h -> "---").collect(Collectors.joining(" | "))).append(" |\n");
        
        for (var row : table.rows()) {
            sb.append("| ").append(String.join(" | ", row)).append(" |\n");
        }
        
        markdown.append(sb).append("\n");
        return sb.toString();
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

// Uso del patrón Visitor
final var document = new Document("Mi Documento", List.of(
    new Heading("Introducción", 1),
    new Paragraph("Este es un documento de ejemplo.", Paragraph.TextStyle.NORMAL),
    new Heading("Datos", 2),
    new Table(
        List.of("Nombre", "Edad", "Ciudad"),
        List.of(
            List.of("Ana", "25", "Madrid"),
            List.of("Juan", "30", "Barcelona")
        )
    ),
    new Heading("Código", 2),
    new CodeBlock("IO.println(\"Hello!\");", "java"),
    new Image("/images/logo.png", "Logo", 200, 100)
));

// Exportar a Markdown
final var markdownVisitor = new MarkdownExportVisitor();
document.accept(markdownVisitor);
IO.println(markdownVisitor.getMarkdown());
```