# PulsePort Executive Cockpit Dashboard Redesign Design

## Goal

Redesign PulsePort into a premium, action-first executive portfolio cockpit with a unified app shell, calmer visual hierarchy, dual-theme design system, and consistent UX across Dashboard, Portfolio, My Investments, Wallet Analyzer, Transactions, and specialist pages.

## Scope

This redesign covers:

- global app shell
- layout system
- visual design language
- reusable UI surfaces
- navigation hierarchy
- responsive behavior
- interaction language
- phased rollout plan for all major product tabs

This redesign does not change core portfolio logic or rewrite analytics math. It changes how the product is structured, presented, and used.

## Product Direction

PulsePort should move from a feature-rich crypto dashboard with uneven density into a layered executive system:

- top level: calm, decisive, action-oriented
- middle layer: portfolio health and ownership truth
- deeper layer: dense analysis and operational workflows

The user chose:

- full app shell redesign, not page-only restyling
- executive portfolio cockpit over terminal-style density
- dual-theme design system with light-first reference
- first screen optimized for what needs action now, with portfolio health directly under it

## Design Decision Framework

Every major interface decision in this redesign follows five tests:

1. Purpose
   Why does this element exist? If it does not clarify a decision, state, or next action, it should not be present.

2. Hierarchy
   How important is it? Primary signals should be obvious in the first scan. Secondary details should support, not compete.

3. Context
   How does it relate to surrounding elements? Components should look and behave like they belong to one system, not adjacent mini-products.

4. Accessibility
   Can users with different vision, motion, and input needs use it effectively? Contrast, focus, target size, and motion behavior are part of the core design, not a later pass.

5. Performance
   Does it slow the first read or the product itself? Heavy visual effects, overly dense first paint, and always-on live modules should be avoided unless they materially improve decisions.

## Experience Model

PulsePort should feel like a premium decision cockpit:

- calm at first glance
- decisive in hierarchy
- exact in detail
- fast to scan
- trustworthy with financial information

The design should not imitate a noisy trading terminal. It should instead feel like a refined operating system for cross-chain portfolio decisions.

## Information Architecture

The product is organized into three layers.

### 1. Action Layer

Purpose:
Answer what needs attention now.

Primary page:
- Dashboard

Content:
- urgent alerts
- concentration risks
- meaningful P&L moves
- bridge and staking events
- actionable next steps such as planner, ledger, or market watch

### 2. Portfolio Layer

Purpose:
Answer what do I own and how healthy is it.

Primary pages:
- Portfolio
- My Investments

Content:
- net worth
- chain exposure
- allocation
- ownership attribution
- cost basis
- holdings truth

### 3. Execution And Analysis Layer

Purpose:
Answer why performance is happening and what to do next.

Primary pages:
- Wallet Analyzer
- Transactions
- HEX Staking
- DeFi
- Bridges

Content:
- performance analysis
- rotation metrics
- scenario planning
- route-level and transaction-level detail
- dense operational ledgers

## App Shell Architecture

The redesign uses one shared shell for the whole product.

### Left Navigation Rail

Purpose:
Provide stable orientation and product structure.

Requirements:
- always visible on desktop
- collapsible on smaller laptop widths
- converted into a bottom sheet or compact drawer on mobile
- grouped by layer, not alphabetic list

Proposed structure:
- Dashboard
- Portfolio
- My Investments
- Wallet Analyzer
- Transactions
- HEX Staking
- DeFi
- Bridges
- Ecosystem or support pages

### Top Command Bar

Purpose:
Provide fast operational controls without polluting page content.

Content:
- wallet scope selector
- global search
- refresh status
- API key / data health status
- theme switch
- quick utilities if needed

### Main Canvas

Purpose:
Host page narratives with consistent width, spacing, and scan order.

Model:
- primary narrative column
- secondary support column when needed
- optional right insight rail only on relevant pages

### Insight Rail

Purpose:
Surface context-aware next actions without crowding the main narrative.

