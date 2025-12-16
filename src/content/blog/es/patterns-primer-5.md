---
slug: 'patterns-primer-5'
lang: 'es'
title: "Patrones de comportamiento — colaboración y orquestación - Parte 5 de 5"
description: 'Quinta entrega: Chain of Responsibility, Command, Observer, Strategy, State, Mediator, Memento, Visitor y más — cómo coordinar interacciones entre objetos en Java 25.'
categories: ['software','patterns','design']
pubDate: '2025-12-06'
heroImage: '@/presentation/assets/patterns-primer-1.png'
---

Esta quinta y última entrega se centra en los patrones de comportamiento: cómo colaboran los objetos, cómo se comunican y cómo reparten responsabilidades. Verás cuándo elegir cada patrón para desacoplar lógica, encapsular decisiones, propagar eventos o modelar flujos de trabajo, con implementaciones modernas en Java 25.

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
public interface TextCommand {
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

// Otros comandos ...

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

// Otras implementaciones

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

final var filter = new FilterBuilder<Product>();

// Construir expresión: category = 'Electronics' AND price > 100 AND active = true
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

// Otras implementaciones de observers...

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

// Implementación de otros estados

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
    
    // Delegación al estado actual
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

// Uso del patrón State
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

// Uso del patrón Visitor
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
