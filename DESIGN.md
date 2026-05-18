---
name: Aura Design System
colors:
  surface: '#f9f9ff'
  surface-dim: '#d4daea'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f3ff'
  surface-container: '#e8eeff'
  surface-container-high: '#e3e8f9'
  surface-container-highest: '#dde2f3'
  on-surface: '#161c27'
  on-surface-variant: '#4a4551'
  inverse-surface: '#2a303d'
  inverse-on-surface: '#ecf0ff'
  outline: '#7b7482'
  outline-variant: '#ccc3d2'
  surface-tint: '#6d4ca6'
  primary: '#6d4ca6'
  on-primary: '#ffffff'
  primary-container: '#b794f4'
  on-primary-container: '#492680'
  inverse-primary: '#d4bbff'
  secondary: '#844e63'
  on-secondary: '#ffffff'
  secondary-container: '#feb9d1'
  on-secondary-container: '#7b465a'
  tertiary: '#1f6587'
  on-tertiary: '#ffffff'
  tertiary-container: '#70add2'
  on-tertiary-container: '#00405a'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ebdcff'
  primary-fixed-dim: '#d4bbff'
  on-primary-fixed: '#270058'
  on-primary-fixed-variant: '#55338d'
  secondary-fixed: '#ffd9e4'
  secondary-fixed-dim: '#f8b3cb'
  on-secondary-fixed: '#350c1f'
  on-secondary-fixed-variant: '#69374b'
  tertiary-fixed: '#c6e7ff'
  tertiary-fixed-dim: '#91cef5'
  on-tertiary-fixed: '#001e2d'
  on-tertiary-fixed-variant: '#004c6b'
  background: '#f9f9ff'
  on-background: '#161c27'
  surface-variant: '#dde2f3'
gradients:
  twilight-background: 'linear-gradient(135deg, #ebdcff 0%, #ffd9e4 50%, #c6e7ff 100%)'
  button-primary: 'linear-gradient(90deg, #6d4ca6 0%, #feb9d1 100%)'
  story-ring: 'conic-gradient(from 0deg at 50% 50%, #b794f4 0%, #feb9d1 33%, #70add2 66%, #b794f4 100%)'
  glass-overlay: 'linear-gradient(180deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.1) 100%)'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-bold:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  container-margin: 20px
  gutter: 16px
---

## Brand & Style

This design system is built for a lifestyle-centric social media experience that prioritizes visual serenity and creative expression. The brand personality is ethereal, welcoming, and sophisticated, aiming to reduce the cognitive noise often associated with social feeds. 

The aesthetic is rooted in **Glassmorphism**, utilizing multi-layered translucency to create a sense of physical depth within a digital space. By combining soft pastel gradients with high-clarity frosted surfaces, the UI feels lightweight and premium. The goal is to evoke a "sanctuary" feel—vibrant yet professional—allowing user-generated content to sit naturally within a luminous, airy framework.

## Colors

The palette centers on a "Twilight Pastel" theme. **Soft Lavender** serves as the primary brand touchstone for actions and active states. **Petal Pink** and **Sky Blue** are utilized for secondary highlights, story rings, and expressive accents. 

To ensure professional readability, neutrals are kept high-contrast (Slate Gray to Deep Charcoal). Backgrounds are never flat white; they utilize a gentle tri-color gradient that interacts with the glass components. All interactive surfaces use a semi-transparent white fill with a high-opacity white border to simulate the edge of a glass pane.

## Typography

This design system employs a pairing of **Inter** for structural hierarchy and functional labels, and **Geist** for primary content consumption. 

Headlines use Inter with tighter letter spacing to maintain a clean, high-precision aesthetic that feels contemporary and neutral. Body copy leverages Geist for its technical clarity and modern geometric character shapes, ensuring long-form captions remain legible against translucent backgrounds. All uppercase labels and navigation elements should utilize Inter with slight tracking increases to improve scanability across the interface.

## Icons

The design system uses lucide-react icons which are already installed, whenver possible.

## Layout & Spacing

The layout follows a **Fluid Grid** model with a soft 4px base unit. For the primary feed, content is housed in containers with 20px lateral margins to create a "floating" effect over the background gradient. 

Horizontal spacing between elements (like icons in a post-action bar) should adhere to the `md` (16px) increment. For vertical rhythm, use `lg` (24px) between distinct feed posts to allow the glass edges and background blurs to be clearly visible, reinforcing the airy, spacious atmosphere.

## Elevation & Depth

Depth is achieved through **Glassmorphism** rather than traditional heavy shadows. 
- **Base Level:** The background pastel gradient.
- **Surface Level:** Semi-transparent containers (`rgba(255, 255, 255, 0.6)`) with a `backdrop-filter: blur(20px)`.
- **Raised Level:** Elements like active buttons or "Story" bubbles use a slightly more opaque fill and a very soft, diffused shadow (`box-shadow: 0 8px 32px rgba(183, 148, 244, 0.15)`) tinted with the primary Lavender.

A 1px solid white border with 80% opacity must be applied to all glass containers to provide "specular highlights" on the edges, ensuring the layers are distinguishable from one another.

## Shapes

The shape language is consistently **Rounded**, reflecting the approachable and soft nature of the brand. 
- Standard components (Buttons, Input fields) use a 0.5rem (8px) radius.
- Large containers (Feed cards, Modals) use `rounded-xl` at 1.5rem (24px).
- Profile avatars and Story rings remain perfectly circular to contrast against the architectural geometry of the feed.

## Components

### Buttons
Primary buttons use a solid-to-soft gradient of Lavender to Pink with white text. Ghost buttons use the glass style (blur + border) with a Lavender text label.

### Glass Cards (Feed Posts)
The primary post container should feature the 20px backdrop blur and a 1px white border. The header and footer of the card are separated by a very subtle, low-opacity white line.

### Story Rings
Story rings use a vibrant conic gradient of the three brand colors (Lavender, Pink, Blue). When viewed, the ring fades to a simple subtle white border.

### Inputs & Search
Search bars should be highly transparent (10-20% opacity) with a strong backdrop blur, making them feel like "etched" glass on the header.

### Chips & Tags
Used for categories or hashtags, these are pill-shaped with a Petal Pink or Sky Blue tint at 15% opacity, using the secondary/accent colors for the text to ensure legibility without heavy visual weight.