---
slug: 'patterns-primer-5'
lang: 'en'
title: "Collaboration and Orchestration - Part 5 of 5"
description: 'Fifth and final installment: Chain of Responsibility, Command, Observer, Strategy, State, Mediator, Memento, Visitor and more — how to coordinate interactions between objects in Java 25.'
categories: ['software','patterns','design']
pubDate: '2025-12-06'
heroImage: '@/presentation/assets/patterns-primer-5.png'
---

This fifth and final installment focuses on behavioral patterns: how objects collaborate, how they communicate, and how they share responsibilities. You'll see when to choose each pattern to decouple logic, encapsulate decisions, propagate events, or model workflows, with modern implementations in Java 25.

## Behavioral Design Patterns

Behavioral patterns focus on communication between objects, defining how they interact and distribute responsibilities.

### Chain of Responsibility

The **Chain of Responsibility** pattern allows passing requests along a chain of potential handlers. Each handler decides whether to process the request or pass it to the next in the chain. This decouples the sender of the request from its receivers, giving multiple objects a chance to handle it.

This pattern provides flexibility to determine dynamically which object handles each request. It's especially useful for implementing processing pipelines, middlewares, or validation systems where multiple filters must be applied in sequence.

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

The **Command** pattern encapsulates a request as an object, allowing you to parameterize clients with different requests, queue or log requests, and support reversible operations. It decouples the object that invokes the operation from the one that knows how to execute it.

Each command is a self-contained object that contains all the information needed to execute an action. This allows creating command queues, implementing undo/redo, logging operation history, and creating composite commands (macros).

**Example: Text editor with undo/redo**

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
        // Undo in reverse order
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
        
        // Keep history limit
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

The **Interpreter** pattern defines a grammatical representation for a language and an interpreter that uses that representation to interpret sentences in the language. It's useful when a problem occurs frequently and can be expressed in a simple language.

The pattern uses an abstract syntax tree (AST) where each node is an expression. Terminal expressions represent atomic elements of the language, while non-terminal ones compose other expressions. Although not the most efficient, it's ideal for simple domain-specific languages (DSL).

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

// Terminal expressions
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

// Non-terminal expressions - comparisons
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

// Other implementations

// DSL builder for building expressions
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

// Filter products
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

The **Iterator** pattern provides a way to access the elements of a collection sequentially without exposing its internal representation. It separates the responsibility of traversing the collection from the collection itself, allowing different iteration strategies.

This pattern offers flexibility to implement multiple ways of traversing a data structure. In modern Java, the pattern is built into the language through `Iterable`, `Iterator`, and the Streams API. However, it's still valuable to implement it explicitly for custom data structures or when specialized iterators are needed.

**Example: Custom iterators for binary tree**

```java
// Node structure
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

// Different ways to iterate
IO.println("In-Order: " + tree.stream(TraversalOrder.IN_ORDER).toList());
// [1, 2, 3, 4, 5, 6, 7]

// Using for-each
for (Integer value : tree.inOrder()) {
    System.out.print(value + " ");
}

// Using Streams for functional operations
int sum = tree.stream()
    .filter(n -> n % 2 == 0)
    .mapToInt(Integer::intValue)
    .sum();
```

---

### Mediator

The **Mediator** pattern defines an object that encapsulates how a set of objects interact. It promotes loose coupling by avoiding explicit references between objects, and allows their interactions to vary independently.

