---
title: "Multiband wideband timing for simultaneous uGMRT observations"
date: "2023-04-25"
description: "A methods paper about doing wideband timing across separated uGMRT bands."
tags: [pulsars, timing, methods, uGMRT, InPTA, TEMPO2]
---

Wideband timing is one of those ideas that quietly changes how you work once you start using it. Instead of measuring a separate time of arrival in each frequency channel and then stitching everything together, you fit a frequency dependent pulse portrait directly and solve, per epoch, for a single ToA and a single DM (and the nuisance terms needed to make that fit honest). It is efficient, it is internally consistent, and it makes it much harder for profile evolution to masquerade as timing structure.

The catch is that wideband timing is usually described for one continuous band, like a clean chunk of spectrum from ν_low to ν_high. With the upgraded GMRT, many of our PTA style observations are not like that. They are simultaneous in two bands with a substantial gap in between, commonly Band 3 and Band 5. In practice that means the pulse shape can evolve a lot between the two bands, and the gap breaks the mental picture of a single smooth portrait.

[This paper](https://inspirehep.net/files/ce60560a742edc388774be13f295b92e) is about how we made wideband timing behave in that multiband, gappy reality, and how we tested it on real uGMRT data. The motivating goal was simple: if the telescope gave us a simultaneous two band observation, we wanted to extract timing information as a single coherent measurement, not as two loosely coupled ones.

## What we actually fit

Think of each band as its own portrait, with its own profile evolution across that band. The timing parameters you care about (ToA and DM for that epoch) should be shared because the signal is the same pulsar at the same time. The difficulty is making sure your model does not force a single smooth evolution across the band gap.

We explored two practical strategies.

### 1) Concatenated Portrait (CP)

In the CP approach, you take the two portraits and treat them as one combined portrait by placing them next to each other in frequency space. Then you run the usual wideband likelihood on that combined data product. It is the most direct extension, and it is a useful baseline because it tells you what happens when you insist on one portrait spanning a discontinuity.

![CP method result](/posts/multiband-wb/CP_result.png)

### 2) Constrained Combination (CC)

In the CC approach, you keep the two bands as two separate portraits, but you fit them together with shared ToA and DM (and any other epoch level parameters you decide are shared). Each band is allowed to have its own internal portrait behaviour and nuisance terms, but the timing parameters are constrained to be common across both. Conceptually it is closer to what the instrument really did, two simultaneous measurements tied together by physics.

Both approaches are reasonable ways to ask the same scientific question. The point of the paper is not to declare a single winner in all situations, but to show the regimes where each behaves well and to give a path that researchers can actually use in production.

![CC method result](/posts/multiband-wb/CC_result.png)

## Implementation notes (for people who will run this)

We implemented the wideband likelihood in TEMPO2 using LIBSTEMPO in Python. That choice was deliberate. PTA analysis lives and dies by reproducibility and by not breaking your established timing workflow. The methods are designed to slot into the tools people already use rather than becoming a separate pipeline that is hard to maintain.

The practical output of the fit, per epoch, is a ToA and a DM that were estimated using both bands simultaneously.

![TOA residuals from both methods](/posts/multiband-wb/TOAs.png)

## What improves when you use both bands

The big win is the dispersion measure estimate. A wider frequency lever arm tightens the DM constraint, and that matters for PTA quality data where DM variations can leak into residual structure if you chase them with per band ToAs or with under constrained models. If you can measure DM more cleanly per epoch, you take pressure off the rest of your timing model.

At the same time, we paid attention to the failure modes. When the gap is large and the profile evolution between bands is strong, forcing everything into one portrait can become fragile. In that regime, the constrained combination approach tends to be more robust because it does not pretend the gap is part of a continuous evolution. It simply uses the two bands as two portraits that must agree on the underlying ToA and DM.

![DM uncertainty comparison](/posts/multiband-wb/Table.png)

We validated the methods in two steps. First we used a very well behaved millisecond pulsar as a sanity check case to ensure the fitted parameters behave as expected and the uncertainties are reasonable. Then we applied the method across the InPTA DR1 uGMRT sample with simultaneous Band 3 and Band 5 observations to test how it behaves in a realistic population, with a mix of pulse shapes, S/N, and profile evolution.

This part of the paper is where the method stops being a nice idea and becomes something I personally trust. When you see the same conclusions repeat across many pulsars, and when the behaviour lines up with your intuition about lever arm, S/N, and evolution, it starts to feel like a tool you can hand to someone else without a long warning label.

## Why this matters for PTA timing

From a pulsar timing array perspective, this is about reducing avoidable noise in residuals. Multiband observations are already information rich, and the DM lever arm is a gift. If we do not use it properly, we end up paying for it twice: we lose DM precision and we risk absorbing profile evolution systematics into timing parameters.

Doing the multiband wideband fit properly means each epoch returns a single, physically consistent measurement. That is the unit PTA analyses want. It also helps keep the timing model and the noise model cleaner, because you are not compensating for avoidable inconsistencies introduced upstream.

## If you want to use this in your own timing set

If you are timing uGMRT pulsars with simultaneous separated bands, this is the workflow I would recommend starting from:

- Build per band portraits in the usual way and do not force continuity across the gap.
- Fit the two bands together with shared ToA and DM at the epoch level.
- Use CP as a sanity check or a baseline, but prefer CC when the gap or evolution is large.
- Inspect a handful of epochs visually to ensure the portrait model is not compensating for unmodelled shape changes by moving ToA or DM.

The headline is that multiband data should not feel like two separate observations. It should feel like one high leverage measurement. This methods paper is basically our attempt to make that statement true in a way that is practical, reproducible, and easy to adopt.