Use only where the page benefits from side guidance, such as:
- Dashboard
- Wallet Analyzer
- Transactions

Not every page should have one.

## Layout Model

This redesign uses a layered executive system rather than flat stacked cards.

### Shared Layout Rules

- wide but bounded content width
- stronger vertical spacing rhythm
- fewer panels per viewport
- top sections framed as decision surfaces
- denser operational tables pushed below the first decision layer

### Dashboard Layout

Purpose:
Immediate executive briefing.

Order:
1. action hero
2. urgent actions and alerts
3. portfolio health row
4. strategy opportunity row
5. below-fold operational modules

### Portfolio Layout

Purpose:
Current exposure and health.

Order:
1. value and exposure hero
2. allocation and chain mix
3. key health metrics
4. holdings and ownership detail

### My Investments Layout

Purpose:
Canonical ownership ledger.

Order:
1. ledger hero and summary
2. utility strip
3. holdings attribution filters
4. cost basis table
5. asset detail panel

This page remains the ownership source of truth.

### Wallet Analyzer Layout

Purpose:
Strategic analysis workspace.

Order:
1. analyzer hero
2. performance and chain mix
3. risk, behavior, and core rotation
4. holdings attribution
5. detailed attribution and drill-downs

This page should feel like the strategy lab of the product.

### Transactions Layout

Purpose:
Operational truth.

Order:
1. compact summary band
2. high-signal filters
3. dense ledger container
4. transaction detail and provenance paths

The ledger stays dense, but the frame around it becomes calmer and more deliberate.

## Visual System

### Overall Aesthetic

The product should feel:

- precise
- premium
- restrained
- editorial
- calm under pressure

Visual confidence should come from proportion, spacing, typography, and discipline, not flashy effects.

### Theme Strategy

The product is dual-theme by design.

Reference design:
- light-first

This means:
- light theme defines the primary hierarchy
- dark theme is intentionally tuned, not mechanically inverted

### Color System

#### Light Theme Reference

- warm near-white background
- cool-neutral panels
- graphite and charcoal text
- one controlled accent for product action
- semantic colors for gain, loss, warning, and chain identity

#### Dark Theme

- deep neutral canvas
- quieter highlights
- controlled saturation
- same hierarchy model as light theme

### Typography

Use a more disciplined type system:

- display style for page titles and major numbers
- clean sans for interface copy and controls
- mono reserved for hashes, wallet fragments, and execution data

Typography should feel more like premium software and less like a generic dashboard theme.

### Surface System

The app should have a finite set of reusable surfaces:

- shell background
- primary cards
- secondary cards
- action cards
- utility strips
- dense ledger containers

Importance should be communicated through:

- spacing
- weight
- border strength
- elevation
- contrast

not by adding more colors.

## Interaction Language

Interaction should feel consistent, subtle, and immediate.

### Principles

- every interactive element should give feedback
- hover and focus states should increase confidence, not noise
- transitions should support orientation
- drawers and planners should feel connected to the current page state

### Micro-Interaction Framework

For each interaction family:

#### Hovering Over Cards

- Trigger: pointer enters card
- Rules: slight lift, border clarification, subtle tone increase
- Feedback: card feels active and selectable
- Loops: reversible on exit
- Modes: no data state change

#### Switching Filters Or Ranges

- Trigger: click or key activation
- Rules: active state updates immediately, content updates with controlled transition
- Feedback: selected state becomes explicit
- Loops: repeatable
- Modes: scope of visible data changes

#### Opening Planner Or Drill-Down

- Trigger: CTA click
- Rules: open contextual overlay, drawer, or deeper workspace
- Feedback: clear transition from analysis to action
- Loops: can move back without losing orientation
- Modes: app enters planning or analysis detail state

## Accessibility Requirements

The redesign must be accessible by default.

Requirements:

- strong contrast in both themes
- keyboard-focus visibility on every interactive control
- reduced-motion support
- generous touch targets
- readable font sizes
- meaningful semantic structure
- consistent interaction patterns across pages

