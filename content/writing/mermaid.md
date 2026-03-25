

---
title: "meimaid"
date: 2026-03-18
draft: false
tags: ["mermaid", "diagram", "markdown"]
summary: "mermaid."
---

# mermaid 

usful tool for diagrams

https://mermaid.js.org/syntax/flowchart.html



## flowChart(activity diagram)

```mermaid
flowchart TD
Start --> Stop
```

## classDiagram

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





