---
title: "Globular Cluster 3D Explorer"
date: 2025-12-30
tags: [globular-clusters, pulsars, visualization, astronomy]
description: "A 3D map of Milky Way globular clusters and their pulsars that you can fly through in the browser."
---

If you work with globular clusters a lot, it is very easy to lose track of where everything actually sits in the Milky Way. You stare at catalog tables, RA and Dec, galactic coordinates, distances in kiloparsecs, dispersion measures, metallicities. You know the numbers, but they do not always turn into an intuitive mental picture.

So I wrote a 3D explorer.

The **[Globular Cluster 3D Explorer](/globular-clusters-3d.html "external")** page on this site is a self contained Three.js scene that puts the Milky Way (a fake rendition to get spatial orientation), its globular clusters and their pulsars into a single interactive view that runs in the browser. All the data comes from published catalogs like **[Baumgardt & Vasiliev (2021)](https://ui.adsabs.harvard.edu/abs/2021MNRAS.505.5957B/abstract)** for cluster properties and Paulo C. C. Freire's **[globular cluster pulsar database](https://www3.mpifr-bonn.mpg.de/staff/pfreire/GCpsr.html)** for pulsar parameters.

## Why I built this

There are three audiences in my head when I work on this page.

1. **Myself as a researcher**  
   I want to see, at a glance, where the clusters I care about actually live in the Galaxy.  
   - How far from the Galactic center are they?  
   - How far above or below the plane?  
   - Which ones are close to the Sun in 3D, not just close on the sky?

2. **Students and visual learners**  
   When I explain what I do, I do not want to throw a wall of coordinates at them. I want them to fly around a fake Milky Way, click on a cluster, and see real numbers update in an information panel.

3. **Other astronomers**  
   I want this to be a practical tool, not only a pretty demo. You should be able to type the name of a cluster, get its parameters, and cross check that with your own work or planning.

## What the page shows

On the surface it looks like a galaxy made of particles with a cloud of golden clusters and pink pulsars floating around it. Under the hood it is doing a bit of good coordinate work.

- The Milky Way disk and bulge are a particle based model, just for context.  
- Each globular cluster is placed at a 3D position using catalog distances and galactic coordinates.  
- Pulsars associated with clusters are drawn as smaller points tied to their host cluster. Coloured according to type (e.g. binary vs isolated).
- You can toggle different reference planes to help with orientation:
  - Galactic plane  
  - Equatorial plane  
  - Ecliptic plane  
  - A line from the Sun

The camera is fully interactive. You can orbit, zoom, and pan the scene to get a feel for where things really are. Escape button goes back to your previous view. I love clikking on a cluster, then clicking on locate sun to see where I am relative to it and then clicking escape to go back to the cluster. The interaction is smooth and responsive even on modest hardware (might start your GPU fans though XD).

## The UI and search

This is not only a spinning globe of dots. It has a proper interface.

- A search bar lets you type cluster names or pulsar names (for example "NGC 104" or a specific cluster ID).  
- When you pick a cluster, a detailed panel opens:
  - an image of the cluster -- clickable to open in full resolution
  - basic identifiers  
  - distance from the Sun and Galactic center  
  - magnitudes and structural radii  
  - coordinates in several systems  
  - a list of known pulsars in that cluster, each with key parameters

There is also an astronomer drawer with filters so you can slice the population by distance, mass, pulsar content and text queries. That part is deliberately opinionated toward the questions I care about, but it is also useful for exploring the catalog as a whole. If you need something more custom, send me a message.

## Outreach and teaching

A big motivation for this project was outreach. I meet a lot of students who learn visually first and numerically second.

For them, being able to:

- see the globular cluster system wrapped around a simple Milky Way model  
- click on "their" cluster and watch its panel light up  
- notice which clusters hug the disk and which plunge through the halo  

is often more powerful than any amount of static plots.

Because the page lives as a single HTML file, I can open it in a classroom, on a projector, or send it as a link that runs on a modest laptop. No special software beyond a modern browser.

## A tool for working astronomers

Underneath the outreach layer, this is also a real tool for me and for other astronomers.

It helps with questions like:

- Which clusters at a given DM and distance are visible from a particular latitude?  
- Where are the clusters with many known pulsars relative to the Galactic center or the Sun?  
- Are there interesting outliers in position or properties that are easier to spot in 3D than in a table?

The page includes a small "observer" section where you can set an observing location and get alt/az information for a selected cluster. That is a simple feature, but it closes the loop between catalog and telescope in a satisfying way.

## How it fits into the rest of the site

The 3D explorer sits next to my more technical project and research pages. It is a bridge between those two worlds.

- If you land here as a student, you can use it to build an intuition for globular clusters and then jump into the written posts.  
- If you land here as an astronomer, you can use it as a quick sanity check or a way to communicate your own work to others.

From a code point of view it is a single, slightly overgrown HTML file that uses Three.js, custom shaders and a fair amount of UI work to keep everything responsive and legible. From a personal point of view it is the closest thing I have to a "here is what I actually do" page for people who think best in pictures.

There is still a long list of things I want to add: better provenance overlays, more cluster level plots, and tighter links back into my search pipelines. But even in its current form, it already does what I hoped. It makes the globular cluster system feel like a real place rather than just numbers on a screen.
