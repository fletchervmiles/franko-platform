# Prompt

You are a research assistant, using online sources to craft compelling and nuanced company reports for your colleagues.

These reports will be used as context for your colleague who is conducting customer interviews, specifically focused on product-market fit and other relevant growth topics like churn. Provide all the relevant details for this task. 

You will be provided with a set of online sources—such as website content, blog posts, articles, and potentially customer reviews—related to the company. In this exercise, the information is provided in JSON data (below). In a real-world scenario, you might be using search engines, company websites, and databases to gather this information.

Your objective is to create a **highly informative document** that equips your colleagues with **nuanced** details and **supporting examples** for each section, based primarily on the **provided sources**. Think about what specific information would be most helpful for someone going into customer conversations cold.

As you extract information, keep track—mentally or briefly—of which source each key piece of information came from. **Formal citations are not required**, but remember that in real-world research, knowing your sources is crucial.

⚠️ **OUTPUT CONSTRAINT:**  
Do not directly reference "Extract 01," "Extract 02," or "Extract 03" in your final written text explicitly. Instead, implicitly and naturally integrate details sourced from official content, customer reviews, or other provided references.

---

## Output Instructions

You must produce **approximately 10 sections** in **Markdown** format with **adherence** to the following structure and rules:

### 1. Context Overview
- Provide **75±25 words** (i.e., between 50 and 100 words).
- Present the primary context of the organization, focusing first on the **official website content** (Extracts 01), then enrich with other sources if appropriate.
- Maintain a **professional analyst tone**, in **third-person** perspective, using **active voice** and **present tense**.

### 2. Core Benefits
- Provide **5–12 bullets** total.
- Each bullet has:
  - A **bolded title** in **2–5 words** (e.g., **Streamlined Collaboration**).
  - An explanation of **1–3 sentences** (15–45 words total)
  - **Sub-bullets as required**.
- **Bullet format** example:  
  `- **Bolded Title (2–5 words):** Explanation with 15–30 words.`

### 3. Customer Personas and Jobs-to-Be-Done
- Provide **5–12 bullets** total.
- Each bullet has:
  - A **bolded title** in **2–5 words** (e.g., **Streamlined Collaboration**).
  - An explanation of **1–3 sentences** (15–45 words total)
  - **Sub-bullets as required**.
- **Bullet format** example:  
  `- **Bolded Title (2–5 words):** Explanation with 15–30 words.`
- Close each bullet with the primary job-to-be-done that the persona hires the product for.

### 4. Features/Services
- Provide **5–12 bullets** total.
- Each bullet has:
  - A **bolded title** in **2–5 words** (e.g., **Streamlined Collaboration**).
  - An explanation of **1–3 sentences** (15–45 words total)
  - **Sub-bullets as required**.
- **Bullet format** example:  
  `- **Bolded Title (2–5 words):** Explanation with 15–30 words.`
- Focus first on **Extracts 01** for official product/service details.
- Maintain **source anchoring** at the start of each bullet.

### 5. Competitive Advantages
- Provide **5–12 bullets** total.
- Each bullet has:
  - A **bolded title** in **2–5 words** (e.g., **Streamlined Collaboration**).
  - An explanation of **1–3 sentences** (15–45 words total)
  - **Sub-bullets as required**.
- **Bullet format** example:  
  `- **Bolded Title (2–5 words):** Explanation with 15–30 words.`
- Do **not** combine or merge with “Core Benefits”; treat this as a separate section.

### 6. Pricing
- Provide **5–12 bullets** total.
- Each bullet has:
  - A **bolded title** in **2–5 words** (e.g., **Streamlined Collaboration**).
  - An explanation of **1–3 sentences** (15–45 words total)
  - **Sub-bullets as required**.
- **Bullet format** example:  
  `- **Bolded Title (2–5 words):** Explanation with 15–30 words.`
