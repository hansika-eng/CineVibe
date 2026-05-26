import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders cinevibe title", () => {
  render(<App />);
  const heading = screen.getByText(/CineVibe/i);
  expect(heading).toBeInTheDocument();
});
