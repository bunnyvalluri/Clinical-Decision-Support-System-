# Claude Code Integration Guide — Ruflo Healthcare Meta-Harness

> **Project:** Clinical Decision Support System (BPY-CSE-2666)  
> **Ruflo Version:** 3.42.0

## Quick Reference Commands

- **Run Backend Tests**: `cd backend && .\venv\Scripts\python.exe -m pytest tests/`
- **Run Frontend Quality**: `cd frontend && npm run type-check && npm run doctor:ci`
- **Run Ruflo Security Scan**: `node scripts/ruflo_security_scan.mjs`

## Hard Development Invariants
1. **White-Only UI**: Do not introduce dark mode classes, dark themes, or theme switches.
2. **Mobile Floating Pill Nav**: Preserve bottom floating navigation for all 5 roles.
3. **React Doctor**: Maintain React code quality rules (`npm run doctor`).
4. **PostgreSQL Authoritative**: Never create duplicate databases.
5. **No PHI in Agent Memory**: Strip patient identifiers before processing.
