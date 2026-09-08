import { useDispatch, useSelector, type TypedUseSelectorHook } from "react-redux";
import type { AppDispatch, RootState } from "./store";
import { showToast } from "./toastSlice";

// Hooks typés à utiliser dans toute l'app à la place de useDispatch/useSelector bruts.
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

/** Remplace l'ancien useToast() du ToastContext : toast(text) dispatch showToast(text). */
export function useToast() {
  const dispatch = useAppDispatch();
  return (text: string) => dispatch(showToast(text));
}
