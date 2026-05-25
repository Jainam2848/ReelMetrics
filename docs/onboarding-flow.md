# Trendoraa User Onboarding Flow Architecture

This document describes the design, implementation, and architectural flow of the **Trendoraa User Onboarding Experience**. 

The onboarding flow is built on two core pillars:
1. **Behavioral Psychology:** Getting creators and businesses to their "first win" (seeing populated analytics and insights) within 60 seconds with minimal friction, using the **Progress Principle** and **Identity Reinforcement**.
2. **Technical Resiliency:** Surfacing platform API failures distinctly from blank workspaces, allowing graceful fallback to a high-fidelity **Sandbox Demo** environment when production OAuth connections are unavailable.

---

## 🗺️ Architectural Workflow Overview

The home dashboard resolves onboarding vs. workspace from SWR account state. **Overview** (shell routing) and **detail** (connect, OAuth errors, sandbox) are split for clarity.

> **Legend:** solid arrows = required UI path · dashed arrows = optional or recovery paths

### Dashboard shell routing

```mermaid
flowchart TB
    subgraph Client["app/(dashboard)/page.tsx"]
        A[User visits /] --> B{useAccounts loading?}
        B -->|yes| C[Full-page spinner]
        B -->|no| D{accounts fetch error?}
        D -->|yes, zero accounts| F[LoadError retry banner]
        D -->|yes, has accounts| G[Dashboard shell + sync alert]
        D -->|no| H{accounts.length === 0?}
        H -->|yes| I[3-step onboarding stepper]
        H -->|no| J[Normal dashboard shell]
    end
```

*Source of truth: `app/(dashboard)/page.tsx`, `components/shared/active-account-context.tsx`.*

### Connect, OAuth callback, and sandbox paths

```mermaid
flowchart TB
    subgraph Step3["Onboarding step 3 — connect or first win"]
        S[User on stepper] --> CH{User action}
        CH -->|Connect Instagram| PF[Pre-flight checklist modal]
        PF --> POST[POST /api/auth/social/instagram]
        POST --> META[Meta OAuth consent]
        META --> CB[Redirect back to app]
        CB -->|URL ?error=| OEB[OAuthErrorBanner strips query]
        CB -->|success| MUT[mutateAccounts]
        CH -->|Explore sandbox demo| DEMO[POST /api/accounts/demo]
        DEMO --> MUT
        OEB -.->|retry connect or use demo| S
    end
    MUT --> J[Exit stepper → populated dashboard]
```

*Source of truth: `components/dashboard/oauth-error-banner.tsx`, `app/api/auth/social/instagram/route.ts`, `app/api/accounts/demo/route.ts`.*

---

## 🔢 The 3-Step Onboarding Stepper

When a user has no connected accounts (`accounts.length === 0`), `app/(dashboard)/page.tsx` mounts the onboarding stepper rather than the default dashboard workspace. 

### 1. Step 1: Content Niche Selection
* **UI Action:** A responsive grid presenting six key content niches: Tech & Gadgets, Comedy & Skits, Business & Finance, Education & How-to, Lifestyle & Vlogs, and Fashion & Beauty.
* **Goal:** Lowers entry friction and establishes the user's creative identity inside the system. 
* **State Persisted:** `niche` state variable.

### 2. Step 2: Growth Goal Selection
* **UI Action:** Creator chooses their primary operational growth metric focus:
  * **Audience Retention** (Hook scroll-stop performance)
  * **Engagement Rate** (Optimize shares/saves)
  * **Active Followers** (Posting schedule velocity)
* **Goal:** Establishes user intent and sets expectations for customized metrics feedback.
* **State Persisted:** `goal` state variable.

### 3. Step 3: Social Connection, Pre-Flight Validation, and Sandbox Fallback
This step offers a highly resilient and supportive social linking portal:
1. **Instagram Connect with Pre-Flight Modal**: Clicking "Connect Instagram" opens an interactive verification checklist. To prevent early failures and Meta API errors, users must confirm two conditions before the Meta Connect button unlocks:
   - **Instagram Business or Creator Profile**: Meta Graph API does not support Personal accounts.
   - **Linked to a Managed Facebook Page**: Instagram must be linked to a Facebook Page the user has administrative rights to.
