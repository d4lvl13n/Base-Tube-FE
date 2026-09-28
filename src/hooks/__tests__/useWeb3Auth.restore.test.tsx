import React from "react";
import { render, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { useWeb3Auth } from "../useWeb3Auth";
jest.mock("wagmi", () => ({
  useAccount: () => ({ address: undefined, isConnected: false }),
  useChainId: () => 84532,
  useSwitchChain: () => ({ switchChain: jest.fn() }),
  useDisconnect: () => ({ disconnect: jest.fn() }),
  useSignMessage: () => ({ signMessageAsync: jest.fn() }),
}));
jest.mock("wagmi/chains", () => ({ baseSepolia: { id: 84532 } }));
jest.mock("../../api/web3authapi", () => ({ __esModule: true, default: { login: jest.fn(), signup: jest.fn(), logout: jest.fn() } }));
jest.mock("../../utils/walletAuth", () => ({ createWalletAuthPayload: jest.fn() }));
type Snapshot = { isRestoring: boolean; isAuthenticated: boolean };
function renders() {
  const seen: Snapshot[] = [];
  function Probe() {
    const { isRestoring, isAuthenticated } = useWeb3Auth();
    seen.push({ isRestoring, isAuthenticated });
    return null;
  }
  render(<MemoryRouter><Probe /></MemoryRouter>);
  return seen;
}
beforeEach(() => {
  localStorage.clear();
  jest.spyOn(console, "log").mockImplementation(() => undefined);
});
afterEach(() => jest.restoreAllMocks());
it("reports a stored wallet session as restoring until it is restored, never as signed out", async () => {
  localStorage.setItem("auth_method", "web3");
  localStorage.setItem("auth_user", JSON.stringify({ id: 7, username: "wallet-creator" }));
  const seen = renders();
  expect(seen[0]).toEqual({ isRestoring: true, isAuthenticated: false });
  await waitFor(() => expect(seen[seen.length - 1]).toEqual({ isRestoring: false, isAuthenticated: true }));
  expect(seen.some((state) => !state.isRestoring && !state.isAuthenticated)).toBe(false);
});
it("does not wait when no wallet session is stored", () => {
  expect(renders()[0]).toEqual({ isRestoring: false, isAuthenticated: false });
});
it("stops restoring when the stored session cannot be read", async () => {
  jest.spyOn(console, "error").mockImplementation(() => undefined);
  localStorage.setItem("auth_method", "web3");
  localStorage.setItem("auth_user", "{broken");
  const seen = renders();
  await waitFor(() => expect(seen[seen.length - 1]).toEqual({ isRestoring: false, isAuthenticated: false }));
  expect(localStorage.getItem("auth_user")).toBeNull();
});
