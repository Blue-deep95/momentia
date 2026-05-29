# Momentia Design Language (Blue & Purple Gradient Theme)

This document outlines the official design language, color systems, layouts, and components used across the Momentia frontend web application.

---

## Core Aesthetic & Philosophy

Momentia uses a **Blue & Purple Gradient** theme combined with elements of **Glassmorphic Depth** and **Contrast Splits**. The goal is to provide a clean, modern, and visually engaging creative playground for sharing social media moments. 

The overall interface focuses on:
1. **Bold Gradient Gradients**: Smooth, vibrant transitions between blue, indigo, and purple for high visual impact.
2. **Glassmorphism Overlay**: Semi-transparent, blur-heavy surfaces overlaying background glows to establish structure without heavy borders.
3. **Contrast-Heavy Splits**: Splitting layout views into deep dark-gradient panels (representing creation/branding) and clean white panels (representing functional forms/feeds).
4. **Subtle Micro-Animations**: Hover scales (`hover:scale-105`) and focus glow rings to make interactive elements feel responsive and premium.

---

## Colors & Themes

### 1. Brand Gradients
* **Primary Layout Gradient**: `from-blue-700 via-indigo-700 to-purple-700` (or `from-blue-600 via-indigo-600 to-purple-700` in linear CSS direction). Used for main branding panels, backgrounds, and sidebars.
* **Button/Action Gradient**: `from-blue-600 to-purple-600` (or `from-indigo-600 to-purple-600`). Used to draw visual weight to primary submission paths.

### 2. Ambient Glow & Shadows
* **Dark Mode Blur Highlights**: `bg-blue-400/20` and `bg-purple-400/20` combined with `blur-3xl` overlays.
* **Light Mode Ambient Glow**: Soft pastel background spots (`bg-blue-100 blur-3xl` and `bg-purple-100 blur-3xl`) to break up sterile white backgrounds.

### 3. Typography & UI Accents
* **Functional Badges**: Pill-shaped components with light backgrounds and rich contrast text (e.g. `bg-blue-50 text-blue-700 border-blue-200` or `bg-indigo-50 text-indigo-600`).
* **Text Neutrals**:
  * Titles: `text-gray-900`
  * Body/Subtext: `text-gray-500`
  * Form Labels: `text-gray-400`
  * Borders: `border-gray-200`

---

## Typography

The project utilizes **Geist** as its primary typeface (mapped directly to `font-sans` within the Tailwind theme layer).

* **Display/Headings**: Bold/Extra-bold hierarchy (`font-black` or `font-bold`), typically sized from `text-5xl` to `text-6xl` with tight line heights (`leading-tight`).
* **Section Headers**: Medium sizes (`text-xl` or `text-2xl`) using `font-semibold` or `font-bold`.
* **Form Labels**: Tiny uppercase headers (`text-[11px] font-bold uppercase tracking-wider`) to keep form styling structured and readable.

---

## Layout & Components

### 1. Split-Screen Layout (Auth & Landing)
Auth views use a 2-column responsive layout grid:
* **Branding Panel (Desktop only - Left)**: A dark-gradient container decorated with floating cards, an abstract stat grid, and ambient white/colored glows.
* **Form Panel (Right)**: A high-contrast white container housing the interactive controls.

### 2. Float Cards (Glassmorphic Mockups)
Used to simulate interactive cards floating on branding panels:
* **Styles**: `rounded-2xl border border-white/20 bg-white/10 px-4 py-3 shadow-lg backdrop-blur-xl`

### 3. Form Input Fields
Standardized inputs focusing on high readability and interactive feedback:
* **Default State**: White background, `rounded-2xl`, `border-gray-200`, text-sm.
* **Focus State**: `border-blue-500 shadow-[0_0_0_4px_rgba(59,130,246,0.15)]` (or `focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100`).
* **Disabled State**: `cursor-not-allowed opacity-50`.

### 4. Interactive Buttons
* **Primary Path**: Gradient pill-style buttons (`from-blue-600 to-purple-600`), featuring high contrast white text and `shadow-lg`.
* **Micro-interactions**: Subtle hover state transforms using `transition hover:scale-105`.