---
slug: 'patterns-primer'
lang: 'en'
title: 'Let’s walk through some of the most common software design patterns'
description: 'Learn about the fundamental principles and techniques that guide the design of software systems.'
categories: 'software;patterns;design'
pubDate: '2025-10-28'
heroImage: '@/presentation/assets/patterns-primer-1.png'
---

# Software Patterns


## MODERN DESIGN PATTERNS

------
#### Fluent Interfaces
- Se centra en brindar una interfaz al usuario de una librería y/o clase solo las acciones que necesita en una interfaz sencilla de trabajar
- Entre sus beneficios está la gestión interna de recursos y solo acceder a la interfaz que se necesita de acuerdo a las opciones que ha seleccionado
- Básicamente es un builder pero con la posibilidad de que intervengan varias interfaces en proceso de creación o de uso. Adicional que aquí no se centra necesariamente en crear, sino en usar una funcionalidad

```java
Mailer.send(mailer -> mailer // Here we don't know if mailer is a new instance, or an existing one obtained from a pool
	.from("me@example.com")
	.to("you@example.com")
	.bcc("other@example.com")
	.body("Hola".getBytes())
)
```

------
### Loan Pattern
- Usando patrón de fluent interfaces con objetivo de gestión de recursos
- Se presta un recurso al cliente para que realice las tareas que necesita. Pero el control sigue estando en clase base. Lo que permite agregar pasos importantes
- Por ejemplo, abrir y cerrar recursos que de otra forma el cliente podría olvidar. Y, en todo caso, como autores de la clase, el escritor está en mejor posición para saber cuándo cerrar o abrir recursos

```java
class Resource {
	private Resource() {}

	Resource opt1() {
		// Something
		return this;		
	}

	Resource opt2() {
		// Something
		return this;			
	}

	private void close() {
		// Close resources
	}

	static use(Consumer<Resource> block) {
		Resource resource = new Resource();
		try {
			block.accept(resource);
		} finally {
			resource.close();
		}
	}	

}

////////////////

Resource.use( resource -> resource.opt1().opt2() );

```


## SOLID PRINCIPLES OF OOP PROGRAMMING

