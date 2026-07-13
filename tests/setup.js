import "@testing-library/jest-dom";
import { afterEach, vi } from "vitest";

afterEach(() => {
  vi.restoreAllMocks();
});

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
    refresh: vi.fn(),
  })),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  usePathname: vi.fn(() => "/"),
  useParams: vi.fn(() => ({})),
}));

// Mock next/image
vi.mock("next/image", () => ({
  default: (props) => {
    const { priority, ...rest } = props;
    return { type: "img", props: rest };
  },
}));

// Mock next-themes
vi.mock("next-themes", () => ({
  ThemeProvider: ({ children }) => children,
  useTheme: vi.fn(() => ({
    theme: "light",
    setTheme: vi.fn(),
  })),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
  Toaster: () => null,
}));

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: "div",
    span: "span",
    li: "li",
    button: "button",
    nav: "nav",
    ul: "ul",
  },
  AnimatePresence: ({ children }) => children,
}));

// Suppress console.error in tests (optional)
// vi.spyOn(console, "error").mockImplementation(() => {});
