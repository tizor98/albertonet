---
slug: 'patterns-primer-1'
lang: 'es'
title: "Fluent Interfaces y Loan Pattern — APIs expresivas y recursos seguros - Parte 1 de 5"
description: 'Primera entrega de la serie: cómo diseñar APIs legibles con Fluent Interfaces y gestionar el ciclo de vida con Loan Pattern, con ejemplos claros en Java 25.'
categories: ['software','patterns','design']
pubDate: '2025-12-06'
heroImage: '@/presentation/assets/patterns-primer-1.png'
---

Esta es la primera entrega de una serie práctica sobre patrones. Aquí nos enfocamos en dos ideas muy útiles en código moderno: usar Fluent Interfaces para construir APIs legibles mediante encadenamiento y aplicar el Loan Pattern para exponer capacidades sin ceder el control del ciclo de vida del recurso. Verás cuándo conviene cada enfoque y cómo implementarlo en Java 25 con ejemplos simples y reutilizables.

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
