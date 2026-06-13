import { useQuery } from "@tanstack/react-query";
import { walletApi } from "@/api/wallet";

export const useWalletBalance = () =>
  useQuery({ queryKey: ["wallet", "balance"], queryFn: () => walletApi.balance() });

export const useWalletTransactions = () =>
  useQuery({ queryKey: ["wallet", "transactions"], queryFn: () => walletApi.transactions() });
