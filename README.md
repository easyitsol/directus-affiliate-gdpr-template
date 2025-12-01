# Next.js Affiliate Marketing Template with Directus Integration

This is a **Next.js-based Affiliate Marketing Template** fully integrated with [Directus](https://directus.io/). Based on the robust CMS Starter, this version is supercharged with affiliate-specific tools (like product-comparisions tables), privacy-first analytics (**Matomo**), and legal compliance integration (**CMP**).

It offers a scalable solution for building high-conversion review sites, blogs, and comparison portals while maintaining full data ownership and GDPR compliance.

## **Features**

### Core Tech Stack

  - **Next.js App Router**: Uses the latest routing architecture for layouts and dynamic performance.
  - **Full Directus Integration**: Manage content, affiliate links, and relational data via the Directus API.
  - **Tailwind CSS & Shadcn**: Rapid UI styling with pre-built, customizable modern components.
  - **TypeScript**: Ensures type safety and reliable code quality.

### 🚀 Affiliate & Marketing Enhancements

  - **Matomo Analytics Integration**: Built-in, privacy-friendly tracking. configured to track page views and outbound affiliate clicks automatically.
  - **Consent Management Platform (CMP)**: Pre-configured logic for CMP scripts (e.g., Cookiebot, Usercentrics) to handle GDPR/CCPA compliance.
  - **Conversion-Focused Blocks**: Includes specific CMS blocks for **Comparison Tables**, **Pros/Cons Lists**, and **Sticky CTA Headers**.
  - **Smart Link Management**: Centralized management of affiliate links via Directus to easily swap URLs across the site.
  - **Optimized Dependency Management**: Project is set up with **pnpm** for speed and efficiency.

-----

## **Why pnpm?**

This project uses `pnpm` for managing dependencies due to its speed and efficiency. If you’re familiar with `npm`, you’ll find `pnpm` very similar in usage. You can still use `npm` if you prefer by replacing `pnpm` commands with their `npm` equivalents.

-----

## **Analytics & Compliance**

### **Matomo Integration**

This template comes pre-wired for Matomo. Unlike Google Analytics, Matomo allows for 100% data ownership—crucial for affiliate marketers.

  - **Event Tracking**: Automatically tags outbound clicks on affiliate links with `data-track-content`.
  - **Privacy**: Configurable to run in cookie-less mode or wait for CMP consent.

### **CMP (Consent Management)**

A dedicated script loader is included to inject your Consent Management Platform (CMP) of choice. This ensures your affiliate cookies and tracking scripts are only loaded after user consent, keeping you compliant with EU/US regulations.

-----

## **Draft Mode & Live Preview**

Directus allows you to work on unpublished content using **Draft Mode**. This template supports:

  - **Real-time Editing**: See changes to your affiliate reviews or comparison tables instantly.
  - **Security**: Uses a secure token to allow previews even on production builds without exposing draft content to the public.

*See [Directus Live Preview Guide](https://docs.directus.io/guides/headless-cms/live-preview/nextjs.html) for deep-dive configuration.*

-----

## **Getting Started**

### Prerequisites

To set up this template, ensure you have the following:

  - **Node.js** (18.x or newer)
  - **npm** or **pnpm**
  - Access to a **Directus** instance
  - A **Matomo** instance (Cloud or Self-Hosted)
  - (Optional) A CMP ID (e.g., Cookiebot ID)

## ⚠️ Directus Setup Instructions

1.  **Schema Import**: Import the provided schema snapshot into your Directus instance to generate the specific affiliate collections (Products, Partners, Reviews).
2.  **Permissions**: Ensure the Public role has read access to the new collections.

## 🚀 One-Click Deploy

You can instantly deploy this template using one of the following platforms:

[](https://www.google.com/search?q=https://vercel.com/new/clone%3Frepository-url%3Dhttps://github.com/your-repo/affiliate-starter)

[](https://www.google.com/search?q=https://app.netlify.com/start/deploy%3Frepository%3Dhttps://github.com/your-repo/affiliate-starter)

### **Environment Variables**

To get started, configure your environment variables.

1.  **Copy the example environment file:**

    ```bash
    cp .env.example .env
    ```

2.  **Update the following variables in your `.env` file:**

    **Directus Settings:**

      - `NEXT_PUBLIC_DIRECTUS_URL`: URL of your Directus instance.
      - `DIRECTUS_PUBLIC_TOKEN`: Public token for accessing public resources.
      - `DIRECTUS_FORM_TOKEN`: Token for handling contact/newsletter forms.
      - `NEXT_PUBLIC_ENABLE_VISUAL_EDITING`: Enable visual editing in Directus.
      - `DRAFT_MODE_SECRET`: Secret token for live preview.

    **Affiliate & Analytics Settings:**

      - `NEXT_PUBLIC_SITE_URL`: The public URL of your site (used for SEO/OG Tags).
      - `NEXT_PUBLIC_MATOMO_URL`: The URL to your Matomo instance (e.g., `https://analytics.mysite.com`).
      - `NEXT_PUBLIC_MATOMO_SITE_ID`: The ID of your site in Matomo.
      - `NEXT_PUBLIC_CMP_ID`: Your Consent Management Platform ID (if using the built-in loader).

## **Running the Application**

### Local Development

1.  Install dependencies:

    ```bash
    pnpm install
    ```

2.  Start the development server:

    ```bash
    pnpm run dev
    ```

3.  Visit [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000).

## Generate Directus Types

To ensure your TypeScript interfaces match your specific Affiliate schema in Directus:

1.  Ensure your `.env` file is connected to your Directus instance.
2.  Run:
    ```bash
    pnpm run generate:types
    ```

-----

## Folder Structure

Updated structure highlights **Analytics** and **Affiliate Components**:

```text
src/
├── app/                              # Next.js App Router and APIs
│   ├── blog/                         # Blog-related routes
│   │   ├── [slug]/                   # Dynamic blog post route
│   │   │   └── page.tsx
│   ├── [permalink]/                  # Dynamic page route
│   │   └── page.tsx
│   ├── api/                          # API routes for draft/live preview and search
│   │   ├── draft/                    # Routes for draft previews
│   │   │   └── route.ts
│   │   ├── search/                   # Routes for search functionality
│   │   │   └── route.ts
│   ├── layout.tsx                    # Shared layout for all routes
├── components/                       # Reusable components
│   ├── blocks/                       # CMS blocks (Hero, Gallery, etc.)
│   │   └── ...
│   ├── forms/                        # Form components
│   │   ├── DynamicForm.tsx           # Renders dynamic forms with validation
│   │   ├── FormBuilder.tsx           # Manages form lifecycles and submission
│   │   ├── FormField.tsx             # Renders individual form fields dynamically
│   │   └── fields/                   # Form fields components
│   │   └── ...
│   ├── layout/                       # Layout components
│   │   ├── Footer.tsx
│   │   ├── NavigationBar.tsx
│   │   └── PageBuilder.tsx           # Assembles blocks into pages
│   ├── shared/                       # Shared utilities
│   │   └── DirectusImage.tsx         # Renders images from Directus
│   ├── ui/                           # Shadcn and other base UI components
│   │   └── ...
├── lib/                              # Utility and global logic
│   ├── directus/                     # Directus utilities
│   │   ├── directus.ts               # Directus client setup
│   │   ├── fetchers.ts               # API fetchers
│   │   ├── forms.ts                  # Directus form handling
│   │   ├── generateDirectusTypes.ts  # Generates Directus types
│   │   └── directus-utils.ts         # General Directus helpers
│   ├── zodSchemaBuilder.ts           # Zod validation schemas
├── styles/                           # Global styles
│   └── ...
├── types/                            # TypeScript types
│   └── directus-schema.ts            # Directus-generated types
```