------
#### 1. SINGLE RESPONSIBILITY RESPONSIBILITY 
- Una clase debería responder solo a un actor/dominio, aka tener solo una razón para cambiar
#### 2. OPEN FOR EXTENSION, CLOSED FOR MODIFICACION
- Una clase debería estar abierta a cambiar su comportamiento (típicamente a través del uso de interfaces para funciones externas) y cerrado para su modificación (porque para cambiar su comportamiento solo hace falta cambiar lo relacionado con las funciones externas
- Para lo cual solo se debe cambiar la implementación de las interfaces con funciones externas
#### 3. LISKOV SUBSTITUTION PRINCIPLE (you can replace a parent class for a subclass)
- Una subclase debería soportar toda la funcionalidad de su clase padre. Si no, puede indicar que clase padre se debe fragmentar, entre otros
#### 4. INTERFACE SEGREGATION PRINCIPLE 
- Una clase debería usar o necesitar todos los métodos de una interfaz. Si no, indica que interfaz debería fragmentarse
#### 5. DEPENDENCY INVERSION PRINCIPLE
- Si una clase tiene dependencias externas, debería depender de abstracciones cuando las implementaciones pueden ser volatiles
- La intención es especialmente no depender de elementos volatiles. Considerando interfaces como menos volatiles que implementaciones. Pero sí se puede depender de elementos concretos, como clases de la librería estándar de un lenguaje, que se consideren relativamente estables


## CREATION

------
### Abstract Factory
- Énfasis en crear familias de objetos, ya sean simples o complejos
- Interfaz que define métodos para crear familias de objetos relacionados entre sí (ej. un botón y un campo de texto)
- Necesita fabricas específicas que implementan cada familia brindando las instancias de cada objeto dentro de esta, e interfaces para cada integrante de la familia
- En código los clientes de esas familias de objetos usan solo la interfaz para crear objetos de esa familia
- AbstractFactory puede ser también una ConcreteFactory si tiene creaciones predefinidas, a sobreescribir si otra ConcreteFactory, que extienda de AbstractFactory, quiere

- Estructura: 
	AbstractFactory(createA, createB) (interface) -> ConcreteFactory1(createA, createB) , ConcreteFactory2(createA, createB), etc..
	
	Client -> usa AbstractFactory.createA para crear objetos de interfaz A, sin conocer cuál implementación de fabrica (y por ende clase de tipo A) está usando

------
### Builder
- Énfasis en construir un objeto complejo paso por paso
- Construcción y representación interna se separa del uso de un objeto
- El objeto a tratar se convierte en una interfaz que define lo que el cliente espera, no la clase específica
- Mientras el Builder es una interfaz que define el proceso de construcción, y sus implementaciones definen la estructura interna de la construcción
- Puede retornar diferentes clases o una misma clase con diferentes representaciones internas, al ser el builder una interfaz y el objeto también
- En el proceso se puede reemplazar fácilmente el builder concrete y el objeto concreto sin problemas
- Ejemplo: un builder de texto a algo. De texto a imagen, o de texto a pdf, etc. teniendo la interfaz del objeto un método que se llame print(), el cual tenga que implementar cada builder concreto
- Steps típicos son AThingBuilder.builder() para iniciar el proceso y AThingBuilder.getThing() o AThingBuilder.build() para retornar el objeto creado

- Estructura:
	Client -> AThingBuilder(stepA, stepB) (interfaz) -> AThingConcreteBuilder(stepA, stepB) -> AConcreteThing -> AThing (interfaz) -> Client


------
### Factory Method
- Énfasis en construir un objeto a través de un método
- Se usa la interfaz del objeto y se delega al factoryMethod() (o métodos dentro de clases que sobrescriban el factoryMethod()) la creación de alguna implementación específica
- Ejemplo: dentro de una clase de un batch se instancia un objeto de tipo UploadTool usando un factoryMethod() y usando la interfaz de UploadTool en lugar de alguna clase particular

- Estructura:
	Client -> Solicita -> AThing (interfaz) -> Invocando a -> aThingFactory(): AThing -> Que brinda -> AConcreteThing -> Usado como -> AThing

------
### Prototype
- Énfasis en construir un objecto clonando un objeto base
- Puede reducir la cantidad de clases existentes en un programa, así como hacer más sencillo la creación de objetos
- Prototype puede hacer más simple y variada la cantidad de objetos que pueden existir a partir de un único molde. Cambiando sus parámetros en cada clonación para crear un objeto un poco diferente
- Incrementa flexibilidad pudiendo agregar y quitar prototipos en tiempo de ejecución
- Ejemplo: Javascript se basa en prototipos, en concreto el Number.prototype es un número inicializado en 0, por lo que Object.getPrototypeOf(1) == 0 es true. Además String.prototype está inicializado en "", y el String.prototype__proto___ (el prototipo de String) es Object.prototype, y String.prototype.__proto__.__proto__ (el prototipo de Object.prototype) es null, siendo Object.prototype el primer prototipo de la jerarquía

- Estructura:
	Client -> Solicita -> AConcreteThing -> Invocando a -> ThePrototypeThing.clone() -> Que brinda una copia de sí mismo -> AConcreteThing

------
### Singleton
- Énfasis en construir una única instancia de una clase, brindando un acceso central a esta
- Tiene un énfasis distinto a los otros patrones para crear objetos, mientras ellos se centran en cómo se crean los objetos. Este patrón es el único que se centra en cuántos se crean
- Flexibilidad en cambiar el número de instancias después, y en extender operaciones de la clase. Si se hiciera con métodos estáticos sería menos flexible cambiar el número de instancias después, así como extender su funcionalidad, ya que en Java, por ejemplo, los métodos estéticos no pueden sobreescribirse
- Ejemplo: una conexión con la base de datos puede ser un singleton, o un AbstractFactory también

- Estructura:
	Client -> Singleton.getInstance() -> Mira si hay una instancia, si la hay la retorna, si no la crea y la retorna -> singletonObject


## STRUCTURE

------
### Adapter
- Énfasis en usar conjuntamente entidades que no están explícititamente construidas para trabajar juntas
- Énfasis en cambiar la interfaz de un objeto existente
- De dos tipos, de clase y de objeto. En la de clase el adaptador mismo adapta lo que se desea usar, mientras en la de objeto el adaptador usa una instancia de la clase con la funcionalidad que se desea usar
- De clase: permite solo contar con una clase adicional que puede adaptar Y cambiar todo lo deseado
- De objeto: permite adaptar varias funcionalidades de clases distintas al tiempo y cambiar rápidamente entre cada una (o usar sus subclases), aunque sin cambiar ninguna de la funcionalidad base presente
- La cantidad de trabajo hecho por el adaptador varía en función de qué tan distintos son la interfaz objetivo y la clase adaptada
- Pueden existir adaptadores de doble vía, en la que el flujo puede ir hacía ambos lados. En este caso las dos clases a los extremos serían al tiempo clases adaptadas e interfaces objetivo
- *Ejemplo:* un adaptador que permite integrar una librería externa para encriptar contraseñas en una clase interna de gestión de usuarios

- *Estructura:*
	De clase -> Adapter(extend AdapteeClass)(Implements TargetInterface) -> Usa y cambia la funcionalidad deseada para adaptarse a la interfaz objetivo
	De objeto -> Adapter(Implements TargetInterface)(Instanciate AdapteeA, AdapteeB, ...) -> Adapter.funcionA()(use instanciate objetcs) -> Se adhiere a interfaz objetivo y la cumple usando objetos instanciados de una o más clases a adaptar


------
### BRIDGE
- Énfasis en separar jerarquías de abstracción y jerarquías de implementación
- Abstracción mantiene una referencia a instancia de un implementador
- Permite cambiar implementador en tiempo de ejecución
- Jerarquía de implementación suele implementar detalles usados en jerarquía de abstracción para realizar acciones
- *Ejemplo1:* usar una jerarquía de abstracción como api expuesta en una librería, mientras jerarquía de implementación con detalles se deja a nivel interno
- *Ejemplo2:* abstracción de estimación usa una implementación por defecto para valores pequeños, y a medida que aumenta la cantidad de elementos va cambiando la implementación usada a una más óptima de acuerdo al número de elementos
- *Ejemplo3:* un caso degenerado es cuando hay una relación 1:1 entre abstración e implementación. Como en el caso de Set, implementado por HashSet, o LinkedSet

- *Estructura:*
	AbstractionA(Implements IAbstractionA)(has ImpClassA(Interfaz), ImpClassB(Interfaz), ...) -> tiene referencias a interfaces de implementadores para realizar acciones


------
### COMPOSITE
- Énfasis en construir funcionalidad componiendo componentes en entidades combinadas
- Trata las entidades combinadas igual que las individuales
- A partir de componentes iniciales simples se pueden construir de forma sencilla sistemas complejos
- Se organiza en interfaces de componente, componentes primitivos (LEAF), y componentes compuestos (COMPOSITE)
- Trade off entre type safety al separar operaciones permitidas solo en leafs o composites, y transparencia al tener la misma interfaz tanto para leafs como para composites
- Algunos composite podrían aceptar solo otros tipos de componentes
- *Ejemplo:* componentes de react, extjs, etc.

- *Estructura:*
	Client -use-> ComponentA(ComponentB(ComponentC(...(PrimitiveComponentA)))) -- todos se adhieren a clase abstracta AbstractComponent(operation(),add(component),remove(component),getChild(int),getParent(int))


------
### DECORATOR
- Énfasis en agregar funcionalidad a objetos sin necesidad de alterar jerarquía de clases
- También conocido como wrapper
- Se puede añadir una cantidad ilimitada de decoradores sin alterar la interfaz del objeto de cara al cliente
- Una alternativa a crear subclases
- No se altera interfaz pero se agrega funcionalidad. Puede resultar en una interfaz extendida
- Transparente en que mantiene interfaz inicial del objeto. Cada llamado al objeto pasa (antes, durante, o después) por las responsabilidades añadidas por el decorador, pero manteniendo su interfaz
- Se puede añadir o quitar un decorador de forma dinámica en tiempo de ejecución (no lo considero esencial, ej: lombok no lo cumple)
- *Ejemplo1:* decorator de width en la propiedad de un componente de React
- *Ejemplo2:* decorator @Getters de lombok extiende interfaz de una clase en java añadiendo getters en tiempo de compilación, pero sin alterar la interfaz existente
- *Ejemplo3:* AbstractVisualComponent tiene clases hijas Decorator y Component. Si A es una clase hija de Decorator se puede añadir funcionalidad a una instancia específica de Component usando var c=new A(component), usándolo con misma interfaz compartida de AbstractVisualComponent

- En java un decorador también puede ser implementado como composición de funciones
- Aquí cada función tiene mismo dominio de aplicación pero cada decorador puede ser muy distinto. Por ejemplo crear un logger, extender interfaz base, etc.
```java
Color addFilters(Color color, Function<Color, Color>... filters) {
	return Stream.of(filters).reduce(Function.Identity(), Function::andThen);
}
```

- *Estructura:*
	Client -> usa DecoratorA->DecoratorB->...->ClassA como si fuera ClassA directamente, cada decorador añade funcionalidad nueva sin alterar la interfaz de ClassA


------
### FACADE
- Énfasis en proveer una interfaz unificada para hacer más fácil el uso de un conjunto de interfaces dentro de un sistema
- Reduce complejidad de uso haciendo disponible un sub-sistema al resto a través de la interfaz unificada
- Usar cuando se quiere tener una forma unificada de acceder a un sistema complejo que sea suficiente para la mayoría de casos de uso
- Se genera independencia entre subsistemas
- Trade off entre brindar personalización frente a tener simplicidad de uso en facade (ej. extremos de tener n parámetros para elegir implementación específica o brindar solo una forma de hacer las cosas)
- Comúnmente son singletons
- *Ejemplo1:* interfaz genérica que define la forma en la que se accede a queries (cada una con su interfaz hecha de argumentos, retornos, etc) en una aplicación de backend, en el caso de customer sería el QuerySystem
- *Ejemplo2:* interfaz genérica para compilar código para un sistema que compila archivos en un lenguaje X. En lugar de dejar que los clientes usen las clases existentes para compilar su código, se brinda un solo punto de entrada para usar todo el sistema

- *Estructura:*
	Client -> usa FacadeInterface -> para tener acceso a funcionalidad de InterfaceA, InterfaceB, ..., InterfaceN


------
### FLYWEIGHT
- Énfasis en generar eficiencia en uso de memoria y desempeño al compartir gran número de objetos
- Un objeto flyweight debe ser indistinguible de un objeto instanciado independiente en cada caso de uso
- En objeto flyweight se guarda SOLO estado intrínseco al objeto, mientras cada contexto se debe encargar de proveer estado extrínseco de ser necesario
- Estado extrínseco puede ser calculado o guardado por contexto que usa los objetos compartidos
- Aplicarlo cuando se cumpla: a) uso de muchos objetos, b) uso de memoria es costoso, c) mayoría de estado se puede externalizar, d) usando patrón se puede reducir en varias ordenes de magnitud la cantidad de objetos total, y e) la aplicación no depende de que cada uso de los objetos sea único en algún sentido
- Una parte de los elementos podrían ser no compartidos pero con potencial de compartirse en el futuro, por lo que sería mejor implementar parte de la lógica del patrón de diseño
- *Ejemplo:* caracteres en aplicación de edición de texto en donde estado intrínseco de objeto flyweight es una letra del alfabeto. Y estado extrínseco es el formato, la fuente, color, etc. que lo provee el contexto de cada fila en que se usa la letra

