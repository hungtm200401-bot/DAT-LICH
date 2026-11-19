# Validation Guide

Run npm.cmd run dev; then node scripts/verify-central-payments.mjs. The browser test intercepts business APIs with isolated fixtures; no real payment is written. Check desktop/mobile canonical navigation, insufficient/full deposits, cash, refunds, duplicate rejection, uncertain retry and empty state. Screenshots go to outputs/central-payments/.

Run npm.cmd test for the verified build and existing core tests. Record actual results in tasks.md after execution.
