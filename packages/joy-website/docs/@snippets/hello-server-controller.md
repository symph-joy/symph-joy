```tsx
// src/server/controller/hello.controller.ts

@Controller()
export class HelloController {
  @Get("/hello")
  hello(): string {
    return "Hello World!";
  }
}
```
