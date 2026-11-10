---
title: "Diagramming with Mermaid"
date: 2026-03-18
draft: false
featured: true
tags: ["mermaid", "diagram", "markdown"]
summary: "Use Mermaid in Markdown to document workflows and class relationships. This note includes a flowchart and a class diagram."
---

Mermaid is useful for creating diagrams directly in Markdown. See the [Mermaid flowchart documentation](https://mermaid.js.org/syntax/flowchart.html).

## Flowchart

```mermaid
flowchart TD
Start --> Stop
```

## Class diagram

```mermaid
classDiagram
    note "From Duck till Zebra"
    Animal <|-- Duck
    note for Duck "can fly<br>can swim<br>can dive<br>can help in debugging"
    Animal <|-- Fish
    Animal <|-- Zebra
    Animal : +int age
    Animal : +String gender
    Animal: +isMammal()
    Animal: +mate()
    class Duck{
        +String beakColor
        +swim()
        +quack()
    }
    class Fish{
        -int sizeInFeet
        -canEat()
    }
    class Zebra{
        +bool is_wild
        +run()
    }
```





