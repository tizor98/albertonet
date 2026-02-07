---
slug: 'patterns-primer-1'
lang: 'en'
title: "Expressive APIs and Safe Resources - Part 1 of 5"
description: 'First installment of the series: how to design readable APIs with Fluent Interfaces and manage lifecycle with the Loan Pattern, with clear examples in Java 25.'
categories: ['software','patterns','design']
pubDate: '2025-12-06'
heroImage: '@/presentation/assets/patterns-primer-1.png'
---

This is the first installment of a practical series on patterns. Here we focus on two very useful ideas in modern code: using Fluent Interfaces to build readable APIs through chaining, and applying the Loan Pattern to expose capabilities without giving up control over the resource lifecycle. You'll see when each approach is appropriate and how to implement it in Java 25 with simple, reusable examples.

## Modern Design Patterns

### Fluent Interfaces

The **Fluent Interface** pattern aims to provide an API that can be used in a natural and expressive way to complete complex operations. Each method in the interface returns the same object (or a related one), allowing calls to be chained so that the resulting code reads almost like prose.

Among its main benefits are internal resource management and selective exposure of methods depending on the context of use. Unlike the traditional Builder pattern, Fluent Interfaces are not exclusively focused on object creation, but on making any functionality intuitive to use. They also allow multiple interfaces to participate in the process, guiding the user through the valid steps.

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

The **Loan** pattern allows you to expose the functionality of a resource while keeping full control over its lifecycle. The central idea is to "lend" a resource to the client so they can perform the necessary operations, but control over when and how the resource is initialized, used, and released stays with the class that manages it.

This pattern is particularly useful for resources that require explicit open and close, such as database connections, files, or network connections. By centralizing lifecycle management, common mistakes like forgetting to close resources or handling exceptions incorrectly are eliminated. As authors of the class, we are in a better position to know exactly when and how these resources should be managed.

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
    
    // Static method implementing the Loan Pattern
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
    
    // Version for operations with no return value
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