- *Estructura:*
	Client -> FlyweightFactory(getFlyweight(key)) -> retorna flyweight o crea uno si no existe ya -> AConcreteFlyweight implements Flyweight(operation(context))


------
### PROXY
- Énfasis en actuar como un objeto intermediario que controla el acceso a otro objeto
- Versión sofisticada y más versátil de tener un pointer a un objeto
- Usar si se requiere: 
	- a) crear objetos solo cuando se necesitan, no cuando se llaman o "instancian", 
	- b) tener un representante local de objetos de otros sistemas, especie de "embajador" en donde proxy se encarga de hacer encode de request y decode de results, 
	- c) controlar seguridad, privilegios (eg. leer, cambiar), y acceso a un objeto, 
	- d) pointers inteligentes que realizan operaciones adicionales cada que un objeto es llamado
- Proxy implementa una interfaz identica a la del objeto
- Se diferencia de Adapter en que un adapter cambia la interfaz del objeto, mientras un proxy controla acceso a la misma interfaz del objeto (con potencial de negarse a realizar algunas operaciones dependiendo del tipo de proxy y del cliente que hace el request)
- *Ejemplo1:* un reverse proxy como Nginx
- *Ejemplo2:* un proxy de una imagen que renderiza imagen a demanda, y no la primera vez que se instancia el proxy

