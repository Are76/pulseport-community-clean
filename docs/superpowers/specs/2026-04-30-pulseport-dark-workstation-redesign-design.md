# PulsePort Dark Workstation Redesign Design

## Goal

Redesign PulsePort into a clean, dense, premium dark workstation for PulseChain investors, inspired by the clarity and restraint of OKX Wallet while preserving PulsePort-specific portfolio truth, cost basis, cross-chain analytics, provenance, and future smart-money workflows.

## Scope

This redesign covers:

- whole-app shell and navigation
- global visual system and spacing rhythm
- page structure for Home, Portfolio, History, Analysis, DeFi, Staking, and Bridges
- common table, metric strip, filter bar, and action surface patterns
- responsive desktop and mobile behavior
- interaction language for dense portfolio workflows

This redesign does not change:

- portfolio math
- transaction normalization logic
- analytics formulas
- cross-chain data-fetching boundaries

The objective is to change presentation, hierarchy, usability, and coherence, not to rewrite the financial engine.

## Product Direction

PulsePort should move away from the current hybrid “dashboard plus cards plus experiments” feel and toward a single dark workstation model:

- quieter shell
- denser but calmer work surfaces
- fewer decorative panels
- stronger table-first workflows
- clearer page roles
- more professional investor/trader feel

The user approved:

- whole-app redesign, not page-only restyling
- dark-first visual system
- mostly monochrome interface with restrained PulsePort/PulseChain accent
- hybrid summary home page
- left rail navigation retained, but slimmer and quieter
- OKX used as design reference, not as a literal clone

## Reference Analysis: What To Take From OKX

The provided OKX Wallet screens consistently show:

- black/graphite background with low-noise framing
- large value header with direct actions
- compact time range and scope controls
- equal-weight metric cards in a single band
- dense transaction and portfolio tables
- extremely restrained use of color
- simple, legible filter chips
- large amounts of empty space used intentionally to calm dense data

Patterns worth carrying over:

- quiet dark shell
- short metric strip
- table-first history and holdings views
- strong scan order: header -> KPIs -> controls -> table
- compact segmented controls
- right-aligned action utilities

Patterns not to copy directly:

- exact navigation architecture
- exchange brand feel
- generic CEX product identity
- metrics that do not map to PulsePort’s actual data model

## Design Decision Framework

Every layout and interaction in this redesign follows five tests.

### 1. Purpose

If a surface does not help the user understand state, evaluate risk, or take a next action, it should not exist.

### 2. Hierarchy

Wallet value, PnL, and operating controls must be obvious on first scan. Secondary analysis should support the decision, not compete with it.

### 3. Context

Home, Portfolio, History, and Analysis must look like one system with different jobs, not different apps.

### 4. Accessibility

Dense does not mean hard to read. The redesign must preserve contrast, focus states, readable numeric typography, and touch-friendly controls.

### 5. Performance

The design should reduce visual and rendering overhead:

- fewer decorative wrappers
- fewer stacked panels
- simpler shadows
- clearer component reuse

## Information Architecture

The app should be reorganized around four primary investor surfaces and supporting specialist surfaces.

### Primary Surfaces

- `Home`
- `Portfolio`
- `History`
- `Analysis`

### Specialist Surfaces

- `DeFi`
- `Staking`
- `Bridges`

### Future Surfaces

- `Whales`
- `Smart Money`

These future pages should inherit the same workstation system rather than inventing a new visual language later.

## Navigation Model

### Left Rail

The app should keep a desktop left rail, but make it significantly quieter.

Requirements:

- icons plus short labels
- reduced width compared with the current shell
- lower visual contrast than the content surface
- active item highlighted with restrained accent and stronger text
- clear grouping by function

Recommended groups:

- `Workspace`
  - Home
  - Portfolio
  - History
  - Analysis
- `Positions`
  - DeFi
  - Staking
  - Bridges
- `Signals` later
  - Whales
  - Smart Money

### Top Utility Bar

The top bar should carry operational controls, not page identity.

Content:

- wallet scope
- network scope
- global search
- refresh
- API/data health
- theme

This should be compact and stable across the app.

## Visual System

### Color

