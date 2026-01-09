# Dark SaaS Landing Page Design System

A comprehensive design system for building modern, dark-themed SaaS landing pages with depth, motion, and premium aesthetics. Framework-agnostic patterns that can be adapted to React, Vue, Svelte, or vanilla CSS.

---

## 1. Color Foundation

### Background Layers (Darkest to Lightest)
```
Base:        #09090B  (primary page background)
Card:        #0c0c0e  (elevated surfaces)
Deep:        #050505  (nested visual containers)
Modal:       #111114  (overlay backgrounds, 90% opacity)
Input:       #18181B  (form fields, interactive areas)
```

### Text Hierarchy
```
Primary:     #FFFFFF  (headlines, important text)
Secondary:   #9CA3AF  (body text, descriptions) - gray-400
Tertiary:    #6B7280  (meta text, captions) - gray-500
Muted:       #4B5563  (disabled, subtle hints) - gray-600
```

### Border & Divider Opacity Pattern
```
Subtle:      white/5   or gray-800/30  (section dividers)
Default:     white/10  or gray-800     (card borders)
Hover:       white/20  or gray-700/50  (interactive states)
Active:      accent/30 or accent/50    (selected states)
```

### Accent Color Usage (Replace with your brand color)
```
Solid:       accent-500       (buttons, icons)
Hover:       accent-500/90    (button hover)
Glow:        accent-500/20-30 (shadows, glows)
Background:  accent-500/10    (badges, chips)
Border:      accent-500/20-40 (highlighted borders)
Text:        accent-400       (links, highlights)
```

---

## 2. Typography Scale

### Headlines
```css
/* Hero Headline - Maximum impact */
.hero-headline {
  font-size: clamp(3rem, 8vw, 4.5rem);  /* text-5xl to text-7xl */
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

/* Section Headline */
.section-headline {
  font-size: clamp(1.875rem, 5vw, 3.75rem);  /* text-3xl to text-6xl */
  font-weight: 700;
  letter-spacing: -0.02em;
}

/* Card/Feature Title */
.card-title {
  font-size: 1.5rem;  /* text-2xl */
  font-weight: 700;
}
```

### Body Text
```css
/* Lead paragraph */
.lead { font-size: 1.25rem; line-height: 1.75; }  /* text-xl */

/* Body */
.body { font-size: 1rem; line-height: 1.625; }    /* text-base */

/* Small/Caption */
.caption { font-size: 0.875rem; line-height: 1.5; }  /* text-sm */
```

### Mono/Technical Text
```css
.mono-label {
  font-family: monospace;
  font-size: 0.625rem;     /* text-[10px] */
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
```

### Gradient Text Effect
```css
.gradient-text {
  background: linear-gradient(to right, var(--accent), var(--accent-light));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

---

## 3. Spacing System

### Container
```css
.container {
  max-width: 80rem;      /* max-w-7xl */
  margin: 0 auto;
  padding: 0 1rem;       /* px-4 */
}

@media (min-width: 640px) { .container { padding: 0 1.5rem; } }  /* sm:px-6 */
@media (min-width: 1024px) { .container { padding: 0 2rem; } }   /* lg:px-8 */
```

### Section Spacing
```
Standard:    py-24  (6rem vertical padding)
Large:       py-32  (8rem vertical padding)
Compact:     py-16  (4rem vertical padding)
```

### Component Spacing
```
Card padding:     p-6 to p-8
Gap between cards: gap-6
Stack spacing:    space-y-3 to space-y-4
Inline spacing:   gap-2 to gap-4
```

---

## 4. Component Patterns

### Bento Card (Feature Card)
```css
.bento-card {
  position: relative;
  overflow: hidden;
  border-radius: 2rem;
  border: 1px solid rgba(255,255,255,0.1);
  background: #0c0c0e;
  display: flex;
  flex-direction: column;
  transition: all 0.5s;
}

.bento-card:hover {
  border-color: rgba(var(--accent-rgb), 0.4);
}

/* Hover gradient overlay */
.bento-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom right, rgba(var(--accent-rgb), 0.05), transparent);
  opacity: 0;
  transition: opacity 0.5s;
}

