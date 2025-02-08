# Code Commenting Guidelines

## General Requirements

- **Line Comments:**
  Add a comment to each line of code explaining what the code does and its purpose. Ensure the comments are concise but informative.

- **Section Comments:**
  At the start of each section of code (e.g., methods, functions, or logical blocks), include a brief one- or two-line description of the purpose or objective of that section. This should provide a clear context for the following code.

## File-Level Commenting

- **Top-of-File Comment Block:**
  At the beginning of the file, include a comment block (in XML format, if supported by the file type, such as TypeScript). This block should:
  1. Specify the name of the file (e.g., `ai-code-context`).
  2. Provide an explanation of what the file does.
  3. Describe the purpose of the file and how it fits into the broader codebase.
  4. Indicate where the file is used in the application or system.

## Example XML Comment Block for a TypeScript File

```xml
<!-- AI Code Context -->
<!--
  File Name: ai-code-context.ts
  Description: This file contains the logic for [insert purpose, e.g., handling user authentication].
  Purpose: Implements methods to validate user credentials and manage user sessions.
  Usage: Used by the authentication service in the main backend application.
-->
```

## Example Function-Level Comment

```typescript
/**
 * Function: validateUser
 * Purpose: Validates the provided user credentials against the database.
 */
function validateUser(username: string, password: string): boolean {
    // Check if username exists in the database
    const user = database.findUserByUsername(username);
    
    // Return false if user is not found
    if (!user) return false;

    // Validate the provided password against the stored password
    return user.password === hash(password);
}
```

## Example Line Comments

```typescript
// Define the user's role in the system
const userRole = "admin";

// Fetch all accessible pages for the defined role
const accessiblePages = getPagesForRole(userRole);

// Log the accessible pages to the console for debugging purposes
console.log(accessiblePages);
```

By following these structured guidelines, you can maintain clear and consistent documentation within your codebase.