- *Estructura:*
	Client -> ObjectProxy(operationA, operationB, ..., operationN) implements ObjectInterface -> quién pasa requests según estructura a -> Object(opearationA, operationB, ..., operationN) implements ObjectInterface


## BEHAVIOR

------
### CHAIN OF RESPONSABILITY
- Énfasis en crear una cadena de potenciales manejadores por los cuales pasa un request/evento. Siendo cada uno capaz de manejar la solicitud y responder
- Se encadena el request pasándolo por la cadena hasta que uno de los objetos la maneje y responda
- Cada manejador tiene la opción de manejar el request, o de pasarlo al siguiente en la cadena
- Otorga flexibilidad en cómo y qué objetos son los encargados de manejar un request
- Usar cuando no se tiene certeza de una entidad en concreto que maneje todas las request, si no por el contrario existen varias formas de hacerlo
- Se deja de tener garantía de que el request será manejado
- *Ejemplo:* cliente en donde cada solicitud pasa por diferentes middlewares, cada uno pudiendo responder de acuerdo a su función, siendo el primero para comprobar si el usuario está loggeado, luego sí tiene permisos, luego validando campos, luego si solicitud está guardada en cache, y finalmente al controlador

- *Estructura:*
	Client -> envía request -> HandleHelper(implements IHandle(handle(),forward())) -> handleA(implements IHandle) -> maneja o reenvía -> handleB(implements IHandle) -> ...


