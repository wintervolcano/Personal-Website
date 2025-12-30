---
title: "Globular Cluster Pulsar Search: Building a Pipeline That Can Keep Up"
date: "2025-11-25"
description: "The ELDeN-Ring Nextflow pipeline"
tags: [Pulsars]
---
The code is available here: **[ELDeN-Ring](https://github.com/erc-compact/elden-ring.git)**

When I first started looking for pulsars in globular clusters, the hardest part was not the physics. It was the plumbing.

You point a sensitive radio telescope at a dense ball of stars. It streams terabytes of data. You want to find tiny, repeating pulses buried in radio noise and human made interference. Doing this by hand is impossible. Doing it with a fragile set of shell scripts is only slightly better.

So I built a proper pipeline.

I call it the ELDeN Ring: **Effelsberg Large-scale Data Exploration with Nextflow for Robust Identification of New Globular cluster pulsars.** In this post I want to explain why it exists, what problems it solves, and how the pieces fit together to search for globular cluster pulsars in a way that a single human can still understand.

## Why a pipeline at all?

Globular cluster searches live at the intersection of high physics value and really annoying engineering.

### Data volume

A single observation can produce tens to hundreds of gigabytes. A survey of many clusters multiplies that quickly. Rerunning ad hoc scripts over that much data is not just boring, it is easy to get wrong.

### Compute complexity

For each pointing you need to:

- clean the data for radio frequency interference (RFI)  
- dedisperse over many dispersion measures (DMs)  
- search each dedispersed time series for periodic signals  
- fold and inspect promising candidates

Each of those steps has its own parameters and failure modes.

### Multiple formats and telescopes

Some backends write `dada` voltage streams. Others write filterbank files. You may want to convert between them, split long observations, or stack beams from multi beam receivers. Your code has to understand all of those shapes while still keeping the science logic the same.

### Reproducibility and bookkeeping

If you find an interesting pulsar like signal you want to know exactly which data, DM, beam, and search configuration produced it. You also want to be able to rerun just one stage with different settings instead of pressing the reset button on the entire search.

All of that calls for a workflow engine. Nextflow gives you:

- a way to describe each step as a reusable process  
- channels that connect outputs to inputs in a traceable way  
- automatic parallelism across beams, DMs and segments  
- the ability to resume and to plug into HPC or cloud clusters

The Elden Ring workflow file is the backbone of that system.

## Intake: teaching the pipeline to speak your survey

The first job of the pipeline is to translate human friendly survey descriptions into machine friendly streams of tuples.

### `workflow intake`: FITS and filterbank data

The `intake` workflow reads a CSV where each row describes one observation and normalizes fields such as:

- pointing and cluster name  
- path to FITS or filterbank files  
- beam name and ID  
- UTC start time  
- sky position (RA, Dec)  
- `cdm` or DM information

It also extracts a clean filename from the path. The output is a channel called `orig_fits_channel` that carries tuples of the form:

`pointing, fits_path, cluster, beam_name, beam_id, utc, ra, dec, cdm, filename`

If your data live on tape or in an archive, `intake` can run `syncFiles` first so the rest of the pipeline sees local files.

### `workflow dada_intake`: voltage data and DM fans

For instruments that produce `dada` baseband data, `dada_intake` does the same job:

- it reads a DADA CSV  
- it parses pointing, source path, cluster, beam, UTC, RA and Dec  
- it also parses a list of candidate DMs per row

For each DM it emits a separate tuple, so the rest of the pipeline can treat these as if they were independent observations. This symmetry lets you reuse cleaning and search logic across backends instead of duplicating everything.

## Cleaning: convincing yourself the data is not lying

Every pulsar search talk complains about RFI. In real life you spend a lot of time looking at it. The pipeline gives you two stages for dealing with RFI in a systematic way.

### `workflow rfi_filter`: from metadata to RFI masks

Given the intake channel, `rfi_filter`:

- calls `readfile` to pull detailed metadata from each file  
- either runs `generateRfiFilter` to build fresh RFI masks and plots  
- or uses telescope specific default masks from the configuration

The output is a channel of tuples like:

`pointing, file, cluster, beam, beam_id, utc, ra, dec, cdm, rfi_mask, tsamp, nsamp, ...`

Those masks are used later, and the plots they produce are where you learn which parts of the band are usable.

### `workflow rfi_clean`: apply the mask, keep the bookkeeping

`rfi_clean` then does the actual cleaning:

- if `params.filtool.run_filtool` is true, it calls `filtool` to zap bad channels, optionally downsample, and write cleaned filterbanks  
- if not, it passes through the original files but attaches the right RFI list

The result is `new_fil`, a clean channel of filterbank paths plus pointing and DM metadata. Everything downstream assumes that it is working on these RFI mitigated products.

## Stacking and segmenting: matching the cluster and the compute

You often observe Globular Clusters with multi band receivers. You may want to combine bands that cover the cluster core, and you certainly do not want one long observation to live as one huge job. In this code, we call bands as beams for historical reasons (I made a mistake lol).

### `workflow stack_by_cdm`: building virtual beams

`stack_by_cdm` operates on `new_fil` and:

- groups data by pointing, cluster, UTC, RA, Dec and DM  
- builds a map from `beam_id` to file path inside each group  
- consults `params.stacks`, which defines named stacks as lists of beam IDs  
- for each defined stack, collects the files that exist for that DM

It emits tuples like:

`pointing, cluster, utc, ra, dec, cdm, stackName, [fil_files_for_this_stack]`

`merge_filterbanks` then turns each of these into a combined filterbank. You can think of each stack as a virtual beam/band that has been tuned to the geometry of your receiver but still remembers which raw beams/bands contributed.

### `workflow segmentation`: carving observations into pieces

The `segmentation` workflow prepares data for the periodicity search:

- it takes each cleaned or stacked filterbank  
- it pairs it with each segment configuration listed in `params.peasoup.segments`  
- it runs `segmented_params`, which produces small CSVs with per segment parameters  
- it flattens those descriptions into `peasoup_input`, with fields like:

`pointing, file, cluster, beam, utc, ra, dec, cdm, tsamp, nsamples_per_segment, segment_id, fft_size, start_sample`

This is the point where the work becomes naturally parallel. Each segment and DM combination can be searched independently.

## The search engine: `dm`, `birdies`, `peasoup`, `xml_parse`

Once the data is cleaned, stacked and segmented, the pipeline starts to look like a classic periodicity search, but with much better bookkeeping.

### `workflow search`: from segments to candidate files

`search` wires together several processes:

- `birdies(segmentation)` uses zero DM data to identify known RFI periodicities ("birdies") per observation  
- `dm(bird_out)` and `generateDMFiles` produce DM files that describe how to dedisperse each segment  
- `peasoup(peasoup_input)` runs the core search:
  - dedisperses the data  
  - computes FFTs  
  - searches for periodic signals across the DM grid  
  - writes XML candidate lists and related products

The workflow then groups results by pointing, cluster, beam, DM, segment and other keys, sorts DM and XML lists, and emits a tidy channel called `search_out`.

### `workflow xml_parse`: turning XML into foldable candidates

XML files are not fun to scan by eye. `xml_parse` takes `search_out` and:

- uses `parse_xml` to read each XML file and extract candidate tables  
- flattens those tables so that each candidate becomes a single tuple  
- carries forward filterbank names, start samples and metadata needed for folding

The output channel, `splitcands_ch`, is essentially a clean list of peaks that are ready to be folded.

## Folding and merging: from peaks to profiles

Just because an FFT peak exists does not mean you have a pulsar. Folding is where you start to see whether a candidate is real.

### `workflow fold`: running `psrfold` at scale

Given `splitcands_ch`, `fold`:

- runs `psrfold` on each candidate  
- groups results back by observation and candidate  
- sorts and flattens the lists so that each candidate has:

`pointing, cluster, beam, utc, ra, dec, cdm, fft_size, segment, seg_id, fil_base, first_filtered_csv, [all_archives], [all_candidate_entries]`

You can think of it as "one row per candidate with all the folds we have for it."

### `workflow fold_merge`: collecting the results

`fold_merge` calls `search_fold_merge` to combine fold results that belong together and to produce a single stream of fold products that can be scored and inspected.

## Scoring and the candy jar

By now you have many folded profiles. Some are clean pulsars. Some are RFI that made it through. Some are noise that learned to stand up straight.

### `workflow classify`: alpha, beta, gamma and PICS

`classify` runs two scoring systems on the merged folds:

- `alpha_beta_gamma_test`, a hand built feature set that measures things like profile shape, signal to noise, DM curve behavior and stability across subintegrations  
- `pics_classifier`, a machine learning model that scores candidates using image like features

It joins these results and writes them to a CSV named `alpha_beta_pics_combined.csv` in the base directory. Each row is a candidate with:

- full observation and DM metadata  
- fold level information  
- hand crafted scores  
- machine learning scores

This CSV is the candyjar (written by Dr. Vivek Krishna to make our work easier) input. 

### `workflow candyjar_tarball` and `workflow candypolice`

If `params.alpha_beta_gamma.create_candyjar_tarball` is enabled, `candyjar_tarball` bundles:

- the combined CSV  
- important plots  
- and associated metadata

into a single `.tar.gz` archive that is easy to share or archive.

The `candypolice` workflow reads an existing candy jar CSV, pulls out candidates you care about using `extract_candidates`, and re runs folding and checks on them with `candypolice_pulsarx`. This is the second pass where you try to decide whether something is a real pulsar or a particularly convincing impostor.

## Entry workflows you actually use

The main Nextflow file defines several entry points, so you do not always have to run the full chain.

- `full`  
  End to end from intake through cleaning, search, folding, classification and tarball creation.

- `run_dada_search`  
  DADA voltage data to FITS to RFI clean to search to fold to classify.

- `run_digifits`  
  DADA to FITS conversion only, useful when you are still calibrating that step.

- `run_dada_clean_stack`  
  DADA to FITS to cleaning to stacking by DM, for testing stack definitions.

- `generate_rfi_filter` and `run_rfi_clean`  
  For regenerating RFI masks and applying `filtool` to existing file lists.

- `run_search_fold`  
  For running search and folding on data that has already been cleaned elsewhere.

- `fold_par`  
  A parfile based folding workflow that lets you fold with known timing solutions.

These entry points turn the pipeline into a toolbox rather than a single spell. You can pick the one that matches the question you are asking.

## Why this matters for globular cluster science

Globular clusters pack a huge number of stars into a tiny patch of sky. They are factories for millisecond pulsars because close encounters and exchanges are common. Many of the most precise pulsars used for gravitational wave detection and cluster dynamics live in these environments.

The cost is complexity. Beams overlap. DMs are not always well behaved. Pulsars can be faint and blended with many other signals, and the RFI environment can be harsh.

A pipeline like Elden Ring does not change the underlying physics. It changes your ability to:

- apply the same logic to many clusters without silently drifting  
- rerun specific stages when you learn something new  
- hand your workflow to someone else and have them reproduce your results

If you have ever lost a candidate to a fragile script or to an undocumented manual step, you know why this matters. My goal with this project is to make the globular cluster pulsar search loop feel less like a one off boss fight and more like a system you can learn, refine and trust across many surveys.
