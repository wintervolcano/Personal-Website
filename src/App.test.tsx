import React from "react";
import { describe, it, expect } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import App from "./App";

describe("Fazal's Portfolio Website", () => {
  it("starts in Browse (light) mode with no overlay", () => {
    const { queryByTestId, getByTestId } = render(<App />);
    expect(getByTestId("theme-toggle")).toBeTruthy();
    expect(queryByTestId("search-overlay")).toBeNull();
  });

  it("shows overlay in Search Mode", () => {
    const { getByTestId, queryByTestId } = render(<App />);
    fireEvent.click(getByTestId("theme-toggle"));
    expect(queryByTestId("search-overlay")).toBeTruthy();
    expect(getByTestId("timeseries-canvas")).toBeTruthy();
    expect(getByTestId("fft-canvas")).toBeTruthy();
  });

  it("FFT click captures if not already captured (smoke)", () => {
    const { getByTestId } = render(<App />);
    fireEvent.click(getByTestId("theme-toggle"));
    const fft = getByTestId("fft-canvas");
    fireEvent.click(fft, { clientX: 20, clientY: 10 });
    expect(fft).toBeTruthy();
  });
});
