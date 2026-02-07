---
slug: 'using-bruno'
lang: 'en'
title: 'If you want to test your APIs, just use Bruno! Stop using Postman'
description: 'Bruno gives you a modern HTTP client experience. Add your collections to your version control system!'
categories: ['http-clients','testing','software','open-source']
pubDate: '2024-12-29'
updatedDate: '2025-10-22'
---

In the world of software development tools, [Bruno](https://www.usebruno.com/) is a revolutionary alternative to Postman and other traditional options.
To enhance your development and collaboration experience when sharing collections, here are 6 reasons to consider switching to this open-source HTTP client:

## 1. Git-Friendly: Built-in version control
Unlike Postman, which relies on proprietary systems for collaborating on API collections, Bruno lets you store your collections directly in your code repository.
This makes it easy to version, review, and share API usage examples in a special yet simple and readable format.

## 2. Bru Markup Language: Goodbye complicated JSONs
Collections in Bruno aren’t stored as massive, hard-to-read JSON files.
Instead, it uses its own lightweight, plain-text markup language that’s easy to manage and understand.

Example of a Bruno auto-generated file:
```bash
meta {
    name: Request Name
    type: http
    seq: 1
}

post {
    url: http://localhost:8080/api/v1/endpoint
    body: json
    auth: none
}

headers {
    Content-Type: application/json
}

body:json {
    "items": [
        "item1"
    ],
    "item": 1.0
}
```

## 3. 100% Open Source
Bruno stands for freedom and transparency, opposing closed and monopolized systems.
This ensures you can customize and adapt the tool to your needs without worrying about restrictions.

Use your HTTP client without needing to create accounts or log in!

## 4. No cloud synchronization
Your API collections won’t be exposed to cloud services.
This boosts security and prevents potential data leaks.

## 5. Perfect for modern teams 
Has it ever happened that the person in charge of API collections left the company and now no one knows how the system works?
With Bruno, all relevant information lives inside the code—available to any developer who clones the repository.

## 6. Environment variables and secrets
You can define environments with your collection variables and share them with teammates through version control.

Not only that—you can also define secrets, which are not stored in the code to prevent security leaks.
However, they are listed so it’s clear which secrets you need to start using your collections.

Example of an environment file in Bruno:
```bash
vars {
    host: http://localhost:5005
}
vars:secret [
    jwtToken
]
```

### Conclusion  
Bruno redefines what it means to be a modern HTTP client. It’s the perfect solution for teams that value efficiency, repository-based collaboration, and simplicity.
Try Bruno today and experience the difference in your workflow.
