---
title: "Globular Cluster Pulsar Search"
date: "2025-12-22"
description: "A practical guide to how pulsar searching works in real life — and how the ELDeN-Ring Nextflow pipeline automates the full globular-cluster workflow."
tags: [pulsars, globular-clusters, nextflow, presto, rfi, pipelines]
---

[https://github.com/erc-compact/elden-ring](https://github.com/erc-compact/elden-ring)

## Why globular clusters are a special kind of hard

Globular clusters are pulsar factories — but they’re also *messy* search environments. You’re often dealing with:

- **Millisecond pulsars** (fast, faint, easy to smear).
- **Binary motion** (acceleration smears power in the Fourier domain if you don’t handle it).
- **Crowded candidate space** (lots of “peaks” that look convincing until you fold them).
- **RFI** that can dominate your top candidates unless it’s handled early.

If you’re new to pulsar searching: the goal is not “make a big FFT peak.”  
The goal is: **produce a folded signal that stays coherent and survives skepticism**.

## What ELDeN-Ring is

**ELDeN-Ring** (“Effelsberg Large-scale Data Exploration with Nextflow for Robust Identification of New Globular cluster pulsars”) is a **Nextflow pipeline** designed to run the full search loop reproducibly — from RFI work to search+fold to candidate triage.  [ELDeN Ring](https://github.com/erc-compact/elden-ring)

Think of it as a workflow that turns:

> *raw observation products* → *cleaned data* → *candidates* → *fold plots you can actually trust*

## The search loop, mapped to the pipeline

A real pulsar search is a chain. ELDeN-Ring exposes that chain as entry workflows you can run independently (so you can iterate without rerunning everything).  

### 1) RFI diagnosis and filtering
You can generate per-file **SK/kurtosis diagnostic plots** and build an SK-based RFI mask, then apply cleaning via `filtool`.  

### 2) Search + fold (the “candidate factory”)
Once data are cleaned, the pipeline runs the core search+fold stage on the cleaned products.  

### 3) Candidate triage + re-folding
There’s also a dedicated workflow to **re-fold selected candidates** (e.g., “T1/T2” candidates listed in a `candyjar.csv`) across beams and bands — a very real part of how you turn “interesting” into “convincing.”  

## Entry workflows you’ll actually use

ELDeN-Ring includes these main entry points: 

- `full`: end-to-end **RFI mitigation → search & fold → ML classification**
- `generate_rfi_filter`: generate **SK/kurtosis plots**
- `rfi_clean`: build SK-based RFI mask + run `filtool`
- `run_search_fold`: run search+fold on already cleaned data
- `fold_par`: fold using pre-computed `.par` files
- `candypolice`: re-fold selected candidates from an existing `candyjar.csv` across beams/bands

That structure is *exactly* how you want to learn pulsar searching: **one step at a time, with repeatable outputs**.

## How you run it (high level)

The README’s quick start looks like: clone/pull, copy an example config, prepare an input list, and choose an entry workflow. 

In practice, the two “learning friendly” ways to start are:

- Run `generate_rfi_filter` first (learn what bad data looks like).
- Then run `rfi_clean` → `run_search_fold` (learn what changes when you clean aggressively vs gently).

## What to look for in the outputs

If you’re learning, here’s the mental checklist:

- **RFI products:** do you see broad contamination (whole channels) vs spiky narrowband vs periodic interference?
- **Search candidates:** do the top peaks persist when you change basic preprocessing knobs?
- **Fold plots:** does the signal stay in phase? does it show broadband consistency? are subintegrations stable?
- **Re-folding:** do “promising” candidates survive a better fold (or do they evaporate)?

## Why Nextflow matters (even if you don’t “care about pipelines”)

The science is the same — but pipelines change your *velocity* and your *honesty*:

- You can rerun steps without manual glue.
- You can compare parameter choices cleanly.
- You can scale up when the data volume becomes real.

ELDeN-Ring is built to make the process less fragile and more reproducible — which matters a lot when you’re doing globular cluster work at scale. 
