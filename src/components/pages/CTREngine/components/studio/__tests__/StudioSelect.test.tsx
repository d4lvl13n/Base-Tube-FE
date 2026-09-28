import React, { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { StudioSelect } from "../StudioSelect";

it("opens by click and keyboard and applies a selected value", () => {
  function Example() {
    const [value, setValue] = useState("2");
    return (
      <label>Concepts<StudioSelect
        aria-label="Concepts"
        value={value}
        onChange={(event) => setValue(event.target.value)}
      >
        <option value="1">One</option>
        <option value="2">Two</option>
        <option value="3">Three</option>
      </StudioSelect></label>
    );
  }
  render(<Example />);
  const trigger = screen.getByRole("button", { name: "Concepts" });
  expect(trigger).toHaveTextContent("Two");
  fireEvent.click(trigger);
  expect(screen.getByRole("listbox", { name: "Concepts" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("option", { name: "One" }));
  expect(trigger).toHaveTextContent("One");
  fireEvent.keyDown(trigger, { key: "ArrowDown" });
  expect(screen.getByRole("listbox", { name: "Concepts" })).toBeInTheDocument();
});
