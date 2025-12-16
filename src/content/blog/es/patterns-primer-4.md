---
slug: 'patterns-primer-4'
lang: 'es'
title: "Patrones estructurales — componer clases y objetos - Parte 4 de 5"
description: 'Cuarta entrega: Adapter, Bridge, Composite, Decorator, Facade, Flyweight y Proxy — cuándo aplicarlos, sus trade‑offs y ejemplos en Java 25.'
categories: ['software','patterns','design']
pubDate: '2025-12-06'
heroImage: '@/presentation/assets/patterns-primer-1.png'
---

Esta cuarta entrega explora los patrones estructurales: maneras de organizar y conectar clases y objetos para construir sistemas flexibles y reutilizables. Verás cómo adaptar interfaces, separar abstracción de implementación, componer jerárquicamente, extender comportamiento sin herencia y optimizar memoria, con ejemplos claros en Java 25.

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

```javascript
// Composite en React: Componentes de menú anidados

// Componente base
export function Menu({ children }) {
  return <ul>{children}</ul>;
}

// "Hoja": ítem de menú simple
export function MenuItem({ label }) {
  return <li>{label}</li>;
}

// "Composite": ítem de menú con hijos (submenú)
export function SubMenu({ label, children }) {
  return (
    <li>
      <span>{label}</span>
      <ul>{children}</ul>
    </li>
  );
}

// Ejemplo de uso:
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

// Uso con decoradores apilados
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

El patrón **Facade** proporciona una interfaz unificada y simplificada para un conjunto de interfaces en un subsistema. Reduce la complejidad del sistema al ocultar sus componentes internos detrás de una fachada que expone solo las operaciones más comunes.

Este patrón es útil cuando existe un sistema complejo con múltiples clases interdependientes y se desea proporcionar una forma simple de usarlo para los casos de uso más frecuentes. 

Por ejemplo, se desea proveer una fachada de uso de una base de datos relacional, pero se desea ocultar la complejidad del cambio de implementaciones cuando se trabaja con OracleDB vs Autora RDS. Así que se brinda solo una interfaz e internamente se hace los cambios correspondientes dependiendo de qué base de datos se este usando. 

La fachada no impide el acceso directo a los componentes del subsistema cuando se necesita funcionalidad avanzada, pero ofrece un punto de entrada conveniente para la mayoría de situaciones.

**Ejemplo: Facade para sistema de e-commerce**

```php
// Ejemplo de uso de Facade en Laravel

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;

Route::get('/facade-ejemplo', function () {
    // Acceder a una base de datos (puede ser posgresql, mysql, etc.) usando la fachada DB
    $users = DB::table('users')->where('active', true)->get();

    // Guardar datos temporalmente con la fachada Cache
    Cache::put('active_users', $users, 60);

    // Enviar un correo usando la fachada Mail
    Mail::raw('Bienvenido!', function ($message) {
        $message->to('correo@ejemplo.com')
                ->subject('Saludos desde Laravel');
    });

    return 'Operaciones realizadas mediante facades.';
});

/*
Las Facades en Laravel permiten acceder a funcionalidades complejas (bases de datos, cache, email, etc.)
a través de una interfaz global y sencilla, usando solo una clase estática como punto de acceso.
Esto simplifica el código y elimina la necesidad de instanciar manualmente los servicios o dependencias.
De fondo cada una puede usar diferentes servicios (ej: redis, valkey, etc.)
*/

```

---

### Flyweight

El patrón **Flyweight** optimiza el uso de memoria compartiendo eficientemente grandes cantidades de objetos similares. Separa el estado de un objeto en estado intrínseco (compartido, inmutable) y estado extrínseco (único por contexto, proporcionado por el cliente).

Este patrón es aplicable cuando se utilizan muchos objetos cuyo almacenamiento es costoso, la mayoría del estado puede externalizarse, y el uso del patrón reduce significativamente la cantidad de objetos. Un objeto flyweight debe ser indistinguible de uno creado independientemente para cada uso.

**Ejemplo: Editor de texto con caracteres compartidos**

```java
// Ejemplo: pool de String (flyweight implícito en Java)
public class PoolStringFlyweightDemo {
    public static void main(String[] args) {
        // Literales: ambos apuntan al mismo objeto en el pool
        String a = "hola";
        String b = "hola";
        System.out.println(a == b); // true

        // new String: crea un nuevo objeto SÓLO si no se usa intern()
        String c = new String("hola");
        System.out.println(a == c); // false

        // intern(): obliga a usar el objeto único del pool (flyweight)
        String d = c.intern();
        System.out.println(a == d); // true

        // Siempre que un string sea internado, se comparte la instancia en memoria
    }
}
/*
En Java, los strings literales y los internados se almacenan en un pool.
Esto implementa el patrón flyweight: si dos partes del programa usan el mismo literal o intern(), 
obtienen la misma referencia inmutable y compartida — ahorrando memoria.
Nota: como el resultado de == cambia dependiendo de cómo se creó el String
sigue siendo mala prácitca en Java comparar dos Strings con ==. Siempre usar método equals
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
    // Implementa lógica para cargar imagen desde el disco
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

// Uso combinado de proxies (decorador de proxies)
final ImageLoader loader =
        new CachingImageProxy(
            new DiskImageLoader(),
            100  // max cache size
        );

// El cliente usa la interfaz sin saber de los proxies
final Image img1 = loader.load("/images/photo.png");  // Carga del disco
final Image img2 = loader.load("/images/photo.png");  // Desde caché
```
