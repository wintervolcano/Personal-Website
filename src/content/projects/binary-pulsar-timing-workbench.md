---
title: "Binary Pulsar Timing Workbench"
date: 2026-03-30
tags: [binary-pulsars, timing, visualization, outreach]
description: "A browser based binary pulsar timing page that lets you play with geometry, TOAs and residuals."
---

Physics can be easy to write down and much harder to make intuitive.

That was my motivation for building the **[Binary Pulsar Timing Workbench](/resources/binary-pulsar-lab)** for the site.
I wanted something I could open in a browser while talking through pulsar timing with students, or just while thinking through the geometry myself. Something where I could change orbital parameters, switch observing frequencies, fit out terms, and immediately see how the TOAs and residuals respond.

It includes an orbital view, a timing residual view, and an epoch-based residual workspace inspired by the kinds of plots people know from tempo2/plk. It is simplified, but I tried to keep the behavior simple: small effects stay small, fitting removes structure the way you would expect, and frequency-dependent delays as best as I could implement.

I also wanted the page to stay clean and usable, without turning into a long lesson. So this ended up feeling less like a demo and more like a small workbench. But still a demo :) 

I also ended up spending a lot more time on the interface than I expected. The hard part was not only the equations. It was making the page sparse enough to feel usable, while still exposing enough controls to make it worth opening. Too much explanation text makes a page feel dead to me, especially for something interactive. So I tried to keep it closer to a small workbench than a lesson page.

It is probably the closest thing on the site to how I actually explain pulsar timing: open a plot, change one thing, and see what moves.