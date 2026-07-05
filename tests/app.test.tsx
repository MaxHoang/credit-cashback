import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import App from "../src/App";

describe("App flow", () => {
  it("shows the home category grid + disclaimer on load", () => {
    render(<App />);
    expect(screen.getByText(/không phải lời khuyên tài chính/i)).toBeInTheDocument();
    expect(screen.getByText("Bảo hiểm")).toBeInTheDocument();
  });

  it("picking Bảo hiểm shows MB JCB Ultimate ranked first", () => {
    render(<App />);
    fireEvent.click(screen.getByText("Bảo hiểm"));
    expect(screen.getByText("MB JCB Ultimate")).toBeInTheDocument();
  });

  it("searching 'Shopee' routes to the online-shopping ranking", () => {
    render(<App />);
    const input = screen.getByPlaceholderText(/tìm danh mục hoặc cửa hàng/i);
    fireEvent.change(input, { target: { value: "Shopee" } });
    fireEvent.submit(input.closest("form")!);
    expect(screen.getByText(/Mua sắm online/i)).toBeInTheDocument();
  });
});