------
### COMMAND
- Énfasis en encapsular un request en un objeto para transportarlo y usarlo sin conocer su comportamiento interno
- Permite desacoplar las entidades que invocan una funcionalidad, de las entidades que definen dicha funcionalidad
- Clase Command define acción genérica de execute en la cual se puede ejecutar una solicitud, sin conocimiento inmediato de qué hace la ejecución
- Se pueden definir comandos que ejecuten varios comandos en cadena (aplicando composite pattern)
- *Ejemplo1:* clase abstracta de botón que ejecuta una acción, lo que permite tener una interfaz general para tratar con botones a pesar de no conocer su comportamiento específico
- *Ejemplo2:* servicios en customer que extienden todos de clase abstracta que define métodos asociados, incluyendo getDomaninData, validateData, doBusinessLogic que se ejecutan por la aplicación en un orden definido previamente sin que la aplicación sepa qué hace el servicio que está usando

- *Estructura:*
	AbstractCommand(execute(),unexecute()?) -> Implementado/Extendido por diferentes clases -> Usado por clientes de forma genérica


------
### INTERPRETER
- Énfasis en proveer un lenguaje simple en formato de árbol para realizar ciertas acciones a través de un interprete
- Funciona cuando hay una tarea repetida cuyas instrucciones se pueden abstraer a una sintaxis propia que puede ser interpretada para realizar las acciones deseadas
- Implementado con un abstract syntax tree, cada expresión es una colección de objetos instanciados de clases finales del árbol (o no finales, que en su mayoría serían composite de clases finales i.e. cada expresión no terminal contiene subexpresiones terminales)
- No es un método eficiente usualmente
- Más apto cuando sintaxis resultante es sencilla
- Es básicamente una aplicación de un command (interpret) distribuido en una estructura que aplica el composite pattern, pero pensándolo como un lenguaje
- *Ejemplo1:* autogenerador para convertir archivos de xml donde se definen queries de sql en servicios de java
- *Ejemplo2:* programa que usa regular expressions para buscar en texto

- *Estructura:*
	situación objetivo --- solución larga --- abstracción de solución larga en sintaxis de árbol más simple --- construir interprete ---- usar sintaxis nueva
	sintaxis --> AbstractExpression(interpret(context)) -- 1) TerminalExpression() -> a) TypeASubexpression - ..., 2) NotTerminalExpression, ....


------
### ITERATOR
- Énfasis en proveer un acceso secuencial a un agregado sin exponer su representación interna
- Se saca la responsabilidad de acceder y secuenciar el agregado del agregado mismo, poniéndolo en un iterador
- Brinda flexibilidad en tipo de secuencia en que se desea recorrer el agregado, por ejemplo se podría usar algoritmo para filtrar antes de hacer disponible la secuencia
- Agregado se le puede asignar responsabilidad de crear su propio iterador, permitiendo tener un método genérico que se puede llamar en cualquier agregado
- Puede ser valioso usar un proxy para limpiar el iterador si es necesario luego de que se termine de usar, haciendo uso del proxy como si fuera un pointer
- Se puede incluir en estructuras recursivas para iterar sobre todo el rango de valores
- *Ejemplo:* un objeto de ResultSet en java accediendo al resultado de una sentencia de SQL

- En programación declarativa se tienen iterares internos donde uno no controla el flujo interno. Por lo que el concepto de este patrón de diseño pierde su significado como patrón para pasar a ser más un Language feature de java

```java
someArray
	.stream()
	.takeWhile(name -> !name.equals("Bob") // Streams equivalent of break
	.forEach(System.out::println);
```