Dense data views should remain accessible, not just pretty.

## Performance Requirements

The redesign should improve clarity without making the app feel heavier.

Rules:

- avoid blur-heavy or glass-heavy rendering that slows real usage
- keep first paint selective and meaningful
- defer heavy modules below fold where appropriate
- use animation sparingly and intentionally
- do not make the first screen more expensive just to look premium

## Reusable Component Architecture

The redesign should be implemented as a UI system, not page-specific styling.

### Core Shell Components

- `AppShell`
- `CommandBar`
- `PageHero`
- `SectionFrame`
- `InsightRail`
- `MetricCard`
- `DenseDataPanel`
- `ContextActionStrip`

### Page-Level Modules

- action summary modules
- portfolio health modules
- analyzer modules
- ledger modules
- utility strip modules

These should share one interaction and spacing system.

## Page-by-Page Redesign Intent

### Dashboard

Job:
Action-first executive briefing.

Must show:
- urgent issues
- next actions
- high-level portfolio health
- high-value strategy modules

### Portfolio

Job:
Current portfolio health.

Must show:
- net worth
- exposure
- allocation
- current holdings health

### My Investments

Job:
Canonical position ledger.

Must show:
- cost basis
- route and source attribution
- true ownership state
- utilities such as planner and market watch

### Wallet Analyzer

Job:
Strategic performance and behavior workspace.

Must show:
- NAV
- performance history
- risk metrics
- trade behavior
- chain mix
- holdings attribution
- core rotation vs PLS
- planner connection

### Transactions

Job:
Operational truth surface.

Must show:
- filterable ledger
- provenance
- bridge/staking/source context
- clear route to explorer and drill-down actions

## Implementation Strategy

This redesign should be phased.

### Phase A: Shell And Design System

Build:
- shell
- command bar
- page hero
- shared section framing
- token system
- theme model

No feature logic changes beyond integration.

### Phase B: Dashboard And Wallet Analyzer

These become the flagship surfaces for the redesign.

Why:
- Dashboard defines the new product impression
- Wallet Analyzer defines the new analysis experience

### Phase C: My Investments And Transactions

These are upgraded into the new system while preserving density and truthfulness.

### Phase D: Specialist Pages

- HEX Staking
- DeFi
- Bridges
- ecosystem/support pages

## File Boundaries

New UI system should live behind explicit boundaries.

Suggested structure:

- `src/features/app-shell/*`
- `src/components/dashboard-shell/*`
- `src/components/executive-cockpit/*`
- `src/styles/tokens.css`
- `src/styles/layout.css`
- `src/styles/surfaces.css`
- `src/styles/motion.css`

Existing pages should consume the system rather than expand `App.tsx`.

## Risks And Controls

### Risk: full-shell redesign causes regressions

Control:
- phase rollout
- keep logic intact where possible
- test each page after migration

### Risk: premium styling becomes ornamental and slows the app

Control:
- performance is a design requirement
- prefer structure over decoration

### Risk: Dashboard becomes calmer but less useful

Control:
- action-first layout
- portfolio health directly under action layer
- dense work still available in deeper layers

### Risk: pages feel inconsistent during rollout

Control:
- shell and token system land first
- flagship pages prove the language before broader rollout

## Success Criteria

The redesign is successful when:

- the app feels like one product, not separate tools
- the first screen answers what needs action now
- portfolio health is readable within one scan
- My Investments and Wallet Analyzer feel connected conceptually and visually
- Transactions remains dense but significantly easier to parse
- both themes feel intentionally designed
- the UI feels premium without feeling slower or more confusing

## Recommendation

Implement this as a layered executive system with:

- shared premium shell
- action-first Dashboard
- strategy-first Wallet Analyzer
- ownership-truth My Investments
- calmer but denser Transactions ledger

That is the best fit for the user-selected direction and the current PulsePort feature set.
