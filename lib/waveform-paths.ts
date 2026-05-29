/**
 * Pre-defined SVG path constants for the morphing waveform display.
 * Designed with the exact same number of command nodes and types (12 quadratic curve points)
 * to ensure Framer Motion can perform mathematically flawless, smooth path morphing.
 *
 * Viewport dimensions: 300 x 48 (Y-midpoint = 24)
 */

// WAVE_1: Gentle sine-like shape with low amplitude (representing normal or quiet background audio)
export const WAVE_1 = 
  "M 0,24 " +
  "Q 12.5,20 25,24 " +
  "Q 37.5,28 50,24 " +
  "Q 62.5,20 75,24 " +
  "Q 87.5,28 100,24 " +
  "Q 112.5,20 125,24 " +
  "Q 137.5,28 150,24 " +
  "Q 162.5,20 175,24 " +
  "Q 187.5,28 200,24 " +
  "Q 212.5,20 225,24 " +
  "Q 237.5,28 250,24 " +
  "Q 262.5,20 275,24 " +
  "Q 287.5,28 300,24";

// WAVE_2: Aggressive peaks and deep troughs (representing a highly active, high-impact audio hook)
export const WAVE_2 = 
  "M 0,24 " +
  "Q 12.5,4 25,24 " +
  "Q 37.5,44 50,24 " +
  "Q 62.5,6 75,24 " +
  "Q 87.5,42 100,24 " +
  "Q 112.5,2 125,24 " +
  "Q 137.5,46 150,24 " +
  "Q 162.5,5 175,24 " +
  "Q 187.5,43 200,24 " +
  "Q 212.5,8 225,24 " +
  "Q 237.5,40 250,24 " +
  "Q 262.5,10 275,24 " +
  "Q 287.5,38 300,24";

// WAVE_3: Mixed energy that spikes heavily at first (first 3 seconds) then trails off into lower levels
export const WAVE_3 = 
  "M 0,24 " +
  "Q 12.5,2 25,24 " +
  "Q 37.5,46 50,24 " +
  "Q 62.5,6 75,24 " +
  "Q 87.5,42 100,24 " +
  "Q 112.5,16 125,24 " +
  "Q 137.5,32 150,24 " +
  "Q 162.5,20 175,24 " +
  "Q 187.5,28 200,24 " +
  "Q 212.5,21 225,24 " +
  "Q 237.5,27 250,24 " +
  "Q 262.5,23 275,24 " +
  "Q 287.5,25 300,24";