.bento-card:hover::before {
  opacity: 1;
}
```

### Bento Grid Layout
```css
.bento-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 1.5rem;
  grid-auto-rows: 420px;
}

@media (min-width: 768px) {
  .bento-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .bento-card--wide { grid-column: span 2; }
  .bento-card--tall { grid-row: span 2; }
}
```

### Icon Container
```css
.icon-container {
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 1rem;
  background: #000000;
  border: 1px solid rgba(255,255,255,0.1);
  color: var(--accent);
  transition: transform 0.5s;
}

.bento-card:hover .icon-container {
  transform: scale(1.1);
}
```

### Badge/Chip
```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  background: rgba(var(--accent-rgb), 0.1);
  border: 1px solid rgba(var(--accent-rgb), 0.2);
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--accent);
}

/* With pulsing dot */
.badge-dot {
  position: relative;
  width: 0.5rem;
  height: 0.5rem;
}

.badge-dot::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: var(--accent);
  animation: ping 1s infinite;
}

.badge-dot::after {
  content: '';
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: var(--accent);
}
```

### FAQ Accordion Item
```css
.faq-item {
  border-radius: 0.75rem;
  border: 1px solid rgba(255,255,255,0.05);
  background: rgba(0,0,0,0.3);
  overflow: hidden;
  transition: all 0.3s;
}

.faq-item--open {
  background: rgba(0,0,0,0.6);
  border-color: rgba(var(--accent-rgb), 0.3);
}

.faq-item:hover:not(.faq-item--open) {
  border-color: rgba(255,255,255,0.1);
}

.faq-button {
  width: 100%;
  padding: 1.25rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-align: left;
}

.faq-content {
  padding: 0 1.5rem 1.25rem;
  color: var(--text-secondary);
  line-height: 1.625;
}
```

### Pipeline/Timeline Step
```css
.pipeline-step {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  border-radius: 1rem;
  border: 1px solid rgba(255,255,255,0.05);
  background: rgba(0,0,0,0.2);
  opacity: 0.5;
  transition: all 0.5s;
}

.pipeline-step--active {
  background: rgba(0,0,0,0.8);
  border-color: rgba(var(--accent-rgb), 0.5);
  box-shadow: 0 0 30px rgba(var(--accent-rgb), 0.1);
  opacity: 1;
}

/* Progress bar at bottom */
.pipeline-step--active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2px;
  background: var(--accent);
  animation: progress 3s linear;
}

@keyframes progress {
  from { width: 0; }
  to { width: 100%; }
}
```

---

## 5. Button Patterns

### Primary CTA (High Emphasis)
```css
.btn-primary {
  position: relative;
  padding: 1rem 2rem;
  background: var(--accent);
  color: white;
  font-weight: 700;
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 0 30px rgba(var(--accent-rgb), 0.3);
  transition: all 0.3s;
}

.btn-primary:hover {
  box-shadow: 0 0 40px rgba(var(--accent-rgb), 0.5);
  transform: scale(1.02);
}

.btn-primary:active {
  transform: scale(0.98);
}

/* Inner gradient layer */
.btn-primary::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to top right, var(--accent-dark), var(--accent-light));
}

/* Bottom shadow/reflection */
.btn-primary::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(to top, rgba(0,0,0,0.2), transparent);
}
```

### Secondary/Ghost Button
```css
.btn-secondary {
  padding: 1rem 2rem;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.8);
  font-weight: 500;
  border-radius: 0.75rem;
  backdrop-filter: blur(12px);
  transition: all 0.3s;
}

.btn-secondary:hover {
  background: rgba(255,255,255,0.1);
  border-color: rgba(255,255,255,0.2);
  color: white;
}
```

### Pill Button (Tertiary)
```css
.btn-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: rgba(var(--accent-rgb), 0.1);
  border: 1px solid rgba(var(--accent-rgb), 0.3);
  border-radius: 9999px;
  color: var(--accent);
  font-weight: 500;
  transition: all 0.3s;
}

.btn-pill:hover {
  background: rgba(var(--accent-rgb), 0.2);
}
```

---

## 6. Visual Effects

### Glow Behind Element
```css
.glow-container {
  position: relative;
}