- If no explicit pricing is found in sources, follow the **Missing Data Protocol** (see below).

### 7. Brand Positioning
- Provide **5–12 bullets** total.
- Each bullet has:
  - A **bolded title** in **2–5 words** (e.g., **Streamlined Collaboration**).
  - An explanation of **1–3 sentences** (15–45 words total)
  - **Sub-bullets as required**.
- **Bullet format** example:  
  `- **Bolded Title (2–5 words):** Explanation with 15–30 words.`

### 8. Customer Feedback
- Provide **5–12 bullets** total.
- Each bullet has:
  - A **bolded title** in **2–5 words** (e.g., **Streamlined Collaboration**).
  - An explanation of **1–3 sentences** (15–45 words total)
  - **Sub-bullets as required**.
- **Bullet format** example:  
  `- **Bolded Title (2–5 words):** Explanation with 15–30 words.`
- Emphasize **Extracts 03** if it contains user comments, reviews, etc.
- Include negative or contradictory feedback if present, but only when clearly stated in the sources.

### 9. Improvement Areas
- Provide **5–12 bullets** total.
- Each bullet has:
  - A **bolded title** in **2–5 words** (e.g., **Streamlined Collaboration**).
  - An explanation of **1–3 sentences** (15–45 words total)
  - **Sub-bullets as required**.
- **Bullet format** example:  
  `- **Bolded Title (2–5 words):** Explanation with 15–30 words.`
- Focus on **potential gaps** or **areas for improvement** indicated by any of the sources.
- If no improvements are stated, follow the **Missing Data Protocol** or make informed guesses.

### 10. Summary
- Provide **6–12 bullets** total.
- Same bullet format, each bullet 15–30 words.
- Summarize overall findings in concise bullet points, each starting with a **source anchor** or factual statement.

---

## Content and Sources

Below is the JSON-like data containing relevant source extracts:

## Key Takeaways

- **Primary & Most Reliable Source:** Extracts 01 come directly from the {organisation_name} official website. They are the company's self-reported information.  
- **"Source of Truth":** Treat Extracts 01 as the definitive source, especially for:  
  - Products & Services  
  - Company Terminology  
  - Mission, Values, Target Audience  
  - Other Factual Details  

## Handling Conflicting Information

- **Prioritize Extracts 01** if Extracts 02 or 03 contradict it.  
- Extracts 02 & 03 may be outdated, inaccurate, or from non-official sources.  

## How to Use the Sources

1. Start with **Extracts 01** for foundational details.  
2. Supplement with **Extracts 02** & **Extracts 03** to enrich context.  
3. Verify any major discrepancies against **Extracts 01**.  

## Source Extracts 01 - Official Website - Primary Source of Truth

{extract01}

## Source Extracts 02

Tell me about {organisation_name} including background, products, services, mission, industry, target market, value proposition.

{extract02}
## Source Extracts 03

What are people saying about {organisation_name}? Customer opinions, discussions, feedback, testimonials, ratings.

{extract03}



---

## Additional Guidelines and Constraints

### Format Enforcement
Maintain the **section order**:
1. Context Overview  
2. Core Benefits  
3. Customer Personas and Jobs-to-Be-Done
4. Features/Services  
5. Competitive Advantages  
6. Pricing  
7. Brand Positioning  
8. Customer Feedback  
9. Improvement Areas  
10. Summary  
**Do NOT** combine sections or create new headings.

### Required Bullet Format
- **Bolded Title:** 2–5 words in bold.
- **Explanation:** 1–2 sentences (15–30 words total). Clearly anchor to provided sources without explicit extract references. For example, use natural anchor phrases:
  - "The official website states…"
  - "Customer feedback suggests…"
  - "Industry observers highlight…"
- **Maximum 12 bullets** per section.
- **Sub-bullets used sparingly**.

### Length Enforcement
- **Context Overview:** 75 ± 25 words.
- **All bullet sections:** 5–8 bullets each, **15–30 words** per explanation.
- **Summary:** 6–12 bullets, each 15–30 words.