- *Estructura:*
	Client -> AggregateClassA(createIterator()) -> IteratorForClassA(implements AbstractIterator)(hasNext(),next())


------
### MEDIATOR
- Énfasis en encapsular la interacción entre varios objetos (también llamados colleagues)
- Permite baja dependencia directo ya que los objetos no necesitan tener referencias a los otros objetos
- Permite cambiar la interacción sin cambiar los objetos
- Centraliza control de interacciones entre objetos, simplificando la interacción añadiendo complejidad en el mediator en sí mismo
- Usar cuando: 
	1) objetos se comunican de formas complejas pero definidas, 
	2) reusar un objeto sería difícil porque sin mediator usa y se comunica con muchos otros objetos, 
	3) se debería customizar la interacción sin extender objetos
- Usualmente se implementa de una de dos formas: 
	- a) el mediator como un observer, 
	- b) los objetos con una interfaz implícita que se comunica con el mediator
- *Ejemplo:* un formulario que maneja la relación entre los distintos campos y botones de este, sin que cada elemento tenga referencia a todos los demás con los que interacciona en el formulario

- *Estructura:*
	Transversal: HandleMediatorInteface que deben seguir objetos que se comunicarán con el mediator, y MediatorInterface que deben seguir los mediators
	ConcreteMediator(implements MediatorInterface)(references ObjectA, ObjectB, ..., ObjectN)
	ObjectA(references to mediator), ObjectB(references to mediator), ..., ObjectN(references to mediator)


------
### MEMENTO
- Énfasis en capturar y externalizar el estado interno de un objeto sin violar en encapsulamiento
- Necesario cuando se requiere hacer rollback de ciertas acciones aplicadas sobre un objeto o recuperarse de errores
- Usar cuando se necesita preservar el estado (o parte de él) de un objeto y exponerlo directamente expondría detalles de implementación
- Originator crea y es el único que puede usar Memento para regresar a un estado prevío, mientras el Caretaker solo puede pasar Memento sin usar directamente
- Si guardar estado es costoso sería mejor evitar este patrón de diseño
- Cuando se tiene una secuencia de cambios predecibles se puede guardar únicamente los cambios en memento, en lugar de todo el estado
- Según el lenguaje de programación podría ser muy difícil o imposible hacer que las interfaces del Memento sean diferentes para el Originator y el Caretaker
- *Ejemplo:* deshacer un cambio en un editor de texto, tal como borrar, escribir, editar, etc.

- *Estructura:*
	Caretaker (client) -> Originator.createMemento() -> retorna Memento(getState(), setState()) -> que se puede usar SOLO por Originator para volver a un punto previo -> Caretaker (Client) -> Originator.setState(Memento m)


------
### OBSERVER
- Énfasis en crear grupos de suscriptores (observers) a eventos de un objeto en particular (subject), creando así una relación de 1 (objeto) a muchos (suscriptores)
- También conocido como publish-subscribe
- El número de suscriptores es indeterminado, brindando flexibilidad en extensión
- Un subject solo conoce que tiene una lista de observers, sin conocer su clase ni detalles de implementación, brindando flexibilidad en los tipos de observers que pueden suscribirse a un subject
- Flexibilidad en cambiar subjects y observers incluso en tiempo de ejecución
- Un observer o externo puede producir problemas en memoria o desempeño al no tener transparencia de los costos que cualquier actualización en un subject puede causar por la cascada de notificaciones y cambios
- Introduciendo un intermediario (aplicando Mediator, y si es pertinente Singleton) se puede conseguir implementar estrategias de notificación, en donde incluso se pueden considerar varios subjects al tiempo con sus respectivos observers
- Un objeto puede actuar como observer de otros objetos y subject al mismo tiempo
- *Ejemplo1:* eventos en elementos del DOM en javascript
- *Ejemplo2:* Aspectos en java, en donde los observers especifican a qué eventos concretos se están suscribiendo en el subject

- *Estructura:*
	Subject(attach(Observer), detach(Observer), notify())(ObserverList) -> cuando hay un evento que requiera publicarse -> Subject.notify() -> ObserverA, ObserverB, ..., ObserverN que actúen con base en evento recibido
	
***Los Observers también podría suscribirse a subjects específicos, o desuscribirse de ser necesario, o incluso ser un intermediario (mediador) el encargado de ligar Observers y Subjects. Pensar en project reactor en java***


