---
title: Search Mode as an outreach medium
date: 2025-12-15
description: A small training ground for thinking like a pulsar astronomer.
tags: [ui, outreach, pulsars, methods]
---

Search Mode started as a UI experiment: could a personal site double as a tiny, fun environment for learning about pulsar searching? The idea was to build a simplified, game-like overlay that mimics the *shape* of a real pulsar search without trying to be a full survey pipeline. The goal is to give visitors a feel for how pulsar searching works in practice, and what it means to detect a weak periodic signal buried in noise.

It is deliberately not a full survey pipeline. Instead, it borrows the *shape* of the workflow — watching noisy data, looking at the Fourier domain, locking a candidate, confirming or rejecting it — and wraps it in a clean, game‑like interface. The goal is to teach visitors how to think about detection, not to pretend they are running a full survey.

## What Search Mode actually does

When you toggle the site into Search Mode, the screen behaves like a very stripped‑down instrument overlay:

- a synthetic time series is streamed into a small “oscilloscope” panel;
- an FFT (fast Fourier transform) of that time series appears as a spectrum with peaks;
- you can **capture** a plausible peak, and the system tells you if you’ve locked a real injected signal;
- successful detections unlock a discovery card with a pulsar and some metadata.

Under the hood, the signals are tied to real TRAPUM discoveries so that each “fake” detection has a real pulsar on the other end. The interface is the training wheels; the science is real.

Search Mode is described in more detail on the dedicated documentation page — if you want the full design story and a step‑by‑step guide, start there:

- [What is Search Mode?](/search-mode)

## Why an FFT shows up at all

Pulsars are periodic sources. If you have even a slightly decent time series, one of the most natural questions to ask is:

> “Is there any repeating pattern hidden in all this noise?”

The FFT is how we ask that question efficiently. It decomposes the time series into a set of sinusoidal components and tells us how much power sits at each frequency. A sharp periodic signal that is hard to see in the raw time series often appears as a clear peak in the Fourier domain.

In Search Mode, that’s the graph you’re staring at when you look for a spike:

- random noise → relatively flat FFT;
- injected pulsar‑like signal → a localised excess in power at a particular frequency (and sometimes its harmonics) persistent around the region of the pulsar.

The interface encourages you to *read* that spectrum instead of just clicking the brightest spike. The training is about building a mental link between “time series that feels interesting” and “Fourier peak that makes sense”.

## What folding means

Once you have a candidate period from the FFT, the next step in a real search is to **fold** the data: you cut the time series into chunks that are one period long and stack them on top of each other. If the period is correct, the pulses line up and the average profile sharpens. If the period is wrong, the signal smears away.

Folding does two important things:

- it boosts signal‑to‑noise by coherently adding many weak pulses;
- it exposes shape and stability — you can see sub‑integrations, frequency evolution, and whether the profile is behaving like a real pulsar.

Search Mode simplifies this dramatically. When you click a peak, it effectively asks “if I folded the data here, would I recover a sensible pulsar?” and then reveals a synthetic “detection” if the answer is yes. The actual folding work is not done live in your browser; it is implied by the logic of the game.

## How real searches differ

It’s important to say this explicitly: **this is not how full pulsar searches are actually run.**

- In practice, FFT peaks are found by specialised search codes (e.g. PRESTO and friends), not by people dragging a cursor across the spectrum.
- Folding is limited by compute, not by enthusiasm. Surveys generate huge volumes of data, and each trial period and dispersion measure (distance proxy) you test costs CPU and storage.
- A real survey does not produce ten or a hundred candidates — it produces **millions** of candidate plots. The little “postage stamp” plots you see in the Search Mode popups are just one of those: they show profiles, sub‑integrations, and frequency behaviour.

Because the raw candidate count is so high, we rely heavily on machine learning and heuristic ranking to bring the list down to something humans can realistically look at:

- millions of raw candidates from the search;
- machine‑learning models and hand‑crafted scores reduce this to thousands;
- humans then scan those thousands of plots, looking for the few real pulsars hiding in the pile.

Each confirmed detection carries a lot of invisible weight: telescope time, compute, storage, careful software, and human attention. That’s why the Search Mode overlay includes a small, simulated “stats” bar — a hint that every little on‑screen success sits on top of a large, mostly hidden stack of work.

## A proxy teaching environment

Given all that complexity, why build a toy at all? Because the ideas are easier to feel when you can play with them.

Search Mode is deliberately constrained:

- only a handful of synthetic targets compared to a real survey;
- a single FFT panel instead of a forest of diagnostic plots;
- click‑based capture instead of a full searching and folding pipeline.

Within those constraints it tries to be honest about the shape of the job:

- you learn to connect the raw squiggles in time to peaks in frequency;
- you get a sense that not every peak is real;
- you see that detections are rare compared to the amount of “just noise” you scroll past;
- you are pointed toward real pulsars and real metadata, not fictional stars.

If you’re curious about the full design philosophy, or want to use Search Mode as a teaching tool yourself, the **[Search Mode page](/search-mode)** walks through the decisions in more detail and includes a panel‑local demo you can experiment with.