The redesign should be mostly monochrome dark.

Base palette:

- near-black background
- charcoal panels
- muted gray dividers
- soft white text

Accent model:

- one restrained PulsePort/PulseChain accent
- chain colors only for small semantic cues
- gain/loss colors only for market meaning

Color should be used for information, not decoration.

### Typography

Typography should support dense financial reading:

- large bold wallet value
- compact numeric table type
- small uppercase support labels
- clear visual separation between labels and values

Avoid theatrical display typography. The tone should be precise and mature.

### Surfaces

The app should use a smaller set of repeatable surface types:

1. `Shell background`
2. `Raised work surface`
3. `Utility control surface`
4. `Metric strip card`
5. `Dense table container`

These surfaces should differ through:

- spacing
- subtle elevation
- border treatment
- background tone

not through loud gradients or varied card styles.

## Interaction Language

The interaction model should feel like a workstation:

- hover states are subtle
- active states are precise
- expansion reveals are smooth but short
- filters are crisp segmented controls, not playful chips
- empty states are quiet and useful

Micro-interaction rules:

- table row hover: slight background lift
- selected filter: darker fill + accent edge or text
- modal open: fast fade/slide, not dramatic
- expandable rows: contained reveal beneath the row

## Page Layout Model

## Home

Purpose:
One-screen operating summary.

Order:

1. wallet identity header
2. compact time range and scope controls
3. KPI strip
4. three operating bands:
   - Portfolio
   - History
   - Analysis

This should be a hybrid summary page, not a loose card collage.

## Portfolio

Purpose:
Current holdings workspace.

Order:

1. compact holdings header
2. scope controls
3. dense holdings table
4. expandable detail rows
5. attribution and cost basis detail

This page should become the cleanest representation of what the user actually owns.

## History

Purpose:
Transaction workbench.

Order:

1. compact PnL/flow header
2. dense filter bar
3. table-first ledger
4. row-level provenance and drill-downs

This is where PulsePort’s transaction depth should be made visually credible.

## Analysis

Purpose:
Investor/trader decision support.

Order:

1. performance header
2. KPI strip
3. analysis bands:
   - PnL
   - trade behavior
   - rotation alpha vs PLS
   - risk and diversification
   - best/worst performer
   - DCA tracker
   - chain and bridge context

This page should feel like the strategic layer of the app, not an experiment page.

## DeFi / Staking / Bridges

Purpose:
Specialist position pages that still belong to the same system.

Pattern:

- concise header
- short KPI strip
- controls
- dense table or list surface

## Shared Components

The redesign should standardize around the following reusable UI primitives:

- `AppShell`
- `RailNav`
- `TopUtilityBar`
- `WalletHeader`
- `MetricStrip`
- `ControlBar`
- `WorkSurface`
- `DenseTable`
- `SectionTabs`
- `EmptyState`

Each primitive should be reusable across multiple pages.

## PulsePort-Specific Identity

The design should not erase what makes PulsePort useful.

PulsePort identity should show up through:

- stronger provenance and source transparency
- explicit PulseChain-native workflows
- cost-basis-aware portfolio truth
- chain-aware portfolio segmentation
- future whale and smart-money modules

The app should feel cleaner than it does now, but more serious and more PulseChain-native than a generic exchange wallet.

## Smart Money And Whale Tracker Fit

These features are not bolt-ons. They should be anticipated in the design.

Best fit:

- smart-money alerts in `Analysis`
- whale flows in `History` and `Analysis`
- optional dedicated `Signals` group later if density grows

This keeps the app coherent and prevents new alpha features from becoming isolated gimmicks.

## Rollout Strategy

The safest rollout order is:

1. shell and tokens
2. Home
3. Portfolio
4. History
5. Analysis
6. specialist pages
7. future signal pages

This allows the app to feel more coherent early while preserving the existing financial engine.

## Success Criteria

The redesign is successful if:

- the app feels like one product instead of several design directions
- Home, Portfolio, History, and Analysis form a coherent operating system
- dense data feels easier to scan, not harder
- tables become the most trustworthy surfaces in the app
- PulsePort keeps its analytical depth while gaining a cleaner, more premium feel
