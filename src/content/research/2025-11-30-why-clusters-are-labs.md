---
title: Why globular clusters are the best pulsar labs
date: 2025-11-30
description: High encounter rates make exotic binaries and the timing is fun.
tags: [globular-clusters, binaries]
---

Globular clusters compress the interesting part of stellar evolution into a dense environment.

1. Encounters swap companions.
2. Compact binaries form efficiently.
3. Accelerations are extreme (and measurable).

That combination turns pulsars into precision probes of dynamics and gravity.

If you have ever tried to explain to someone why pulsars are such absurdly good clocks, you probably reach for the usual line: neutron stars spin fast, their beams sweep past us, and the pulse arrival times can be measured with ridiculous precision. All true. But for a timing person, the real magic is what happens when you place that clock in an environment that keeps poking it, tugging it, and throwing it into weird orbits. That is what globular clusters do. They take a clean laboratory instrument and put it inside a bustling physics department hallway.

In the Galactic field, most binaries live quiet lives. In a globular cluster, “quiet” is not really an option. The stellar density can be enormous, up to orders of magnitude above the Solar neighbourhood, and that means encounters are not rare accidents, they are part of the ecosystem. When you live in that kind of crowd, binaries get exchanged, hardened, perturbed, and sometimes upgraded into systems that you would almost never produce through isolated evolution alone. 

The result is that globular clusters do not just give you more pulsars. They give you *specific kinds* of pulsars that are disproportionately valuable for timing.

One reason is the compact-binary factory effect. Close encounters do a brutal but efficient kind of “selection”, driving the formation of exotic binaries and ultra compact systems. These are exactly the systems where relativistic effects are loud: periastron advance, Shapiro delay, orbital decay, and all the timing terms we love because they let us turn a timing model into a physics statement. In COMPACT, the core idea is to lean into this and search for binaries with orbital periods of minutes to hours, because those are the ones that crank up gravitational radiation and relativistic signatures. 

There is also a second advantage that is almost too practical to be romantic: distance. For some of the best gravity tests, “boring” systematics like distance can become the limiting factor. Globular clusters have well constrained distances compared to many field pulsars, and that changes the game for any measurement where kinematic or geometric effects compete with the intrinsic signal. In the COMPACT project framing, clusters help remove one of the major bottlenecks that can limit how far we can push certain strong field tests with timing.  

Of course, clusters come with their own complications. The cluster potential introduces additional accelerations, and if you are doing precision timing you cannot pretend the environment is a small perturbation. But I actually think this is part of why clusters are such good labs: the timing is not just a gravity test or just an orbital solution. It becomes a combined measurement of the pulsar, its binary, and the cluster dynamics. In a good case, you do not just get “a pulsar”, you get a tracer particle for the cluster potential, and sometimes a whole population of tracers.

This is also why the search side is hard, and why it is fun. The same accelerations that make cluster binaries juicy for timing also smear signals in the Fourier domain and punish simplistic searches. Traditional pipelines often have to compromise: a limited number of DM trials, incoherent dedispersion, acceleration or jerk approximations, and all the shortcuts we take when compute is the bottleneck. Those compromises can quietly bias us away from exactly the compact systems we want most.  

That is where modern wideband receivers and compute-heavy methods matter. On the Effelsberg side, the Ultra Broadband Receiver covers roughly 1.3 to 6 GHz, and combined with the backend it enables search-mode and baseband strategies that let us do coherent dedispersion in a way that is simply not feasible in many older surveys. It also opens up higher frequency searches (above 3 GHz) that can be genuinely helpful when low frequency emission is obscured by companions or messy propagation effects.  

In the COMPACT ecosystem, there is a parallel push on the compute and workflow side: distributed processing across dedicated clusters, coherent dedispersion and beamforming as early steps, and pipeline orchestration that looks more like modern data engineering than a single machine running PRESTO overnight. The point is not “bigger computers are cool”. The point is that the discovery space we care about (short orbital period binaries, very fast rotators, heavily dispersed signals) lives behind a compute wall, and clusters are one of the best places to go looking once you have the tools to climb it.

So when I say globular clusters are the best pulsar labs, I mean it in a very literal way. They manufacture the exotic systems we want, they amplify the relativistic signals we can measure, and they add a dynamical environment that turns timing into something richer than “just” a clock experiment. **The price is complexity, but that complexity is exactly where the new science is hiding.**

And honestly, there is something satisfying about it: in the field you might wait for a rare system to show up. In a globular cluster, the cluster itself is doing the population synthesis in real time. Our job is to catch the signals, and then let the timing tell us what kind of story the cluster has been writing.