2. **Setup Linkage Guide**: If the user is unlinked or unsure how to configure these settings, they can toggle an inline, animated guide with detailed instructions for switching profile types and linking accounts on Facebook or Instagram.
3. **Explore Sandbox Demo Account (First-Win Fallback)**: Available in both the main portal and connection guide modal, this allows users to instantly skip setup and seed a high-fidelity mock environment (ingesting `@alice_reels` statistics) with simulated loading logs to prove product value immediately.


---

## 🧪 Sandbox Seeding Mechanics (`POST /api/accounts/demo`)

To provide immediate value without requiring live production authorization, the **Explore Sandbox Demo** button performs the following operational loop:

1. **Wow-Effect Visual Simulation:**
   * Before executing the request, the client runs a simulated progress spinner highlighting core technical steps (e.g., *"Connecting to Trendoraa AI ingestion pipeline..."*, *"Calculating AI Engagement Moat Index..."*). This builds anticipation, reinforcing the Endowment Effect.
2. **API Call (`POST /api/accounts/demo`):**
   * The API first searches the database for the pre-seeded account `alice_reels`.
   * **Success Path:** Links the `alice_reels` Instagram account, strategies, and post data to the currently authenticated `userId`.
   * **Fallback Path:** If the seed was never run, the endpoint dynamically instantiates a mock account `alice_reels` and seeds two high-fidelity mock reels directly to the current user's profile to prevent a blank state.
3. **Re-validation:**
   * On success, the client triggers `mutateAccounts()`, prompting the app to transition instantly from the onboarding stepper to the populated dashboard shell.

---

## 🎨 Personalized Workspace Matching

To prevent an immersion break after onboarding, the home dashboard personalized strategy cards dynamically read the user's selected niche and goal states:

### 1. Topic Strategy Customization
The sample weekly content strategy lists custom topics corresponding directly to the selected niche in Step 1 using a defined constant map:

* **Tech:** *"CSS Grid vs Flexbox"*, *"Setup Gear Unboxing"*
* **Comedy:** *"When the server goes down mid-demo 🎭"*, *"Expectation vs Reality: AI pair programming 💻"*
* **Finance:** *"3 Indicators I watch for market pivots 📈"*, *"How creators structure LLCs 🏢"*
* **Education:** *"How the Transformer Attention Mechanism works 🧠"*, *"Why database indexing drops writes 📊"*
* **Lifestyle:** *"My digital nomad morning setup in Kyoto ✈️"*, *"Co-working spaces that don't feel like cubicles ☕"*
* **Fashion:** *"Aesthetic palette matching for dark-mode desks ✨"*, *"Summer office capsule wardrobe 👗"*

### 2. Goal Highlight Badges
The dashboard bento metric cards map a glowing **`🎯 Goal Focus`** badge onto the metric corresponding to the growth goal chosen in Step 2, focusing the user's eyes on their primary metric target immediately upon entering.

---

## 🛡️ Resiliency & Error Recovery Systems

Production OAuth is highly prone to failures (e.g., user declines permissions, user has a personal instead of a business profile, network timeout). The onboarding UX is safeguarded by two recovery layers:

### 1. `OAuthErrorBanner` (`components/dashboard/oauth-error-banner.tsx`)
* **Behavior:** Reads `?error=` search parameters from the URL upon callback and maps them to clean, plain-language error alerts (e.g., telling the user they need to convert their profile to a Creator/Business account to link Instagram).
* **Self-Cleaning:** Automatically strips the `?error` parameters from the address bar on mount, preventing refreshing the page from repeatedly popping up the alert.

### 2. Retryable Network Failure Banner
* **Behavior:** If `GET /api/accounts` fails with a `500` or a network drop, the dashboard blocks the onboarding wizard from rendering (since the user might actually have linked accounts that we just failed to load). Instead, it shows the `LoadError` retry banner, allowing the user to refresh SWR states.

---

## 📂 Key Code Components

* **`app/(dashboard)/page.tsx`:** Primary client dashboard controller. Coordinates the onboarding stepper state machine, simulated progress syncing, loading state blocks, and personalized strategical widgets.
* **`components/dashboard/oauth-error-banner.tsx`:** Handles translation and self-cleaning dismissal of callback parameters.
* **`app/api/accounts/demo/route.ts`:** Seeding database handler for mock profiles.
* **`components/shared/active-account-context.tsx`:** Coordinates active account state across the entire panel.