This pattern centralizes control of complex communication between related objects. Participating objects (colleagues) only know the mediator, not the other objects they interact with. This simplifies maintenance and makes it easier to reuse individual objects.

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
        sendSystemMessage(user.name() + " has joined the chat");
    }
    
    @Override
    public void removeUser(User user) {
        users.remove(user);
        sendSystemMessage(user.name() + " has left the chat");
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
alice.send("Hello everyone!");
// [Alice] sends: Hello everyone!
//   [Bob] received from [Alice]: Hello everyone!
//   [Charlie] received from [Alice]: Hello everyone!

bob.sendPrivate("Hi Alice, how are you?", alice);
// [Bob] whispers to [Alice]: Hi Alice, how are you?
//   [Alice] received private from [Bob]: Hi Alice, how are you?

// Block user
chatRoom.blockUser("Charlie", "Bob");
bob.send("This message will not reach Charlie");

alice.leave();
// [SYSTEM -> Bob]: Alice has left the chat
// [SYSTEM -> Charlie]: Alice has left the chat
```

---

### Memento

The **Memento** pattern allows capturing and externalizing an object's internal state without violating its encapsulation, so it can be restored to that state later. It's especially useful for implementing undo, checkpoints, or error recovery.

The pattern involves three participants: the Originator (the object whose state is saved), the Memento (stores the state), and the Caretaker (manages mementos without accessing their content). The Memento has a narrow interface for the Caretaker but a wide one for the Originator.

**Example: Code editor with snapshots**

```java
// Memento - stores state
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
    
    // Restore from memento
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

// Caretaker - manages memento history
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

// Undo changes
editor.undo();
editor.undo();
IO.println("After 2 undos:\n" + editor.getContent());

// Redo
editor.redo();
IO.println("After redo:\n" + editor.getContent());
```

---

### Observer

The **Observer** pattern defines a one-to-many relationship between objects so that when one object (subject) changes state, all its dependents (observers) are notified and updated automatically. Also known as publish-subscribe, this pattern is fundamental for implementing decoupled event systems.

The subject maintains a list of observers without knowing their concrete classes, providing maximum flexibility. Observers can subscribe, unsubscribe, or be notified of specific changes. An object can act simultaneously as subject and observer of other objects.

**Example: Reactive event system**

```java
// Typed events
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

The **State** pattern allows an object to alter its behavior when its internal state changes. The object will appear to change class, since each state encapsulates the specific behavior associated with it in a separate class.

This pattern eliminates lengthy conditional statements that check the object's current state. Instead, each possible state is represented as a class that implements the appropriate behavior. The context delegates operations to the current state object, and transitions between states can be managed by the context or by the states themselves.

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

// Concrete states
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
        // Validate and process payment
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

// Other state implementations

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

The **Strategy** pattern defines a family of algorithms, encapsulates each one, and makes them interchangeable. It allows the algorithm to vary independently from the clients that use it. This pattern is ideal when you have multiple ways to perform a task and the choice of algorithm must be made at runtime.

Unlike the State pattern where behavior changes according to internal state, in Strategy the choice of algorithm depends on external conditions such as configuration, user preferences, or data type. In modern Java, strategies can be implemented elegantly using functional interfaces and lambdas.

**Example: Payment processing system with strategies**

```java
// Strategy interface
@FunctionalInterface
public interface PricingStrategy extends Function<Order, Money> {
    
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
                .map(s -> s.apply(order))
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
        var example = new FunctionalPricingExample();
        var order = new Order("ORD-001", List.of(
            new OrderItem("PROD-A", 5, new Money(20, "USD")),
            new OrderItem("PROD-B", 3, new Money(15, "USD"))
        ));
        
        // Strategies as lambdas
        PricingStrategy standard = new StandardPricing();
        PricingStrategy members = new MembershipPricing(MembershipLevel.GOLD);
        
        IO.println("Standard discount: " + example.applyDiscount(order, standard));
        IO.println("10% off for members: " + example.applyDiscount(order, members));
        IO.println("Compound: " + example.applyDiscount(order, new CompositePricingStrategy(CombinationMode.BEST_PRICE, standard, members)));
    }
}
```

---

### Template Method

The **Template Method** pattern defines the skeleton of an algorithm in an operation, deferring some steps to subclasses. It lets subclasses redefine certain steps of the algorithm without changing its overall structure. The philosophy is "Don't call us, we'll call you" (Hollywood Principle).

The base class defines the sequence of steps and provides default or abstract implementations for each step. Subclasses can override specific steps while the algorithm's structure remains intact. "Hooks" can also be included—empty methods that subclasses can optionally override.

**Example: Data processing pipeline**

```java
// Abstract template
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
            
            // Hook - optional completion
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
    
    // Methods with default implementation - subclasses MAY override
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
        // More detailed logging for DB errors
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

The **Visitor** pattern allows defining new operations on a structure of objects without modifying the classes of the elements it operates on. It separates an algorithm from the object structure it operates on, making it easy to add new operations without changing existing classes.

This pattern is ideal when the object structure is stable but the operations on it change frequently. It defines double dispatch: the element accepts a visitor and the visitor determines which operation to run based on the concrete type of the element.

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

// Concrete visitor: Export to Markdown
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
final var document = new Document("My Document", List.of(
    new Heading("Introduction", 1),
    new Paragraph("This is an example document.", Paragraph.TextStyle.NORMAL),
    new Heading("Data", 2),
    new Heading("Code", 2),
    new CodeBlock("IO.println(\"Hello!\");", "java")
));

// Export to Markdown
final var markdownVisitor = new MarkdownExportVisitor();
document.accept(markdownVisitor);
IO.println(markdownVisitor.getMarkdown());
```