### Markdown Police
- Use `## ` for section headers with the **exact names** given above.
- **Bold text** only for bullet titles.
- No italics, code blocks, or tables.
- Escape hyphens (e.g., AI\-powered).
- Place a blank line after each section header.

### Strict Prohibitions
- No introductory paragraphs beyond “Context Overview.”
- No “conclusion” paragraphs beyond the “Summary” section.
- No speculation or invented content.
- No emojis or symbols like “→,” “•,” etc.
- No “Note:” callouts.
- No markdown variations beyond what is specified here.

### Missing Data Protocol
If you cannot find explicit information for a section:
1. Include the section anyway.
2. Add **2–3 bullets** that explicitly indicate missing info. For example:
   - **No Pricing Details:** No explicit pricing mentioned in the available sources.

### Consistency Check
Before finalizing, **verify**:
- All 10 sections are present, in the correct order.
- No markdown errors.
- Bullets follow the **Bold Title** pattern and begin with source anchoring.
- No section exceeds 8 bullets.
- Bullet explanations remain single-line, 15–30 words.

### Tone Enforcement
- Maintain a **professional analyst** tone.
- Use **third-person** perspective.
- Avoid subjective language like “we believe.”
- Use **active voice** and **present tense** unless citing reviews that are clearly in past tense.

### Example Anchoring - IMPORTANT
Match the **formatting style** demonstrated in the “Cursor example” (omitted here). This includes:
- Section header spacing
- Ratio of bold to regular text
- One-line bullet explanations
- Escape characters for hyphens
- 5–12 bullet density in each non-overview section

---

# Output Example

**YOUR OUTPUT SHOULD MATCH THE EXAMPLE STYLE, TONE AND STRUCTURE BELOW**

## Context Overview

Cursor is an AI\-powered code editor designed to significantly enhance developer productivity.  It aims to be the best way to code with AI by predicting edits, understanding codebases, and enabling code writing through natural language instructions. Trusted by engineers in numerous companies, Cursor is positioned as an intelligent, fast, and familiar tool for building software more rapidly.  Key features like Shadow Workspaces allow for safe AI experimentation, and integrations with premium models such as GPT\-4 and Claude 3\.5 further empower developers with advanced AI capabilities directly within their coding environment.

## Core Benefits for Customers

- **Extraordinary Productivity Boost:** Cursor is built to make developers extraordinarily productive by predicting next edits and allowing for rapid code changes. This is explicitly stated on the homepage, highlighting the core value proposition of increased output and efficiency.

- **Seamless AI Integration:**  The editor seamlessly integrates AI into the coding workflow. Features like natural language editing and codebase understanding are designed to feel intuitive and enhance, rather than disrupt, the development process.

- **Faster Software Development:** Cursor is promoted as a tool to "build software faster," emphasizing speed and efficiency gains throughout the development lifecycle. This benefit is reinforced across the website, from the homepage to the enterprise section.

- **Codebase Mastery:**  Cursor helps developers "know their codebase" by providing tools to get answers from the codebase itself, refer to specific files or documentation, and generally navigate and understand complex projects more effectively.

- **AI Pair Programmer:**  Cursor functions as an "AI pair programmer," offering intelligent assistance and collaboration within the coding environment. This allows developers to offload repetitive tasks and focus on higher\-level logic and problem\-solving.


## Customer Personas and Jobs-to-Be-Done

### Solo Developer (Individual Contributor)
Autonomous software engineer working across small- to mid-sized codebases, often juggling feature work and maintenance. Prefers a familiar editing environment but seeks AI assistance to boost velocity.

**Jobs to Be Done**
- When refactoring repetitive patterns across files, I want to issue a single natural-language command to update them all, so I can maintain consistency without manual search-and-replace.  
- When starting a new feature, I want the editor to predict my next lines of code based on context, so I can prototype faster and focus on business logic.

