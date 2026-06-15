import { createRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import Feedback from "@/components/Feedback";
import FormSubmitButton from "@/components/FormSubmitButton";
import PasswordInput from "@/components/PasswordInput";

describe("Feedback", () => {
  it("renders nothing without children", () => {
    const { container } = render(<Feedback />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders error state with alert role", () => {
    render(<Feedback>Something failed</Feedback>);
    expect(screen.getByRole("alert")).toHaveTextContent("Something failed");
  });

  it("renders success state with status role", () => {
    render(<Feedback variant="success">Saved</Feedback>);
    expect(screen.getByRole("status")).toHaveTextContent("Saved");
  });

  it("accepts custom className", () => {
    render(<Feedback className="custom-class">Error</Feedback>);
    expect(screen.getByRole("alert")).toHaveClass("custom-class");
  });
});

describe("PasswordInput", () => {
  it("is hidden by default and toggles visibility", () => {
    render(<PasswordInput aria-label="Password" />);
    const input = screen.getByLabelText("Password");
    const toggle = screen.getByRole("button", { name: "Show password" });

    expect(input).toHaveAttribute("type", "password");
    fireEvent.click(toggle);
    expect(input).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "Hide password" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Hide password" }));
    expect(input).toHaveAttribute("type", "password");
  });

  it("toggle button never submits the form", () => {
    const onSubmit = vi.fn((event) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <PasswordInput aria-label="Password" />
      </form>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("supports disabled state and forwarded ref", () => {
    const ref = createRef<HTMLInputElement>();
    render(<PasswordInput ref={ref} aria-label="Password" disabled />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(screen.getByLabelText("Password")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Show password" })).toBeDisabled();
  });
});

describe("FormSubmitButton", () => {
  it("renders normal label", () => {
    render(<FormSubmitButton>Save</FormSubmitButton>);
    expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute("type", "submit");
  });

  it("renders loading label and disables while pending", () => {
    render(<FormSubmitButton isPending loadingText="Saving...">Save</FormSubmitButton>);
    const button = screen.getByRole("button", { name: /saving/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("passes button props", () => {
    const onClick = vi.fn();
    render(<FormSubmitButton type="button" onClick={onClick}>Click</FormSubmitButton>);
    fireEvent.click(screen.getByRole("button", { name: "Click" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