.glow-container::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 120%;
  height: 120%;
  background: radial-gradient(
    ellipse at center,
    rgba(var(--accent-rgb), 0.2) 0%,
    transparent 70%
  );
  filter: blur(60px);
  z-index: -1;
}
```

### Ambient Background Glow
```css
.ambient-glow {
  position: absolute;
  top: -10%;
  right: -5%;
  width: 600px;
  height: 600px;
  background: rgba(var(--accent-rgb), 0.1);
  border-radius: 50%;
  filter: blur(120px);
  opacity: 0.4;
  pointer-events: none;
}
```

### Noise Texture Overlay
```css
.noise-overlay {
  position: absolute;
  inset: 0;
  background-image: url('data:image/svg+xml,...');  /* or external noise.svg */
  opacity: 0.03;
  pointer-events: none;
}
```

### Grid Background
```css
.grid-background {
  background-image:
    linear-gradient(to right, rgba(var(--accent-rgb), 0.03) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(var(--accent-rgb), 0.03) 1px, transparent 1px);
  background-size: 30px 30px;
}

/* Perspective grid (for depth) */
.perspective-grid {
  background-image:
    linear-gradient(to right, #333 1px, transparent 1px),
    linear-gradient(to bottom, #333 1px, transparent 1px);
  background-size: 60px 60px;
  opacity: 0.05;
  transform: perspective(500px) rotateX(60deg) translateY(-200px);
}
```

### Top Highlight Line
```css
.highlight-line {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(
    to right,
    transparent,
    rgba(255,255,255,0.2),
    transparent
  );
}
```

### Scan Line Animation
```css
.scan-line {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--accent);
  box-shadow: 0 0 40px rgba(var(--accent-rgb), 0.8);
  animation: scan 4s ease-in-out infinite;
}

@keyframes scan {
  0%, 100% { left: 0%; }
  50% { left: 100%; }
}
```

---

## 7. Animation Patterns

### Entrance Animations (Scroll-triggered)
```css
/* Fade up */
.animate-fade-up {
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.5s ease-out;
}

.animate-fade-up.in-view {
  opacity: 1;
  transform: translateY(0);
}

/* Scale in */
.animate-scale-in {
  opacity: 0;
  transform: scale(0.9);
  transition: all 0.5s ease-out;
}

.animate-scale-in.in-view {
  opacity: 1;
  transform: scale(1);
}
```

### Staggered Children
```css
.stagger-children > *:nth-child(1) { transition-delay: 0.05s; }
.stagger-children > *:nth-child(2) { transition-delay: 0.1s; }
.stagger-children > *:nth-child(3) { transition-delay: 0.15s; }
.stagger-children > *:nth-child(4) { transition-delay: 0.2s; }
/* ... continue as needed */
```

### Hover Micro-interactions
```css
/* Scale bounce */
.hover-scale {
  transition: transform 0.2s;
}
.hover-scale:hover { transform: scale(1.05); }
.hover-scale:active { transform: scale(0.95); }

/* Icon shift */
.hover-shift-icon .icon {
  transition: transform 0.2s;
}
.hover-shift-icon:hover .icon {
  transform: translateX(4px);
}
```

### Looping Ambient Animations
```css
/* Pulse */
@keyframes pulse {
  0%, 100% { opacity: 0.8; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
}

/* Horizontal traverse */
@keyframes traverse {
  from { left: -10%; }
  to { left: 110%; }
}

/* Breathing glow */
@keyframes breathe {
  0%, 100% { box-shadow: 0 0 20px rgba(var(--accent-rgb), 0.3); }
  50% { box-shadow: 0 0 40px rgba(var(--accent-rgb), 0.6); }
}
```

---

## 8. Modal/Overlay Pattern

```css
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: 1rem;
}

.modal-content {
  position: relative;
  max-width: 28rem;
  width: 100%;
}

/* Glow ring around modal */
.modal-content::before {
  content: '';
  position: absolute;
  inset: -4px;
  background: linear-gradient(
    to right,
    rgba(var(--accent-rgb), 0.2),
    rgba(var(--accent-rgb), 0.1),
    rgba(var(--accent-rgb), 0.2)
  );
  border-radius: 1.5rem;
  filter: blur(32px);
}

.modal-card {
  position: relative;
  background: rgba(17, 17, 20, 0.9);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 1rem;
  backdrop-filter: blur(4px);
  box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
}

.modal-close {
  position: absolute;
  top: -1rem;
  right: -1rem;
  width: 2rem;
  height: 2rem;
  background: rgba(255,255,255,0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.modal-close:hover {
  background: rgba(255,255,255,0.2);
}
```

---

## 9. Header/Navigation

```css
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
}

.header-inner {
  background: linear-gradient(
    to bottom,
    rgba(0,0,0,1),
    rgba(0,0,0,0.95),
    rgba(0,0,0,0.8)
  );
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255,255,255,0.05);
}

.header-container {
  max-width: 80rem;
  margin: 0 auto;
  padding: 0 1rem;
  height: 4rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* Logo with glow effect */
.logo-glow {
  position: relative;
}

.logo-glow::before {
  content: '';
  position: absolute;
  inset: -2px;
  background: linear-gradient(to right, var(--accent), var(--accent-light));
  border-radius: 0.75rem;
  opacity: 0.3;
  filter: blur(4px);
  transition: opacity 0.3s;
}

.logo-glow:hover::before {
  opacity: 0.5;
}
```

---

## 10. Footer Pattern

```css
.footer {
  background: #000000;
  border-top: 1px solid rgba(255,255,255,0.05);
  padding: 4rem 0;
}

.footer-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 2rem;
}

@media (min-width: 768px) {
  .footer-grid {
    grid-template-columns: 1.5fr repeat(3, 1fr);
  }
}

.footer-heading {
  color: white;
  font-weight: 600;
  margin-bottom: 1rem;
}

.footer-link {
  display: block;
  font-size: 0.875rem;
  color: rgba(255,255,255,0.5);
  padding: 0.25rem 0;
  transition: color 0.2s;
}

.footer-link:hover {
  color: var(--accent);
}

.footer-bottom {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(255,255,255,0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

@media (min-width: 768px) {
  .footer-bottom {
    flex-direction: row;
    justify-content: space-between;
  }
}
```

---

## 11. Responsive Breakpoints

```css
/* Mobile first approach */
/* sm: 640px  - Large phones, small tablets */
/* md: 768px  - Tablets */
/* lg: 1024px - Laptops */
/* xl: 1280px - Desktops */
/* 2xl: 1536px - Large screens */

/* Key responsive patterns used: */

/* Text scaling */
.responsive-headline {
  font-size: 3rem;           /* Mobile */
}
@media (min-width: 1024px) {
  .responsive-headline {
    font-size: 4.5rem;       /* Desktop */
  }
}

/* Grid collapse */
.responsive-grid {
  grid-template-columns: 1fr;
}
@media (min-width: 768px) {
  .responsive-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (min-width: 1024px) {
  .responsive-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Show/hide elements */
.hide-mobile { display: none; }
@media (min-width: 640px) {
  .hide-mobile { display: inline; }
}
```

---

## 12. Implementation Checklist

When building a new landing page with this system:

- [ ] Set up CSS variables for accent color (RGB format for opacity)
- [ ] Apply base background color to body (#09090B)
- [ ] Add noise texture overlay to main container
- [ ] Position ambient glow elements in hero section
- [ ] Use container with responsive padding
- [ ] Apply entrance animations to sections (fade-up, stagger)
- [ ] Add hover states to all interactive elements
- [ ] Ensure mobile-first responsive behavior
- [ ] Test color contrast for accessibility
- [ ] Add loading states for async content

---

## CSS Variable Setup

```css
:root {
  /* Replace with your brand color */
  --accent: #fa7517;
  --accent-rgb: 250, 117, 23;
  --accent-light: #f59e0b;
  --accent-dark: #ea580c;

  /* Backgrounds */
  --bg-base: #09090B;
  --bg-card: #0c0c0e;
  --bg-deep: #050505;
  --bg-input: #18181B;

  /* Text */
  --text-primary: #FFFFFF;
  --text-secondary: #9CA3AF;
  --text-tertiary: #6B7280;
  --text-muted: #4B5563;
}
```