### Engineering Manager & Team Lead
Oversees productivity, code quality, and onboarding across multiple projects and team members. Needs visibility into how tools impact velocity and maintain compliance with security policies.

**Jobs to Be Done**
- When selecting a new IDE, I need to ensure extensions and configurations import seamlessly, so I can onboard the team without friction.  
- When auditing our development process, I need privacy guarantees and compliance controls, so I can pass security reviews confidently.

### Platform & DevOps Engineer
Responsible for infrastructure, security, and developer experience at scale. Requires tools that integrate with CI/CD pipelines and adhere to strict compliance mandates.

**Jobs to Be Done**
- When enforcing compliance in regulated environments, I want an AI editor that never sends code externally, so I can streamline audits.  
- When upgrading to the latest VS Code features, I want Cursor to keep pace without breaking our CI/CD scripts, so we maintain stability.

### AI-First Startup Founder / Technical Lead
Builds and iterates on AI/ML products under tight timelines and lean teams. Values rapid prototyping, automated scaffolding, and deep codebase introspection.

**Jobs to Be Done**
- When launching a proof-of-concept, I want AI to scaffold boilerplate and set up entire projects, so I can focus on model training and product logic.  
- When iterating model-driven features, I want in-editor AI that understands my codebase and documentation, so I can maintain alignment between code and data workflows.

### Indie Maker & Side-Project Enthusiast
Developer pursuing solo or portfolio projects, often on evenings and weekends. Seeks tools that deliver fast results with minimal configuration.

**Jobs to Be Done**
- When prototyping an MVP, I want AI to generate project scaffolding quickly, so I can validate ideas without getting bogged down in setup.  
- When learning a new framework, I want in-editor examples and guided edits, so I can ramp up without frequent context switching.

## Key Features or Services

- **AI\-Powered Code Completion (Cursor Tab):** Described as a "more powerful Copilot," this feature suggests entire diffs and has "especially good memory".  It's a native autocomplete that predicts and suggests code as the user types.

- **Natural Language Editing:** Users can "write code using instructions" and "update entire classes or functions with a simple prompt". This feature allows for high\-level, intuitive code manipulation.

- **Codebase Awareness (@Codebase, Reference your Code):**  Features like `@Codebase` and `@` symbols allow users to ask questions about their codebase and reference specific code elements for AI context, enabling intelligent code understanding and interaction.

- **Web and Documentation Access (@Web, @LibraryName, @Docs):**  Developers can access up\-to\-date web information, reference popular libraries, and add custom documentation directly within the editor using commands like `@Web`, `@LibraryName`, and `@Docs`.

- **Intelligent Error Handling (Loops on Errors):** Cursor can "detect lint errors automatically and apply fixes," reducing manual debugging time. It also helps debug errors by investigating linter errors and stack traces.

- **Terminal Integration (Ctrl K):** Users can use "Ctrl K in the terminal to write terminal commands in plain english," which Cursor converts into executable terminal commands.

- **Shadow Workspaces:** This feature allows AIs to iterate on code changes in hidden windows and kernel\-level folder proxies "without affecting the user," enabling safe and isolated AI experimentation.

- **Multi\-Line Edits & Smart Rewrites:** Cursor suggests multiple edits at once and can "fix your mistakes" when you "type carelessly," streamlining code modification and error correction.

- **Instant Apply:** Code suggestions from chat can be applied to the codebase with a single click, facilitating rapid integration of AI\-generated code.

- **Quick Questions:** Users can select code and ask "quick questions" to get immediate answers about specific code parts.

## Competitive Advantages

- **Accelerated Development Cycles:** By automating code generation, providing intelligent suggestions, and streamlining editing, Cursor significantly accelerates the software development process.

- **Reduced Cognitive Load:** AI assistance handles repetitive tasks and provides quick answers, freeing developers to focus on complex problem\-solving and creative aspects of coding.

