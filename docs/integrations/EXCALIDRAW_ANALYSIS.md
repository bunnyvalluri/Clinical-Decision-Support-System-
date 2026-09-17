# Excalidraw Analysis & Clinical Integration Architecture

> **Repository Analyzed:** `https://github.com/excalidraw/excalidraw.git`  
> **Package Evaluated:** `@excalidraw/excalidraw@0.18.0`  
> **Application Target:** HealthNova AI (BPY-CSE-2666) — Clinical Decision Support System  
> **Authoritative Data Store:** Neon PostgreSQL  

---

## 1. Executive Summary & Monorepo Architecture

Excalidraw is an open-source virtual whiteboard and diagramming system designed with a hand-drawn aesthetic, high rendering performance via HTML5 2D Canvas, and a local-first / collaborative data model.

The upstream repository is organized as a pnpm/yarn workspace monorepo:
```
excalidraw/
├── packages/
│   ├── excalidraw/           # Core embeddable React component library (@excalidraw/excalidraw)
│   ├── common/               # Shared constants, types, geometry primitives
│   ├── element/              # Element definitions, resize logic, mutation, bounds
│   ├── math/                 # Mathematical functions, matrix operations, curve collision
│   ├── utils/                # General utility functions, array/object manipulation
│   ├── fractional-indexing/  # Fractional indexing algorithm for ordered element reconciliation
│   └── laser-pointer/        # Real-time pointer trail visualization
├── excalidraw-app/           # Consumer web application (uses Firebase, Vercel, PWA)
├── examples/
│   ├── with-nextjs/          # Next.js App Router dynamic import example
│   └── with-script-in-browser/# Script tag embedding example
└── dev-docs/                 # Internal development guides
```

---

## 2. Package Architecture & Migration to `@excalidraw/excalidraw@0.18.x`

In version `0.18.x`, Excalidraw modernized its package entrypoints:
- **Root Entrypoint (`.`)**: Exports `<Excalidraw />`, `exportToSvg`, `exportToBlob`, `exportToCanvas`, `serializeAsJSON`, `restore`, `reconcileElements`.
- **Stylesheet (`./index.css`)**: Contains essential layout, canvas positioning, font definitions, and UI variables.
- **Deep Types**: Legacy deep imports (`@excalidraw/excalidraw/types/...`) have been superseded by direct root type exports and subpaths (`@excalidraw/excalidraw/element/types`, `@excalidraw/excalidraw/types`).
- **React Compatibility**: Officially supports React 18 and React 19 (`^17.0.2 || ^18.2.0 || ^19.0.0`).

---

## 3. Integration Strategy: Reusable Component vs Monorepo Fork

```
+-------------------------------------------------------------------------------+
|                      REJECTED: Forking Entire Monorepo                        |
| - High maintenance overhead of synchronizing canvas engine updates.           |
| - Unnecessary bloat of Firebase, Google Drive, and cloud hosting glue code.   |
| - Incompatible with strict hospital security and Neon PostgreSQL authority.   |
+-------------------------------------------------------------------------------+
                                      vs
+-------------------------------------------------------------------------------+
|              ADOPTED: Embed Official @excalidraw/excalidraw Package           |
| - Official, security-maintained React component embedded in Next.js 16.       |
| - Custom collaboration layer backed by Django Channels + WebSockets + Redis.  |
| - Neon PostgreSQL as authoritative metadata, versioning, and document store.  |
| - Zero external dependencies on Firebase or public SaaS infrastructure.       |
+-------------------------------------------------------------------------------+
```

---

## 4. Next.js 16 Client-Only Dynamic Loading

Excalidraw depends on browser-only primitives (`window`, `document`, `HTMLCanvasElement`, `requestAnimationFrame`). Attempting server-side rendering causes fatal hydration mismatches and `window is not defined` errors.

### Mandatory Rules for Next.js App Router:
1. **Dynamic Import with `ssr: false`**:
   ```tsx
   const ExcalidrawClient = dynamic(
     () => import("@/features/clinical-whiteboard/components/ExcalidrawClient"),
     { ssr: false, loading: () => <WhiteboardCanvasSkeleton /> }
   );
   ```
2. **Parent Container Non-Zero Height**:
   Excalidraw renders with `position: relative; width: 100%; height: 100%`. If the parent container does not possess an explicit height, the canvas collapses to `0px` height.
   ```tsx
   <div className="w-full h-[calc(100vh-140px)] min-h-[650px] relative bg-white">
     <ExcalidrawClient {...props} />
   </div>
   ```
3. **Mandatory Light Theme Enforcement**:
   To satisfy clinical UI standards and prohibit dark mode, the component must be explicitly initialized with `theme="light"` and hide internal theme toggles.

---

## 5. Document Serialization & Schema

Excalidraw documents serialize to clean JSON matching schema version 2:
```json
{
  "type": "excalidraw",
  "version": 2,
  "source": "https://healthnova.ai",
  "elements": [
    {
      "id": "node_sepsis_protocol_1",
      "type": "rectangle",
      "x": 120,
      "y": 80,
      "width": 240,
      "height": 90,
      "angle": 0,
      "strokeColor": "#0284c7",
      "backgroundColor": "#f0f9ff",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "strokeStyle": "solid",
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": { "type": 3 },
      "seed": 1049281,
      "version": 4,
      "versionNonce": 8392183,
      "isDeleted": false,
      "boundElements": null,
      "updated": 1726560000000,
      "link": null,
      "locked": false,
      "customData": {
        "clinicalNodeType": "DECISION_STEP",
        "guidelineReference": "SSC-2021-REC-4"
      }
    }
  ],
  "appState": {
    "viewBackgroundColor": "#ffffff",
    "theme": "light"
  },
  "files": {}
}
```

---

## 6. Real-Time Collaboration & Fractional Indexing

In the upstream demo application (`excalidraw-app`), collaboration relies on Firebase Realtime Database. For HealthNova AI:
1. **Transport**: Django Channels over secure WebSockets (`wss://host/ws/whiteboards/<uuid:id>/`).
2. **Coordination**: In-memory Redis channel layers broadcast updates across multi-worker ASGI instances.
3. **Conflict Resolution**: Excalidraw provides `reconcileElements(localElements, remoteElements, localAppState)`. Each element tracks `version`, `versionNonce`, and fractional index order. Conflicts are resolved deterministically without dropping concurrent edits.
4. **Presence**: Pointer coordinates and collaborator display names are cached in Redis with an 8-second TTL to handle abrupt disconnections gracefully.

---

## 7. Healthcare Safety & Regulatory Invariants

1. **Non-Authoritative Status**: Drawn diagrams cannot mutate structured patient records or clinical risk categories. An annotation stating *"Risk = High"* is a diagram element, not a clinical diagnosis.
2. **Zero PHI in Diagram Content**: Real patient identifiers (MRN, SSN, direct vitals) are rejected or flagged before persistence.
3. **Document Limits**:
   - Max Elements: 5,000
   - Max Payload Size: 10 MB
   - Max Image Count: 10 per whiteboard (max 2 MB per image)
4. **Secret Scanning**: Input text is scanned for API keys, bearer tokens, and credentials before persistence or export.
