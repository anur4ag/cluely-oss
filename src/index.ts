interface GreetingOptions {
  name: string;
  age?: number;
}

function greet(options: GreetingOptions): string {
  const { name, age } = options;
  if (age !== undefined) {
    return `Hello, ${name}! You are ${age} years old.`;
  }
  return `Hello, ${name}!`;
}

function main(): void {
  console.log('Welcome to your new TypeScript project! 🚀');

  const greeting1 = greet({ name: 'Developer' });
  const greeting2 = greet({ name: 'TypeScript Fan', age: 25 });

  console.log(greeting1);
  console.log(greeting2);
}

// Run the main function
main();