------
### STATE
- Énfasis en que los objetos puedan cambiar su comportamiento cuando cambia su estado
- Usar cuando: 
	- a) el comportamiento de un objeto depende de su estado y debe poder cambiar ese comportamiento en tiempo de ejecución, y 
	- b) muchas operaciones dependen de estados bien definidos que afectan el comportamiento a lo largo del uso del objeto
- Separa lógica en distintas de un caso de uso en clases específica a cada estado, en lugar de tenerlo centralizado en clase única
- Evita incluir lógica diferente en una misma clase separada por mismo tipo de condicionales (estados)
- Lógica compartida puede mantenerse en clase base
- Las operaciones de Context y State no necesariamente serán las mismas, aunque sí estarán relacionadas de acuerdo al caso de uso
- Los clientes o los mismos estados pueden elegir el estado a implementar dependiendo del caso de uso
- *Ejemplo1:* una clase TCPConnection encargada de gestionar request dependiendo del estado de la conexión, para lo cual delega el comportamiento a un objeto de tipo TCPState implementado según tipos de estado existan. En este caso TCPConecction cambia el objeto de TCPState con el que atiende solicitudes dependiendo del estado de la conexión en la que se encuentre
- *Ejemplo2:* editor de pdfs que provee varias herramientas de selección. Cada herramienta se puede implementar como un State para el Context de "seleccionar"

- *Estructura:*
	clase State que define interfaz para manejar solicitudes y es implementada por los diferentes estados en los que puede estar el objeto base
	clase base Context(referencia a objeto State)(execute1(), execute2(), ..., executeN()) -> Context.executeX() delega funcionamiento a State.executeX() y si estado cambia State se instancia a implementación pertinente


------
### STRATEGY
- Énfasis en definir una serie de caminos (expresados en algoritmos) encapsulados que pueden ser usados intercambiablemente por los clientes
- Diferentes algoritmos serán apropiados en diferentes situaciones, por lo que se necesita que su uso sea intercambiable de cara a los clientes
- Permite agregar nuevos algoritmos de forma flexible
- Usar cuando: 
	- a) muchas clases necesarias difieren solo en su comportamiento, no en su interfaz, 
	- b) se desea esconder lógica compleja, 
	- c) una clase define muchos comportamientos expresados en condicionales que pueden ser consolidados en clases de estrategias
- Se diferencia de State en que estos dependen del estado interno del Contexto, mientras la elección de una estrategia sobre otra depende más genericamente de condiciones (que pueden ser estados, pero también configuraciones, tipo de argumentos, etc.). Siendo los State más directamente ligados al Context, y una estrategia ligada especialmente a la tarea (desencriptar, copiar información, guardar datos, etc.) para la que se creo, no a un contexto
- Los clientes son los que eligen la estrategia a implementar
- *Ejemplo1:* programa de edición de texto que debe usar un algoritmo de separación de líneas, pero el algoritmo apropiado depende del tipo de texto (texto simple, iconos, imágenes, etc.). Por lo que cada algoritmo se encapsula en una clase (una estrategia) que el programa elige y usa a necesidad cuando
- *Ejemplo2:* programa para valoras instrumentos financieros con estrategias distintas para cada instrumento (swaps, options, futures, forwards, etc.)
- *Ejemplo3:* estrategias de validación de campos en aplicación web, con la posibilidad de tener campos sin validación, siendo la estrategia opcional

- Una estrategia es básicamente una función. En java se puede implementar con lambdas
```java
int totalValue(List<Integer> values, Predicate<Integer> selector) { 
// selector is the strategy in this case
	return values.stream().filter(selector).mapToInt(e -> e).sum();
}

///////////////////////////////////////////////

var myVals = List.of(10, 11, 12, 13);

System.out.println(totalValue(myVals, e -> true); // Al numbers
System.out.println(totalValue(myVals, e -> e % 2 == 0); // Only even numbers
System.out.println(totalValue(myVals, e -> e % 2 != 0); // Only odd numbers
```

- *Estructura:*
	Client -> solicita un algoritmo específico dependiendo de las condiciones definidas -> StrategyInterface implementada por Strategy1, Strategy2, ..., StrategyN usados intercambiablemente


