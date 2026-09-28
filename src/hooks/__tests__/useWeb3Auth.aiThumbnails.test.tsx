import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { useWeb3Auth } from "../useWeb3Auth";
import web3AuthApi from "../../api/web3authapi";
import { createWalletAuthPayload } from "../../utils/walletAuth";
jest.mock("wagmi", () => ({
  useAccount: () => ({ address: "0x1111111111111111111111111111111111111111", isConnected: true }),
  useChainId: () => 84532,
  useSwitchChain: () => ({ switchChain: jest.fn() }),
  useDisconnect: () => ({ disconnect: jest.fn() }),
  useSignMessage: () => ({ signMessageAsync: jest.fn() }),
}));
jest.mock("wagmi/chains", () => ({ baseSepolia: { id: 84532 } }));
jest.mock("../../api/web3authapi", () => ({ __esModule: true, default: { login: jest.fn(), signup: jest.fn(), logout: jest.fn() } }));
jest.mock("../../utils/walletAuth", () => ({ createWalletAuthPayload: jest.fn() }));

/** The connected wallet signs in by itself (the auto-connect in useWeb3Auth), on the page `url`. */
function signInOn(url: string) {
  const [pathname, search = ""] = url.split("?");
  Object.assign(window.location, { pathname, search: search ? `?${search}` : "" });
  function Probe() {
    const { isAuthenticated } = useWeb3Auth();
    const location = useLocation();
    return <output data-testid="where">{`${isAuthenticated ? "signed in" : "signed out"} ${location.pathname}${location.search}`}</output>;
  }
  render(<MemoryRouter initialEntries={[url]}><Probe /></MemoryRouter>);
}
beforeEach(() => {
  localStorage.clear();
  (window as any).__web3AttemptRef = { current: false };
  jest.spyOn(console, "log").mockImplementation(() => undefined);
  (createWalletAuthPayload as jest.Mock).mockResolvedValue({ walletAddress: "0x1111111111111111111111111111111111111111", signature: "0xsig" });
  (web3AuthApi.login as jest.Mock).mockResolvedValue({ user: { id: "wallet-1", username: "0x_11111111", onboarding_status: "PENDING" } });
});
afterEach(() => {
  jest.restoreAllMocks();
  Object.assign(window.location, { pathname: "/", search: "" });
});

it.each(["/ai-thumbnails/sign-in", "/ai-thumbnails/sign-in/factor-one"])("leaves a new wallet account on the AI Thumbnails sign-in page (%s) to that page, never the onboarding screens", async url => {
  signInOn(url);
  // The page then goes to /ai-thumbnails/auth/continue, which completes the onboarding quietly.
  await waitFor(() => expect(screen.getByTestId("where").textContent).toBe(`signed in ${url}`));
});
it("keeps sending a new wallet account from base.tube's wallet page to the wallet onboarding, even with an old AI Thumbnails return", async () => {
  signInOn(`/sign-in-web3?studioReturn=${encodeURIComponent("/ai-thumbnails/generate")}`);
  await waitFor(() => expect(screen.getByTestId("where").textContent).toBe("signed in /onboarding/web3"));
});
