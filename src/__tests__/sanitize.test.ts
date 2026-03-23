import { describe, it, expect } from "vitest";
import { stripHtml, sanitizeStrings } from "../lib/sanitize";

describe("stripHtml", () => {
  it("strips basic HTML tags", () => {
    expect(stripHtml("<b>Hello</b>")).toBe("Hello");
  });

  it("strips script tags and their content", () => {
    expect(stripHtml('<script>alert("xss")</script>text')).toBe("text");
  });

  it("strips inline event handlers", () => {
    expect(stripHtml('<img src="x" onerror="alert(1)">')).toBe("");
  });

  it("strips anchor tags but keeps text", () => {
    expect(stripHtml('<a href="https://evil.com">click</a>')).toBe("click");
  });

  it("removes null bytes", () => {
    expect(stripHtml("hello\0world")).toBe("helloworld");
  });

  it("trims whitespace", () => {
    expect(stripHtml("  hello  ")).toBe("hello");
  });

  it("returns plain text unchanged", () => {
    expect(stripHtml("My MCP server does cool things")).toBe("My MCP server does cool things");
  });

  it("handles nested tags", () => {
    expect(stripHtml("<div><p><b>nested</b></p></div>")).toBe("nested");
  });
});

describe("sanitizeStrings", () => {
  it("strips HTML from all string fields", () => {
    const input = { name: "<b>Server</b>", description: "A <em>cool</em> server", count: 5 };
    const result = sanitizeStrings(input);
    expect(result.name).toBe("Server");
    expect(result.description).toBe("A cool server");
    expect(result.count).toBe(5);
  });

  it("does not modify non-string fields", () => {
    const input = { flag: true, items: ["a", "b"], nested: { x: 1 } };
    const result = sanitizeStrings(input as any);
    expect(result.flag).toBe(true);
    expect(result.items).toEqual(["a", "b"]);
    expect(result.nested).toEqual({ x: 1 });
  });
});