------
### TEMPLATE METHOD
- Énfasis en definir el esqueleto de un algoritmo permitiendo a clases extendidas redefinir algunos pasos sin cambiar la estructura del algoritmo
- Brinda interfaz específica con pasos necesarios para ejecutar una acción, así como la posibilidad de tener un comportamiento por defecto dejando los detalles a otras clases hija
- Útil cuando pasos de un algoritmo están bien definidos pero detalles pueden variar
- Brinda estructura a algoritmo genérico. Mientras en estrategia el enfoque se encuentra en brindar una solución (cada estrategia) a una tarea específica. Aquí la tarea es genérica y las implementaciones son específicas (una solución para cada tarea específica con misma estructura genérica)
- Un template method no implementa ninguna operación primitiva, pero puede usar operaciones internas o externas que sí tengan implementación (ej: File.read() para leer un archivo), o incluso llamar métodos "hook" que tienen un comportamiento por defecto (o no hacen nada) pero pueden ser sobreescritos para subclases si lo desean (ej: aboutToOpenDoc())
- Un template method delega parque de un algoritmo a subclases, mientras una clase abstracta (o interfaz) de Strategy delega todo el algoritmo a subclases
- Filosofía se puede resumir en "Don't call us, we call you" ya que es el template method el que centraliza comportamiento compartido y llama al que no es compartido e implementado por subclases
- *Ejemplo1:* servicios en aplicación de customers, en donde se define templateMethod de execute() donde se tiene una serie de pasos para ejecutar un servicio que pueden sobreecribirse por servicios concretos: getDomainData(Request), validateData(), doBusinessLogic(Result)
- *Ejemplo2:* template method de leerDocument() que usar operaciones para abrir, visualizar, y cerrar documentos, cualquiera sea el documento que se abra o cierre

- *Estructura:*
	AbstractTemplate(templateMethod(), primitiveOperationA, ..., primitiveOperationN) en donde templateMethod llama con una estructura específica las operaciones primitiveOperationX (y otras operaciones internas o externas si es necesario, las cuales sí tendrían implementación)
	ConcreteClass(extends AbstractTemplate)(@Override primitiveOperationA, ..., @Override primitiveOperationN) y clases específicas sobreescriben operaciones primitivas


------
### VISITOR
- Énfasis en separar acciones aplicadas sobre una colección de objetos, dando flexibilidad en agregar nuevas acciones sin alterar las clases pertinentes
- Centraliza operaciones (y su lógica) que podría repartirse en muchas clases que ahora serán "visitadas" por visitor
- Se definen dos jerarquías de clases: 1) una para los elementos sobre los que se opera, y 2) para los elementos que pueden operar (visitors) sobre los primeros
- Agrupa funcionalidad relacionada a expensas de descentralizar funcionalidad total en clases distintas
- Usar cuando los elementos que se visitan son estables y se quiere tener flexibilidad o variedad en su implementación (variación de implementaciones de visitors), mientras si lo que varía mucho es a qué tipo de elementos (variación en interfaz de visitors) se necesita aplicar las operaciones entonces es mejor evitar el patrón si potencialmente por cada elemento nuevo o eliminado de la lista se necesitaría cambiar la interfaz de toda la jerarquía de los visitors
- Cada visitor se encarga de visitar la colección de elementos para una operación en concreto
- Cada operación para visitar una clase distinta recibe como argumento al objeto visitado, por lo que este sería uno de los casos de uso para genéricos permitiendo a cada implementación de visitor definir una sola vez la operación de visit para toda la colección de elementos, o las subjerarquías en las que se puede dividir (ej: en colección de productos definir la operación de visita para electrodomésticos, hogar, etc.)
- *Ejemplo1:* página web en donde los visitors aplican estilos visuales al texto, se tienen definidos varios visitors para diversos estilos y cada elemento puede llamar la operación de cualquier visitor que implementa su operación de estilizar
- *Ejemplo2:* un pricingVisitor (que extiende de DevicesVisitor) para calcular precio total (necesita mantener state) sobre una estructura abstracta de medidores, mientras un inventoryVisitor calcula el inventario total
- *Ejemplo3:* una clase NewComplaint pasa por un proceso en el que se llama el método accept sobre un VisitorFactory que llama el método accept para cada Visitor obtenido a través del factory. En Indra el NewComplaint y el VisitorFactory estarían definidos en producto y el Visitor estaría definido en proyecto. Donde podría implementar cualquier cosa, por ejemplo generar un evento de auditoría, de notificación, etc.

- *Estructura:*
	AbstractVisitor(visitConcreteElementA(ElementA), ..., visitConcreteElementN(ElementN)) que siguen todos los visitors de esta jerarquía
	AbstractElement(accept(AbstractVisitor)) implementado por cada elemento de la colección: ElementA(implements AbstractElement)(accept(AbstractVisitor), visitConcreteElementA(this)) que puede usar cualquier visitor para realizar la funcionalidad específica

