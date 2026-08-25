import { describe, expect, test } from "bun:test";
import { assertNonEmpty, assertSlug, assertTake } from "../../src/validation.js";

describe("assertNonEmpty", () => {
  test("throws on empty string", () => {
    expect(() => assertNonEmpty("  ", "title")).toThrow();
  });
  test("passes on non-empty string", () => {
    expect(() => assertNonEmpty("hello", "title")).not.toThrow();
  });
});

describe("assertSlug", () => {
  test("accepts valid slug", () => {
    expect(() => assertSlug("my-collection-1")).not.toThrow();
  });
  test("rejects uppercase", () => {
    expect(() => assertSlug("My-Collection")).toThrow();
  });
  test("rejects double hyphen", () => {
    expect(() => assertSlug("my--collection")).toThrow();
  });
  test("rejects leading hyphen", () => {
    expect(() => assertSlug("-collection")).toThrow();
  });
});

describe("assertTake", () => {
  test("defaults to 20", () => {
    expect(assertTake(undefined)).toBe(20);
    expect(assertTake(null)).toBe(20);
  });
  test("rejects out of range", () => {
    expect(() => assertTake(0)).toThrow();
    expect(() => assertTake(101)).toThrow();
  });
  test("accepts valid value", () => {
    expect(assertTake(5)).toBe(5);
  });
});
