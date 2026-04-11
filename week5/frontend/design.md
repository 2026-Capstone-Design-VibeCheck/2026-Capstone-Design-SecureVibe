# Secure Vibe Design Document

Secure Vibe is a modern, intelligent code security analysis platform designed to detect vulnerabilities like OWASP Top 10 risks using AI and static analysis (SAST) tools like Semgrep.

## 1. Design Philosophy
The design of Secure Vibe focuses on **Security, Transparency, and Minimalism**. It aims to provide a high-tech "Obsidian" aesthetic while remaining accessible to developers of all levels.

- **Trust**: Visual cues that reinforce security (locks, shields, clean lines).
- **Efficiency**: A streamlined process from code input to security report.
- **Clarity**: Using high-contrast elements to highlight critical vulnerabilities.

## 2. Visual Identity

### Color Palette
| Color Name | Hex Code | Usage |
| :--- | :--- | :--- |
| **Obsidian Green** | `#5EEAD4` | Primary brand color, accents, and "glow" effects. |
| **Page Background** | `#F9FAFB` | Main application background (Light mode). |
| **Dark Background** | `#0A0A0A` | Dark mode background. |
| **Teal Accent** | `bg-teal-50` | Secondary background for badges and status indicators. |
| **Danger Red** | `text-red-500`| Error messages and critical vulnerability highlights. |

### Typography
- **Sans-Serif**: `Geist Sans`, Arial, Helvetica (Modern, readable, technical).
- **Monospace**: `Geist Mono` (Used for code snippets and analysis outputs).

## 3. UI Components

### Navigation (NavBar)
- A clean, sticky top navigation bar providing access to Home, Reports, and Documentation.

### Input Section
- **ScanInputSelector**: A toggle interface allowing users to switch between:
    - **File Upload**: Drag-and-drop or select multiple project files.
    - **Code Snippet**: Direct text entry for quick checks.
- **FileDropzone**: A dash-bordered interaction area with feedback for selected files.
- **CodeEditorInput**: A syntax-highlighted editor for direct code pasting.

### Action Area (ScanAction)
- A prominent CTA (Call to Action) that initiates the backend Semgrep scan processes.
- Includes loading states and progress indicators during analysis.

### Feature Cards (SecurityInfoCard)
- Informational blocks highlighting key technical features:
    - **Deep AI Scanning**: AI-driven flaw detection.
    - **OWASP Top 10**: Specialized rulesets for standard web vulnerabilities.
    - **Zero-Knowledge**: Emphasis on local analysis and privacy.

## 4. User Experience Flow
1. **Selection**: User chooses between file upload or code pasting.
2. **Analysis**: Upon clicking "Scan", the backend retrieves the code, runs Semgrep with `p/default` and `p/owasp-top-ten` rulesets.
3. **Reporting**: Results are parsed and presented in a detailed Report page, categorized by severity and vulnerability type.

## 5. Technical Design Implementation
- **Framework**: Next.js 15 (App Router).
- **Styling**: Tailwind CSS v4 with custom theme tokens.
- **Backend**: FastAPI (Python) integration for SAST execution.
- **Interactivity**: React hooks (`useState`, `useEffect`) manage complex UI states like file selections and error handling.