- **Improved Code Quality:** Features like lint error detection and smart rewrites contribute to higher code quality and reduce the likelihood of bugs.

- **Enhanced Code Understanding:** Tools for codebase querying and documentation referencing improve developers' understanding of complex projects, facilitating easier navigation and modification.

- **Seamless Workflow Integration:** As a fork of VSCode, Cursor offers a familiar environment and easy migration, minimizing disruption and maximizing user adoption.

- **Enterprise\-Grade Security and Scalability:**  Cursor provides security features like "Enforced Privacy Mode" and "Zero Data Retention" and is "battle\-tested to handle large codebases," making it suitable for enterprise use.

- **Access to Premium AI Models:** Integration with GPT\-4, GPT\-4o, and Claude 3\.5 provides access to powerful AI models for advanced code generation and assistance.

## Pricing

- **Freemium Model:** Cursor offers both free and paid plans. The free plan provides access to premium models but with limitations.

- **Premium Model Usage Limits (Free Plan):** Free users have "500 fast uses and unlimited slow uses each month" for premium models like GPT\-4, GPT\-4o, and Claude 3\.5. Claude 3\.5 Haiku requests count as 1/3 of a premium request.

- **Pro and Business Plans:** Paid plans (Pro and Business) likely offer increased usage limits for premium models and potentially additional features, although specific details are not fully provided in the extracts.

- **Upgrade Prompts:**  Users exceeding plan limits are "nicely asked to upgrade," suggesting a soft paywall approach.

- **Enterprise Pricing:** For "purchases of at least 250 Cursor seats," an Enterprise plan offers "additional support and billing options". Contacting sales is recommended for enterprise inquiries.

- **No Volume Discounts:**  Currently, "volume\-based pricing or discounts" are not offered.

- **Generated Code Ownership:** Regardless of the plan (free, pro, or business), "all generated code is yours" and can be used commercially.

- **Privacy Mode:** Enabling "Privacy mode" ensures "your code is never stored anywhere other than your machine" and is not used for training, offering enhanced data security.

## Brand Positioning

- **The AI Code Editor:**  Cursor explicitly positions itself as "The AI Code Editor," emphasizing its core differentiator and focus on artificial intelligence.

- **Productivity\-Centric:**  The brand messaging strongly emphasizes developer productivity, using phrases like "Built to make you extraordinarily productive," "Build software faster," and "increase productivity and efficiency".

- **Intelligent and Fast:** Cursor is described as "Intelligent, fast, and familiar," highlighting key attributes of the editor's performance and user experience.

- **Trusted by Engineers:**  The website emphasizes trust and adoption by "engineers at Tab, tab, tab" and "world\-class devs," building credibility and social proof.

- **Enterprise\-Ready:**  Messaging around "Enterprise" and adoption by Fortune 1000 companies positions Cursor as a robust and scalable solution for professional development teams.

- **Developer\-Focused and Loved:** Phrases like "Loved by world\-class devs" and "Loved By Developers" aim to create a positive brand image and appeal to the developer community.

- **Innovation and Future of Coding:**  Blog posts about "Shadow Workspaces" and "Automating Code" suggest a forward\-thinking brand focused on pushing the boundaries of AI in coding and shaping the future of software development.

## What Customers Say

- **Positive Experiences and Productivity Gains:** Some users express being "blown away" by Cursor, noting it as "absolutely incredible" and a "2x improvement over Copilot". They highlight its seamless AI integration and acceleration of development.

- **Rapid Improvement and Feature Growth:**  Positive reviews mention that Cursor "literally gets better/more feature\-rich every couple of weeks," indicating ongoing development and improvement.

- **Initial Design and Implementation Strengths:** Cursor is praised for being "brilliant during the initial design and implementations stages," suggesting strength in early project phases.

