---
title: "RustyCandyPicker"
date: 2025-12-30
tags: [rust, pulsars, radio-astronomy, tooling]
description: "The little Rust tool I built to help me sift pulsar candidates"
---

Project repo: [Rusty Candipicker](https://github.com/wintervolcano/rusty_candypicker.git)

This was inspired by the candypicker code Dr. Vivek wrote in C++: [Candypicker](https://github.com/erc-compact/CandyPicker.git)

If you have ever run a pulsar search, you know the emotional arc. You press go, the pipeline finishes, and you get a mountain of candidates. For a brief moment it feels like the universe might have handed you something amazing. Then you open the results and remember the truth: most of your time is spent sorting, filtering, and trying not to miss the one interesting thing hiding in a sea of “probably not”.

I wrote **RustyCandyPicker** to make that part a bit less painful.

It is a small command line tool that helps me **sift candidates from pulsar searches** and split them into “picked” and “rejected” outputs so I can focus my attention where it matters. I also built it very intentionally as a **project to learn Rust**, because I wanted to stop reading about Rust and actually write something real with it.

## What the tool actually does

RustyCandyPicker takes pulsar search outputs (the stuff you would normally inspect by hand) and applies a few simple rules so the result set becomes manageable.

The core loop is basically:

- read candidate information from the search output
- apply selection thresholds (the period threshold is the main entry point in the CLI)
- optionally cluster nearby candidates in DM space so you do not see the same thing repeated a dozen times
- write two outputs per input: one file of picked candidates and one file of rejected candidates

None of this is meant to replace careful inspection. It is meant to get you to the point where careful inspection is still possible.

One thing I cared about while writing this was not mangling the data on the way through. I wanted the output files to stay faithful to the inputs, not rewritten in a “kind of similar” format that breaks the next step of someone’s workflow. So if you give a PEASOUP xml file, you get PEASOUP xml files out the other side. If you give a CandyJar csv file, you get CandyJar csv files out the other side. That way you can slot the tool into existing pipelines without breaking everything downstream.

## Why Rust

I picked Rust on purpose. This was a learning project.

I could have written the first version faster in a language I use daily, but I wanted a tool that would be:

- fast enough to run on lots of files without feeling sluggish
- strict enough that I do not accidentally paper over errors
- structured enough that future me can extend it without groaning

Rust is good at forcing those habits. It makes you confront edge cases and error handling early, and that is exactly what you want in a tool that is going to touch a lot of search output files.

## The extra CSV helpers in `src/bin`

Alongside the main candidate picker, I ended up adding two small binaries that work with CSV files. These live in the `bin` folder and they exist for the moments when your candidate lists are already in CSV land, or when you want quick comparisons between runs without writing a new script each time.

### `csv_candypicker.rs`

This is the “CSV version” of the same idea.

Sometimes you export candidates to a CSV, or you have a collaborator who wants a spreadsheet-friendly list (Stop collaborating with them! Now!). In those cases, it is handy to run a simple picker directly on the CSV rather than converting formats again.

What it does in practice:

- reads a candidate list from CSV
- applies straightforward selection rules
- writes a filtered output that is easier to review or share

It is not fancy, but it saves time, and it fits nicely into quick iterations where you are trying different thresholds.

### `csv_matcher.rs`

This one is for the question you ask after every tweak to a search pipeline:

“Did I actually change anything meaningful, or did I just reshuffle noise?”

`csv_matcher.rs` helps compare candidate lists across runs. If you have two CSVs, it helps you see what overlaps, what is new, and what disappeared. That is especially useful when you are tuning parameters and want to make sure the “interesting” candidates remain stable, or when you are checking whether two different methods are flagging the same objects. Or more importantly, whether a follow-up observation has the same candidates as the original search.

## Building and running

If you build it locally, it is the standard Rust workflow:

```bash
cargo build --release
```

That produces the binaries under target/release/. From there you can run the main picker or the CSV helpers depending on what format you are working with.

The exact flags and inputs are documented in the repository README, but the workflow is always the same: point it at your files, set the thresholds, and let it split things into outputs that are easier to handle.

### What I got out of this project

I started this to learn Rust, but it ended up being one of those “small tools that quietly improves your daily life” projects.

It taught me:
- how to structure a real CLI tool in Rust
- how to be disciplined about input parsing and error handling
- how to keep code fast without turning it into unreadable cleverness

And the biggest win is simple: I now have a repeatable way to reduce candidate lists before I sink time into inspection.

### What I want to add next

A few ideas I would like to grow into later:
- clearer summaries after a run (how many picked, how many rejected, and the common reasons)
- more configurable filtering rules while keeping the defaults simple
- more tests around messy or edge-case inputs, because real pipelines always find creative ways to be messy


And as a Rust learning project, it did its job perfectly: it forced me to write careful code, handle real data, and finish something I actually use.