- **Bugs and Imperfect AI:**  Some users note that the AI "isn't very smart and often struggles to understand issues," leading to bugs and requiring effort to fix AI\-introduced errors.

- **Refactoring and Redesign Challenges:**  Cursor is reported to "fail terribly as the project needs redesign and refactoring," suggesting limitations in handling complex code evolution.

- **Context Loss and Repetitive Interactions:**  Users describe "endless mind numbing interactions" and the AI's inability to follow redesign documentation, indicating potential context loss and limitations in complex conversations.

- **Concerns about Data Privacy and Security:**  One highly negative review raises serious accusations of "next generation scamming," data scraping, and potential code subversion, along with strong warnings against using services using Claude AI, citing unethical behavior and potential security risks. *It's important to note this is a single, extreme negative review and may not be representative.*

- **Billing Issues and Support Concerns:**  Complaints include "unexpected extra charges," unauthorized charges, and "non existent" or unhelpful customer support, raising concerns about billing transparency and customer service responsiveness.

- **Overselling and Unfulfilled Promises:**  One review claims "promised product isn't delivered anymore" and accuses Cursor of "classical overselling," suggesting potential discrepancies between marketing claims and actual user experience.

## Potential areas for improvements or existing customer gaps

- **AI Accuracy and Bug Reduction:**  Addressing customer concerns about AI\-introduced bugs and improving the AI's understanding of complex code and user intent is crucial.

- **Refactoring and Redesign Capabilities:**  Enhancing Cursor's ability to assist with code refactoring, redesign, and complex project evolution is needed to support the full development lifecycle.

- **Context Management in Complex Projects:**  Improving context handling and conversation management, especially in large projects and during iterative design processes, is essential to prevent user frustration.

- **Billing Transparency and Customer Support:**  Addressing billing issues, ensuring transparent charges, and improving customer support responsiveness are critical to building trust and customer satisfaction.

- **Data Privacy and Security Assurance:**  Addressing extreme concerns about data privacy and security (even if potentially exaggerated) is important. Reinforcing and clearly communicating security measures and privacy policies can help alleviate these fears.

- ** "Harder" Feedback Option for Expert Users:**  Providing an option for more critical and in\-depth code reviews from the AI, rather than just positive reinforcement, could benefit expert developers seeking rigorous feedback.

- **Handling Mixed\-Language Projects:**  Improving support for projects with multiple programming languages to ensure accurate AI assistance across different codebases.

- **Runnability and Testing in Shadow Workspaces:**  Implementing and refining "Runnability" in Shadow Workspaces, as discussed in the blog, to enable more comprehensive AI\-driven development and testing workflows is a key area for future development.

## Summary

- **AI\-Powered Code Editor for Productivity:** Cursor is positioned as a leading AI code editor focused on significantly boosting developer productivity through AI\-driven features.

- **Strong Feature Set:**  It offers a comprehensive suite of features including AI code completion, natural language editing, codebase awareness, web integration, error handling, and shadow workspaces.

- **Targeting Developers and Enterprises:**  Cursor targets individual software engineers, development teams, and large enterprises seeking to enhance coding efficiency and accelerate software development.

- **Freemium Pricing Model:**  It utilizes a freemium model, offering a free plan with limited premium AI model usage and paid plans for increased access and enterprise features.

- **Mixed Customer Feedback:**  Customer reviews are mixed, with positive feedback highlighting productivity gains and seamless AI integration, while negative feedback raises concerns about AI accuracy, bugs, refactoring limitations, billing issues, and (in one extreme case) data security.

- **Areas for Improvement:** Key areas for improvement include enhancing AI accuracy and context handling, improving refactoring capabilities, ensuring billing transparency and customer support, and addressing data privacy concerns.

- **Potential to Disrupt Development Workflow:** Despite areas for improvement, Cursor has the potential to significantly disrupt and enhance software development workflows through its innovative AI\-powered features and focus on developer productivity.
